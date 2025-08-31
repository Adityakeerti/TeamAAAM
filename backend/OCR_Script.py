import argparse
import os
import time
from dotenv import load_dotenv
from google.api_core.client_options import ClientOptions
from google.cloud import documentai, storage

def batch_process_documents_with_doc_ai(
    project_id: str,
    location: str,
    processor_id: str,
    gcs_input_uri: str,
    gcs_output_uri: str,
    mime_type: str = "application/pdf",
):
    """
    Performs asynchronous OCR on a PDF in GCS using Document AI.
    """
    print("Starting Document AI batch processing...")
    
    opts = ClientOptions(api_endpoint=f"{location}-documentai.googleapis.com")
    client = documentai.DocumentProcessorServiceClient(client_options=opts)

    name = client.processor_path(project_id, location, processor_id)

    gcs_document = documentai.GcsDocument(gcs_uri=gcs_input_uri, mime_type=mime_type)
    gcs_documents = documentai.GcsDocuments(documents=[gcs_document])
    input_config = documentai.BatchDocumentsInputConfig(gcs_documents=gcs_documents)
    
    gcs_output_config = documentai.DocumentOutputConfig.GcsOutputConfig(gcs_uri=gcs_output_uri)
    output_config = documentai.DocumentOutputConfig(gcs_output_config=gcs_output_config)

    request = documentai.BatchProcessRequest(
        name=name,
        input_documents=input_config,
        document_output_config=output_config,
    )

    operation = client.batch_process_documents(request)

    print(f"Waiting for Document AI operation {operation.operation.name} to complete...")
    operation.result(timeout=420)
    print("Document AI batch processing finished.")


def write_doc_ai_results_to_local_file(bucket_name, gcs_prefix, local_output_file):
    """
    Writes the content of Document AI output files to a local file,
    reconstructing the layout to preserve left-to-right reading order.
    """
    print(f"Consolidating Document AI results into '{local_output_file}'...")
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    blob_list = list(bucket.list_blobs(prefix=gcs_prefix))
    
    def get_text(text_anchor: documentai.Document.TextAnchor, full_text: str) -> str:
        """Helper function to extract text from a document element."""
        if text_anchor.text_segments:
            start_index = int(text_anchor.text_segments[0].start_index)
            end_index = int(text_anchor.text_segments[0].end_index)
            return full_text[start_index:end_index]
        return ""

    with open(local_output_file, "w", encoding="utf-8") as outfile:
        for blob in blob_list:
            if ".json" in blob.name:
                json_string = blob.download_as_bytes()
                document = documentai.Document.from_json(json_string)
                
                full_text = document.text
                
                # --- New Logic: Calculate Average Character Width ---
                total_width = 0
                total_chars = 0
                for page in document.pages:
                    for line in page.lines:
                        line_text = get_text(line.layout.text_anchor, full_text).strip()
                        if not line_text: continue
                        x_coords = [v.x for v in line.layout.bounding_poly.vertices]
                        line_width = max(x_coords) - min(x_coords)
                        if line_width > 0:
                            total_width += line_width
                            total_chars += len(line_text)
                
                avg_char_width = (total_width / total_chars) if total_chars > 0 else 8 # Default fallback
                print(f"Calculated average character width: {avg_char_width:.2f}")

                print(f"Processing {len(document.pages)} pages from '{blob.name}' with layout reconstruction...")
                for i, page in enumerate(document.pages):
                    lines_on_page = []
                    for line in page.lines:
                        line_text = get_text(line.layout.text_anchor, full_text).strip()
                        if not line_text: continue
                        y_coord = line.layout.bounding_poly.vertices[0].y
                        x_coord = line.layout.bounding_poly.vertices[0].x
                        lines_on_page.append({'text': line_text, 'y': y_coord, 'x': x_coord})
                    
                    if not lines_on_page: continue
                    lines_on_page.sort(key=lambda l: l['y'])
                    
                    reconstructed_lines = []
                    current_visual_line = []
                    y_tolerance = 10 

                    for line_data in lines_on_page:
                        if not current_visual_line:
                            current_visual_line.append(line_data)
                        else:
                            if abs(line_data['y'] - current_visual_line[0]['y']) < y_tolerance:
                                current_visual_line.append(line_data)
                            else:
                                current_visual_line.sort(key=lambda l: l['x'])
                                # --- New Logic: Reconstruct line with spacing ---
                                reconstructed_line = ""
                                cursor_pos = 0
                                for segment in current_visual_line:
                                    target_pos = int(segment['x'] / avg_char_width)
                                    spaces_to_add = max(0, target_pos - cursor_pos)
                                    reconstructed_line += " " * spaces_to_add
                                    reconstructed_line += segment['text']
                                    cursor_pos = target_pos + len(segment['text'])
                                reconstructed_lines.append(reconstructed_line)
                                current_visual_line = [line_data]
                    
                    if current_visual_line:
                        current_visual_line.sort(key=lambda l: l['x'])
                        reconstructed_line = ""
                        cursor_pos = 0
                        for segment in current_visual_line:
                            target_pos = int(segment['x'] / avg_char_width)
                            spaces_to_add = max(0, target_pos - cursor_pos)
                            reconstructed_line += " " * spaces_to_add
                            reconstructed_line += segment['text']
                            cursor_pos = target_pos + len(segment['text'])
                        reconstructed_lines.append(reconstructed_line)

                    for text_line in reconstructed_lines:
                        outfile.write(text_line + "\n")

                    if i < len(document.pages) - 1:
                        outfile.write("\n\n--- Page Break ---\n\n")

    print("Successfully wrote Document AI OCR results to local file with left-to-right layout.")

def upload_to_gcs(bucket_name, file_path, gcs_filename):
    """Uploads a file to the given GCS bucket."""
    print(f"Uploading '{os.path.basename(file_path)}' to bucket '{bucket_name}'...")
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(gcs_filename)
    blob.upload_from_filename(file_path)
    print("Upload complete.")
    return f"gs://{bucket_name}/{gcs_filename}"

def cleanup_gcs(bucket_name, gcs_prefix, gcs_filename):
    """Removes the uploaded PDF and the OCR output from GCS."""
    print("Cleaning up files from Google Cloud Storage...")
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    
    try:
        bucket.blob(gcs_filename).delete()
    except Exception as e:
        print(f"Warning: could not delete source PDF. {e}")

    blobs_to_delete = list(bucket.list_blobs(prefix=gcs_prefix))
    for blob in blobs_to_delete:
        blob.delete()
        
    print("Cleanup complete.")

def main():
    """Main function to orchestrate the PDF OCR process with Document AI."""
    load_dotenv()

    if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        print("\n--- ERROR ---")
        print("Could not find the GOOGLE_APPLICATION_CREDENTIALS environment variable.")
        print("Please ensure you have a '.env' file in the same directory as this script.")
        print('The .env file should contain the line: GOOGLE_APPLICATION_CREDENTIALS="C:\\path\\to\\your\\credentials.json"')
        print("-------------\n")
        return

    parser = argparse.ArgumentParser(description="Extract text from a PDF using Google Document AI.")
    parser.add_argument("pdf_path", help="The local path to the PDF file.")
    parser.add_argument("bucket_name", help="Your Google Cloud Storage bucket name.")
    parser.add_argument("location", help="The location of your Document AI processor (e.g., 'us' or 'eu').")
    parser.add_argument("processor_id", help="The ID of your Document AI processor.")
    parser.add_argument("output_file", help="The name for the local output text file.")
    args = parser.parse_args()

    try:
        from google.auth import default
        creds, project_id = default()
        if not project_id:
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        if not project_id:
            print("Could not determine project ID. Please set GOOGLE_CLOUD_PROJECT in your .env file.")
            return
    except Exception:
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        if not project_id:
            print("Could not determine project ID. Please set GOOGLE_CLOUD_PROJECT in your .env file.")
            return


    timestamp = int(time.time())
    pdf_filename = os.path.basename(args.pdf_path)
    gcs_filename = f"docai-input/{timestamp}-{pdf_filename}"
    gcs_output_prefix = f"docai-output/{timestamp}-{pdf_filename}/"
    
    gcs_input_uri = upload_to_gcs(args.bucket_name, args.pdf_path, gcs_filename)
    gcs_output_uri = f"gs://{args.bucket_name}/{gcs_output_prefix}"

    try:
        batch_process_documents_with_doc_ai(
            project_id,
            args.location,
            args.processor_id,
            gcs_input_uri,
            gcs_output_uri
        )
        write_doc_ai_results_to_local_file(args.bucket_name, gcs_output_prefix, args.output_file)
    finally:
        cleanup_gcs(args.bucket_name, gcs_output_prefix, gcs_filename)


if __name__ == "__main__":
    main()


import argparse
import os
import json
import re
import ast
import google.generativeai as genai
from dotenv import load_dotenv
from typing import Optional, Dict, List, Any

# --- Schema Definition ---
def get_sof_schema_for_prompt() -> str:
    """Returns a detailed schema description for the model prompt."""
    schema = {
      "header": {
        "document_title": "STATEMENT OF FACTS",
      },
      "vessel_info": {
        "name_of_vessel": "MV CAPE ASTER",
        "name_of_master": "N/A",
        "port_of_loading_cargo": "Richards Bay",
        "description_of_cargo": "SOUTH AFRICAN STEAM COAL IN BULK",
        "quantity_of_cargo": "158,484 MT"
      },
      "events": [
        {
          "event": "VESSEL ARRIVED AT RICHARDS BAY ANCHORAGE AND NOTICE OF READINESS WAS TENDERED",
          "day": "WED",
          "start_date": "20.01.2021",
          "start_time": "2005",
          "end_time": "N/A"
        },
        {
          "event": "VESSEL DRIFTING AT ANCHORAGE AWAITING COMMENCEMENT OF LAYCAN",
          "day": "WED",
          "start_date": "20.01.2021",
          "start_time": "2005",
          "end_time": "2400"
        }
      ]
    }
    return json.dumps(schema, indent=2)

# --- Robust JSON Parsing and Cleaning (from your provided code) ---
def find_balanced_json(text: str) -> Optional[str]:
    """Find the first balanced JSON object starting at the first '{' or '['."""
    start_brace = text.find('{')
    start_bracket = text.find('[')

    if start_brace == -1 and start_bracket == -1:
        return None

    if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
        start = start_brace
        start_char = '{'
        end_char = '}'
    else:
        start = start_bracket
        start_char = '['
        end_char = ']'

    stack = 0
    in_string = False
    string_char = ''
    escaped = False

    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == string_char:
                in_string = False
        else:
            if ch == '"' or ch == "'":
                in_string = True
                string_char = ch
            elif ch == start_char:
                stack += 1
            elif ch == end_char:
                stack -= 1
                if stack == 0:
                    return text[start:i+1]
    return text[start:]

def show_json_error_context(json_text: str, exc: json.JSONDecodeError, window: int = 120):
    """Prints context around a JSON decoding error for easier debugging."""
    pos = exc.pos
    start = max(0, pos - window)
    end = min(len(json_text), pos + window)
    snippet = json_text[start:end].replace('\n', '\\n')
    pointer_index = pos - start
    pointer_line = ' ' * pointer_index + '^'
    print(f"\nJSONDecodeError: {exc.msg} at pos {pos} (line {exc.lineno} col {exc.colno})")
    print("---- context ----")
    print(snippet)
    print(pointer_line)
    print("-----------------\n")

def extract_json_from_model_response(raw_text: str) -> Optional[Any]:
    """
    Highly robust function to find, clean, and parse a JSON object from a model's raw text response.
    Returns a dict/list or None.
    """
    candidate = find_balanced_json(raw_text)
    if candidate is None:
        print("No '{' or '[' found in model response.")
        return None

    # Attempt to repair common syntax errors
    repaired = re.sub(r'}\s*,?\s*\n\s*(?=\])', '}\n', candidate) # Remove trailing comma before closing bracket
    repaired = re.sub(r'}\s*{', '},{', repaired) # Fix missing comma between objects
    repaired = re.sub(r',\s*(?=[}\]])', '', repaired) # Remove other trailing commas

    # Save debug files
    with open('raw_model_response.txt', 'w', encoding='utf-8') as f:
        f.write(raw_text)
    with open('attempted_clean.json', 'w', encoding='utf-8') as f:
        f.write(repaired)

    try:
        return json.loads(repaired)
    except json.JSONDecodeError as e:
        show_json_error_context(repaired, e)
        print("Final parsing attempt failed after cleaning. Check 'attempted_clean.json'.")
        return None

# --- Single Page Document Handler ---
def parse_single_page_sof(input_text: str) -> Optional[Any]:
    """Handles single-page SOF documents with increased token limits and validation."""
    schema_description = get_sof_schema_for_prompt()
    
    # Count approximate events in the text to determine token needs
    event_indicators = ['Loading', 'Awaiting', 'Stevedore', 'P.O.B.', 'Passage', 'Arrived', 'First line', 'Accommodation', 'Inward', 'Initial', 'Master']
    event_count = sum(input_text.count(indicator) for indicator in event_indicators)
    
    # Calculate dynamic token limit based on content size
    base_tokens = 4096
    additional_tokens = min(event_count * 50, 12288)  # Max 16K tokens
    max_tokens = base_tokens + additional_tokens
    
    prompt = f"""
    Analyze the following COMPLETE "Statement of Facts" document. This is a SINGLE-PAGE document containing ALL events from start to finish.

    CRITICAL REQUIREMENTS:
    1. Extract ALL header and vessel information
    2. Extract EVERY SINGLE EVENT from the entire document - do not miss any events
    3. Pay special attention to events at the end of the document
    4. Ensure you capture events through the final completion and departure
    5. Your response must be ONLY the JSON object, starting with `{{` and ending with `}}`

    JSON Schema to follow:
    {schema_description}

    --- COMPLETE DOCUMENT TEXT START ---
    {input_text}
    --- COMPLETE DOCUMENT TEXT END ---

    IMPORTANT: This document contains approximately {event_count} events. Make sure to capture ALL of them, including the final events at the end.

    JSON Output:
    """

    print(f"Processing single-page document with ~{event_count} events using {max_tokens} max tokens...")
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        generation_config = genai.types.GenerationConfig(max_output_tokens=max_tokens)
        response = model.generate_content(prompt, generation_config=generation_config)
        
        print("Raw response received. Attempting to parse JSON...")
        parsed_data = extract_json_from_model_response(response.text)
        
        # Validation: Check if we captured a reasonable number of events
        if parsed_data and isinstance(parsed_data, dict):
            captured_events = len(parsed_data.get('events', []))
            print(f"Validation: Captured {captured_events} events from estimated {event_count} events")
            
            # If we captured significantly fewer events than expected, warn
            if captured_events < event_count * 0.7:  # Less than 70% of expected events
                print(f"WARNING: May have missed events. Expected ~{event_count}, captured {captured_events}")
                print("Consider increasing token limit or splitting document.")
            
        return parsed_data
    except Exception as e:
        print(f"An error occurred during single-page API processing: {e}")
        return None

# --- Gemini API Interaction ---
def parse_sof_chunk(input_text: str, is_first_page: bool) -> Optional[Any]:
    """Sends a chunk of text (one page) to the Gemini API for parsing."""
    if is_first_page:
        schema_description = get_sof_schema_for_prompt()
        prompt = f"""
        Analyze the following text from the first page of a "Statement of Facts" document. Your task is to extract the information and structure it into a single, valid JSON object.

        Adhere strictly to this JSON schema. Your entire response must be ONLY the JSON object, starting with `{{` and ending with `}}`. Do not include markdown or any other explanatory text.

        - Extract all header and vessel information.
        - Meticulously extract every event from THIS PAGE into the "events" list.

        JSON Schema to follow:
        {schema_description}

        --- DOCUMENT TEXT START ---
        {input_text}
        --- DOCUMENT TEXT END ---

        JSON Output:
        """
    else:
        # For subsequent pages, we only need the events.
        event_schema = [{"event": "...", "day": "...", "start_date": "...", "start_time": "...", "end_time": "..."}]
        prompt = f"""
        Analyze the following text from a subsequent page of a "Statement of Facts" document. Your task is to extract only the events and structure them into a valid JSON array of objects.

        Your entire response must be ONLY the JSON array, starting with `[` and ending with `]`. Do not include any other text.

        JSON Array of Events Schema to follow:
        {json.dumps(event_schema, indent=2)}

        --- DOCUMENT TEXT START ---
        {input_text}
        --- DOCUMENT TEXT END ---

        JSON Array Output:
        """

    print(f"Sending {'first' if is_first_page else 'subsequent'} page to the Google Gemini API for parsing...")
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        # Configure for potentially larger JSON output, even from a single page
        generation_config = genai.types.GenerationConfig(max_output_tokens=8192)
        response = model.generate_content(prompt, generation_config=generation_config)
        
        print("Raw response received. Attempting to parse JSON...")
        return extract_json_from_model_response(response.text)
    except Exception as e:
        print(f"An error occurred during API processing: {e}")
        return None

# --- Main Execution Logic ---
def main():
    """Main function to read, chunk, parse, and merge SOF data."""
    load_dotenv()

    parser = argparse.ArgumentParser(description="Parse a multi-page SOF text file into a structured JSON file using the Google Gemini API.")
    parser.add_argument("input_file", help="The path to the input text file (e.g., output.txt).")
    parser.add_argument("output_file", help="The name for the final output JSON file.")
    args = parser.parse_args()

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: Google API key not found. Please create a .env file and add: GOOGLE_API_KEY='your_key_here'")
        return
    genai.configure(api_key=api_key)

    if not os.path.exists(args.input_file):
        print(f"Error: Input file not found at '{args.input_file}'")
        return

    print(f"Reading and splitting SOF text from '{args.input_file}'...")
    with open(args.input_file, "r", encoding="utf-8") as f:
        sof_text = f.read()

    if not sof_text.strip():
        print("Error: The input file is empty.")
        return

    pages = sof_text.split('--- Page Break ---')
    print(f"Document split into {len(pages)} pages.")

    # Check if this is a single-page document (no page breaks found)
    is_single_page = len(pages) == 1 and '--- Page Break ---' not in sof_text
    
    if is_single_page:
        print("Detected single-page document. Using specialized single-page parser...")
        parsed_data = parse_single_page_sof(sof_text)
        
        if parsed_data and isinstance(parsed_data, dict):
            final_json = parsed_data
            all_events = parsed_data.get('events', [])
            print(f"Single-page parsing completed. Captured {len(all_events)} events.")
        else:
            print("Failed to parse single-page document.")
            return
    else:
        # Multi-page document processing
        final_json = {}
        all_events = []

        for i, page_text in enumerate(pages):
            if not page_text.strip():
                continue
            
            print(f"\n--- Processing Page {i + 1} ---")
            is_first = (i == 0)
            parsed_data = parse_sof_chunk(page_text, is_first_page=is_first)

            if not parsed_data:
                print(f"Warning: Failed to parse page {i + 1}. Skipping.")
                continue

            if is_first and isinstance(parsed_data, dict):
                final_json['header'] = parsed_data.get('header', {})
                final_json['vessel_info'] = parsed_data.get('vessel_info', {})
                page_events = parsed_data.get('events', [])
                if isinstance(page_events, list):
                    all_events.extend(page_events)
            elif not is_first and isinstance(parsed_data, list):
                all_events.extend(parsed_data)
            else:
                print(f"Warning: Parsed data for page {i + 1} has an unexpected format. Skipping.")

        final_json['events'] = all_events

    if final_json.get('header') or final_json.get('vessel_info') or final_json.get('events'):
        page_count = 1 if is_single_page else len(pages)
        print(f"\nSuccessfully parsed {len(all_events)} events across {page_count} page(s). Writing to '{args.output_file}'...")
        with open(args.output_file, "w", encoding="utf-8") as f:
            json.dump(final_json, f, indent=2)
        print("JSON file created successfully.")
    else:
        print("Failed to generate structured data after processing all pages.")

if __name__ == "__main__":
    main()


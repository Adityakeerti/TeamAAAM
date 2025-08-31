from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os
import tempfile
import shutil
import uuid
from pathlib import Path
import json
from datetime import datetime

app = FastAPI(title="PDF OCR & JSON Converter API", version="1.0.0")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all origins for development
        "https://adityakeerti.github.io",  # Your GitHub Pages frontend
        "https://teamaaam.onrender.com",   # Your Render backend
        "http://localhost:3000",           # Local development
        "http://localhost:8080",           # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FIXED: Mount static files with correct path - go up one directory to access docs
docs_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs")
if os.path.exists(docs_path):
    app.mount("/static", StaticFiles(directory=docs_path), name="static")

# Set environment variables for Google Cloud
# Use environment variables if available, otherwise use default paths
google_creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "goog_cred.json")
google_project = os.getenv("GOOGLE_CLOUD_PROJECT", "wise-groove-469722-q4")

# Set the environment variables
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = google_creds_path
os.environ["GOOGLE_CLOUD_PROJECT"] = google_project

# Store the latest extraction results
latest_extraction_results = None

@app.get("/")
async def root():
    return {"message": "PDF OCR & JSON Converter API", "status": "running"}

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and testing
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "backend": "Render",
        "cors_enabled": True,
        "allowed_origins": [
            "https://adityakeerti.github.io",
            "https://teamaaam.onrender.com"
        ]
    }

@app.post("/extract")
async def extract_pdf(pdf: UploadFile = File(..., alias="pdf")):
    """
    Extract data from PDF using OCR and parsing (compatibility endpoint)
    """
    return await convert_pdf_to_json(pdf)

# NEW ENDPOINT: For dashboard button integration
@app.post("/api/extract-events")
async def extract_events_and_timeline():
    """
    Endpoint for dashboard 'Extract Events and Laytime' button
    Uses the most recent PDF processing results or processes a default file
    """
    global latest_extraction_results
    
    try:
        # Option 1: Use cached results if available
        if latest_extraction_results:
            return {
                "success": True,
                "message": "Events extracted successfully",
                "events": latest_extraction_results.get("data", {}).get("events", []),
                "vessel_info": latest_extraction_results.get("data", {}).get("vessel_info", {}),
                "total_events": len(latest_extraction_results.get("data", {}).get("events", [])),
                "extraction_timestamp": datetime.now().isoformat(),
                "filename": latest_extraction_results.get("filename", "Unknown")
            }
        
        # Option 2: Process a default/sample file if no recent results
        sample_dir = os.path.join(os.path.dirname(__file__), "..", "sample")
        if os.path.exists(sample_dir):
            sample_files = [f for f in os.listdir(sample_dir) if f.endswith('.pdf')]
        else:
            sample_files = []
            
        if not sample_files:
            # Return mock data for testing
            mock_events = [
                {
                    "date": "2024-01-15",
                    "time": "08:30",
                    "event_type": "Arrival",
                    "description": "Vessel arrived at port",
                    "location": "Port of Dubai",
                    "laytime_impact": "Start counting",
                    "status": "Completed"
                },
                {
                    "date": "2024-01-15",
                    "time": "14:45", 
                    "event_type": "Loading Start",
                    "description": "Commenced loading operations",
                    "location": "Berth 7",
                    "laytime_impact": "Laytime running",
                    "status": "Completed"
                },
                {
                    "date": "2024-01-16",
                    "time": "16:20",
                    "event_type": "Loading Complete",
                    "description": "All cargo loaded",
                    "location": "Berth 7", 
                    "laytime_impact": "Stop counting",
                    "status": "Completed"
                }
            ]
            
            return {
                "success": True,
                "message": "Sample events extracted successfully",
                "events": mock_events,
                "vessel_info": {
                    "vessel_name": "Sample Vessel",
                    "imo": "1234567",
                    "voyage": "V001"
                },
                "total_events": len(mock_events),
                "extraction_timestamp": datetime.now().isoformat(),
                "filename": "sample_data"
            }
        
        # Process the first available sample file
        sample_file = sample_files[0]
        sample_path = os.path.join(sample_dir, sample_file)
        
        # Create a mock UploadFile object for the sample
        with open(sample_path, "rb") as f:
            file_content = f.read()
        
        class MockUploadFile:
            def __init__(self, filename, content):
                self.filename = filename
                self.file = tempfile.NamedTemporaryFile()
                self.file.write(content)
                self.file.seek(0)
        
        mock_file = MockUploadFile(sample_file, file_content)
        
        # Process the sample file
        result = await convert_pdf_to_json(mock_file)
        
        # Store results for future requests
        latest_extraction_results = result
        
        return {
            "success": True,
            "message": "Events extracted successfully from sample file",
            "events": result.get("data", {}).get("events", []),
            "vessel_info": result.get("data", {}).get("vessel_info", {}),
            "total_events": len(result.get("data", {}).get("events", [])),
            "extraction_timestamp": datetime.now().isoformat(),
            "filename": sample_file
        }
        
    except Exception as e:
        print(f"Error in extract_events_and_timeline: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Failed to extract events: {str(e)}",
                "events": [],
                "vessel_info": {},
                "total_events": 0
            }
        )

@app.post("/convert-pdf/")
async def convert_pdf_to_json(pdf_file: UploadFile = File(...)):
    """
    Convert PDF to JSON using OCR and parsing
    """
    global latest_extraction_results
    
    if not pdf_file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Create unique working directory
    work_dir = f"temp_{uuid.uuid4().hex[:8]}"
    os.makedirs(work_dir, exist_ok=True)
    
    try:
        # Save uploaded PDF to working directory
        pdf_path = os.path.join(work_dir, pdf_file.filename)
        with open(pdf_path, "wb") as buffer:
            shutil.copyfileobj(pdf_file.file, buffer)
        
        # Generate unique output filenames
        output_txt = os.path.join(work_dir, "output.txt")
        output_json = os.path.join(work_dir, "sof_data.json")
        
        print(f"Processing PDF: {pdf_path}")
        
        # Step 1: Run OCR Script
        print("Step 1: Running OCR conversion...")
        ocr_cmd = [
            "python", "OCR_Script.py",
            pdf_path,
            "marithon-ocr-bucket-123",
            "us",
            "44770fd7117288da",
            output_txt
        ]
        
        result = subprocess.run(ocr_cmd, capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode != 0:
            print(f"OCR Error: {result.stderr}")
            raise HTTPException(status_code=500, detail=f"OCR conversion failed: {result.stderr}")
        
        print("OCR conversion completed successfully")
        
        # Step 2: Run Parser Script
        print("Step 2: Running JSON conversion...")
        parser_cmd = [
            "python", "parser_script.py",
            output_txt,
            output_json
        ]
        
        result = subprocess.run(parser_cmd, capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode != 0:
            print(f"Parser Error: {result.stderr}")
            raise HTTPException(status_code=500, detail=f"JSON conversion failed: {result.stderr}")
        
        print("JSON conversion completed successfully")
        
        # Read the generated JSON before cleanup
        try:
            with open(output_json, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
        except Exception as e:
            print(f"Error reading JSON file: {e}")
            # Try to parse the output from the parser script
            json_data = parse_parser_output(result.stdout)
        
        # Prepare the response data
        response_data = {
            "message": "PDF successfully converted to JSON",
            "filename": pdf_file.filename,
            "data": json_data
        }
        
        # Store results for dashboard use
        latest_extraction_results = response_data
        
        return response_data
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    
    finally:
        # Cleanup temporary files
        try:
            shutil.rmtree(work_dir)
            print(f"Cleaned up temporary directory: {work_dir}")
        except Exception as e:
            print(f"Warning: Could not clean up {work_dir}: {e}")

def parse_parser_output(stdout):
    """Parse the output from parser script to extract JSON data"""
    try:
        # Look for JSON-like content in the output
        lines = stdout.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith('{') and line.endswith('}'):
                return json.loads(line)
            elif line.startswith('[') and line.endswith(']'):
                return json.loads(line)
        
        # If no JSON found, return a default structure
        return {
            "vessel_info": {},
            "events": []
        }
    except Exception as e:
        print(f"Error parsing parser output: {e}")
        return {
            "vessel_info": {},
            "events": []
        }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "environment": "ready"}

# FIXED: Serve HTML files directly from docs directory
@app.get("/dashboard")
async def serve_dashboard():
    """Serve the dashboard HTML file"""
    dashboard_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs", "dashboard.html")
    if os.path.exists(dashboard_path):
        return FileResponse(dashboard_path)
    raise HTTPException(status_code=404, detail="Dashboard file not found")

@app.get("/extraction-results")
async def serve_extraction_results():
    """Serve the extraction results HTML file"""
    results_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs", "extraction-results.html")
    if os.path.exists(results_path):
        return FileResponse(results_path)
    raise HTTPException(status_code=404, detail="Results file not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

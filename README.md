# 🚢 Cargo Laytime - SOF Document Processing & Laytime Calculator

A comprehensive maritime document processing system that extracts data from Statement of Facts (SOF) documents, processes vessel information, and calculates laytime utilization with professional-grade accuracy.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Hosting & Deployment](#hosting--deployment)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

Cargo Laytime is a sophisticated web application designed for maritime professionals to process Statement of Facts (SOF) documents, extract vessel and voyage information, and perform accurate laytime calculations. The system combines advanced OCR technology, AI-powered text extraction, and maritime-specific calculation logic to provide industry-standard results.

### 🎯 Use Cases

- **Maritime Companies**: Process SOF documents for laytime calculations
- **Port Agents**: Extract and validate vessel information
- **Charterers**: Calculate demurrage/dispatch costs
- **Legal Teams**: Review and analyze maritime documentation
- **Auditors**: Verify laytime calculations and compliance

## ✨ Features

### 🔍 Document Processing
- **PDF Upload & Processing**: Support for various PDF formats
- **OCR Integration**: Google Cloud Document AI for text extraction
- **AI-Powered Parsing**: Google Generative AI for intelligent data extraction
- **Multi-format Support**: Handles various SOF document layouts

### 📊 Data Extraction
- **Vessel Information**: Name, master, agent, ports
- **Cargo Details**: Description, quantity, specifications
- **Voyage Data**: Loading/discharge ports, dates
- **Event Timeline**: Chronological event tracking

### ⏱️ Laytime Calculations
- **Real-time Processing**: Instant calculations as data changes
- **Professional Logic**: Industry-standard laytime computation
- **Visual Indicators**: Color-coded status (on-time, early, late)
- **Cumulative Tracking**: Running totals across all events

### 🎨 User Interface
- **Modern Design**: Clean, professional maritime interface
- **Responsive Layout**: Works on desktop and mobile devices
- **Interactive Tables**: Editable event management
- **Export Options**: JSON, CSV, and PDF export

## 🛠️ Technology Stack

### Backend
- **Python 3.8+**: Core application logic
- **FastAPI**: High-performance web framework
- **Uvicorn**: ASGI server for production deployment
- **Google Cloud APIs**: Document AI, Storage, Generative AI
- **Python Standard Library**: Built-in modules for file handling and utilities

### Frontend
- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Interactive functionality
- **Font Awesome**: Professional iconography
- **Responsive Design**: Mobile-first approach

### Infrastructure
- **Google Cloud Platform**: AI services and storage
- **Local Development**: FastAPI development server
- **File Storage**: Local file handling with cloud backup options

## 📁 Project Structure

```
Marithon_New/
├── backend/                          # Python backend application
│   ├── main.py                      # FastAPI application entry point
│   ├── OCR_Script.py                # OCR processing logic using Google Document AI
│   ├── parser_script.py             # Document parsing utilities with Google Generative AI
│   ├── requirements.txt             # Python dependencies (cleaned)
│   ├── setup.py                     # Package installation script
│   ├── goog_cred.json              # Google Cloud credentials
│   ├── env.example                  # Environment variables template
│   ├── render.yaml                  # Deployment configuration
│   └── procfile                     # Heroku deployment configuration
├── docs/                            # Frontend web application
│   ├── index.html                   # Landing page
│   ├── login.html                   # Authentication page
│   ├── signup.html                  # User registration
│   ├── dashboard.html               # Main dashboard
│   ├── extraction-results.html      # SOF processing results
│   ├── calculate.html               # Laytime calculation page
│   ├── account-details.html         # User profile management
│   ├── test-upload.html             # PDF upload testing page
│   ├── assets/                      # Static assets
│   │   ├── css/                     # Stylesheets
│   │   ├── js/                      # JavaScript files
│   │   └── images/                  # Images and media
│   └── sample/                      # Sample SOF documents for testing
└── README.md                        # Project documentation
```

## ⚠️ Prerequisites

Before setting up the project, ensure you have the following:

### System Requirements
- **Python 3.8 or higher**
- **Git** for version control
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Google Cloud Services
- **Google Cloud Project** with billing enabled
- **Google Cloud Document AI API** enabled
- **Google Cloud Storage API** enabled
- **Google Generative AI API** enabled
- **Service Account** with appropriate permissions
- **JSON credentials file** downloaded

### API Keys & Credentials
- **Google Cloud Service Account Key** (JSON format)
- **API access permissions** for all required services
- **Environment variables** configured for local development

## 🚀 Local Setup

Follow these steps to set up the project on your local machine:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Marithon_New
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Alternative: Install via setup.py

```bash
cd backend
pip install -e .
```

#### Configure Google Cloud Credentials

1. **Download your service account key** from Google Cloud Console
2. **Place the JSON file** in the `backend/` directory
3. **Rename it** to `goog_cred.json` (or update the path in code)
4. **Set environment variable** (optional):

```bash
export GOOGLE_APPLICATION_CREDENTIALS="backend/goog_cred.json"
```

#### Start the Backend Server

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Serve the Frontend

Since this is a static HTML application, you can serve it using any of these methods:

**Option 1: Python HTTP Server**
```bash
cd docs
python -m http.server 8080
```

**Option 2: Node.js HTTP Server**
```bash
cd docs
npx http-server -p 8080
```

**Option 3: Live Server (VS Code Extension)**
- Install the "Live Server" extension in VS Code
- Right-click on `docs/index.html`
- Select "Open with Live Server"

The frontend will be available at `http://localhost:8080`

### 4. Verify Installation

1. **Backend Health Check**: Visit `http://localhost:8000/health` for backend status
2. **Frontend Access**: Open `http://localhost:8080` in your browser
3. **API Connection**: Ensure the frontend can connect to the backend at port 8000

## ☁️ Hosting & Deployment

This project is configured for multiple hosting platforms. Choose the option that best fits your needs:

### 🚀 Render (Recommended - Free Tier Available)

**Current Configuration**: The project is pre-configured for Render deployment.

#### Quick Deploy to Render

1. **Fork/Clone** this repository to your GitHub account
2. **Sign up** for a free Render account at [render.com](https://render.com)
3. **Connect** your GitHub repository
4. **Create New Web Service**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3.9.16

#### Render Configuration Files

**`backend/render.yaml`** (Current Configuration):
```yaml
services:
  - type: web
    name: cargo-laytime-backend
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.9.16
```

#### Required Environment Variables on Render

Set these in your Render dashboard:

```env
# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=goog_cred.json
GOOGLE_CLOUD_PROJECT=your-project-id

# Render-specific
PYTHON_VERSION=3.9.16
PORT=10000

# Security
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=https://your-app-name.onrender.com
```

### 🎯 Heroku Deployment

**Current Configuration**: The project includes Heroku configuration files.

#### Deploy to Heroku

1. **Install Heroku CLI** and login:
```bash
heroku login
```

2. **Create Heroku app**:
```bash
heroku create your-app-name
```

3. **Set buildpacks**:
```bash
heroku buildpacks:set heroku/python
```

4. **Configure environment variables**:
```bash
heroku config:set GOOGLE_APPLICATION_CREDENTIALS=goog_cred.json
heroku config:set GOOGLE_CLOUD_PROJECT=your-project-id
heroku config:set SECRET_KEY=your-secret-key-here
```

5. **Deploy**:
```bash
git push heroku main
```

#### Heroku Configuration Files

**`backend/procfile`** (Current Configuration):
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 🌐 Railway Deployment

Railway offers a simple alternative to Heroku:

1. **Sign up** at [railway.app](https://railway.app)
2. **Connect** your GitHub repository
3. **Deploy** automatically with the existing configuration

### 🔧 Vercel Deployment (Frontend Only)

For static frontend hosting:

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy frontend**:
```bash
cd docs
vercel
```

### 🐳 Docker Deployment

#### Dockerfile (Create if needed)

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - GOOGLE_APPLICATION_CREDENTIALS=/app/goog_cred.json
    volumes:
      - ./backend/goog_cred.json:/app/goog_cred.json
```

### 📱 Production Considerations

#### Environment Variables

Create a production `.env` file:

```env
# Production Configuration
DEBUG_MODE=false
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://your-domain.com

# Google Cloud (Production)
GOOGLE_CLOUD_PROJECT=your-production-project
GOOGLE_APPLICATION_CREDENTIALS=production-credentials.json

# Security
SECRET_KEY=your-production-secret-key
CORS_ORIGINS=https://your-domain.com
```

#### SSL/HTTPS

- **Render**: Automatic SSL with custom domains
- **Heroku**: Automatic SSL with custom domains
- **Custom Domain**: Configure SSL certificates

#### Monitoring & Logging

```python
# Add to main.py for production logging
import logging
from fastapi.middleware.cors import CORSMiddleware

# Production logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Production CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### 🔄 Deployment Workflow

#### Automated Deployment

1. **Push to main branch** triggers automatic deployment
2. **Environment variables** are managed through hosting platform
3. **Health checks** ensure successful deployment
4. **Rollback** available if deployment fails

#### Manual Deployment

```bash
# Build and test locally
cd backend
pip install -r requirements.txt
python -m pytest

# Deploy to production
git push origin main
# Or use hosting platform CLI
render deploy
# Or
heroku git:remote -a your-app-name
git push heroku main
```

### 📊 Performance Optimization

#### Production Settings

```python
# In main.py
if not DEBUG_MODE:
    # Production optimizations
    app = FastAPI(
        title="Cargo Laytime API",
        version="1.0.0",
        docs_url=None,  # Disable docs in production
        redoc_url=None
    )
```

#### Caching Strategy

```python
# Add caching for production
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost", encoding="utf8")
    FastAPICache.init(RedisBackend(redis), prefix="cargo-laytime")
```

## 📖 Usage

### 1. User Authentication

- **Register**: Create a new account with email and password
- **Login**: Access your dashboard with credentials
- **Profile Management**: Update account details and preferences

### 2. Document Processing

#### Upload SOF Document
1. **Navigate** to the dashboard
2. **Click** "Upload PDF" button
3. **Select** your SOF document (PDF format)
4. **Wait** for processing to complete
5. **Review** extracted data

#### Review Extracted Data
- **Vessel Information**: Verify ship details, master, agent
- **Port Details**: Check loading and discharge ports
- **Cargo Information**: Review cargo type and quantity
- **Event Timeline**: Examine chronological events

### 3. Laytime Calculations

#### Configure Parameters
- **Allowed Laytime**: Set the permitted laytime in days
- **Demurrage Rate**: Define daily demurrage charges
- **Dispatch Rate**: Set daily dispatch credits
- **Processing Rate**: Specify cargo handling rate

#### View Results
- **Utilization**: Time used for each event
- **Remaining Time**: Available laytime with color coding
- **Status Indicators**:
  - 🟢 **Green**: On time (0.0 hrs)
  - 🔵 **Blue**: Early (+ve values = dispatch credit)
  - 🔴 **Red**: Late (-ve values = demurrage charges)

### 4. Data Management

#### Edit Information
- **Inline Editing**: Click on any field to modify
- **Event Management**: Add, edit, or delete timeline events
- **Real-time Updates**: Changes reflect immediately in calculations

#### Export Data
- **JSON Format**: Structured data export
- **CSV Format**: Spreadsheet compatibility
- **PDF Format**: Professional report generation

## 🔌 API Endpoints

### Base URL: `http://localhost:8000`

#### Document Processing
- `POST /convert-pdf/` - Upload and process PDF documents
- `POST /extract` - Extract data from PDF (compatibility endpoint)
- `POST /api/extract-events` - Extract events and timeline data
- `GET /health` - Backend health check
- `GET /dashboard` - Serve dashboard HTML
- `GET /extraction-results` - Serve extraction results HTML

#### Response Format
```json
{
  "message": "PDF successfully converted to JSON",
  "filename": "document.pdf",
  "data": {
    "vessel_info": {
      "name_of_vessel": "M.V. ORION TRADER",
      "name_of_master": "CAPTAIN A. K. SINGH",
      "agent": "GLOBAL MARITIME SERVICES LTD"
    },
    "events": [
      {
        "start_date": "2024-03-08",
        "start_time": "13:00",
        "end_time": "14:00",
        "description": "Stevedore's meal break"
      }
    ]
  }
}
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory (use `env.example` as template):

```env
# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=goog_cred.json
GOOGLE_CLOUD_PROJECT=your-project-id

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG_MODE=true

# Security
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

### Google Cloud Setup

1. **Enable APIs** in Google Cloud Console:
   - Document AI API
   - Cloud Storage API
   - Generative AI API

2. **Create Service Account**:
   - Navigate to IAM & Admin > Service Accounts
   - Create new service account
   - Assign appropriate roles
   - Download JSON key

3. **Set Permissions**:
   - Ensure service account has access to required APIs
   - Set appropriate IAM roles for document processing

## 🐛 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check Python version
python --version

# Verify dependencies
pip list | grep fastapi

# Check port availability
netstat -an | grep 8000
```

#### Google Cloud API Errors
```bash
# Verify credentials
cat backend/goog_cred.json

# Check API enablement
gcloud services list --enabled

# Test authentication
gcloud auth application-default print-access-token
```

#### Frontend Connection Issues
```bash
# Check backend status
curl http://localhost:8000/health

# Verify CORS settings
# Check browser console for errors
```

#### PDF Processing Failures
- **File Size**: Ensure PDF is under 10MB
- **Format**: Verify PDF is not corrupted
- **Content**: Check if PDF contains extractable text
- **Permissions**: Ensure file is readable

### Debug Mode

Enable debug logging in the backend:

```python
# In main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Performance Optimization

- **Image Resolution**: Optimize PDF image quality
- **Batch Processing**: Process multiple documents efficiently
- **Caching**: Implement result caching for repeated documents
- **Async Processing**: Use background tasks for large documents

## 🤝 Contributing

We welcome contributions to improve Cargo Laytime!

### Development Setup

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Code Standards

- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ES6+ features and consistent formatting
- **HTML/CSS**: Maintain semantic markup and responsive design
- **Documentation**: Update README and add code comments

### Testing

```bash
# Backend tests
cd backend
python -m pytest

# Manual testing
# Test PDF upload and processing
# Verify laytime calculations
# Check frontend-backend integration
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Cloud Platform** for AI and OCR services
- **FastAPI** for the excellent web framework
- **Maritime Industry** professionals for domain expertise
- **Open Source Community** for various libraries and tools

## 📞 Support

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions
- **Email**: Contact the development team

### Professional Support

For enterprise deployments and professional support:
- **Customization**: Tailored solutions for your business
- **Integration**: API integration with existing systems
- **Training**: User training and documentation
- **Maintenance**: Ongoing support and updates

---

**Cargo Laytime** - Professional maritime document processing and laytime calculation.

*Built with ❤️ for the maritime industry*

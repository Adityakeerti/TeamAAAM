# 🚀 Render Deployment Guide for Cargo Laytime

Complete step-by-step guide to deploy your Cargo Laytime application on Render.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ **Google Cloud Project** with billing enabled
- ✅ **Google Cloud APIs** enabled (Vision, Document AI, Generative AI)
- ✅ **Service Account** with proper permissions
- ✅ **GitHub Repository** with your code
- ✅ **Render Account** (free tier available)

## 🔧 Step 1: Prepare Your Repository

### 1.1 Update Frontend URLs

Update your frontend JavaScript files to use the Render URL instead of localhost:

**File: `docs/assets/js/extraction-results.js`**
```javascript
// Change this line:
this.baseURL = 'http://localhost:8000';

// To your Render URL (you'll get this after deployment):
this.baseURL = 'https://your-app-name.onrender.com';
```

**File: `docs/assets/js/dashboard.js`**
```javascript
// Update any localhost references to your Render URL
const API_BASE_URL = 'https://your-app-name.onrender.com';
```

### 1.2 Commit and Push Changes

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## 🌐 Step 2: Create Render Account & Service

### 2.1 Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended) or email
4. Verify your email address

### 2.2 Create New Web Service

1. **Dashboard**: Click "New +" button
2. **Service Type**: Select "Web Service"
3. **Repository**: Connect your GitHub repository
4. **Service Name**: `cargo-laytime-backend`
5. **Environment**: `Python 3`
6. **Region**: Choose closest to your users
7. **Branch**: `main` (or your default branch)
8. **Root Directory**: Leave empty (if backend is in root) or specify `backend/`

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Required Environment Variables

In your Render service dashboard, go to **Environment** tab and add these variables:

| **Key** | **Value** | **Description** |
|---------|-----------|-----------------|
| `PYTHON_VERSION` | `3.9.16` | Python version for Render |
| `GOOGLE_CLOUD_PROJECT` | `wise-groove-469722-q4` | Your Google Cloud Project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | `goog_cred.json` | Path to credentials file |
| `API_HOST` | `0.0.0.0` | Host binding for production |
| `DEBUG_MODE` | `false` | Disable debug mode in production |
| `SECRET_KEY` | `[Auto-generated]` | Render will generate this |
| `ALLOWED_ORIGINS` | `*` | Allow all origins (configure properly for production) |
| `LOG_LEVEL` | `INFO` | Production logging level |
| `MAX_FILE_SIZE` | `10485760` | 10MB file upload limit |
| `UPLOAD_DIR` | `uploads` | Directory for file uploads |

### 3.2 Google Cloud Credentials Setup

#### Option A: Upload Credentials File (Recommended)

1. **Download your service account key** from Google Cloud Console
2. **In Render Dashboard**: Go to **Files** tab
3. **Upload**: Drag and drop your `goog_cred.json` file
4. **Verify**: The file should appear in the file list

#### Option B: Use Environment Variable (Alternative)

If you prefer to use environment variables instead of file upload:

1. **In Render Dashboard**: Go to **Environment** tab
2. **Add Variable**:
   - Key: `GOOGLE_CREDENTIALS_JSON`
   - Value: Copy the entire content of your `goog_cred.json` file
3. **Update your code** to read from this environment variable

## 🔧 Step 4: Configure Build & Deploy Settings

### 4.1 Build Settings

In your Render service dashboard:

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 4.2 Advanced Settings

- **Auto-Deploy**: Enable (recommended)
- **Health Check Path**: `/` (or `/health` if you have a health endpoint)
- **Health Check Timeout**: `300` seconds

## 🚀 Step 5: Deploy Your Application

### 5.1 Initial Deployment

1. **Click "Create Web Service"**
2. **Wait for build** (usually 5-10 minutes)
3. **Monitor logs** for any errors
4. **Check deployment status**

### 5.2 Verify Deployment

1. **Visit your Render URL**: `https://your-app-name.onrender.com`
2. **Check API docs**: `https://your-app-name.onrender.com/docs`
3. **Test health endpoint**: `https://your-app-name.onrender.com/`

## 🔍 Step 6: Troubleshooting Common Issues

### 6.1 Build Failures

**Issue**: `ModuleNotFoundError` or dependency issues
**Solution**: 
```bash
# Check requirements.txt is in the correct location
# Ensure all dependencies are listed
# Verify Python version compatibility
```

**Issue**: `Port already in use`
**Solution**: 
```bash
# Use $PORT environment variable (Render sets this automatically)
# Update start command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 6.2 Runtime Errors

**Issue**: `Google Cloud credentials not found`
**Solution**:
```bash
# Verify goog_cred.json is uploaded to Render
# Check file path in environment variables
# Ensure service account has proper permissions
```

**Issue**: `CORS errors`
**Solution**:
```bash
# Update ALLOWED_ORIGINS in environment variables
# Check CORS middleware configuration in main.py
```

### 6.3 Performance Issues

**Issue**: Cold start delays
**Solution**:
- **Upgrade Plan**: Consider paid plans for better performance
- **Health Checks**: Implement proper health check endpoints
- **Optimization**: Reduce dependency size and startup time

## 📱 Step 7: Update Frontend for Production

### 7.1 Update API URLs

After successful deployment, update your frontend files:

```javascript
// In all JavaScript files, change:
const baseURL = 'http://localhost:8000';

// To:
const baseURL = 'https://your-app-name.onrender.com';
```

### 7.2 Test Frontend Integration

1. **Upload a test PDF** through your deployed application
2. **Verify OCR processing** works correctly
3. **Check laytime calculations** function properly
4. **Test export functionality**

## 🔒 Step 8: Security & Production Considerations

### 8.1 Environment Variables

**Never commit sensitive data**:
```bash
# ❌ Don't do this:
git add goog_cred.json
git commit -m "Add credentials"

# ✅ Do this instead:
echo "goog_cred.json" >> .gitignore
git add .gitignore
git commit -m "Ignore credentials file"
```

### 8.2 CORS Configuration

For production, restrict CORS origins:
```python
# In main.py, update CORS middleware:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com", "https://www.yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### 8.3 File Upload Security

```python
# Implement file type validation
ALLOWED_EXTENSIONS = {'.pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
```

## 📊 Step 9: Monitor & Maintain

### 9.1 Render Dashboard Monitoring

- **Logs**: Monitor application logs for errors
- **Metrics**: Track response times and error rates
- **Deployments**: Monitor deployment success/failure rates

### 9.2 Health Checks

Implement a health check endpoint:
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }
```

### 9.3 Error Monitoring

Consider adding error monitoring:
```python
import logging
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

## 🔄 Step 10: Continuous Deployment

### 10.1 Auto-Deploy Setup

1. **Enable auto-deploy** in Render dashboard
2. **Connect GitHub webhook** (automatic with GitHub integration)
3. **Test deployment** by pushing a small change

### 10.2 Deployment Workflow

```bash
# Your typical workflow:
git add .
git commit -m "Update feature"
git push origin main
# Render automatically deploys!
```

## 📋 Complete Environment Variables Summary

Here's the complete list of environment variables you need in Render:

```bash
# Render Auto-Set Variables
PORT=10000  # Automatically set by Render

# Python Configuration
PYTHON_VERSION=3.9.16

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=wise-groove-469722-q4
GOOGLE_APPLICATION_CREDENTIALS=goog_cred.json

# Application Configuration
API_HOST=0.0.0.0
DEBUG_MODE=false
SECRET_KEY=[Auto-generated by Render]
ALLOWED_ORIGINS=*
LOG_LEVEL=INFO

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

## 🎯 Final Checklist

Before going live:

- [ ] **Backend deployed** successfully on Render
- [ ] **Frontend URLs updated** to use Render domain
- [ ] **Google Cloud credentials** uploaded and working
- [ ] **Environment variables** all configured correctly
- [ ] **Health checks** passing
- [ ] **PDF processing** working correctly
- [ ] **Laytime calculations** functioning properly
- [ ] **CORS issues** resolved
- [ ] **File uploads** working
- [ ] **Error handling** implemented
- [ ] **Monitoring** set up

## 🆘 Getting Help

### Render Support
- **Documentation**: [docs.render.com](https://docs.render.com)
- **Community**: [community.render.com](https://community.render.com)
- **Status Page**: [status.render.com](https://status.render.com)

### Common Issues & Solutions
- **Build failures**: Check requirements.txt and Python version
- **Runtime errors**: Verify environment variables and credentials
- **Performance issues**: Consider upgrading to paid plans
- **CORS problems**: Update ALLOWED_ORIGINS configuration

---

**🎉 Congratulations!** Your Cargo Laytime application is now deployed on Render and ready for production use.

**Next Steps**: 
1. Test all functionality thoroughly
2. Set up monitoring and alerts
3. Configure custom domain (optional)
4. Implement backup and recovery procedures
5. Plan for scaling as your user base grows

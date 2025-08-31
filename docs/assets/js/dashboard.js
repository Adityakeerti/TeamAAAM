// Dashboard JavaScript with FastAPI Integration
class DashboardAPI {
    constructor() {
        this.baseURL = 'https://teamaaam.onrender.com';
        this.currentDocumentId = null;
        this.currentFile = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.updateUserProfile();
    }

    // Authentication check (disabled for public demo)
    checkAuth() { /* no-op */ }

    // Get auth headers (not needed)
    getAuthHeaders() { return {}; }

    // Setup event listeners
    setupEventListeners() {
        // SOF File input change
        const sofFileInput = document.getElementById('sofFileInput');
        if (sofFileInput) {
            sofFileInput.addEventListener('change', (e) => this.handleFileSelect(e, 'sof'));
        }

        // CP File input change
        const cpFileInput = document.getElementById('cpFileInput');
        if (cpFileInput) {
            cpFileInput.addEventListener('change', (e) => this.handleFileSelect(e, 'cp'));
        }

        // Drag and drop
        const uploadArea = document.getElementById('sofUploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        }

        // Extract Events button
        const extractButton = document.getElementById('extractButton');
        if (extractButton) {
            extractButton.addEventListener('click', () => this.extractEventsAndTimeline());
        }

        // User profile dropdown
        const userProfile = document.getElementById('userProfile');
        if (userProfile) {
            userProfile.addEventListener('click', () => this.toggleDropdown());
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#userProfile')) {
                this.hideDropdown();
            }
        });
    }

    // File handling
    handleFileSelect(event, fileType) {
        const file = event.target.files[0];
        if (file) {
            if (fileType === 'sof') {
                this.currentFile = file;
            }
            this.displayFileInfo(file, fileType);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.currentFile = files[0];
            this.displayFileInfo(files[0]);
        }
    }

    displayFileInfo(file, fileType) {
        const fileInfo = document.getElementById(`${fileType}FileInfo`);
        const fileName = document.getElementById(`${fileType}FileName`);
        const uploadArea = document.getElementById(`${fileType}UploadArea`);
        const fileStatus = document.getElementById(`${fileType}FileStatus`);
        
        if (fileInfo && fileName && uploadArea) {
            fileName.textContent = file.name;
            fileInfo.style.display = 'block';
            uploadArea.style.display = 'none';
            
            // Hide the "No file selected" text
            if (fileStatus) {
                fileStatus.style.display = 'none';
            }
        }
    }

    removeFile(fileType) {
        if (fileType === 'sof') {
            this.currentFile = null;
            this.currentDocumentId = null;
        }
        
        const fileInfo = document.getElementById(`${fileType}FileInfo`);
        const uploadArea = document.getElementById(`${fileType}UploadArea`);
        const fileInput = document.getElementById(`${fileType}FileInput`);
        const fileStatus = document.getElementById(`${fileType}FileStatus`);
        
        if (fileInfo && uploadArea && fileInput) {
            fileInfo.style.display = 'none';
            uploadArea.style.display = 'block';
            fileInput.value = '';
            
            // Show the "No file selected" text again
            if (fileStatus) {
                fileStatus.style.display = 'block';
            }
        }
    }

    // NEW METHOD: Extract Events and Timeline functionality
    async extractEventsAndTimeline() {
        // Get the button element
        const extractButton = document.getElementById('extractButton');
        const originalText = extractButton ? extractButton.innerHTML : 'Extract Events and Laytime';

        try {
            // Show loading state on button
            if (extractButton) {
                extractButton.disabled = true;
                extractButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }

            this.showLoading('Extracting events and timeline...');

            // First, upload the file if one is selected
            if (this.currentFile) {
                await this.uploadFileForProcessing();
            }

            // Call the extract-events API
            const response = await fetch(`${this.baseURL}/api/extract-events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Store ALL events data in sessionStorage for extraction-results.html
                sessionStorage.setItem('extractionResults', JSON.stringify(data));
                
                // Also store in localStorage as backup
                localStorage.setItem('extractionResult', JSON.stringify({
                    message: data.message,
                    filename: data.filename,
                    data: {
                        events: data.events,
                        vessel_info: data.vessel_info
                    }
                }));

                this.showMessage('Events extracted successfully! Redirecting to results...', 'success');

                // Redirect to results page after short delay
                setTimeout(() => {
                    window.location.href = 'extraction-results.html';
                }, 1000);

            } else {
                throw new Error(data.error || 'Extraction failed');
            }

        } catch (error) {
            console.error('Extract Events Error:', error);
            this.showMessage(`Failed to extract events: ${error.message}`, 'error');
        } finally {
            // Reset button state
            if (extractButton) {
                extractButton.disabled = false;
                extractButton.innerHTML = originalText;
            }
            this.hideLoading();
        }
    }

    // HELPER METHOD: Upload file for processing (if needed)
    async uploadFileForProcessing() {
        if (!this.currentFile) return;

        const formData = new FormData();
        formData.append('pdf', this.currentFile);

        const response = await fetch(`${this.baseURL}/convert-pdf/`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'File upload failed');
        }

        return await response.json();
    }

    // Document upload (existing method - kept unchanged)
    async uploadDocument() {
        if (!this.currentFile) {
            this.showMessage('Please select a file first', 'error');
            return;
        }
        
        this.showLoading('Uploading document...');
        
        try {
            const formData = new FormData();
            // Backend expects field name 'pdf'
            formData.append('pdf', this.currentFile);

            const response = await fetch(`${this.baseURL}/extract`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Extraction failed');
            }

            const result = await response.json();
            // Persist extraction result for results page
            localStorage.setItem('extractionResult', JSON.stringify(result));

            this.showMessage('Extraction successful! Opening results…', 'success');

            setTimeout(() => {
                window.location.href = 'extraction-results.html';
            }, 800);
        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage(`Upload failed: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // UI helpers
    showLoading(text = 'Processing...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingOverlay && loadingText) {
            loadingText.textContent = text;
            loadingOverlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    showMessage(text, type) {
        // Simple message display - you can enhance this with a proper toast system
        console.log(`${type.toUpperCase()}: ${text}`);
        
        // For now, we'll use the existing modal system
        if (type === 'success') {
            this.showModal(text);
        } else if (type === 'error') {
            alert(`Error: ${text}`);
        }
    }

    showModal(message) {
        const modal = document.getElementById('successModal');
        const modalBody = modal?.querySelector('.modal-body p');
        
        if (modal && modalBody) {
            modalBody.textContent = message;
            modal.style.display = 'block';
        }
    }

    closeModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // User profile
    updateUserProfile() {
        const username = localStorage.getItem('username');
        const avatar = document.getElementById('avatar');
        
        if (avatar && username) {
            avatar.innerHTML = `<span>${username.charAt(0).toUpperCase()}</span>`;
        }
    }

    toggleDropdown() {
        const dropdown = document.getElementById('dropdownMenu');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    hideDropdown() {
        const dropdown = document.getElementById('dropdownMenu');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    showAccountDetails() {
        // Redirect to account details page
        window.location.href = 'account-details.html';
    }

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    }
}

// Utility functions
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.select();
        document.execCommand('copy');
        
        // Show feedback
        const originalText = element.placeholder;
        element.placeholder = 'Copied to clipboard!';
        setTimeout(() => {
            element.placeholder = originalText;
        }, 2000);
    }
}

// Global functions for HTML onclick handlers
function uploadDocument() {
    dashboard.uploadDocument();
}

function removeFile(type) {
    dashboard.removeFile(type);
}

function closeModal() {
    dashboard.closeModal();
}

// NEW GLOBAL FUNCTION: Extract Events handler
function extractEventsAndTimeline() {
    dashboard.extractEventsAndTimeline();
}

// Global dropdown functions
function toggleUserMenu() {
    dashboard.toggleDropdown();
}

function showAccountDetails() {
    dashboard.showAccountDetails();
}

function logout() {
    dashboard.logout();
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new DashboardAPI();
});

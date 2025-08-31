// Extraction Results JavaScript - Complete SOF Processing Workflow
class ExtractionResults {
    constructor() {
        this.baseURL = 'http://localhost:8000'; // Local FastAPI backend
        this.documentId = null;
        this.vesselData = {};
        this.events = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUserProfile();
        this.loadFromStoredResult();
    }

    // Authentication check
    checkAuth() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
    }

    // Get auth headers
    getAuthHeaders() {
        const token = localStorage.getItem('auth_token');
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    // Get document ID from URL parameters
    getDocumentIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.documentId = urlParams.get('doc_id');
        if (!this.documentId) {
            this.showError('No document ID provided. Redirecting to dashboard...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
				return;
			}
    }

    // Setup event listeners
    setupEventListeners() {
        // Form input change listeners
        const formInputs = document.querySelectorAll('#data-form input');
        formInputs.forEach(input => {
            input.addEventListener('change', () => this.saveFormData());
        });

        // Calculate button
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateLaytime());
        }

        // PDF file input listener
        const pdfFileInput = document.getElementById('pdfFileInput');
        if (pdfFileInput) {
            pdfFileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        }

        // User profile dropdown (dashboard style)
        const userProfile = document.getElementById('userProfile');
        if (userProfile) {
            userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('dropdownMenu');
            const userProfile = document.getElementById('userProfile');
            
            if (dropdown && userProfile && !userProfile.contains(e.target)) {
                this.closeUserMenu();
            }
        });
    }

    // Update user profile
    updateUserProfile() {
        const username = localStorage.getItem('username') || 'User';
        const userAvatar = document.getElementById('avatar');
        
        if (userAvatar && username) {
            // Clear any existing content and add the user icon
            userAvatar.innerHTML = '<i class="fas fa-user"></i>';
        }
    }

    // Toggle user menu
    toggleUserMenu() {
        const dropdown = document.getElementById('dropdownMenu');
        const userProfile = document.getElementById('userProfile');
        
        if (dropdown && userProfile) {
            dropdown.classList.toggle('show');
            userProfile.classList.toggle('active');
        }
    }

    // Close user menu
    closeUserMenu() {
        const dropdown = document.getElementById('dropdownMenu');
        const userProfile = document.getElementById('userProfile');
        
        if (dropdown && userProfile) {
            dropdown.classList.remove('show');
            userProfile.classList.remove('active');
        }
    }

    // Load result saved by dashboard after /extract
    loadFromStoredResult() {
        const raw = localStorage.getItem('extractionResult');
        if (!raw) {
            this.showError('No extraction result found. Please upload a PDF first.');
            setTimeout(() => window.location.href = 'dashboard.html', 1200);
            return;
        }
        try {
            const result = JSON.parse(raw);
            this.renderFromBackendResult(result);
        } catch (e) {
            console.warn('Failed to parse extractionResult from localStorage:', raw);
            localStorage.removeItem('extractionResult');
            this.showError('Invalid result data. Please re-upload your PDF.');
            setTimeout(() => window.location.href = 'dashboard.html', 1200);
        }
    }

    // Call backend API to process PDF and get results
    async processPDFWithBackend(pdfFile) {
        try {
            this.showLoading('Processing PDF with backend...');
            
            const formData = new FormData();
            formData.append('pdf_file', pdfFile);
            
            console.log('Sending PDF to backend:', pdfFile.name);
            
            const response = await fetch(`${this.baseURL}/convert-pdf/`, {
                method: 'POST',
                body: formData
            });
            
            console.log('Backend response status:', response.status);
            console.log('Backend response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('Backend result:', result);
            
            this.hideLoading();
            
            // Store the result and render it
            localStorage.setItem('extractionResult', JSON.stringify(result));
            this.renderFromBackendResult(result);
            
            return result;
        } catch (error) {
            this.hideLoading();
            console.error('Error processing PDF:', error);
            this.showError('Failed to process PDF with backend: ' + error.message);
            throw error;
        }
    }

    // Deprecated: no longer used in new flow
    async runOCR() { return; }

    async extractClauses() { return; }

    async generateSummary() { return; }

    // Render backend /extract result into form and events table
    renderFromBackendResult(result) {
        console.log('Rendering backend result:', result);
        
        const vessel = (result && result.vessel_info) || {};
        console.log('Vessel info:', vessel);
        
        const fieldMap = {
            'name_of_vessel': 'vessel-name',
            'name_of_master': 'master',
            'agent': 'agent',
            'port_of_loading_cargo': 'port-loading',
            'port_of_discharge': 'port-discharge',
            'description_of_cargo': 'cargo',
            'quantity_of_cargo': 'quantity'
        };
        Object.keys(fieldMap).forEach((k) => {
            const el = document.getElementById(fieldMap[k]);
            if (el) el.value = vessel[k] || '';
        });

        // Calculator defaults - removed hardcoded values
        // Users should input their own values based on their contracts

        // Try different possible data structures
        let backendEvents = [];
        if (Array.isArray(result && result.events)) {
            backendEvents = result.events;
        } else if (Array.isArray(result && result.data && result.data.events)) {
            backendEvents = result.data.events;
        } else if (Array.isArray(result)) {
            backendEvents = result;
        } else if (result && typeof result === 'object') {
            // If result is a single object, try to extract events from it
            const keys = Object.keys(result);
            for (const key of keys) {
                if (Array.isArray(result[key])) {
                    backendEvents = result[key];
                    break;
                }
            }
        }
        
        console.log('Backend events:', backendEvents);
        
        this.events = backendEvents.map((ev) => {
            // Handle the actual data structure from the backend
            const startDate = ev['start_date'] || ev['Start Date'] || ev['Date'] || ev['date'] || '';
            const startTime = ev['start_time'] || ev['Start Time'] || ev['start_time'] || '';
            const endTime = ev['end_time'] || ev['End Time'] || ev['end_time'] || '';
            
            // Combine date and time for display
            const startDateTime = startDate && startTime ? `${startDate} ${startTime}` : (startDate || startTime || '-');
            const endDateTime = startDate && endTime ? `${startDate} ${endTime}` : (startDate || endTime || '-');
            
            const mappedEvent = {
                events: ev['Events'] || ev['Event Description'] || ev['Description'] || ev['event'] || '-',
                day: ev['Day'] || ev['day'] || '-',
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                laytimeTimeUtilization: ev['Laytime Time Utilization'] || ev['laytime_time_utilization'] || ev['Duration'] || ev['duration'] || ev['laytime_utilization'] || '-',
                laytimePercentageUtilization: ev['Laytime % Utilization'] || ev['laytime_percentage_utilization'] || ev['laytime_percentage'] || ev['percentage_utilization'] || '-',
                laytimeConsumed: ev['Laytime Consumed'] || ev['laytime_consumed'] || ev['Duration'] || ev['duration'] || ev['laytime_used'] || '-',
                laytimeRemaining: ev['Laytime Remaining'] || ev['laytime_remaining'] || ev['laytime_left'] || '-'
            };
            console.log('Mapped event:', mappedEvent);
            return mappedEvent;
        });

        console.log('Final events array:', this.events);
        
        // If no events found, show a message
        if (this.events.length === 0) {
            console.log('No events found in backend data');
            this.events = [];
        }
        
        this.renderEventsTable();
    }

    // Convert "08 Jun 2024" to "2024-06-08" for input/date parsing
    normalizeDateForInput(d) {
        if (!d || d === '-') return '';
        const parts = String(d).trim().split(/\s+/);
        if (parts.length !== 3) return d;
        const [dd, mon, yyyy] = parts;
        const monthMap = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
        const mm = monthMap[mon] || monthMap[mon?.slice(0,3)] || '01';
        const day = dd.padStart(2, '0');
        return `${yyyy}-${mm}-${day}`;
    }

    // Get day of week from date string
    getDayFromDate(dateString) {
        if (!dateString || dateString === '-') return '-';
        
        // Handle backend date format like "30.07" (day.month)
        if (dateString.includes('.')) {
            const parts = dateString.split('.');
            if (parts.length === 2) {
                const day = parts[0];
                const month = parts[1];
                // For now, return a placeholder since we don't have the year
                // In a real scenario, you'd need to determine the year from context
                return `${day}/${month}`;
            }
        }
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            return days[date.getDay()];
        } catch (e) {
            return '-';
        }
    }

    // Handle PDF file selection
    handleFileSelection(event) {
        const file = event.target.files[0];
        const selectedFileName = document.getElementById('selectedFileName');
        const processPdfBtn = document.getElementById('processPdfBtn');
        
        if (file && file.type === 'application/pdf') {
            selectedFileName.textContent = file.name;
            selectedFileName.className = 'selected-file has-file';
            processPdfBtn.disabled = false;
            this.selectedPDFFile = file;
        } else {
            selectedFileName.textContent = 'Please select a valid PDF file';
            selectedFileName.className = 'selected-file error';
            processPdfBtn.disabled = true;
            this.selectedPDFFile = null;
        }
    }

    // Process the selected PDF
    async processSelectedPDF() {
        if (!this.selectedPDFFile) {
            this.showError('Please select a PDF file first.');
            return;
        }

        try {
            await this.processPDFWithBackend(this.selectedPDFFile);
            this.showSuccess('PDF processed successfully! Data loaded into the table.');
        } catch (error) {
            console.error('Failed to process PDF:', error);
        }
    }

    // Populate form with extracted data
    populateFormWithExtractedData() { /* deprecated */ }

    // Populate events (handled in renderFromBackendResult now)
    populateEventsTable() { this.renderEventsTable(); }

    // Render events table
    renderEventsTable() {
		const tbody = document.getElementById('events-tbody');
		if (!tbody) return;
		
        tbody.innerHTML = '';

        this.events.forEach((event, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${event.events}</td>
                <td>${event.day}</td>
                <td>${event.startDateTime}</td>
                <td>${event.endDateTime}</td>
                <td>${event.laytimeTimeUtilization}</td>
                <td>${event.laytimePercentageUtilization}</td>
                <td>${event.laytimeConsumed}</td>
                <td>${event.laytimeRemaining}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editEvent(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEvent(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
					</td>
				`;
            tbody.appendChild(row);
        });
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '–';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '–';
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    // Calculate laytime
    calculateLaytime() {
        console.log('Calculate laytime function called');
        
        // Collect all form data
        const formData = {
            vesselName: document.getElementById('vessel-name').value,
            master: document.getElementById('master').value,
            agent: document.getElementById('agent').value,
            portLoading: document.getElementById('port-loading').value,
            portDischarge: document.getElementById('port-discharge').value,
            cargo: document.getElementById('cargo').value,
            quantity: document.getElementById('quantity').value,
            allowedLaytime: document.getElementById('allowed-laytime').value,
            demurrage: document.getElementById('demurrage').value,
            dispatch: document.getElementById('dispatch').value,
            rate: document.getElementById('rate').value || '' // No hardcoded default
        };

        console.log('Form data collected:', formData);
        console.log('Events data:', this.events);

        // Save form data to localStorage for the calculate page
        localStorage.setItem('calculateFormData', JSON.stringify(formData));
        
        // Save events data for calculation
        localStorage.setItem('calculateEvents', JSON.stringify(this.events));

        console.log('Data saved to localStorage, redirecting to calculate.html');
        
        // Redirect to calculate page
        window.location.href = 'calculate.html';
    }

    // Save form data
    saveFormData() {
        const formData = {
            vesselName: document.getElementById('vessel-name').value,
            master: document.getElementById('master').value,
            agent: document.getElementById('agent').value,
            portLoading: document.getElementById('port-loading').value,
            portDischarge: document.getElementById('port-discharge').value,
            cargo: document.getElementById('cargo').value,
            quantity: document.getElementById('quantity').value,
            allowedLaytime: document.getElementById('allowed-laytime').value,
            demurrage: document.getElementById('demurrage').value,
            dispatch: document.getElementById('dispatch').value,
            rate: document.getElementById('rate').value
        };

        // Save to localStorage for persistence
        localStorage.setItem('vesselFormData', JSON.stringify(formData));
    }

    // Load saved form data
    loadSavedFormData() {
        const savedData = localStorage.getItem('vesselFormData');
        if (savedData) {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
                if (element) {
                    element.value = data[key];
                }
            });
        }
    }

    // Show loading
    showLoading(text = 'Processing...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingOverlay && loadingText) {
            loadingText.textContent = text;
            loadingOverlay.style.display = 'flex';
        }
    }

    // Hide loading
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    // Show error
    showError(message) {
        alert(`Error: ${message}`);
    }

    // Show success
    showSuccess(message) {
        // Create a proper success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        console.log('Success:', message);
    }
}

// Global functions for HTML onclick handlers

// Add new event
function addNewEvent() {
    document.getElementById('addEventModal').style.display = 'block';
}

// Close add event modal
function closeAddEventModal() {
    document.getElementById('addEventModal').style.display = 'none';
    // Clear form
    document.getElementById('newEventDesc').value = '';
    document.getElementById('newEventDate').value = '';
    document.getElementById('newEventStart').value = '';
    document.getElementById('newEventEnd').value = '';
    document.getElementById('newEventRemarks').value = '';
}

// Save new event
function saveNewEvent() {
    const description = document.getElementById('newEventDesc').value;
    const date = document.getElementById('newEventDate').value;
    const startTime = document.getElementById('newEventStart').value;
    const endTime = document.getElementById('newEventEnd').value;
    const remarks = document.getElementById('newEventRemarks').value;

    if (!description || !date || !startTime) {
        alert('Please fill in all required fields');
        return;
    }

    // Calculate duration if end time is provided
    let duration = '';
    if (endTime) {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const hours = (end - start) / (1000 * 60 * 60);
        duration = `${hours}h`;
    }

    // Add new event - use the same structure as displayed events
    const newEvent = {
        events: description,
        day: '-',
        startDateTime: `${date} ${startTime}`,
        endDateTime: endTime ? `${date} ${endTime}` : `${date} ${startTime}`,
        laytimeTimeUtilization: duration || '-',
        laytimePercentageUtilization: '-',
        laytimeConsumed: duration || '-',
        laytimeRemaining: '-'
    };

    extractionResults.events.push(newEvent);
    extractionResults.renderEventsTable();
    closeAddEventModal();
}

// Edit event
function editEvent(index) {
    const event = extractionResults.events[index];
    
    // Extract date and time from the startDateTime field
    let date = '';
    let startTime = '';
    let endTime = '';
    
    if (event.startDateTime && event.startDateTime !== '-') {
        const startParts = event.startDateTime.split(' ');
        if (startParts.length >= 2) {
            date = startParts[0];
            startTime = startParts[1];
        }
    }
    
    if (event.endDateTime && event.endDateTime !== '-') {
        const endParts = event.endDateTime.split(' ');
        if (endParts.length >= 2) {
            endTime = endParts[1];
        }
    }
    
    document.getElementById('editEventIndex').value = index;
    document.getElementById('editEventDesc').value = event.events || '';
    document.getElementById('editEventDate').value = date;
    document.getElementById('editEventStart').value = startTime;
    document.getElementById('editEventEnd').value = endTime;
    document.getElementById('editEventRemarks').value = event.remarks || '';
    
    document.getElementById('editEventModal').style.display = 'block';
}

// Close edit event modal
function closeEditEventModal() {
    document.getElementById('editEventModal').style.display = 'none';
}

// Save edited event
function saveEditedEvent() {
    const index = parseInt(document.getElementById('editEventIndex').value);
    const description = document.getElementById('editEventDesc').value;
    const date = document.getElementById('editEventDate').value;
    const startTime = document.getElementById('editEventStart').value;
    const endTime = document.getElementById('editEventEnd').value;
    const remarks = document.getElementById('editEventRemarks').value;

    if (!description || !date || !startTime) {
        alert('Please fill in all required fields');
        return;
    }

    // Calculate duration if end time is provided
    let duration = '';
    if (endTime) {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const hours = (end - start) / (1000 * 60 * 60);
        duration = `${hours}h`;
    }

    // Update event - use the same structure as displayed events
    extractionResults.events[index] = {
        events: description,
        day: '-',
        startDateTime: `${date} ${startTime}`,
        endDateTime: endTime ? `${date} ${endTime}` : `${date} ${startTime}`,
        laytimeTimeUtilization: duration || '-',
        laytimePercentageUtilization: '-',
        laytimeConsumed: duration || '-',
        laytimeRemaining: '-'
    };

    extractionResults.renderEventsTable();
    closeEditEventModal();
}

// Delete event
function deleteEvent(index) {
    if (confirm('Are you sure you want to delete this event?')) {
        extractionResults.events.splice(index, 1);
        extractionResults.renderEventsTable();
    }
}

// Calculate laytime
function calculateLaytime() {
    extractionResults.calculateLaytime();
}

// Show help
function showHelp() {
    alert('Help: This page allows you to review extracted SOF data, edit vessel details, manage events timeline, and calculate laytime costs.');
}

// Global functions for PDF processing
function processSelectedPDF() {
    if (window.extractionResults) {
        window.extractionResults.processSelectedPDF();
    }
}

// Global functions for user menu
function showAccountDetails() {
    // Redirect to account details page
    window.location.href = 'account-details.html';
}

function logout() {
    // Clear local storage and redirect to login
    localStorage.clear();
    window.location.href = 'login.html';
}

// Global function for HTML onclick
function toggleUserMenu() {
    if (window.extractionResults) {
        window.extractionResults.toggleUserMenu();
    }
}

// Initialize when DOM is loaded
let extractionResults;
document.addEventListener('DOMContentLoaded', () => {
    extractionResults = new ExtractionResults();
    window.extractionResults = extractionResults;
    
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
});

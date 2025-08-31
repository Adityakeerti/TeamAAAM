// Extraction Results JavaScript - Complete SOF Processing Workflow
class ExtractionResults {
    constructor() {
        this.baseURL = 'https://teamaaam.onrender.com'; // Render backend
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
    
    // Show success banner when data is loaded
    showSuccessBanner() {
        const successBanner = document.getElementById('successBanner');
        if (successBanner) {
            successBanner.style.display = 'flex';
            console.log('Success banner displayed');
        }
    }
    
    // Test method to manually populate form with sample data - REMOVED HARDCODED DATA
    testFormPopulation() {
        console.log('⚠ Test method called - but hardcoded data has been removed');
        console.log('📝 Please upload a real PDF or enter data manually for testing');
        
        // Clear any existing test data
        localStorage.removeItem('extractionResult');
        console.log('🧹 Cleared any existing test data from localStorage');
        
        // Test time parsing with sample data
        console.log('🧪 Testing time parsing with sample data:');
        const testTimes = [
            '03.08 13.00',
            '03.08 14.00',
            '03.08 19.30',
            '03.08 20.30',
            '0830',
            '08.30',
            '08:30'
        ];
        
        testTimes.forEach(time => {
            const parsed = this.parseDateTime(time);
            console.log(`   "${time}" -> ${parsed ? parsed.toISOString() : 'FAILED'}`);
        });
        
        // Test calculation logic
        console.log('🧮 Testing calculation logic:');
        console.log('   Allowed laytime: 0 days (default)');
        console.log('   Event 1: 13:00 to 14:00 = 1.0 hrs');
        console.log('   Event 2: 14:00 to 19:30 = 5.5 hrs');
        console.log('   Event 3: 19:30 to 20:30 = 1.0 hrs');
        console.log('   Total consumed: 7.5 hrs');
        console.log('   Remaining: 0 - 7.5 = -7.5 hrs (demurrage)');
    }
    
    // Clear localStorage and reload page
    clearAndReload() {
        localStorage.removeItem('extractionResult');
        console.log('Cleared localStorage and reloading page');
        window.location.reload();
    }
    
    // Debug localStorage contents
    debugLocalStorage() {
        console.log('=== localStorage Debug ===');
        const raw = localStorage.getItem('extractionResult');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                console.log('extractionResult in localStorage:', parsed);
                console.log('Structure:', {
                    hasData: !!parsed.data,
                    hasVesselInfo: !!(parsed.data && parsed.data.vessel_info),
                    hasEvents: !!(parsed.data && parsed.data.events),
                    directVesselInfo: !!parsed.vessel_info,
                    directEvents: !!parsed.events
                });
            } catch (e) {
                console.error('Failed to parse localStorage data:', e);
            }
        } else {
            console.log('No extractionResult in localStorage');
        }
        console.log('=== End localStorage Debug ===');
    }
    
    // Show info message
    showInfo(message) {
        console.log('Info:', message);
        // You can implement a proper info display here
    }
    
    // Show error message
    showError(message) {
        console.error('Error:', message);
        // You can implement a proper error display here
    }
    
    // Show loading overlay
    showLoading(message = 'Processing...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        if (loadingText) {
            loadingText.textContent = message;
        }
    }
    
    // Hide loading overlay
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    
    // Show success message
    showSuccess(message) {
        console.log('Success:', message);
        // You can implement a proper success display here
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
            console.log('No extraction result found in localStorage');
            // Don't redirect immediately, just show a message
            this.showInfo('No extraction result found. Please upload a PDF or use the test button.');
            return;
        }
        try {
            const result = JSON.parse(raw);
            console.log('Loaded result from localStorage:', result);
            console.log('Result structure:', {
                hasData: !!result.data,
                hasVesselInfo: !!(result.data && result.data.vessel_info),
                hasEvents: !!(result.data && result.data.events),
                directVesselInfo: !!result.vessel_info,
                directEvents: !!result.events
            });
            this.renderFromBackendResult(result);
        } catch (e) {
            console.warn('Failed to parse extractionResult from localStorage:', raw);
            localStorage.removeItem('extractionResult');
            this.showError('Invalid result data. Please re-upload your PDF.');
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
        
        // Extract vessel info from the correct path in the result structure
        let vessel = {};
        console.log('Result structure analysis:', {
            hasResult: !!result,
            hasData: !!(result && result.data),
            hasVesselInfo: !!(result && result.data && result.data.vessel_info),
            hasDirectVesselInfo: !!(result && result.vessel_info),
            resultKeys: result ? Object.keys(result) : [],
            dataKeys: result && result.data ? Object.keys(result.data) : []
        });
        
        if (result && result.data && result.data.vessel_info) {
            vessel = result.data.vessel_info;
            console.log('Using vessel_info from result.data.vessel_info');
        } else if (result && result.vessel_info) {
            vessel = result.vessel_info;
            console.log('Using vessel_info from result.vessel_info');
        } else {
            console.log('No vessel_info found in expected locations');
        }
        console.log('Vessel info:', vessel);
        
        // Map the backend fields to form input IDs
        const fieldMap = {
            'name_of_vessel': 'vessel-name',
            'name_of_master': 'master',
            'agent': 'agent',
            'port_of_loading_cargo': 'port-loading',
            'port_of_discharge': 'port-discharge',
            'description_of_cargo': 'cargo',
            'quantity_of_cargo': 'quantity'
        };
        
        // Also try alternative field names that might be used
        const alternativeFieldMap = {
            'vessel_name': 'vessel-name',
            'master_name': 'master',
            'port_loading': 'port-loading',
            'port_discharge': 'port-discharge',
            'cargo_description': 'cargo',
            'cargo_quantity': 'quantity'
        };
        
        // Populate form fields with extracted data using primary field map
        Object.keys(fieldMap).forEach((key) => {
            const formFieldId = fieldMap[key];
            const formElement = document.getElementById(formFieldId);
            if (formElement && vessel[key]) {
                formElement.value = vessel[key];
                console.log(`Populated ${formFieldId} with: ${vessel[key]}`);
            } else if (formElement) {
                console.log(`Field ${formFieldId} not found or no data for ${key}`);
            }
        });
        
        // Try alternative field names if primary ones didn't work
        Object.keys(alternativeFieldMap).forEach((key) => {
            const formFieldId = alternativeFieldMap[key];
            const formElement = document.getElementById(formFieldId);
            if (formElement && vessel[key] && !formElement.value) {
                formElement.value = vessel[key];
                console.log(`Populated ${formFieldId} with alternative field ${key}: ${vessel[key]}`);
            }
        });
        
        // Debug: Check all form fields and their values
        console.log('=== Form Field Debug ===');
        Object.values(fieldMap).forEach((formFieldId) => {
            const formElement = document.getElementById(formFieldId);
            if (formElement) {
                console.log(`${formFieldId}: "${formElement.value}"`);
            } else {
                console.log(`${formFieldId}: Element not found`);
            }
        });
        console.log('=== End Form Field Debug ===');
        
        // Also check if any fields were actually populated
        let populatedCount = 0;
        Object.values(fieldMap).forEach((formFieldId) => {
            const formElement = document.getElementById(formFieldId);
            if (formElement && formElement.value) {
                populatedCount++;
            }
        });
        console.log(`Form population result: ${populatedCount} out of ${Object.keys(fieldMap).length} fields populated`);
        
        // Log all available vessel data for debugging
        console.log('All available vessel data:', vessel);
        console.log('Form field mapping:', fieldMap);
        console.log('Vessel data keys:', Object.keys(vessel));
        console.log('Vessel data values:', Object.values(vessel));
        
        // Show success banner if vessel data was loaded
        if (Object.keys(vessel).length > 0) {
            this.showSuccessBanner();
        }

        // Calculator defaults - removed hardcoded values
        // Users should input their own values based on their contracts

        // Try different possible data structures for events
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
                events: ev['Events'] || ev['Event Description'] || ev['Description'] || ev['event'] || '',
                day: ev['Day'] || ev['day'] || '',
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                laytimeTimeUtilization: ev['Laytime Time Utilization'] || ev['laytime_time_utilization'] || ev['Duration'] || ev['duration'] || ev['laytime_utilization'] || '',
                laytimePercentageUtilization: ev['Laytime % Utilization'] || ev['laytime_percentage_utilization'] || ev['laytime_percentage'] || ev['percentage_utilization'] || '',
                laytimeConsumed: ev['Laytime Consumed'] || ev['laytime_consumed'] || ev['Duration'] || ev['duration'] || ev['laytime_used'] || '',
                laytimeRemaining: ev['Laytime Remaining'] || ev['laytime_remaining'] || ev['laytime_left'] || ''
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
        
        // Log the calculated time utilizations for debugging
        console.log('=== Time Utilization Calculations ===');
        this.events.forEach((event, index) => {
            const timeCalc = this.calculateTimeUtilization(event.startDateTime, event.endDateTime);
            console.log(`Event ${index + 1}:`, {
                start: event.startDateTime,
                end: event.endDateTime,
                timeUtilization: timeCalc.timeUtilization,
                percentageUtilization: timeCalc.percentageUtilization
            });
        });
        console.log('=== End Time Utilization Calculations ===');
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

    // Parse datetime strings into Date objects with comprehensive regex parsing
    parseDateTime(dateTimeStr) {
        if (!dateTimeStr || dateTimeStr === '-') return null;
        
        try {
            let cleanStr = dateTimeStr.trim();
            console.log(`🔍 Parsing datetime: "${dateTimeStr}"`);
            
            // Handle various time formats with regex
            // Format: "03.08 13.00" or "03.08 13:00" or "03.08 1300"
            const timeFormatRegex = /(\d{1,2})\.(\d{1,2})\s+(\d{1,2})[.:]?(\d{2})/;
            const timeMatch = cleanStr.match(timeFormatRegex);
            
            if (timeMatch) {
                const day = timeMatch[1];
                const month = timeMatch[2];
                const hour = timeMatch[3];
                const minute = timeMatch[4];
                
                // Assume current year for calculations
                const currentYear = new Date().getFullYear();
                const dateStr = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
                
                const parsedDate = new Date(dateStr);
                if (!isNaN(parsedDate.getTime())) {
                    console.log(`✓ Parsed with time format regex: ${parsedDate} (${day}.${month} ${hour}:${minute})`);
                    return parsedDate;
                }
            }
            
            // Handle format: "0830" -> "08:30"
            const compactTimeRegex = /^(\d{1,2})(\d{2})$/;
            const compactMatch = cleanStr.match(compactTimeRegex);
            
            if (compactMatch) {
                const hour = compactMatch[1];
                const minute = compactMatch[2];
                const today = new Date();
                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
                
                const parsedDate = new Date(dateStr);
                if (!isNaN(parsedDate.getTime())) {
                    console.log(`✓ Parsed compact time: ${parsedDate} (${hour}:${minute})`);
                    return parsedDate;
                }
            }
            
            // Handle format: "08.30" -> "08:30"
            const dotTimeRegex = /^(\d{1,2})\.(\d{2})$/;
            const dotMatch = cleanStr.match(dotTimeRegex);
            
            if (dotMatch) {
                const hour = dotMatch[1];
                const minute = dotMatch[2];
                const today = new Date();
                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
                
                const parsedDate = new Date(dateStr);
                if (!isNaN(parsedDate.getTime())) {
                    console.log(`✓ Parsed dot time: ${parsedDate} (${hour}:${minute})`);
                    return parsedDate;
                }
            }
            
            // Handle format: "08:30" -> "08:30"
            const colonTimeRegex = /^(\d{1,2}):(\d{2})$/;
            const colonMatch = cleanStr.match(colonTimeRegex);
            
            if (colonMatch) {
                const hour = colonMatch[1];
                const minute = colonMatch[2];
                const today = new Date();
                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
                
                const parsedDate = new Date(dateStr);
                if (!isNaN(parsedDate.getTime())) {
                    console.log(`✓ Parsed colon time: ${parsedDate} (${hour}:${minute})`);
                    return parsedDate;
                }
            }
            
            // First attempt: Use Date.parse() for standard formats
            const parsedDate = new Date(cleanStr);
            if (!isNaN(parsedDate.getTime())) {
                console.log(`✓ Parsed with Date.parse(): ${parsedDate}`);
                return parsedDate;
            }
            
            console.log(`✗ Failed to parse: "${dateTimeStr}"`);
            return null;
        } catch (e) {
            console.warn('Failed to parse datetime:', dateTimeStr, e);
            return null;
        }
    }

    // Calculate time difference in hours between two datetime strings
    calculateHoursDifference(startStr, endStr) {
        const startDate = this.parseDateTime(startStr);
        const endDate = this.parseDateTime(endStr);
        
        if (!startDate || !endDate) {
            console.log(`✗ Cannot calculate difference: start=${startStr}, end=${endStr}`);
            return 0;
        }
        
        let diffMs = endDate.getTime() - startDate.getTime();
        
        // If end time is earlier than start time, assume it's the next day
        if (diffMs < 0) {
            diffMs += 24 * 60 * 60 * 1000; // Add 24 hours in milliseconds
            console.log(`⚠ End time before start time, assuming next day`);
        }
        
        const hours = diffMs / (1000 * 60 * 60); // Convert to hours
        console.log(`✓ Time difference: ${startStr} to ${endStr} = ${hours.toFixed(2)} hours`);
        return hours;
    }

    // Format hours to days and hours display (enhanced format)
    formatHoursToDaysHours(hours) {
        if (hours === 0) return '0.0 hrs';
        
        return `${hours.toFixed(1)} hrs`;
    }

    // Format remaining time in hours with color indication
    formatRemainingTime(hours) {
        if (hours === 0) return '0.0 hrs';
        
        return `${hours.toFixed(1)} hrs`;
    }

    // Calculate laytime utilization and remaining for each event
    calculateLaytimeMetrics() {
        const allowedLaytimeDays = parseFloat(document.getElementById('allowed-laytime')?.value || 0);
        const allowedLaytimeHours = allowedLaytimeDays * 24;
        
        console.log(`📊 Calculating laytime metrics: allowed=${allowedLaytimeDays} days (${allowedLaytimeHours} hrs)`);
        
        let cumulativeConsumed = 0;
        
        const result = this.events.map((event, index) => {
            // Calculate utilization for this event (simple end time - start time)
            const utilizationHours = this.calculateHoursDifference(event.startDateTime, event.endDateTime);
            cumulativeConsumed += utilizationHours;
            
            // Calculate remaining laytime in hours
            // If no allowed laytime set, use 0 as default (assume no laytime allowed)
            const remainingHours = allowedLaytimeHours - cumulativeConsumed;
            
            console.log(`📅 Event ${index + 1}: ${event.events}`);
            console.log(`   Start: ${event.startDateTime}, End: ${event.endDateTime}`);
            console.log(`   Utilization: ${utilizationHours.toFixed(2)} hrs (end - start)`);
            console.log(`   Cumulative: ${cumulativeConsumed.toFixed(2)} hrs`);
            console.log(`   Remaining: ${remainingHours.toFixed(2)} hrs`);
            
            return {
                ...event,
                utilizationHours,
                remainingHours,
                cumulativeConsumed
            };
        });
        
        console.log(`📊 Final metrics calculated for ${result.length} events`);
        return result;
    }

    // Calculate time difference between start and end times (keeping original for compatibility)
    calculateTimeUtilization(startDateTime, endDateTime) {
        const hours = this.calculateHoursDifference(startDateTime, endDateTime);
        
        return {
            timeUtilization: this.formatHoursToDaysHours(hours),
            percentageUtilization: hours > 0 ? ((hours / 24) * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    // Convert time string (HH.MM) to minutes - keeping for compatibility
    timeToMinutes(timeStr) {
        if (!timeStr) return null;
        
        try {
            // Handle different time formats
            const time = timeStr.replace(/[^\d.]/g, ''); // Remove non-digits and non-dots
            const parts = time.split('.');
            
            if (parts.length === 2) {
                const hours = parseInt(parts[0]);
                const minutes = parseInt(parts[1]);
                return hours * 60 + minutes;
            } else if (parts.length === 1) {
                // Assume it's hours only
                return parseInt(parts[0]) * 60;
            }
            
            return null;
        } catch (error) {
            console.error('Error converting time to minutes:', error);
            return null;
        }
    }
    
    // Convert minutes to time string (HH.MM) - keeping for compatibility
    minutesToTime(minutes) {
        if (minutes === null || minutes < 0) return '';
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}.${mins.toString().padStart(2, '0')}`;
    }
    
    // Recalculate all time utilizations and update the table
    recalculateTimeUtilizations() {
        console.log('Recalculating time utilizations for all events...');
        
        // Recalculate all metrics
        const updatedEvents = this.calculateLaytimeMetrics();
        this.events = updatedEvents;
        
        // Re-render the table with updated calculations
        this.renderEventsTable();
        
        console.log('Time utilizations recalculated and table updated');
    }

    // Render events table with proper column alignment and new columns
    renderEventsTable() {
        const tbody = document.getElementById('events-tbody');
        if (!tbody) return;
        
        // Update table header if needed
        this.updateTableHeader();
        
        tbody.innerHTML = '';

        // Calculate metrics for all events
        const eventsWithMetrics = this.calculateLaytimeMetrics();

        eventsWithMetrics.forEach((event, index) => {
            const row = document.createElement('tr');
            
            // Format remaining time with color indication
            const remainingTimeFormatted = this.formatRemainingTime(event.remainingHours);
            
            // Simple logic: 0 = on time, +ve = early, -ve = late
            let remainingTimeCell;
            if (event.remainingHours === 0) {
                remainingTimeCell = `<span style="color: #10b981;">${remainingTimeFormatted}</span>`; // Green for on time
            } else if (event.remainingHours > 0) {
                remainingTimeCell = `<span style="color: #3b82f6;">${remainingTimeFormatted}</span>`; // Blue for early (dispatch)
            } else {
                remainingTimeCell = `<span style="color: #ef4444;">${remainingTimeFormatted}</span>`; // Red for late (demurrage)
            }
            
            row.innerHTML = `
                <td>${event.events || ''}</td>
                <td>${event.day || ''}</td>
                <td>${event.startDateTime || ''}</td>
                <td>${event.endDateTime || ''}</td>
                <td>${this.formatHoursToDaysHours(event.utilizationHours)}</td>
                <td>${remainingTimeCell}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editEvent(${index})" title="Edit Event">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEvent(${index})" title="Delete Event">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Update laytime summary
        this.updateLaytimeSummary(eventsWithMetrics);
    }

    // Update table header to include new columns
    updateTableHeader() {
        const thead = document.querySelector('.events-table thead');
        if (!thead) return;

        const headerRow = thead.querySelector('tr');
        if (!headerRow) return;

        // Check if new columns already exist
        const existingHeaders = headerRow.querySelectorAll('th');
        if (existingHeaders.length === 7) return; // Already updated

        // Update header HTML
        headerRow.innerHTML = `
            <th>EVENTS</th>
            <th>DAY</th>
            <th>START DATE TIME</th>
            <th>END DATE TIME</th>
            <th>LAYTIME UTILIZATION (hrs)</th>
            <th>LAYTIME REMAINING (hrs)</th>
            <th>ACTIONS</th>
        `;
    }

    // Update laytime summary section
    updateLaytimeSummary(eventsWithMetrics) {
        const summarySection = document.getElementById('laytimeSummary');
        if (!summarySection) return;

        const allowedLaytimeDays = parseFloat(document.getElementById('allowed-laytime')?.value || 0);
        const allowedLaytimeHours = allowedLaytimeDays * 24;
        
        // Calculate totals
        const totalConsumedHours = eventsWithMetrics.reduce((sum, event) => sum + event.utilizationHours, 0);
        const totalRemainingHours = allowedLaytimeHours - totalConsumedHours;
        
        // Update summary display elements
        const totalLaytimeElement = document.getElementById('total-laytime');
        const laytimeRemainingElement = document.getElementById('laytime-remaining');
        const demurrageCostElement = document.getElementById('demurrage-cost');
        const dispatchCreditElement = document.getElementById('dispatch-credit');
        
        if (totalLaytimeElement) {
            totalLaytimeElement.textContent = this.formatHoursToDaysHours(totalConsumedHours);
        }
        
        if (laytimeRemainingElement) {
            // Simple logic: 0 = on time, +ve = early, -ve = late
            laytimeRemainingElement.textContent = this.formatRemainingTime(Math.abs(totalRemainingHours));
            
            if (totalRemainingHours === 0) {
                laytimeRemainingElement.style.color = '#10b981'; // Green for on time
            } else if (totalRemainingHours > 0) {
                laytimeRemainingElement.style.color = '#3b82f6'; // Blue for early (dispatch)
            } else {
                laytimeRemainingElement.style.color = '#ef4444'; // Red for late (demurrage)
            }
        }
        
        // Calculate demurrage or dispatch costs
        const demurrageRate = parseFloat(document.getElementById('demurrage')?.value || 0);
        const dispatchRate = parseFloat(document.getElementById('dispatch')?.value || 0);
        
        if (demurrageCostElement && dispatchCreditElement) {
            if (totalRemainingHours < 0) {
                // Demurrage situation (stayed longer)
                const demurrageDays = Math.abs(totalRemainingHours) / 24;
                const demurrageCost = demurrageDays * demurrageRate;
                demurrageCostElement.textContent = `${demurrageCost.toFixed(2)}`;
                dispatchCreditElement.textContent = '$0.00';
            } else if (totalRemainingHours > 0) {
                // Dispatch situation (left early)
                const dispatchDays = totalRemainingHours / 24;
                const dispatchCredit = dispatchDays * dispatchRate;
                demurrageCostElement.textContent = '$0.00';
                dispatchCreditElement.textContent = `${dispatchCredit.toFixed(2)}`;
            } else {
                // Exactly on time
                demurrageCostElement.textContent = '$0.00';
                dispatchCreditElement.textContent = '$0.00';
            }
        }
        
        // Show summary section
        summarySection.style.display = 'block';
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
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

    // Add new event - use the same structure as displayed events
    const newEvent = {
        events: description,
        day: '-',
        startDateTime: `${date} ${startTime}`,
        endDateTime: endTime ? `${date} ${endTime}` : `${date} ${startTime}`,
        laytimeTimeUtilization: '',
        laytimePercentageUtilization: '',
        laytimeConsumed: '',
        laytimeRemaining: ''
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

    // Update event - use the same structure as displayed events
    extractionResults.events[index] = {
        events: description,
        day: '-',
        startDateTime: `${date} ${startTime}`,
        endDateTime: endTime ? `${date} ${endTime}` : `${date} ${startTime}`,
        laytimeTimeUtilization: '',
        laytimePercentageUtilization: '',
        laytimeConsumed: '',
        laytimeRemaining: ''
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



// Recalculate time utilizations
function recalculateTimeUtilizations() {
    if (window.extractionResults) {
        window.extractionResults.recalculateTimeUtilizations();
    }
}

// Show help
function showHelp() {
    alert('Help: This page allows you to review extracted SOF data, edit vessel details, and manage events timeline.');
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
    
    // Debug: Check if form fields are accessible
    console.log('=== DOM Loaded - Form Field Check ===');
    const fieldIds = ['vessel-name', 'master', 'agent', 'port-loading', 'port-discharge', 'cargo', 'quantity'];
    fieldIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✓ DOM Ready - Found field: ${id}`);
        } else {
            console.log(`✗ DOM Ready - Missing field: ${id}`);
        }
    });
    console.log('=== End DOM Check ===');
});
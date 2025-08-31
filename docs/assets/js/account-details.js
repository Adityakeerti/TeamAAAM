// Account Details Page JavaScript

class AccountDetails {
    constructor() {
        this.init();
    }

               init() {
               this.loadSavedData();
               this.setupEventListeners();
           }

    // Load saved account data from localStorage
    loadSavedData() {
        const savedData = localStorage.getItem('accountDetails');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.populateForm(data);
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
    }

    // Populate form with saved data
    populateForm(data) {
        if (data.fullName) {
            document.getElementById('fullName').value = data.fullName;
            this.updateProfileName(data.fullName);
        }
        if (data.email) {
            document.getElementById('email').value = data.email;
        }
        if (data.phone) {
            document.getElementById('phone').value = data.phone;
        }
                       if (data.company) {
                   document.getElementById('company').value = data.company;
               }
    }

               // Setup event listeners
           setupEventListeners() {
               // Form submission handler
               const form = document.getElementById('accountForm');
               if (form) {
                   form.addEventListener('submit', (e) => this.handleSaveAccount(e));
               }
           }

    

    // Update profile name display
    updateProfileName(name) {
        const profileNameDisplay = document.getElementById('profileNameDisplay');
        if (profileNameDisplay) {
            const nameSpan = profileNameDisplay.querySelector('span');
            if (nameSpan) {
                nameSpan.textContent = name || 'Your Name';
            }
        }
    }

    // Format phone number as user types
    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value.length <= 3) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        }
        
        input.value = value;
    }

    // Handle form submission
    async handleSaveAccount(event) {
        event.preventDefault();
        
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.innerHTML;
        
        // Show loading state
        saveBtn.classList.add('loading');
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Saving...</span>';
        
        try {
                               // Collect form data
                   const formData = {
                       fullName: document.getElementById('fullName').value.trim(),
                       email: document.getElementById('email').value.trim(),
                       phone: document.getElementById('phone').value.trim(),
                       company: document.getElementById('company').value.trim()
                   };

                               // Validate required fields
                   if (!formData.fullName || !formData.email) {
                       throw new Error('Please fill in all required fields.');
                   }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                throw new Error('Please enter a valid email address.');
            }

            // Save to localStorage
            localStorage.setItem('accountDetails', JSON.stringify(formData));
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Show success message
            this.showMessage('Account details saved successfully!', 'success');
            
            // Update profile name display
            this.updateProfileName(formData.fullName);
            
        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            // Restore button state
            saveBtn.classList.remove('loading');
            saveBtn.innerHTML = originalText;
        }
    }

    

    // Show message to user
    showMessage(message, type) {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-toast ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(messageDiv);

        // Show message
        setTimeout(() => messageDiv.classList.add('show'), 100);

        // Remove message after 3 seconds
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => document.body.removeChild(messageDiv), 300);
        }, 3000);
    }
}

// Global functions for HTML event handlers
function updateProfileName(name) {
    if (accountDetails) {
        accountDetails.updateProfileName(name);
    }
}

function formatPhoneNumber(input) {
    if (accountDetails) {
        accountDetails.formatPhoneNumber(input);
    }
}

function handleSaveAccount(event) {
    if (accountDetails) {
        accountDetails.handleSaveAccount(event);
    }
}

// Initialize when DOM is loaded
let accountDetails;
document.addEventListener('DOMContentLoaded', () => {
    accountDetails = new AccountDetails();
});

// Add CSS for message toast
const style = document.createElement('style');
style.textContent = `
    .message-toast {
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 10000;
        max-width: 350px;
    }

    .message-toast.show {
        transform: translateX(0);
    }

    .message-toast.success {
        border-left: 4px solid #10b981;
    }

    .message-toast.error {
        border-left: 4px solid #ef4444;
    }

    .message-toast .message-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .message-toast.success .message-content i {
        color: #10b981;
    }

    .message-toast.error .message-content i {
        color: #ef4444;
    }

    .message-toast span {
        color: #1f2937;
        font-weight: 500;
    }
`;
document.head.appendChild(style);

// Profile page functionality

// DOM Elements
const profileTabs = document.querySelectorAll('.profile-menu li');
const tabContents = document.querySelectorAll('.profile-tab');
const profileForm = document.getElementById('profile-form');
const passwordForm = document.getElementById('password-form');
const preferencesForm = document.getElementById('preferences-form');
const verifyEmailBtn = document.getElementById('verify-email-btn');
const profileError = document.getElementById('profile-error');
const profileSuccess = document.getElementById('profile-success');
const passwordError = document.getElementById('password-error');
const passwordSuccess = document.getElementById('password-success');
const preferencesSuccess = document.getElementById('preferences-success');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileAvatar = document.getElementById('profile-avatar');

// Helper functions
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function hideError(element) {
    if (element) {
        element.style.display = 'none';
    }
}

function hideSuccess(element) {
    if (element) {
        element.style.display = 'none';
    }
}

// Tab switching
if (profileTabs.length > 0 && tabContents.length > 0) {
    profileTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            profileTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show selected tab content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// Load user profile data
auth.onAuthStateChanged(function(user) {
    if (user) {
        // Update profile header
        if (profileName) profileName.textContent = user.displayName || 'User';
        if (profileEmail) profileEmail.textContent = user.email;
        
        // Update profile form
        if (profileForm) {
            const displayNameInput = document.getElementById('display-name');
            const emailInput = document.getElementById('profile-email-input');
            
            if (displayNameInput) displayNameInput.value = user.displayName || '';
            if (emailInput) emailInput.value = user.email;
            
            // Load additional user data from Firestore if available
            if (db) {
                db.collection('users').doc(user.uid).get()
                    .then((doc) => {
                        if (doc.exists) {
                            const userData = doc.data();
                            const specialtySelect = document.getElementById('specialty');
                            
                            if (specialtySelect && userData.specialty) {
                                specialtySelect.value = userData.specialty;
                            }
                        }
                    })
                    .catch((error) => {
                        console.error('Error getting user data:', error);
                    });
            }
        }
        
        // Update email verification button
        if (verifyEmailBtn) {
            if (user.emailVerified) {
                verifyEmailBtn.textContent = 'Email Verified';
                verifyEmailBtn.disabled = true;
                verifyEmailBtn.classList.remove('btn-secondary');
                verifyEmailBtn.classList.add('btn-success');
                verifyEmailBtn.innerHTML = '<i class="fas fa-check-circle"></i> Email Verified';
            } else {
                verifyEmailBtn.disabled = false;
            }
        }
    }
});

// Profile form submission
if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideError(profileError);
        hideSuccess(profileSuccess);
        
        const user = auth.currentUser;
        if (!user) return;
        
        const displayName = document.getElementById('display-name').value;
        const specialty = document.getElementById('specialty').value;
        
        // Update display name in Firebase Auth
        user.updateProfile({
            displayName: displayName
        })
        .then(() => {
            // Update user data in Firestore if available
            if (db) {
                return db.collection('users').doc(user.uid).update({
                    name: displayName,
                    specialty: specialty
                });
            }
        })
        .then(() => {
            showSuccess(profileSuccess, 'Profile updated successfully!');
            
            // Update UI
            if (profileName) profileName.textContent = displayName || 'User';
            if (userName) userName.textContent = displayName || user.email.split('@')[0];
        })
        .catch((error) => {
            console.error('Profile update error:', error);
            showError(profileError, 'Failed to update profile. Please try again.');
        });
    });
}

// Password change form
if (passwordForm) {
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideError(passwordError);
        hideSuccess(passwordSuccess);
        
        const user = auth.currentUser;
        if (!user) return;
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmNewPassword = document.getElementById('confirm-new-password').value;
        
        // Validate passwords
        if (newPassword !== confirmNewPassword) {
            showError(passwordError, 'New passwords do not match. Please try again.');
            return;
        }
        
        // Reauthenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            user.email, 
            currentPassword
        );
        
        user.reauthenticateWithCredential(credential)
            .then(() => {
                // Change password
                return user.updatePassword(newPassword);
            })
            .then(() => {
                showSuccess(passwordSuccess, 'Password updated successfully!');
                passwordForm.reset();
            })
            .catch((error) => {
                console.error('Password change error:', error);
                let errorMessage = 'Failed to update password. Please try again.';
                
                if (error.code === 'auth/wrong-password') {
                    errorMessage = 'Current password is incorrect. Please try again.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'New password is too weak. Please use a stronger password.';
                }
                
                showError(passwordError, errorMessage);
            });
    });
}

// Preferences form
if (preferencesForm) {
    preferencesForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideSuccess(preferencesSuccess);
        
        const theme = document.querySelector('input[name="theme"]:checked').value;
        const notifyUpdates = document.getElementById('notify-updates').checked;
        const notifyNews = document.getElementById('notify-news').checked;
        
        // Save preferences to localStorage
        const preferences = {
            theme: theme,
            notifications: {
                updates: notifyUpdates,
                news: notifyNews
            }
        };
        
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        
        // Save to Firestore if available
        const user = auth.currentUser;
        if (user && db) {
            db.collection('users').doc(user.uid).update({
                preferences: preferences
            })
            .then(() => {
                showSuccess(preferencesSuccess, 'Preferences saved successfully!');
            })
            .catch((error) => {
                console.error('Preferences save error:', error);
                showSuccess(preferencesSuccess, 'Preferences saved locally.');
            });
        } else {
            showSuccess(preferencesSuccess, 'Preferences saved locally.');
        }
        
        // Apply theme if changed
        applyTheme(theme);
    });
    
    // Load saved preferences
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        
        // Set theme radio button
        const themeRadio = document.querySelector(`input[name="theme"][value="${preferences.theme}"]`);
        if (themeRadio) themeRadio.checked = true;
        
        // Set notification checkboxes
        if (preferences.notifications) {
            const notifyUpdates = document.getElementById('notify-updates');
            const notifyNews = document.getElementById('notify-news');
            
            if (notifyUpdates) notifyUpdates.checked = preferences.notifications.updates;
            if (notifyNews) notifyNews.checked = preferences.notifications.news;
        }
        
        // Apply current theme
        applyTheme(preferences.theme);
    }
}

// Apply theme function
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// Email verification
if (verifyEmailBtn) {
    verifyEmailBtn.addEventListener('click', function() {
        const user = auth.currentUser;
        if (!user) return;
        
        user.sendEmailVerification()
            .then(() => {
                showSuccess(passwordSuccess, 'Verification email sent! Check your inbox.');
                verifyEmailBtn.disabled = true;
                verifyEmailBtn.textContent = 'Email Sent';
                
                // Re-enable after 60 seconds
                setTimeout(() => {
                    if (!user.emailVerified) {
                        verifyEmailBtn.disabled = false;
                        verifyEmailBtn.textContent = 'Verify Email';
                    }
                }, 60000);
            })
            .catch((error) => {
                console.error('Email verification error:', error);
                showError(passwordError, 'Failed to send verification email. Please try again later.');
            });
    });
}

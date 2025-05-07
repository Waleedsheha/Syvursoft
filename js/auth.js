// Authentication functionality

// DOM Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const resetForm = document.getElementById('reset-form');
const googleLoginBtn = document.getElementById('google-login');
const googleSignupBtn = document.getElementById('google-signup');
const logoutBtn = document.getElementById('logout-btn');
const authError = document.getElementById('auth-error');
const authSuccess = document.getElementById('auth-success');
const userDropdownToggle = document.getElementById('user-dropdown-toggle');
const userDropdown = document.getElementById('user-dropdown');
const userName = document.getElementById('user-name');

// Helper functions
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function showSuccess(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
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

// Check if user is logged in and handle redirects
auth.onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);

        // Redirect if on login/signup/reset pages
        const currentPath = window.location.pathname;
        if (currentPath.includes('login.html') ||
            currentPath.includes('signup.html') ||
            currentPath.includes('reset-password.html')) {
            window.location.href = 'profile.html';
        }
    } else {
        // User is signed out
        console.log('User is signed out');

        // Redirect if on profile page
        const currentPath = window.location.pathname;
        if (currentPath.includes('profile.html')) {
            window.location.href = 'login.html';
        }
    }
});

// Login form submission
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideError(authError);

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember').checked;

        // Set persistence based on remember me checkbox
        const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;

        auth.setPersistence(persistence)
            .then(() => {
                return auth.signInWithEmailAndPassword(email, password);
            })
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;
                console.log('User logged in:', user.email);
                window.location.href = 'profile.html';
            })
            .catch((error) => {
                console.error('Login error:', error);
                let errorMessage = 'Failed to login. Please check your credentials.';

                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMessage = 'Invalid email or password. Please try again.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
                }

                showError(authError, errorMessage);
            });
    });
}

// Signup form submission
if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideError(authError);

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const termsAgreed = document.getElementById('terms').checked;

        // Validate form
        if (password !== confirmPassword) {
            showError(authError, 'Passwords do not match. Please try again.');
            return;
        }

        if (!termsAgreed) {
            showError(authError, 'You must agree to the Terms of Service and Privacy Policy.');
            return;
        }

        // Create user
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Signed up
                const user = userCredential.user;
                console.log('User created:', user.email);

                // Update profile with name
                return user.updateProfile({
                    displayName: name
                });
            })
            .then(() => {
                // Create user document in Firestore if available
                if (db) {
                    return db.collection('users').doc(auth.currentUser.uid).set({
                        name: name,
                        email: auth.currentUser.email,
                        createdAt: new Date(),
                        specialty: ''
                    });
                }
            })
            .then(() => {
                // Send email verification
                return auth.currentUser.sendEmailVerification();
            })
            .then(() => {
                window.location.href = 'profile.html';
            })
            .catch((error) => {
                console.error('Signup error:', error);
                let errorMessage = 'Failed to create account. Please try again.';

                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'Email is already in use. Please use a different email or login.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Password is too weak. Please use a stronger password.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Invalid email address. Please check and try again.';
                }

                showError(authError, errorMessage);
            });
    });
}

// Password reset form
if (resetForm) {
    resetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideError(authError);
        hideSuccess(authSuccess);

        const email = document.getElementById('email').value;

        auth.sendPasswordResetEmail(email)
            .then(() => {
                showSuccess(authSuccess, 'Password reset email sent! Check your inbox for further instructions.');
                resetForm.reset();
            })
            .catch((error) => {
                console.error('Password reset error:', error);
                let errorMessage = 'Failed to send password reset email. Please try again.';

                if (error.code === 'auth/user-not-found') {
                    errorMessage = 'No account found with this email address.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Invalid email address. Please check and try again.';
                }

                showError(authError, errorMessage);
            });
    });
}

// Google Sign-in
function signInWithGoogle() {
    console.log('Google sign-in function called');
    try {
        // Create Google auth provider
        const provider = new firebase.auth.GoogleAuthProvider();
        console.log('Google provider created');

        // Add scopes for better user data
        provider.addScope('profile');
        provider.addScope('email');

        // Set custom parameters
        provider.setCustomParameters({
            'prompt': 'select_account'
        });

        // Try redirect auth first (more reliable than popup)
        auth.signInWithRedirect(provider)
            .catch(error => {
                console.error('Redirect auth failed, trying popup:', error);
                // If redirect fails, try popup
                return auth.signInWithPopup(provider);
            })
            .then((result) => {
                if (!result) return; // Skip if this is after redirect initiation

                console.log('Google sign-in successful', result);
                // Check if user is new
                const isNewUser = result.additionalUserInfo.isNewUser;
                console.log('Is new user:', isNewUser);

                // If new user, create profile in Firestore
                if (isNewUser && db) {
                    console.log('Creating user profile in Firestore');
                    return db.collection('users').doc(result.user.uid).set({
                        name: result.user.displayName,
                        email: result.user.email,
                        createdAt: new Date(),
                        specialty: ''
                    });
                }
            })
            .then(() => {
                // This might not execute if we're doing a redirect
                const user = auth.currentUser;
                if (user) {
                    console.log('Redirecting to profile page');
                    window.location.href = 'profile.html';
                }
            })
            .catch((error) => {
                console.error('Google sign-in error:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);

                let errorMessage = 'Failed to sign in with Google. ';

                // Handle specific error cases
                if (error.code === 'auth/popup-blocked') {
                    errorMessage += 'Please allow popups for this website and try again.';
                } else if (error.code === 'auth/popup-closed-by-user') {
                    errorMessage += 'Sign-in was cancelled. Please try again.';
                } else if (error.code === 'auth/cancelled-popup-request') {
                    errorMessage += 'Another sign-in attempt is in progress. Please wait.';
                } else if (error.code === 'auth/network-request-failed') {
                    errorMessage += 'Network error. Please check your connection and try again.';
                } else {
                    errorMessage += 'Error: ' + error.message;
                }

                if (authError) {
                    showError(authError, errorMessage);
                }
            });
    } catch (error) {
        console.error('Exception in Google sign-in function:', error);
        if (authError) {
            showError(authError, 'An unexpected error occurred. Please try again.');
        }
    }
}

// Handle redirect result
auth.getRedirectResult().then((result) => {
    if (result.user) {
        console.log('Redirect result received', result);
        // Check if user is new
        const isNewUser = result.additionalUserInfo.isNewUser;

        // If new user, create profile in Firestore
        if (isNewUser && db) {
            console.log('Creating user profile in Firestore after redirect');
            db.collection('users').doc(result.user.uid).set({
                name: result.user.displayName,
                email: result.user.email,
                createdAt: new Date(),
                specialty: ''
            }).then(() => {
                window.location.href = 'profile.html';
            });
        } else {
            window.location.href = 'profile.html';
        }
    }
}).catch((error) => {
    console.error('Redirect result error:', error);
    // Only show error if we're on the signup or login page
    if (authError && (window.location.pathname.includes('signup.html') || window.location.pathname.includes('login.html'))) {
        showError(authError, 'Failed to complete Google sign-in. Please try again.');
    }
});

// Google login button
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', signInWithGoogle);
}

// Google signup button
if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', signInWithGoogle);
}

// Logout functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();

        auth.signOut()
            .then(() => {
                console.log('User signed out');
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Logout error:', error);
            });
    });
}

// User dropdown toggle
if (userDropdownToggle && userDropdown) {
    userDropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        userDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!userDropdownToggle.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
}

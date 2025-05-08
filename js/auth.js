// js/auth.js

// This script assumes that 'auth' and 'db' constants are defined
// and available globally or in the script's scope by
// the firebase-config.js file loaded previously.

// DOM Elements for Header UI
const userDropdownToggle = document.getElementById('user-dropdown-toggle');
const userDropdown = document.getElementById('user-dropdown');
const navUserName = document.getElementById('nav-user-name'); // Correct ID from header HTML
const authLinks = document.querySelectorAll('.auth-links'); // For header login/signup links
const userMenu = document.querySelector('.user-menu'); // For header user menu
const logoutBtn = document.getElementById('nav-logout-btn'); // Correct ID from header dropdown

// DOM Elements for this specific page (signup.html)
const signedInMessage = document.getElementById('signed-in-message');
const firebaseUIContainer = document.getElementById('firebaseui-auth-container');
const loader = document.getElementById('loader');


// Helper functions (simple versions, less needed with FirebaseUI)
function showElement(element) {
    if (element) element.style.display = 'block';
}

function hideElement(element) {
     if (element) element.style.display = 'none';
}

// Check if user is logged in and handle redirects + UI updates
// This listener runs whenever the auth state changes (login, logout)
auth.onAuthStateChanged(function(user) {
    console.log("Auth state changed. Current user:", user ? user.email : "None");

    const currentPath = window.location.pathname;

    // === Handle Header UI Visibility ===
    if (authLinks && userMenu && navUserName) { // Check if header elements exist
        if (user) {
            // User is signed in
            authLinks.forEach(link => hideElement(link));
            showElement(userMenu); // Display user menu
            navUserName.textContent = user.displayName || user.email || 'Account'; // Use display name if available
        } else {
            // User is signed out
            authLinks.forEach(link => showElement(link));
            hideElement(userMenu); // Hide user menu
            navUserName.textContent = 'Account'; // Reset name
        }
    }

    // === Handle Page Content & Redirections ===
    if (currentPath.includes('signup.html')) { // Logic specifically for the signup page
        if (user) {
             // User is signed in
             console.log('User is signed in on signup page. Redirecting or showing message.');
             hideElement(firebaseUIContainer); // Hide FirebaseUI widget
             hideElement(loader); // Hide loader
             showElement(signedInMessage); // Show "already signed in" message

             // Redirect to profile after a short delay
             setTimeout(() => {
                 window.location.href = 'profile.html';
             }, 2000); // Redirect after 2 seconds
        } else {
             // User is signed out
             console.log('User is signed out on signup page. Showing FirebaseUI.');
             // FirebaseUI will be started by auth-ui-init.js, which handles showing itself
             hideElement(signedInMessage); // Hide signed-in message
             // loader and firebaseUIContainer display handled by auth-ui-init.js uiShown callback
        }
    }
     // Add logic here for other pages if needed, like login.html, profile.html etc.
     // The previous auth.js had redirects for login/signup/reset -> profile
     // and profile -> login. You should adapt that logic here based on which
     // pages this auth.js script is included on.

     // Example: Redirect logic for login.html (if auth.js is also on login.html)
     if (currentPath.includes('login.html')) {
         if (user) {
             console.log('User signed in on login page. Redirecting to profile.');
             window.location.href = 'profile.html';
         } else {
             console.log('User signed out on login page. Showing login form.');
             // Assume login.html has its own form or FirebaseUI container
         }
     }
     // Example: Redirect logic for profile.html (if auth.js is also on profile.html)
     if (currentPath.includes('profile.html')) {
         if (!user) {
             console.log('User signed out on profile page. Redirecting to login.');
             window.location.href = 'login.html';
         }
     }


});

// Logout functionality (for the header button)
// Using the correct ID from the header dropdown menu
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Logout button clicked.');

        auth.signOut()
            .then(() => {
                console.log('User signed out successfully.');
                // The onAuthStateChanged listener handles the UI update and redirection
            })
            .catch((error) => {
                console.error('Logout error:', error);
                // Optionally show a logout error message if needed
                // showError(authError, 'Logout failed: ' + error.message); // Need authError element
            });
    });
}

// User dropdown toggle (for the header)
if (userDropdownToggle && userDropdown) {
    userDropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        userDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (userDropdownToggle && userDropdown &&
           !userDropdownToggle.contains(e.target) &&
           !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
}

// Note: Form submission handlers (for custom email/password forms),
// Google button listeners (if not using FirebaseUI), and password reset
// form logic should be in other scripts or handled by FirebaseUI
// if you adopt the FirebaseUI-centric approach.
// This auth.js focuses on universal auth state management and header UI.
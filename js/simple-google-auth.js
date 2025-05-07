// Simple Google Authentication Implementation
// This uses the most basic approach possible to minimize potential issues

// Function to handle Google sign-in
function handleGoogleSignIn() {
    // Show loading state
    const statusElement = document.getElementById('google-status');
    if (statusElement) {
        statusElement.textContent = 'Connecting to Google...';
        statusElement.style.display = 'block';
    }
    
    try {
        // Create Google provider
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Sign in with popup
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                // Success - redirect to profile
                if (statusElement) {
                    statusElement.textContent = 'Success! Redirecting...';
                }
                
                // Wait a moment before redirecting
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1000);
            })
            .catch((error) => {
                // Handle errors
                console.error('Google sign-in error:', error);
                
                if (statusElement) {
                    statusElement.textContent = `Error: ${error.message}`;
                    statusElement.style.color = 'red';
                }
            });
    } catch (error) {
        // Handle unexpected errors
        console.error('Unexpected error:', error);
        
        if (statusElement) {
            statusElement.textContent = `Unexpected error: ${error.message}`;
            statusElement.style.color = 'red';
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers to buttons
    const googleLoginBtn = document.getElementById('simple-google-login');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    const googleSignupBtn = document.getElementById('simple-google-signup');
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', handleGoogleSignIn);
    }
});

// Simplified Google Authentication Implementation for SyvurSoft

/**
 * Direct Google Sign-in Implementation
 * This is a simplified version that directly uses Firebase's signInWithPopup
 */
function signInWithGoogleDirect() {
    console.log('Attempting direct Google sign-in with popup...');

    // Create a Google Auth Provider
    const provider = new firebase.auth.GoogleAuthProvider();
    console.log('Google provider created');

    // Add scopes for better user data
    provider.addScope('profile');
    provider.addScope('email');
    console.log('Added scopes to Google provider');

    // Set custom parameters for better UX
    provider.setCustomParameters({
        'prompt': 'select_account'
    });
    console.log('Set custom parameters for Google provider');

    // Get the auth instance
    const auth = firebase.auth();
    console.log('Got auth instance');

    // Sign in with popup
    console.log('Calling signInWithPopup...');
    return auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Google sign-in successful!', result);

            // Get the signed-in user info
            const user = result.user;
            console.log('User:', user.email);

            // Check if user is new
            const isNewUser = result.additionalUserInfo.isNewUser;
            console.log('Is new user:', isNewUser);

            // Redirect to profile page
            console.log('Redirecting to profile page...');
            window.location.href = 'profile.html';

            return { user, isNewUser };
        })
        .catch((error) => {
            console.error('Google sign-in error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            alert('Google sign-in failed: ' + error.message);

            throw error;
        });
}

// Export the functions
window.googleAuth = {
    signInWithGoogle: signInWithGoogleDirect,
    signInWithGooglePopup: signInWithGoogleDirect,
    signInWithGoogleRedirect: signInWithGoogleDirect,
    handleGoogleRedirectResult: function() { return Promise.resolve(null); }
};

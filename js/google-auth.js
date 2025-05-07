// Google Authentication Implementation for SyvurSoft
// Based on Firebase best practices and quickstart examples

/**
 * Initializes Google Authentication
 * This function sets up the Google Auth provider with proper scopes and parameters
 */
function initGoogleAuth() {
    console.log('Initializing Google Authentication...');
    
    // Create a Google Auth Provider
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Add scopes for better user data
    provider.addScope('profile');
    provider.addScope('email');
    
    // Set custom parameters for better UX
    provider.setCustomParameters({
        'prompt': 'select_account'
    });
    
    return provider;
}

/**
 * Sign in with Google using Popup
 * This is the recommended approach for desktop browsers
 */
function signInWithGooglePopup() {
    console.log('Attempting Google sign-in with popup...');
    
    const provider = initGoogleAuth();
    const auth = firebase.auth();
    
    // Display loading indicator or disable button here
    
    return auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Google sign-in successful', result);
            
            // Get the Google Access Token
            const credential = result.credential;
            const token = credential.accessToken;
            
            // Get the signed-in user info
            const user = result.user;
            
            // Check if user is new
            const isNewUser = result.additionalUserInfo.isNewUser;
            console.log('Is new user:', isNewUser);
            
            // If new user, create profile in Firestore
            if (isNewUser && firebase.firestore) {
                console.log('Creating user profile in Firestore');
                return firebase.firestore().collection('users').doc(user.uid).set({
                    name: user.displayName,
                    email: user.email,
                    createdAt: new Date(),
                    specialty: '',
                    photoURL: user.photoURL || '',
                    lastLogin: new Date()
                }).then(() => {
                    console.log('User profile created successfully');
                    return { user, isNewUser };
                });
            }
            
            // Update last login time for existing users
            if (!isNewUser && firebase.firestore) {
                firebase.firestore().collection('users').doc(user.uid).update({
                    lastLogin: new Date()
                }).catch(error => {
                    console.error('Error updating last login time:', error);
                });
            }
            
            return { user, isNewUser };
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
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage += 'An account already exists with the same email address but different sign-in credentials. Please sign in using the original method.';
            } else {
                errorMessage += error.message;
            }
            
            throw { 
                code: error.code, 
                message: errorMessage,
                originalError: error 
            };
        });
}

/**
 * Sign in with Google using Redirect
 * This is the recommended approach for mobile browsers
 */
function signInWithGoogleRedirect() {
    console.log('Attempting Google sign-in with redirect...');
    
    const provider = initGoogleAuth();
    const auth = firebase.auth();
    
    // Store that we're using redirect method in session storage
    // This helps us handle the redirect result properly
    sessionStorage.setItem('authMethod', 'redirect');
    
    return auth.signInWithRedirect(provider)
        .catch(error => {
            console.error('Error starting Google redirect flow:', error);
            throw error;
        });
}

/**
 * Handle the redirect result from Google sign-in
 * Call this function when your page loads to handle redirect results
 */
function handleGoogleRedirectResult() {
    console.log('Checking for Google redirect result...');
    
    const auth = firebase.auth();
    
    return auth.getRedirectResult()
        .then((result) => {
            // Clear the auth method from session storage
            sessionStorage.removeItem('authMethod');
            
            // If no result, user didn't just complete a redirect flow
            if (!result.user) {
                console.log('No redirect result found');
                return null;
            }
            
            console.log('Google redirect sign-in successful', result);
            
            // Get the Google Access Token
            const credential = result.credential;
            const token = credential.accessToken;
            
            // Get the signed-in user info
            const user = result.user;
            
            // Check if user is new
            const isNewUser = result.additionalUserInfo.isNewUser;
            console.log('Is new user:', isNewUser);
            
            // If new user, create profile in Firestore
            if (isNewUser && firebase.firestore) {
                console.log('Creating user profile in Firestore');
                return firebase.firestore().collection('users').doc(user.uid).set({
                    name: user.displayName,
                    email: user.email,
                    createdAt: new Date(),
                    specialty: '',
                    photoURL: user.photoURL || '',
                    lastLogin: new Date()
                }).then(() => {
                    console.log('User profile created successfully');
                    return { user, isNewUser };
                });
            }
            
            // Update last login time for existing users
            if (!isNewUser && firebase.firestore) {
                firebase.firestore().collection('users').doc(user.uid).update({
                    lastLogin: new Date()
                }).catch(error => {
                    console.error('Error updating last login time:', error);
                });
            }
            
            return { user, isNewUser };
        })
        .catch((error) => {
            console.error('Google redirect result error:', error);
            
            // Only throw an error if we were expecting a redirect result
            if (sessionStorage.getItem('authMethod') === 'redirect') {
                sessionStorage.removeItem('authMethod');
                
                let errorMessage = 'Failed to complete Google sign-in. ';
                
                if (error.code === 'auth/network-request-failed') {
                    errorMessage += 'Network error. Please check your connection and try again.';
                } else if (error.code === 'auth/account-exists-with-different-credential') {
                    errorMessage += 'An account already exists with the same email address but different sign-in credentials. Please sign in using the original method.';
                } else {
                    errorMessage += error.message;
                }
                
                throw { 
                    code: error.code, 
                    message: errorMessage,
                    originalError: error 
                };
            }
            
            return null;
        });
}

/**
 * Detect if the user is on a mobile device
 * Used to determine whether to use popup or redirect
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Smart sign-in with Google
 * Uses redirect for mobile devices and popup for desktop
 */
function signInWithGoogle() {
    if (isMobileDevice()) {
        return signInWithGoogleRedirect();
    } else {
        return signInWithGooglePopup();
    }
}

// Export the functions
window.googleAuth = {
    signInWithGoogle,
    signInWithGooglePopup,
    signInWithGoogleRedirect,
    handleGoogleRedirectResult
};

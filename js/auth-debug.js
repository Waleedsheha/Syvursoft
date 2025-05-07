// Authentication Debugging Tool
// This script helps diagnose authentication issues

// Create a debugging div that will show all authentication events
function createDebugPanel() {
    // Check if debug panel already exists
    if (document.getElementById('auth-debug-panel')) {
        return;
    }

    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'auth-debug-panel';
    debugPanel.style.position = 'fixed';
    debugPanel.style.bottom = '10px';
    debugPanel.style.right = '10px';
    debugPanel.style.width = '300px';
    debugPanel.style.maxHeight = '200px';
    debugPanel.style.overflowY = 'auto';
    debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugPanel.style.color = '#00ff00';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.zIndex = '9999';
    
    // Add a title
    const title = document.createElement('div');
    title.textContent = 'Auth Debug Panel';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '5px';
    title.style.borderBottom = '1px solid #00ff00';
    debugPanel.appendChild(title);
    
    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = '#ff0000';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = function() {
        document.body.removeChild(debugPanel);
    };
    debugPanel.appendChild(closeButton);
    
    // Add a clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.style.backgroundColor = '#333';
    clearButton.style.border = 'none';
    clearButton.style.color = '#fff';
    clearButton.style.padding = '2px 5px';
    clearButton.style.marginTop = '5px';
    clearButton.style.cursor = 'pointer';
    clearButton.onclick = function() {
        const logs = debugPanel.querySelector('#debug-logs');
        logs.innerHTML = '';
    };
    debugPanel.appendChild(clearButton);
    
    // Add a container for logs
    const logs = document.createElement('div');
    logs.id = 'debug-logs';
    logs.style.marginTop = '10px';
    debugPanel.appendChild(logs);
    
    // Add to body
    document.body.appendChild(debugPanel);
    
    // Log initial message
    logDebug('Debug panel initialized');
}

// Log a debug message to the panel
function logDebug(message, type = 'info') {
    const debugPanel = document.getElementById('auth-debug-panel');
    if (!debugPanel) {
        createDebugPanel();
    }
    
    const logs = document.getElementById('debug-logs');
    const log = document.createElement('div');
    
    // Set color based on type
    let color = '#00ff00'; // Default green for info
    if (type === 'error') {
        color = '#ff0000'; // Red for errors
    } else if (type === 'warning') {
        color = '#ffff00'; // Yellow for warnings
    } else if (type === 'success') {
        color = '#00ffff'; // Cyan for success
    }
    
    log.style.color = color;
    log.style.marginBottom = '3px';
    
    // Add timestamp
    const now = new Date();
    const timestamp = now.toLocaleTimeString() + '.' + now.getMilliseconds().toString().padStart(3, '0');
    
    log.textContent = `[${timestamp}] ${message}`;
    logs.appendChild(log);
    
    // Auto-scroll to bottom
    logs.scrollTop = logs.scrollHeight;
    
    // Also log to console
    if (type === 'error') {
        console.error(message);
    } else if (type === 'warning') {
        console.warn(message);
    } else {
        console.log(message);
    }
}

// Check Firebase initialization
function checkFirebaseInit() {
    try {
        if (firebase.app) {
            logDebug('Firebase initialized successfully');
            
            // Log Firebase config
            const config = firebase.app().options;
            logDebug(`Firebase config: apiKey=${config.apiKey.substring(0, 5)}..., projectId=${config.projectId}`);
            
            // Check auth
            if (firebase.auth) {
                logDebug('Firebase Auth is available');
            } else {
                logDebug('Firebase Auth is NOT available', 'error');
            }
            
            // Check firestore
            if (firebase.firestore) {
                logDebug('Firebase Firestore is available');
            } else {
                logDebug('Firebase Firestore is NOT available', 'warning');
            }
        } else {
            logDebug('Firebase app is not initialized', 'error');
        }
    } catch (error) {
        logDebug(`Firebase initialization error: ${error.message}`, 'error');
    }
}

// Monitor auth state changes
function monitorAuthState() {
    try {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                logDebug(`User signed in: ${user.email}`, 'success');
                logDebug(`User ID: ${user.uid}`);
                logDebug(`Display name: ${user.displayName || 'Not set'}`);
                logDebug(`Email verified: ${user.emailVerified}`);
                logDebug(`Provider ID: ${user.providerId}`);
                
                // Check provider data
                if (user.providerData && user.providerData.length > 0) {
                    user.providerData.forEach((profile) => {
                        logDebug(`Provider: ${profile.providerId}`);
                    });
                }
            } else {
                logDebug('User is signed out');
            }
        });
    } catch (error) {
        logDebug(`Error setting up auth state monitor: ${error.message}`, 'error');
    }
}

// Test Google sign-in
function testGoogleSignIn() {
    logDebug('Testing Google sign-in...');
    
    try {
        // Create a Google provider
        const provider = new firebase.auth.GoogleAuthProvider();
        logDebug('Google provider created');
        
        // Add scopes
        provider.addScope('profile');
        provider.addScope('email');
        logDebug('Added scopes to Google provider');
        
        // Set custom parameters
        provider.setCustomParameters({
            'prompt': 'select_account'
        });
        logDebug('Set custom parameters for Google provider');
        
        // Sign in with popup
        logDebug('Attempting sign in with popup...');
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                logDebug('Google sign-in successful!', 'success');
                logDebug(`User: ${result.user.email}`);
                logDebug(`Token: ${result.credential.accessToken ? 'Available' : 'Not available'}`);
                
                // Check if new user
                const isNewUser = result.additionalUserInfo.isNewUser;
                logDebug(`Is new user: ${isNewUser}`);
                
                // Redirect to profile page
                setTimeout(() => {
                    logDebug('Redirecting to profile page...');
                    window.location.href = 'profile.html';
                }, 3000);
            })
            .catch((error) => {
                logDebug(`Google sign-in error: ${error.code}`, 'error');
                logDebug(`Error message: ${error.message}`, 'error');
                
                if (error.code === 'auth/popup-blocked') {
                    logDebug('Popup was blocked by the browser. Trying redirect method...', 'warning');
                    testGoogleSignInRedirect();
                }
            });
    } catch (error) {
        logDebug(`Exception in Google sign-in test: ${error.message}`, 'error');
    }
}

// Test Google sign-in with redirect
function testGoogleSignInRedirect() {
    logDebug('Testing Google sign-in with redirect...');
    
    try {
        // Create a Google provider
        const provider = new firebase.auth.GoogleAuthProvider();
        logDebug('Google provider created for redirect');
        
        // Add scopes
        provider.addScope('profile');
        provider.addScope('email');
        logDebug('Added scopes to Google provider');
        
        // Set custom parameters
        provider.setCustomParameters({
            'prompt': 'select_account'
        });
        logDebug('Set custom parameters for Google provider');
        
        // Store that we're using redirect method
        sessionStorage.setItem('authMethod', 'redirect');
        logDebug('Stored auth method in session storage');
        
        // Sign in with redirect
        logDebug('Attempting sign in with redirect...');
        firebase.auth().signInWithRedirect(provider)
            .catch((error) => {
                logDebug(`Google redirect error: ${error.code}`, 'error');
                logDebug(`Error message: ${error.message}`, 'error');
            });
    } catch (error) {
        logDebug(`Exception in Google redirect test: ${error.message}`, 'error');
    }
}

// Check for redirect result
function checkRedirectResult() {
    logDebug('Checking for redirect result...');
    
    try {
        firebase.auth().getRedirectResult()
            .then((result) => {
                if (result.user) {
                    logDebug('Redirect result received!', 'success');
                    logDebug(`User: ${result.user.email}`);
                    logDebug(`Token: ${result.credential.accessToken ? 'Available' : 'Not available'}`);
                    
                    // Check if new user
                    const isNewUser = result.additionalUserInfo.isNewUser;
                    logDebug(`Is new user: ${isNewUser}`);
                    
                    // Redirect to profile page
                    setTimeout(() => {
                        logDebug('Redirecting to profile page...');
                        window.location.href = 'profile.html';
                    }, 3000);
                } else {
                    logDebug('No redirect result found');
                }
            })
            .catch((error) => {
                logDebug(`Redirect result error: ${error.code}`, 'error');
                logDebug(`Error message: ${error.message}`, 'error');
            });
    } catch (error) {
        logDebug(`Exception in checking redirect result: ${error.message}`, 'error');
    }
}

// Add a debug button to the page
function addDebugButton() {
    const button = document.createElement('button');
    button.textContent = 'Debug Google Sign-In';
    button.style.position = 'fixed';
    button.style.bottom = '10px';
    button.style.left = '10px';
    button.style.backgroundColor = '#007bff';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.padding = '10px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '9999';
    
    button.onclick = function() {
        createDebugPanel();
        checkFirebaseInit();
        monitorAuthState();
        testGoogleSignIn();
    };
    
    document.body.appendChild(button);
}

// Initialize debugging
document.addEventListener('DOMContentLoaded', function() {
    // Create debug panel
    createDebugPanel();
    
    // Check Firebase initialization
    checkFirebaseInit();
    
    // Monitor auth state
    monitorAuthState();
    
    // Check for redirect result
    checkRedirectResult();
    
    // Add debug button
    addDebugButton();
    
    // Log page info
    logDebug(`Page loaded: ${window.location.pathname}`);
    logDebug(`User agent: ${navigator.userAgent}`);
});

// Export debugging functions
window.authDebug = {
    log: logDebug,
    testGoogleSignIn: testGoogleSignIn,
    testGoogleSignInRedirect: testGoogleSignInRedirect,
    checkRedirectResult: checkRedirectResult
};

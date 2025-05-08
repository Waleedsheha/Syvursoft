// js/auth-ui-init.js

// This script assumes 'firebase' and 'auth' are available globally
// from the SDKs and firebase-config.js loaded previously.
// It also assumes 'db' is available if you want to use it in callbacks.

document.addEventListener('DOMContentLoaded', function() {
    const firebaseUIContainer = document.getElementById('firebaseui-auth-container');
    const loader = document.getElementById('loader');
    const authError = document.getElementById('auth-error'); // Get auth error div from signup.html
    const authSuccess = document.getElementById('auth-success'); // Get auth success div

     // Check if the container exists before trying to start FirebaseUI
    if (!firebaseUIContainer) {
        console.warn("FirebaseUI container #firebaseui-auth-container not found on this page.");
         if(loader) loader.style.display = 'none'; // Hide loader if container is missing
        return; // Stop execution if no container
    }

    // Ensure FirebaseUI is available
    if (typeof firebaseui === 'undefined' || !firebaseui.auth || !firebaseui.auth.AuthUI) {
        console.error("FirebaseUI SDK not loaded. Cannot initialize FirebaseUI.");
         if(loader) loader.style.display = 'none'; // Hide loader
         if(authError) authError.textContent = "Authentication options failed to load. Please try refreshing.";
         if(authError) authError.style.display = 'block';
        return; // Stop execution
    }

    // Initialize the FirebaseUI Widget
    // Pass the 'auth' instance from firebase-config.js
    const ui = new firebaseui.auth.AuthUI(auth);

    // FirebaseUI configuration
    const uiConfig = {
      callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
          // User successfully signed in or signed up
          console.log('Sign-in successful via FirebaseUI:', authResult);

          // Check if user is new (useful for initial profile creation)
          const isNewUser = authResult.additionalUserInfo.isNewUser;
          const user = authResult.user;

          // If new user AND Firestore is available, create profile
          if (isNewUser && typeof db !== 'undefined' && db.collection) {
            console.log('New user signed up via FirebaseUI. Creating profile in Firestore.');
            // Use the user's display name and photo URL if provided by the auth provider (like Google)
            const userName = user.displayName || '';
            const userPhotoURL = user.photoURL || '';

             db.collection('users').doc(user.uid).set({
               name: userName,
               email: user.email,
               createdAt: firebase.firestore.FieldValue.serverTimestamp(), // Use server timestamp
               specialty: '', // Initialize specialty
               photoURL: userPhotoURL,
               lastLogin: firebase.firestore.FieldValue.serverTimestamp() // Initial last login timestamp
            }).then(() => {
                 console.log("New user profile created in Firestore.");
                 // No need to redirect here, the return false handles it.
            }).catch(error => {
                 console.error("Error creating new user profile in Firestore:", error);
                 // Decide how to handle this error - maybe log it and proceed?
            });

          } else if (typeof db !== 'undefined' && db.collection) {
             // Existing user, update last login time in Firestore
             console.log('Existing user signed in via FirebaseUI. Updating last login.');
             db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
             }).then(() => {
                 console.log("Existing user last login updated in Firestore.");
             }).catch(error => {
                 console.error("Error updating existing user last login:", error);
             });
          } else {
               console.warn("Firestore DB not initialized or user not new. Skipping user profile creation/update.");
          }


          // Do not redirect here. Let the auth.onAuthStateChanged listener handle the redirect.
          // Returning `false` prevents FirebaseUI's default redirect.
          return false;
        },
        uiShown: function() {
          // The FirebaseUI widget is rendered.
          // Hide the loader.
          if (loader) loader.style.display = 'none';
          // Show the container if hidden (optional, usually defaults to block)
          if (firebaseUIContainer) firebaseUIContainer.style.display = 'block';
          console.log("FirebaseUI widget rendered.");
        },
        signInFailure: function(error) {
           // Some unrecoverable error occurred during sign-in.
           // The error object contains details.
           console.error('FirebaseUI sign-in error:', error);
            let errorMessage = 'Authentication failed. Please try again.';

            // Display error message
            if (authError) {
                if (error.code) {
                    // You can add more specific error messages here
                     switch (error.code) {
                         case 'firebaseui/anonymous-upgrade-merge-conflict':
                             errorMessage = 'Account merge conflict. Try signing in with your other account.';
                             break;
                         case 'auth/popup-blocked':
                             errorMessage = 'Popup window blocked by your browser. Please allow popups for this site.';
                             break;
                         // Add more cases for common errors if desired
                         default:
                             errorMessage = `Authentication failed: ${error.message}`; // Fallback to Firebase error message
                             break;
                     }
                }
                authError.textContent = errorMessage;
                authError.style.display = 'block';
            }
             // Ensure loader is hidden
             if(loader) loader.style.display = 'none';
              // Ensure container is visible
             if(firebaseUIContainer) firebaseUIContainer.style.display = 'block';

        }
      },
      // Will use popup for IDP Providers sign-in flow instead of the default, redirect
      signInFlow: 'popup', // Or 'redirect' if you prefer a full page redirect
      // Specify the pages you want to redirect to AFTER successful authentication
      // However, we return `false` in signInSuccessWithAuthResult to let auth.js handle redirects
      // signInSuccessUrl: 'profile.html', // This is ignored because we return false

      // List of OAuth providers supported
      // Include Email/Password here so FirebaseUI renders its form
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // Add other providers like Facebook, Twitter, etc. here if enabled in Firebase
        // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      ],
      // Terms of service url
      tosUrl: 'terms.html',
      // Privacy policy url
      privacyPolicyUrl: 'privacy.html'
    };

    // Start FirebaseUI if the container is not hidden (e.g., by the auth state listener)
    // and the user is currently signed out.
     if (firebaseUIContainer.style.display !== 'none' && !auth.currentUser) {
        console.log("Starting FirebaseUI widget.");
        // Hide loader initially until uiShown callback
        if(loader) loader.style.display = 'block';
        // Optionally hide the container until uiShown
        // if(firebaseUIContainer) firebaseUIContainer.style.display = 'none';

        ui.start('#firebaseui-auth-container', uiConfig);
     } else {
         console.log("FirebaseUI not started: User already signed in or container not visible.");
          if(loader) loader.style.display = 'none'; // Hide loader if not starting
     }

});
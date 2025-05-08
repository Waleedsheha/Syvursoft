// js/firebase-config.js

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgKc46stmvdh0jFOGBikbAJZao3DjIJMw",
  authDomain: "divine-anthem-451320-e1.firebaseapp.com",
  projectId: "divine-anthem-451320-e1",
  storageBucket: "divine-anthem-451320-e1.firebasestorage.app",
  messagingSenderId: "813789382998",
  appId: "1:813789382998:web:6c1aa26bd05911ad90eef7",
  measurementId: "G-5FQXXVV0F5" // Optional, only if you need analytics
};

// Initialize Firebase App (using compat syntax)
const app = firebase.initializeApp(firebaseConfig);

// Get Firebase Auth instance (using compat syntax)
const auth = firebase.auth(app);

// Get Firebase Firestore instance (using compat syntax)
const db = firebase.firestore(app);

// Optional: Initialize Analytics if you included the SDK
// const analytics = firebase.analytics(app);


// ==============================================
// Initialize Firebase App Check
// Requires the firebase-app-check-compat.js SDK
// And configuration in the Firebase Console -> App Check
// ==============================================

// Replace 'YOUR_RECAPTCHA_V3_SITE_KEY' with your actual site key
// Get this from the Firebase Console -> App Check -> Web (reCAPTCHA v3)
const RECAPTCHA_V3_SITE_KEY = '6LftBDIrAAAAAOV1TwbF_Jz12cwvNB5pub1j6Rjt'; // <-- REPLACE THIS


// Check if App Check is available (SDK loaded)
if (typeof firebase.appCheck !== 'undefined') {
     // Get the App Check instance
     const appCheck = firebase.appCheck(app);

     // Initialize App Check with reCAPTCHA v3
     appCheck.activate(RECAPTCHA_V3_SITE_KEY, true); // true enables debug mode (useful during development)

     console.log("Firebase App Check initialized.");
} else {
     console.warn("Firebase App Check SDK not loaded or available. App Check will not function.");
      // If App Check is enforced in Firebase, this will lead to errors.
}


console.log("Firebase Compat SDK initialized successfully!");

// Note: The variables 'auth' and 'db' are made available
// in the global scope because the compat SDKs add them
// to the global 'firebase' object, and we assign them here
// for clarity and easier access in other scripts loaded later.
// Firebase configuration
// SyvurSoft Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyAgKc46stmvdh0jFOGBikbAJZao3DjIJMw",
    authDomain: "divine-anthem-451320-e1.firebaseapp.com",
    projectId: "divine-anthem-451320-e1",
    storageBucket: "divine-anthem-451320-e1.firebasestorage.app",
    messagingSenderId: "813789382998",
    appId: "1:813789382998:web:6c1aa26bd05911ad90eef7",
    measurementId: "G-5FQXXVV0F5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = firebase.auth();

// Initialize Firestore (for user profiles)
const db = firebase.firestore ? firebase.firestore() : null;

// Initialize Analytics if available
const analytics = firebase.analytics ? firebase.analytics() : null;

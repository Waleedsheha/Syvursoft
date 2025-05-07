# Firebase Authentication Setup for SyvurSoft

This document provides instructions on how to set up Firebase Authentication for your SyvurSoft project.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "SyvurSoft")
4. Choose whether to enable Google Analytics (recommended)
5. Accept the terms and click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the web icon (</>) to add a web app
2. Enter a nickname for your app (e.g., "SyvurSoft Web")
3. Check the box for "Also set up Firebase Hosting" if you plan to use it
4. Click "Register app"
5. Copy the Firebase configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

6. Replace the placeholder configuration in `js/firebase-config.js` with your actual Firebase configuration

## Step 3: Set Up Authentication Methods

1. In the Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the authentication methods you want to use:
   - Email/Password (required)
   - Google (recommended)
   - Other providers as needed
4. For Email/Password:
   - Click "Email/Password"
   - Toggle the "Enable" switch to on
   - Choose whether to enable email link authentication
   - Click "Save"
5. For Google:
   - Click "Google"
   - Toggle the "Enable" switch to on
   - Enter your support email
   - Click "Save"

## Step 4: Set Up Firestore (Optional, for User Profiles)

1. In the Firebase Console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" or "Start in test mode" (for development)
4. Select a location for your database
5. Click "Enable"
6. Set up security rules for your database:
   - Go to the "Rules" tab
   - Update the rules to allow authenticated users to access their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
  }
}
```

## Step 5: Deploy Your Website

1. Update your website with the Firebase configuration
2. Test the authentication flow locally
3. Deploy your website to your hosting provider

## Troubleshooting

- If you encounter CORS issues, make sure your domain is added to the authorized domains in Firebase Authentication settings
- If Google sign-in doesn't work, verify that you've configured the OAuth consent screen in the Google Cloud Console
- For any other issues, check the browser console for error messages

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Web Setup Guide](https://firebase.google.com/docs/web/setup)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)

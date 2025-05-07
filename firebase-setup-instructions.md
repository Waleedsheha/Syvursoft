# Firebase Authentication Setup Instructions

To fix the Google authentication issue, please follow these steps in the Firebase Console:

## 1. Enable Google Authentication in Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `divine-anthem-451320-e1`
3. In the left sidebar, click on **Authentication**
4. Click on the **Sign-in method** tab
5. Find **Google** in the list of providers
6. Click on it and make sure it's **Enabled** (toggle should be on)
7. Make sure you have a valid **Support email** selected
8. Click **Save**

## 2. Add Your Domain to Authorized Domains

1. While still in the Authentication section, click on the **Settings** tab
2. Scroll down to the **Authorized domains** section
3. Make sure your domain is listed (if you're testing locally, `localhost` should be there)
4. If not, click **Add domain** and add your domain

## 3. Configure OAuth Consent Screen

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the same project as your Firebase project
3. In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**
4. Set up the OAuth consent screen if not already done:
   - Choose **External** user type
   - Fill in the required fields (App name, User support email, Developer contact information)
   - Click **Save and Continue**
5. Under **Scopes**, add the following scopes:
   - `email`
   - `profile`
   - Click **Save and Continue**
6. Under **Test users**, add your email address
   - Click **Save and Continue**
7. Review your settings and click **Back to Dashboard**

## 4. Check OAuth Credentials

1. In the Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Look for a **Web client** under **OAuth 2.0 Client IDs**
3. Click on it to view the details
4. Make sure the **Authorized JavaScript origins** include your domain
   - For local testing, add `http://localhost` and `http://localhost:5000`
5. Make sure the **Authorized redirect URIs** include:
   - `https://divine-anthem-451320-e1.firebaseapp.com/__/auth/handler`
   - For local testing: `http://localhost:5000/__/auth/handler`
6. Click **Save** if you made any changes

## 5. Update Your Firebase Config

Make sure your Firebase configuration in the code matches exactly what's in the Firebase Console:

1. In the Firebase Console, go to **Project settings** (gear icon)
2. Scroll down to the **Your apps** section
3. Click on the web app
4. Copy the Firebase configuration object
5. Make sure it matches exactly with what's in your `firebase-config.js` file

## After Making These Changes

After making these changes, please try the Google sign-in again. If it still doesn't work, please check the browser console for any specific error messages and let me know what you see.

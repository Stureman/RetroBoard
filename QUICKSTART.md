# Retroboard Quick Start Guide

Get your Retroboard up and running in 5 minutes!

## Prerequisites

- A Google account (for Firebase)
- Node.js v16+ and npm installed locally

## Step 1: Clone the Repository

```bash
git clone https://github.com/Stureman/RetroBoard.git
cd RetroBoard
npm install
```

## Step 2: Set Up Firebase (5 minutes)

### 2.1 Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project" → Enter "Retroboard" → Continue
3. Disable Google Analytics (optional) → Create project

### 2.2 Enable Authentication
1. In Firebase Console, click **Authentication** → **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password** provider
4. Toggle on **Email link (passwordless sign-in)**
5. Click **Save**

### 2.3 Create Firestore Database
1. Click **Firestore Database** → **Create database**
2. Select **Start in test mode** → Next
3. Choose your preferred location → Enable

### 2.4 Set Security Rules
1. Go to **Rules** tab in Firestore
2. Copy and paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /boards/{boardId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      request.auth.token.email == resource.data.creatorEmail;
    }
    match /cards/{cardId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                      request.auth.token.email == request.resource.data.authorEmail;
      allow update, delete: if request.auth != null &&
                               request.auth.token.email == resource.data.authorEmail;
    }
  }
}
```

3. Click **Publish**

### 2.5 Get Firebase Config
1. Click the gear icon ⚙️ → **Project settings**
2. Scroll to **Your apps** → Click the web icon `</>`
3. Register app with nickname "Retroboard Web"
4. Copy the `firebaseConfig` object

## Step 3: Configure the App

Open `src/environments/environment.ts` and replace with your config:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};
```

## Step 4: Run Locally

```bash
npm start
```

Open http://localhost:4200 🎉

## Step 5: Test It Out

1. Click **Login** → Enter your email → Check inbox
2. Click the magic link in your email
3. Create a new board with any name
4. Note the 6-character board code
5. Share the code with your team!

## Deploy to GitHub Pages (Optional)

1. Update your Firebase config in the code
2. Commit and push to main branch:
   ```bash
   git add .
   git commit -m "Update Firebase config"
   git push origin main
   ```
3. GitHub Actions will deploy automatically
4. Access at: `https://[your-username].github.io/RetroBoard/`

## Add Your GitHub Pages Domain to Firebase

After deploying:
1. Go to Firebase Console → Authentication → Settings
2. Under **Authorized domains**, click **Add domain**
3. Add: `[your-username].github.io`
4. Click **Add**

## Troubleshooting

**Can't sign in?**
- Make sure you enabled Email/Link in Firebase Auth
- Check that localhost is in Firebase authorized domains
- Wait a minute after sending the magic link

**Board not found?**
- Make sure you're authenticated before joining
- Check that the code is correct (6 uppercase characters/numbers)

**Data not saving?**
- Verify Firestore security rules are published
- Check browser console for errors

## Need Help?

- Read the full [SETUP.md](SETUP.md) guide
- Check [FEATURES.md](FEATURES.md) for feature details
- View [SCREENSHOTS.md](SCREENSHOTS.md) for UI examples
- Open an issue on GitHub

## What's Next?

- Customize the default lanes in `board.service.ts`
- Adjust the theme colors in `src/styles.scss`
- Add your own features!

---

**Happy Retrospecting! 🚀**

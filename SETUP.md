# Retroboard Setup Guide

This guide will walk you through setting up your own instance of Retroboard with Firebase.

## Prerequisites

- Node.js v16 or higher
- npm or yarn
- A Google account for Firebase

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "Retroboard")
4. Follow the prompts to create your project

### 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get started**
3. Click on the **Sign-in method** tab
4. Find **Email/Password** and click on it
5. Enable **Email link (passwordless sign-in)**
6. Add authorized domains (localhost for development, your GitHub Pages domain for production)
   - For GitHub Pages, add: `[your-username].github.io`
7. Click **Save**

### 3. Create Firestore Database

1. In your Firebase project, go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (we'll add security rules later)
4. Select a location close to your users
5. Click **Enable**

### 4. Set Up Firestore Security Rules

1. In Firestore Database, go to the **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Boards collection
    match /boards/{boardId} {
      // Anyone can read boards if they have the code
      allow read: if request.auth != null;
      // Only authenticated users can create boards
      allow create: if request.auth != null;
      // Only the creator can update their board
      allow update: if request.auth != null && 
                      request.auth.token.email == resource.data.creatorEmail;
    }
    
    // Cards collection
    match /cards/{cardId} {
      // Anyone can read cards if authenticated
      allow read: if request.auth != null;
      // Authenticated users can create cards
      allow create: if request.auth != null &&
                      request.auth.token.email == request.resource.data.authorEmail;
      // Only the author can update/delete their cards
      allow update, delete: if request.auth != null &&
                               request.auth.token.email == resource.data.authorEmail;
    }
  }
}
```

3. Click **Publish**

### 5. Get Firebase Configuration

1. In your Firebase project, click the gear icon ⚙️ next to **Project Overview**
2. Click **Project settings**
3. Scroll down to **Your apps** section
4. Click the web icon `</>` to add a web app
5. Register your app with a nickname (e.g., "Retroboard Web")
6. Copy the `firebaseConfig` object

### 6. Update Application Configuration

1. Open `src/environments/environment.ts` in your project
2. Replace the placeholder values with your Firebase configuration:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open http://localhost:4200

## Deployment to GitHub Pages

### Enable GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to **Pages** in the left sidebar
3. Under **Source**, select **GitHub Actions**

### Deploy

The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the main branch.

1. Make sure your Firebase configuration is set in `src/environments/environment.ts`
2. Push your changes to the main branch:
   ```bash
   git add .
   git commit -m "Update Firebase configuration"
   git push origin main
   ```

3. GitHub Actions will automatically build and deploy your app
4. Your app will be available at: `https://[your-username].github.io/RetroBoard/`

### Update Firebase Authorized Domains

After deployment, add your GitHub Pages domain to Firebase:

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add: `[your-username].github.io`
3. Click **Add**

## Testing the Application

### 1. Test Authentication

1. Go to your deployed app or http://localhost:4200
2. Click **Login**
3. Enter your email address
4. Check your email for the magic link
5. Click the link to sign in

### 2. Create a Board

1. After signing in, enter a board name
2. Click **Create Board**
3. Note the 6-character board code displayed

### 3. Test Board Features

1. Add cards to different lanes
2. Toggle visibility (admin only)
3. Add new lanes (admin only)
4. Share the board code with others

### 4. Join a Board

1. Open the app in a different browser or incognito window
2. Sign in with a different email
3. Enter the board code
4. Click **Join Board**
5. Verify that you can add cards but cannot see others' cards until visibility is toggled

## Troubleshooting

### Authentication Issues

- **Error: "Invalid action code"**
  - Make sure you're using the link from the email within 1 hour
  - Don't click the link multiple times
  - Try requesting a new magic link

- **Error: "Unauthorized domain"**
  - Add your domain to Firebase Authorized domains
  - For local development, `localhost` should be added
  - For GitHub Pages, add `[your-username].github.io`

### Firestore Issues

- **Error: "Missing or insufficient permissions"**
  - Check your Firestore security rules
  - Make sure you're authenticated before accessing data
  - Verify the rules allow the operation you're trying to perform

### Build Issues

- **Error: "Module not found"**
  - Run `npm install` to install dependencies
  - Delete `node_modules` and `package-lock.json`, then run `npm install` again

- **Build fails with memory errors**
  - Try increasing Node memory: `NODE_OPTIONS=--max_old_space_size=4096 npm run build`

## Support

For issues or questions:
1. Check the [GitHub Issues](https://github.com/Stureman/RetroBoard/issues)
2. Create a new issue if your problem isn't already reported

## License

MIT

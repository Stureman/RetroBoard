# RetroBoard

A modern Angular retroboard application for team retrospectives with real-time collaboration.

## Features

- 🔐 **Magic Link Authentication** - Passwordless sign-in using Firebase Auth
- 📊 **Board Management** - Create boards with shareable 6-character codes
- 👥 **Admin Controls** - Board creator has admin privileges
- 📝 **Lane Customization** - Add custom lanes (default: Good, Bad, Improve)
- 🎴 **Card Posting** - Users can post cards to lanes
- 👁️ **Visibility Toggle** - Admin can control when cards are visible to all users
- 🎨 **Material Design** - Beautiful UI with Angular Material
- 🔄 **Real-time Updates** - Live synchronization using Firebase Firestore

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project

## Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in 5 minutes
- **[Setup Guide](SETUP.md)** - Detailed Firebase configuration instructions
- **[Features](FEATURES.md)** - Complete feature list and technical details
- **[Screenshots](SCREENSHOTS.md)** - Visual documentation of the UI

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Stureman/RetroBoard.git
   cd RetroBoard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Link sign-in method)
   - Create a Firestore database
   - Copy your Firebase configuration
   - Update `src/environments/environment.ts` with your Firebase config:
   ```typescript
   export const environment = {
     production: false,
     firebase: {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
     }
   };
   ```

4. Run the development server:
   ```bash
   npm start
   ```

5. Open http://localhost:4200

## Deployment to GitHub Pages

The application is configured to deploy to GitHub Pages automatically via GitHub Actions.

1. Ensure your Firebase configuration is set in `src/environments/environment.ts`
2. Push changes to the main branch
3. GitHub Actions will build and deploy to GitHub Pages
4. Access your app at: https://[username].github.io/RetroBoard/

## Usage

1. **Login**: Enter your email to receive a magic link
2. **Create Board**: Give your board a name and click "Create Board"
3. **Share Code**: Copy the 6-character board code and share with your team
4. **Add Cards**: Users can add cards to any lane
5. **Toggle Visibility** (Admin only): Control when all users can see all cards
6. **Add Lanes** (Admin only): Customize lanes for your retrospective

## Project Structure

```
src/
├── app/
│   ├── components/          # UI components
│   │   ├── home/           # Home page
│   │   ├── login/          # Login page
│   │   ├── auth-verify/    # Magic link verification
│   │   └── board/          # Board view with lanes and cards
│   ├── services/           # Business logic
│   │   ├── auth.service.ts     # Authentication
│   │   └── board.service.ts    # Board management
│   ├── models/             # Data models
│   ├── guards/             # Route guards
│   └── app.routes.ts       # Routing configuration
└── environments/           # Environment configs
```

## Technologies

- Angular 17
- Angular Material
- Firebase (Auth & Firestore)
- TypeScript
- SCSS

## License

MIT

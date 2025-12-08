# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `daggerheart-campaign-manager`
4. Disable Google Analytics (optional, can enable later)
5. Click **"Create project"**

## Step 2: Register Web App

1. In your Firebase project, click the **Web icon** (</>)
2. Enter app nickname: `Daggerheart Web App`
3. Click **"Register app"**
4. Copy the Firebase configuration object

## Step 3: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **"Get started"**
3. Enable **Email/Password** sign-in method
4. Enable **Google** sign-in method (optional but recommended)
   - Add your support email
   - Click **Save**

## Step 4: Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll add rules next)
4. Choose your Cloud Firestore location (e.g., `us-central1`)
5. Click **"Enable"**

## Step 5: Configure Security Rules

1. In Firestore Database, go to **"Rules"** tab
2. Replace the default rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // User's campaigns
      match /campaigns/{campaignId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        // Campaign subcollections
        match /{subcollection}/{document=**} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

3. Click **"Publish"**

## Step 6: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and paste your Firebase config:
   ```
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

3. Save the file

## Step 7: Update .gitignore

Make sure `.env.local` is in `.gitignore` (already added):
```
# Environment variables
.env.local
.env
```

## Step 8: Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173
3. You should see the login page
4. Try signing up with an email/password
5. Check Firebase Console → Authentication to see the new user

## Step 9: Deploy (After Testing)

### Update Firebase Config for Production

1. In Firebase Console, go to **Project settings**
2. Scroll to **"Authorized domains"**
3. Add your production domain:
   - For Vercel: `daggerheart.vercel.app`
   - For GitHub Pages: `kedhead.github.io`
   - For custom domain: `yourdomain.com`

### Add Environment Variables to Hosting Platform

**Vercel:**
1. Go to your project settings
2. Add all `VITE_FIREBASE_*` variables
3. Redeploy

**Netlify:**
1. Site settings → Environment variables
2. Add all `VITE_FIREBASE_*` variables
3. Redeploy

**GitHub Pages:**
- Environment variables not supported
- Need to use GitHub Secrets and Actions
- Or hardcode values (not recommended for security)

## Security Best Practices

### ✅ DO:
- Keep `.env.local` in `.gitignore`
- Use environment variables for all Firebase config
- Enable only necessary sign-in methods
- Use security rules to protect data
- Add authorized domains in production

### ❌ DON'T:
- Commit Firebase config to Git (unless using env variables)
- Allow public read/write in Firestore rules
- Share your Firebase API key publicly
- Use the same Firebase project for dev and production

## Testing Authentication

### Test Email/Password Signup:
1. Click "Sign up"
2. Enter name, email, password
3. Should redirect to campaign selector
4. Check Firebase Console → Authentication for new user

### Test Google Sign-In:
1. Click "Continue with Google"
2. Select Google account
3. Should redirect to campaign selector
4. Check Firebase Console → Authentication

### Test Password Reset:
1. Click "Forgot password?"
2. Enter email
3. Check email for reset link
4. Click link and reset password

## Data Structure

Your Firestore database will look like this:

```
users/
  {userId}/
    campaigns/
      {campaignId}/
        name: "Shadowfen Chronicles"
        description: "A dark fantasy campaign"
        createdAt: timestamp
        updatedAt: timestamp

        characters/
          {characterId}/
            name: "Eldrin"
            demiplaneLink: "..."
            playerNotes: "..."
            backstory: "..."
            dmNotes: "..."
            createdAt: timestamp
            updatedAt: timestamp

        lore/
          {loreId}/
            title: "The Lost Temple"
            type: "location"
            content: "..."
            tags: ["temple", "ruins"]
            hidden: false
            createdAt: timestamp
            updatedAt: timestamp

        sessions/
          {sessionId}/
            number: 1
            title: "Session 1"
            date: "2025-01-15"
            summary: "..."
            highlights: ["..."]
            dmNotes: "..."
            createdAt: timestamp
```

## Monitoring & Analytics

### View Usage:
1. Firebase Console → Analytics (if enabled)
2. See user counts, activity, etc.

### Monitor Costs:
1. Firebase Console → Usage
2. Free tier includes:
   - 50,000 authenticated users
   - 1 GB Firestore storage
   - 10 GB/month network egress

### Upgrade if Needed:
- Blaze plan (pay-as-you-go)
- Only pay for what you use beyond free tier
- Set budget alerts to avoid surprises

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to authorized domains in Firebase Console
- Project settings → Authorized domains

### "Missing or insufficient permissions"
- Check Firestore security rules
- Make sure user is authenticated
- Verify `request.auth.uid` matches document path

### "FirebaseError: Firebase: Error (auth/api-key-not-valid-please-pass-a-valid-api-key)"
- Check `.env.local` has correct API key
- Restart dev server after changing env variables

### "Network error" or "Failed to fetch"
- Check internet connection
- Verify Firebase project is active
- Check browser console for CORS errors

## Next Steps

After setup:
1. ✅ Test authentication flows
2. ✅ Create a campaign
3. ✅ Add characters, lore, sessions
4. ✅ Test data persistence
5. ✅ Deploy to production
6. ✅ Share with your gaming group!

## Support

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com
- Stack Overflow: [firebase] tag

---

**Ready to set this up?** Follow the steps above and you'll have authentication and cloud sync working in ~15 minutes! 🗡️✨

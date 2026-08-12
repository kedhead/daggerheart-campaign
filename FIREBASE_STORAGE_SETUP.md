# Firebase Storage Setup Instructions

The file upload feature requires Firebase Storage to be configured with security rules.

## Setup Steps

### 1. Enable Firebase Storage
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `daggerheart-campaign-manager`
3. Click on "Storage" in the left sidebar
4. Click "Get Started"
5. Choose your storage location (use the same region as your Firestore)
6. Click "Done"

### 2. Deploy Storage Rules

#### Option A: Let CI do it (default)
Merging a change to `storage.rules` (or `firestore.rules`) into `main` triggers
the **Deploy Firebase rules** workflow, which publishes both rule files. You can
also run it by hand from the repo's **Actions** tab. Nothing to do locally.

The workflow needs a `FIREBASE_SERVICE_ACCOUNT` repository secret — see
`.github/workflows/deploy-firebase-rules.yml` for the service account roles it
expects.

#### Option B: Using the Firebase CLI (local or emergency)
```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init storage

# Validate without publishing
firebase deploy --only storage --dry-run

# Deploy the storage rules
firebase deploy --only storage
```

#### Option C: Manual Upload via Console
1. Go to Firebase Console > Storage
2. Click on the "Rules" tab
3. Copy the contents of `storage.rules` file
4. Paste into the rules editor
5. Click "Publish"

### 3. Verify Setup
After deploying the rules:
1. Go to your deployed app
2. Navigate to "Maps & Files" tab
3. Try uploading a file as a DM
4. Verify the file appears in the list
5. Check that players can view but not delete files

## Security Rules Explanation

The storage rules ensure:
- ✅ Only authenticated users can access campaign files
- ✅ Users can only read files from campaigns they're members of
- ✅ Only DMs can upload files to their campaigns
- ✅ Only DMs can delete files from their campaigns
- ✅ File size limited to 10MB per file
- ❌ All other access is denied

## Troubleshooting

### CORS Errors
If you see CORS errors in the console:
1. Make sure Firebase Storage is enabled
2. Verify the storage rules are deployed
3. Check that your domain is authorized in Firebase Authentication

### Permission Denied Errors
If you see "permission-denied" errors:
1. Verify the storage rules are deployed correctly
2. Make sure users are authenticated
3. Confirm users are members of the campaign they're trying to access

### Files Not Loading
1. Check browser console for errors
2. Verify Firebase Storage is enabled in your project
3. Ensure storage rules allow read access for campaign members
4. Check that the storage bucket name in your Firebase config is correct

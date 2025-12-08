# Authentication & Multi-Campaign Feature Plan

## Current Changes ✅

### Simplified Character System (Just Completed!)
- ✅ Characters now only require:
  - Character Name
  - Demiplane character sheet link
  - Player Notes (optional)
  - Backstory (optional)
  - DM Notes (DM only, optional)
- ✅ All stats managed on Demiplane
- ✅ Click "Open Character Sheet" to view full stats
- ✅ Much simpler, faster character creation

---

## Requested Features

### 1. User Sign-Up & Authentication
Users can create accounts and login to access their campaigns from any device.

### 2. Multiple Campaigns
Each user can create and manage multiple campaigns, each with its own:
- Characters
- Lore entries
- Session logs
- Campaign settings

---

## Implementation Options

### Option A: Firebase (Recommended for Ease)

**What is Firebase?**
- Google's backend-as-a-service
- No server management needed
- Built-in authentication
- Real-time database
- Free tier is generous

**Free Tier:**
- ✅ Up to 50,000 users
- ✅ 1GB database storage
- ✅ 10GB/month bandwidth
- ✅ Authentication included

**Features You Get:**
- Email/password signup
- Google Sign-In
- Password reset
- Real-time sync across devices
- Offline support
- Automatic backups

**Implementation Time:** ~3-4 hours

**Code Changes Required:**
- Add Firebase SDK
- Create auth components (Login, Signup)
- Update data hooks to use Firestore instead of localStorage
- Add campaign selector UI
- Add security rules for data access

**Pros:**
- ✅ Easiest to implement
- ✅ Battle-tested and reliable
- ✅ Great documentation
- ✅ Real-time sync
- ✅ No backend coding needed

**Cons:**
- ⚠️ Vendor lock-in (Google)
- ⚠️ Less control over data
- ⚠️ Need to learn Firebase concepts

---

### Option B: Supabase (More Power, More Control)

**What is Supabase?**
- Open-source Firebase alternative
- PostgreSQL database
- Built-in auth
- RESTful API
- More control than Firebase

**Free Tier:**
- ✅ 500MB database
- ✅ Unlimited API requests
- ✅ 50,000 monthly active users
- ✅ 2GB file storage

**Features You Get:**
- Email/password auth
- OAuth (Google, GitHub, Discord, etc.)
- Row-level security
- PostgreSQL features (relations, triggers)
- Real-time subscriptions
- Built-in storage for images

**Implementation Time:** ~4-5 hours

**Pros:**
- ✅ More powerful database (PostgreSQL)
- ✅ Open source (can self-host later)
- ✅ Better for complex queries
- ✅ Built-in file storage
- ✅ SQL access

**Cons:**
- ⚠️ Slightly steeper learning curve
- ⚠️ More configuration needed

---

### Option C: Custom Backend (Most Work)

Build your own backend with Node.js/Express + MongoDB/PostgreSQL

**Implementation Time:** ~10-15 hours

**Pros:**
- ✅ Full control
- ✅ No vendor lock-in
- ✅ Custom features

**Cons:**
- ❌ Much more work
- ❌ Need to manage servers
- ❌ Security is your responsibility
- ❌ Need to set up hosting

---

## Recommended Approach: Firebase

I recommend **Firebase** because:
1. Fastest to implement
2. Free tier is more than enough
3. No server management
4. Reliable and scalable
5. Great for this use case

---

## What the New System Would Look Like

### User Flow:

#### 1. Landing Page (New)
```
┌─────────────────────────────────┐
│  Daggerheart Campaign Manager   │
│                                 │
│     [Sign In]  [Sign Up]       │
│                                 │
│  Or try the [Demo] (no login)  │
└─────────────────────────────────┘
```

#### 2. After Login
```
┌─────────────────────────────────┐
│  My Campaigns                   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ⚔️ Shadowfen Chronicles │   │
│  │ 5 characters, 12 sessions│   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🏰 Dragon's Keep        │   │
│  │ 3 characters, 4 sessions│   │
│  └─────────────────────────┘   │
│                                 │
│  [+ New Campaign]               │
└─────────────────────────────────┘
```

#### 3. Inside a Campaign
(Same interface as now, but with campaign selector in sidebar)

```
┌─────────────────────┐
│ [Campaign Dropdown] │
│ ▼ Shadowfen Chron.  │
│                     │
│ 👤 Player / 👑 DM   │
│                     │
│ 🏠 Dashboard        │
│ 👥 Characters       │
│ 📖 Lore             │
│ 📜 Sessions         │
│ 🔧 Tools            │
│                     │
│ [Sign Out]          │
└─────────────────────┘
```

---

## Data Structure

### With Firebase/Supabase:

```
users/
  └── {userId}/
      ├── profile
      │   ├── email
      │   ├── displayName
      │   └── createdAt
      │
      └── campaigns/
          ├── {campaignId1}/
          │   ├── info (name, description)
          │   ├── characters/
          │   ├── lore/
          │   └── sessions/
          │
          └── {campaignId2}/
              ├── info
              ├── characters/
              ├── lore/
              └── sessions/
```

---

## Features You'd Get

### Authentication
- ✅ Email/password signup
- ✅ Google Sign-In (optional)
- ✅ Password reset
- ✅ Email verification
- ✅ Session management
- ✅ Secure logout

### Campaign Management
- ✅ Create unlimited campaigns
- ✅ Switch between campaigns
- ✅ Rename/delete campaigns
- ✅ Each campaign isolated
- ✅ Share campaign with other users (future)

### Data Sync
- ✅ Access from any device
- ✅ Real-time updates
- ✅ Automatic cloud backups
- ✅ Offline support (with cache)

### Multi-User (Future Enhancement)
- 🔮 Invite players to campaign
- 🔮 Players see only their characters
- 🔮 DM controls all content
- 🔮 Real-time collaboration

---

## Migration Plan

### Phase 1: Add Authentication (Firebase)
**Time: ~3 hours**

1. Set up Firebase project
2. Add Firebase SDK to project
3. Create Login/Signup components
4. Add auth state management
5. Update routing (public vs authenticated)

### Phase 2: Migrate Data to Cloud
**Time: ~2 hours**

1. Create Firestore data structure
2. Update `useCampaign` hook to use Firestore
3. Add data migration tool (localStorage → Firestore)
4. Test data sync

### Phase 3: Add Multi-Campaign Support
**Time: ~2 hours**

1. Create campaign selector UI
2. Add campaign CRUD operations
3. Update navigation to filter by campaign
4. Add "Create Campaign" flow

### Phase 4: Polish & Testing
**Time: ~1 hour**

1. Loading states
2. Error handling
3. User testing
4. Deploy updates

**Total Time: ~8 hours of development**

---

## Costs

### Firebase Free Tier
- **Users:** Up to 50,000 (way more than needed)
- **Storage:** 1GB (enough for thousands of campaigns)
- **Bandwidth:** 10GB/month
- **Cost:** $0/month

**When you'd need to upgrade:**
- More than 50,000 users
- More than 1GB of data
- More than 10GB/month bandwidth

**Paid tier (if needed):**
- Pay as you go
- ~$25/month for 100K users
- Very scalable

### Supabase Free Tier
- **Database:** 500MB
- **Bandwidth:** Unlimited
- **Users:** 50,000
- **Cost:** $0/month

---

## Security

### Built-In Security Features:
- ✅ Encrypted connections (HTTPS)
- ✅ Secure authentication
- ✅ Database access rules
- ✅ CSRF protection
- ✅ XSS protection

### Firebase Security Rules Example:
```javascript
// Users can only access their own data
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// Campaign sharing (future)
match /campaigns/{campaignId} {
  allow read: if request.auth.uid in resource.data.members;
  allow write: if request.auth.uid == resource.data.owner;
}
```

---

## Next Steps - Your Decision

### Option 1: Implement Firebase Now
I can start implementing Firebase authentication and multi-campaign support right away.

**Deliverables:**
- User signup/login
- Multiple campaigns per user
- Cloud data sync
- Campaign selector UI
- Data migration from localStorage

**Time: I can have this working in ~8 hours of development**

### Option 2: Test Simplified Characters First
Deploy the current simplified character changes, test with users, then add auth later.

**Benefits:**
- See if simplified characters work well
- Get user feedback
- Add auth when needed

### Option 3: Stay with LocalStorage
Keep current localStorage approach, add campaign switcher that stores multiple campaigns locally (no auth).

**Benefits:**
- No backend needed
- Simpler implementation
- Privacy (no cloud)

**Limitations:**
- Data only on one device
- Can't share campaigns
- No automatic backups

---

## My Recommendation

### Start with Firebase Authentication + Multi-Campaign

**Why:**
1. Makes the app much more useful (access anywhere)
2. Industry-standard solution
3. Free for your use case
4. Opens door for future features (sharing campaigns, collaboration)
5. Professional user experience

**Next Steps:**
1. I'll set up Firebase
2. Implement authentication
3. Migrate data structure
4. Add campaign selector
5. Test everything
6. Deploy

**Ready to proceed?** Let me know and I'll start implementing!

---

## Questions?

**Q: Will existing data be lost?**
A: No! I'll create a migration tool to move localStorage data to Firebase when you first login.

**Q: Can I export my data later?**
A: Yes, I'll add an export feature to download all campaign data as JSON.

**Q: What if I don't want cloud storage?**
A: We can keep the localStorage option as a "Guest Mode" for those who prefer it.

**Q: Can multiple people manage one campaign?**
A: Not in Phase 1, but easy to add later (Phase 5).

**Q: What about privacy?**
A: Your data is private by default. Only you can access your campaigns. Sharing is opt-in.

---

Ready to implement this? Let me know which option you prefer! 🗡️✨

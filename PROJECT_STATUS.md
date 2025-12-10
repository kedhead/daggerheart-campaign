# Daggerheart Campaign Manager - Project Status

**Last Updated:** December 9, 2024
**Repository:** https://github.com/kedhead/daggerheart-campaign
**Live App:** https://daggerheart-campaign.vercel.app

## Current Features

### Core Campaign Management
- ✅ Multi-user campaigns with invite system
- ✅ DM and Player roles with appropriate permissions
- ✅ Co-DM support (multiple DMs per campaign)
- ✅ Public campaign browser (players can discover and request to join)
- ✅ Campaign switching
- ✅ Real-time synchronization via Firebase Firestore

### Character Management
- ✅ **Simple Mode** - Link to Demiplane character sheets
- ✅ **Full Mode** - Complete character stat tracking (not currently used)
- ✅ Character avatars (base64 upload, max 1MB)
- ✅ Player name tracking
- ✅ Player notes and backstory
- ✅ DM-only notes per character

### Lore System
- ✅ World-building entries
- ✅ Category filtering (People, Places, Events, Items, Factions, Other)
- ✅ Search functionality
- ✅ DM-only editing

### Session Management
- ✅ Session logging with numbers
- ✅ Session planning (Planned, In Progress, Completed statuses)
- ✅ FreshCutGrass encounter links
- ✅ Hope/Fear tracking per session
- ✅ DM-only editing

### Organization Features (NEW - Added Dec 9, 2024)

#### 1. NPC Directory
- ✅ NPC portraits (base64 upload)
- ✅ Occupation and location tracking
- ✅ Relationship types (Ally, Neutral, Enemy)
- ✅ Description, notes, and "first met" tracking
- ✅ Search and filter by relationship
- ✅ Visible to all players

#### 2. Campaign Timeline
- ✅ Chronological event tracking
- ✅ In-game date tracking (flexible format)
- ✅ Event types (Event, Quest, Milestone, Other)
- ✅ Location, participants, and outcome tracking
- ✅ Visual timeline display
- ✅ Visible to all players

#### 3. Locations & Map
- ✅ World map upload (up to 5MB, base64 storage)
- ✅ Location types (City, Town, Village, Dungeon, Wilderness, Landmark, Other)
- ✅ Notable features and secrets
- ✅ Inhabitants tracking
- ✅ Region categorization
- ✅ DM-only map upload, locations visible to all

#### 4. Combat Encounters (DM-ONLY)
- ✅ Encounter templates
- ✅ Difficulty levels (Easy, Medium, Hard, Deadly)
- ✅ Enemy lists and tactics
- ✅ Environment descriptions
- ✅ Rewards tracking
- ✅ FreshCutGrass integration links
- ✅ **Only visible to DMs** - kept secret from players

#### 5. Player Notes (NEW - Added Dec 9, 2024)
- ✅ Personal note-taking for all players
- ✅ Categories (Quest, NPC, Location, Combat, Other)
- ✅ Players only see their own notes
- ✅ DM can see all players' notes
- ✅ Author and timestamp tracking
- ✅ Search and filter functionality

### File Management
- ✅ Map and document uploads (max 5MB per file)
- ✅ Base64 storage in Firestore (no Firebase Storage needed)
- ✅ File preview and download
- ✅ DM-only uploads

### Tools
- ✅ Dice roller
- ✅ Hope/Fear tracker (shared state)
- ✅ FreshCutGrass integration links

## Technical Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Custom CSS with CSS variables
- **Icons:** Lucide React
- **Routing:** Client-side view switching

### Backend
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth (Google Sign-In)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Storage:** Base64 encoding in Firestore (no Firebase Storage)

### Data Structure
```
campaigns/{campaignId}/
├── campaign document (name, description, dmId, members, isPublic, etc.)
├── characters/
├── lore/
├── sessions/
├── npcs/
├── timelineEvents/
├── locations/
├── encounters/
└── notes/
```

## Git Setup
- **Origin:** https://github.com/kedhead/daggerheart.git (backup)
- **Campaign:** https://github.com/kedhead/daggerheart-campaign.git (active deployment)
- **Deploy Target:** Push to `campaign` remote triggers Vercel deployment

## Known Technical Decisions

### Why Base64 Storage Instead of Firebase Storage?
- Firebase Storage requires paid Blaze plan
- Base64 in Firestore keeps project on free tier
- File size limited to 5MB to stay within Firestore limits
- Works well for avatars, maps, and documents

### Why Simple Character Sheets?
- Demiplane provides full character sheet functionality
- Linking to Demiplane avoids duplicating complex stat management
- Focuses app on campaign organization rather than character mechanics

### Why DM-Only Encounters?
- Keeps combat plans secret from players
- Prevents metagaming
- DM-only navigation item in sidebar

## Future Consideration: Mobile App Conversion

### Context
User is interested in converting to native iOS/Android apps but wants to think about it first.

### Options Discussed

#### Option 1: Progressive Web App (PWA)
- **Effort:** 1-2 hours
- **Cost:** Free
- **Pros:** Works immediately, no app store needed
- **Cons:** Not in app stores, limited native features

#### Option 2: React Native (Expo)
- **Effort:** 2-4 weeks
- **Cost:** $99/year (Apple) + $25 one-time (Google)
- **Pros:** True native experience, full native features
- **Cons:** Complete rewrite, separate codebase

#### Option 3: Capacitor (RECOMMENDED)
- **Effort:** 3-5 days
- **Cost:** $99/year (Apple) + $25 one-time (Google)
- **Pros:** Keep existing codebase, publish to stores, native features
- **Cons:** Slightly larger app size

### Recommendation
**Capacitor** is the best option because:
1. Minimal code changes (~95% of codebase stays the same)
2. Firebase works perfectly
3. Can publish to both app stores
4. Native features available if needed
5. Reasonable development time

### Cost Considerations
- **Apple Developer Account:** $99/year (required for iOS)
- **Google Play Developer:** $25 one-time (for Android)
- **PWA:** Free alternative, no store fees

### Current Status
- App is already mobile-responsive
- Works well in mobile browsers
- Users can bookmark to home screen now
- No immediate action needed
- **Decision pending** - user wants to think about it

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Git workflow
git add -A
git commit -m "message"
git push campaign main  # Triggers Vercel deployment
```

## Recent Changes (Session History)

### December 9, 2024
1. Added NPC Directory with portraits and relationships
2. Added Campaign Timeline for event tracking
3. Added Locations & Map with world map upload
4. Added Combat Encounters (DM-only)
5. Made Encounters section hidden from players
6. Added Player Notes system with privacy controls
7. All features integrated into sidebar navigation
8. All CRUD operations added to useFirestoreCampaign hook

## Next Steps (When Ready)

### If Going Mobile Route:
1. Choose PWA, React Native, or Capacitor
2. Set up developer accounts if needed
3. Configure mobile-specific UI adjustments
4. Design app icons and splash screens
5. Test on iOS/Android devices
6. Submit to app stores (if not PWA)

### Possible Future Features:
- Initiative tracker for combat
- Inventory management system
- Quest tracking with completion status
- Relationship web between NPCs
- Session audio/video recording links
- Automated session summaries
- Character leveling notifications
- Custom dice roller presets

## Important Files

### Main Application
- `src/AppWithAuth.jsx` - Main app with routing
- `src/components/SidebarWithAuth.jsx` - Navigation
- `src/hooks/useFirestoreCampaign.js` - All Firestore operations

### Organization Features
- `src/components/NPCs/` - NPC Directory
- `src/components/Timeline/` - Campaign Timeline
- `src/components/Locations/` - Locations & Map
- `src/components/Encounters/` - Combat Encounters (DM-only)
- `src/components/Notes/` - Player Notes

### Configuration
- `src/config/firebase.js` - Firebase configuration
- `vite.config.js` - Vite build configuration
- `vercel.json` - Vercel deployment settings

## Useful Links
- **FreshCutGrass:** https://freshcutgrass.app/encounter-manager
- **Demiplane:** https://app.demiplane.com/nexus/daggerheart
- **Firebase Console:** https://console.firebase.google.com
- **Vercel Dashboard:** https://vercel.com/dashboard

## Notes
- All images/files stored as base64 in Firestore
- Campaign data syncs in real-time across all users
- DM permissions checked via campaign.dmId or campaign.members[uid].role
- Players can only edit their own characters and notes
- DM can edit everything except other players' notes (view-only)

---

**To resume this project later:**
1. Review this document for current state
2. Check the Recent Changes section for context
3. Review the Future Consideration section for mobile app discussion
4. Run `npm install` and `npm run dev` to start development
5. Check GitHub repo for latest code: `git pull campaign main`

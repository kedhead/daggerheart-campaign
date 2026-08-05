# Lorelich Mobile

An iOS/Android player app for Lorelich. Character sheet, inventory, and dice —
the non-admin half of the app, on a phone, synced live with the table.

Nothing here changes the web app. It's a second build target out of the same
source tree plus a thin Expo shell.

## How it fits together

```
src/mobile.jsx  ->  src/MobileApp.jsx  ->  PlayerPortalView
      |                                          |
      |  vite build --mode mobile                |  publishRoll()
      v                                          v
  dist-mobile/  --deployed-->  app.lorelich.com   campaigns/{id}/rolls
      ^                                          ^
      |  WebView                                 |  onSnapshot
  mobile/App.js (Expo)                     the GM's screen
```

The phone isn't talking to a new backend. Every roll it makes writes the same
canonical document to `campaigns/{id}/rolls` that the web app writes
(`src/dice/service.js`), and the table's dice tray picks it up through
`useLiveRoll`. Character edits go to the same Firestore documents. Table sync
is free because there was never a second source of truth to reconcile.

## What the mobile target changes

Both differences are enforced at build time in `vite.config.js`, not at
runtime, so they can't be undone by a config flag or a stale campaign setting:

| | Web (`dist/`) | Mobile (`dist-mobile/`) |
|---|---|---|
| Entry | `AppWithAuth` — full router, GM tools | `MobileApp` — portal only |
| Hope & Fear expansion | included | aliased to an empty stub |
| Star Wars D6 content | included | never imported |
| Google sign-in | shown | hidden (see below) |

The expansion split matters because an app-store binary is a redistributed
artifact, not a page served to a browser. Daggerheart SRD content is CC BY 4.0
and ships. `src/data/hopeFear.js` is commercial product content and does not —
aliasing it at resolve time means the text isn't in the bundle at all, which a
runtime source filter wouldn't achieve. `npm test` asserts the stub stays in
lockstep with the real module's exports.

## Running it

Build and serve the web layer:

```bash
# from the repo root
npm run build:mobile      # -> dist-mobile/
npx serve dist-mobile     # or deploy it (see below)
```

Then the shell:

```bash
cd mobile
npm install
npm run pin-versions      # expo install --fix — resolves every dep to the
                          # version the installed SDK expects. Run this once
                          # on first checkout; don't hand-pick RN versions.
npm start
```

Point the shell at your machine while developing by editing `extra.appUrl` in
`app.json` to your LAN address (`http://192.168.x.x:3000`). Android needs
`android:usesCleartextTraffic` for plain HTTP, so prefer an https tunnel.

## Deploying the web layer

`dist-mobile/` is a separate artifact from `dist/`. Deploy it to its own host —
a second Vercel project on `app.lorelich.com` is the simplest option — with:

- Build command: `npm run build:mobile`
- Output directory: `dist-mobile`

Keeping it on its own origin means a mobile deploy can never take the main site
down, and the shell's `onShouldStartLoadWithRequest` can use the origin to tell
in-app navigation from links that should open in the real browser.

## Building for the stores

```bash
cd mobile
eas build --profile preview      # internal APK / ad-hoc IPA
eas build --profile production
eas submit --profile production
```

Set `extra.eas.projectId` in `app.json` first (`eas init` fills it in).

## Store submission notes

- **Name the app Lorelich.** Never "Daggerheart" in the app name, subtitle,
  keywords, or icon — it's a Darrington Press trademark, and Apple 4.1/5.2
  rejections over third-party marks are routine.
- **Attribute the SRD.** Daggerheart SRD content is CC BY 4.0 and the licence
  requires attribution. The existing notice in `LICENSE` and the in-app terms
  covers it; make sure the store listing carries it too.
- **Expect a 4.2 "minimum functionality" question** for a WebView app. The
  answers are the native capabilities the shell actually has: haptics on rolls,
  offline handling, hardware-back navigation, and the fact that the app is a
  live play companion rather than a repackaged website. Adding push
  notifications for "your turn" is the strongest next answer.

## Known gaps

- **Google sign-in is hidden on mobile.** `signInWithPopup` cannot work in a
  WebView — Google blocks OAuth in embedded user agents, and there's no window
  for the popup. Email/password works. Players who signed up with Google can
  set a password via "Forgot password" and use the same account. Fixing this
  properly means brokering the token natively (`expo-auth-session` →
  `signInWithCredential`) and posting it into the page.
- **Joining a campaign still happens on the web.** The picker lists campaigns
  you're already a member of; invite links open in the browser.
- **The campaign subscription is the full one.** `useFirestoreCampaign`
  subscribes to all 16 collections, including battle maps and storybook
  chapters the portal never reads. Fine on wifi, wasteful on cellular — worth
  a portal-scoped subscription before this gets much use.
- **No push notifications yet.** Deliberately not half-built: the sending side
  needs a Cloud Function watching turn state.

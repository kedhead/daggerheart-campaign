# Recovering a deleted character

Deletes are now **soft deletes**: the character document stays in Firestore with
a `deletedAt` stamp and shows up under **Graveyard → Recently Deleted**, where
anyone in the campaign can restore it. Only the DM can destroy it for good, and
that button makes you type the character's name first.

This guide is for characters deleted **before** that change shipped, when the
Delete button removed the Firestore document immediately with no confirmation.
Work through the options in order — the first one that applies is the only one
you need.

Project: `daggerheart-campaign-manager` · collection:
`campaigns/{campaignId}/characters/{characterId}`

---

## 1. Point-in-time recovery (best option, 7-day window)

Firestore PITR keeps every version of every document for 7 days — but only if
it was switched on **before** the delete. Check:

```bash
gcloud firestore databases describe \
  --database='(default)' \
  --project=daggerheart-campaign-manager \
  --format='value(pointInTimeRecoveryEnablement)'
```

- `POINT_IN_TIME_RECOVERY_ENABLED` → keep going, the data is retrievable.
- `POINT_IN_TIME_RECOVERY_DISABLED` → skip to option 2. (Turn it on now so the
  next incident is a five-minute fix:
  `gcloud firestore databases update --database='(default)' --enable-pitr`.)

Export the characters collection as it existed *before* the delete. The
snapshot time must be within the last 7 days and a whole minute, in UTC:

```bash
gcloud firestore export gs://YOUR_BUCKET/pitr-recovery \
  --project=daggerheart-campaign-manager \
  --collection-ids=characters \
  --snapshot-time=2026-08-11T18:00:00Z
```

Import that export into a **scratch** database — never into `(default)`, which
would overwrite current play data:

```bash
gcloud firestore databases create --database=recovery --location=YOUR_REGION
gcloud firestore import gs://YOUR_BUCKET/pitr-recovery/<export-folder> \
  --database=recovery
```

Read the character out of the scratch database (Firebase console → Firestore →
database picker → `recovery`), copy its JSON, and write it back:

```bash
node scripts/character-backup.mjs restore <campaignId> emmanita.json
```

Then delete the scratch database so it stops costing storage:
`gcloud firestore databases delete --database=recovery`.

## 2. A scheduled backup

If the project has scheduled Firestore backups (Firebase console → Firestore →
**Backups**), restore the most recent one that predates the delete into a
scratch database and follow the same read-and-restore path as option 1.

## 3. The offline cache on a player's device (long shot, worth trying fast)

The app runs Firestore with `persistentLocalCache`, so every browser that had
the campaign open holds a copy of the character documents in IndexedDB. A
delete clears that copy — but only on devices that were online to receive it.

If a player has **not** opened the app since the delete, their laptop or phone
may still have Emmanita cached:

1. On that device, open DevTools → **Network** → set throttling to **Offline**
   *before* loading the app.
2. Load the app and go to the campaign. Firestore serves the roster from the
   local cache, so the character should appear.
3. Screenshot or copy the sheet, or run
   `JSON.stringify(...)` on the character in the console, and save it.
4. Go back online and re-enter the sheet, or restore the JSON with
   `node scripts/character-backup.mjs restore <campaignId> emmanita.json`.

Do this before that device reconnects — once it syncs, the cached copy is gone.

## 4. Rebuild from what survived the delete

Deleting the character document does **not** touch anything else. These still
hold pieces of the sheet:

- **Firebase Storage** — the portrait and any uploaded art are still in the
  bucket under their original paths. Nothing deletes them.
- **Storybook chapters** — journal entries keep `characterName`, and chapter
  spotlights keep the name, portrait URL, and the character's big moments.
- **Session recaps and live notes** — level, gear, and story beats in prose.
- **Party stash** — items transferred out of the character's inventory.
- **Messages and the campaign chat** — rolls and sheet talk.
- **Initiative history and battle maps** — token names and portraits.

Between the portrait in Storage and the level/class/gear in the recaps, a
rebuilt sheet is usually close to the original.

---

## Preventing the next one

- Deletes are soft by default, and only the DM can purge from the trash.
- Take a snapshot before big changes:
  `node scripts/character-backup.mjs dump <campaignId>` writes every character
  (including trashed ones) to a JSON file you can keep or restore from.
- Turn on PITR if it is off — it costs almost nothing and turns a lost
  character into a one-command restore.

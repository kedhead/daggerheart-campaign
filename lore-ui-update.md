# Lorelich Design System: "Universal Arcane OS"
**Version:** 4.0 (Strict Content Preservation)
**Philosophy:** The UI provides the *theme*, but the text must remain *functional*.

---

## 1. Strict Copywriting & Nomenclature (The "No-RP" Rule)
**CRITICAL INSTRUCTION:** Do not "roleplay" the UI text. Visuals change; text does not.

* **Forbidden Terms (Do Not Use):**
    * ❌ Initialize / Sequence / Payload / Engage / Comm Link
    * ❌ Scribe / Inscribe / Enchant / Scry
    * ❌ Manifest / Extraction / Sector / Coordinates
* **Required Standard Terms (Must Use):**
    * ✅ **Actions:** Save, Edit, Delete, Cancel, Confirm, Add New, Start, Stop.
    * ✅ **Navigation:** Dashboard, Lore, Map, Settings, Profile, Logout.
    * ✅ **Status:** Loading, Error, Success, Saved, Offline.

**Correction Protocol:** If you encounter a button labeled "Initialize Payload," rename it to "Start Session." If you see "Establish Comms," rename it to "Open Chat."

---

## 2. Theming Engine (Strict Color Mapping)
The app must support hot-swapping themes via a data attribute: `<body data-theme="daggerheart">`.

### A. Daggerheart (Purple & Gold)
* **Primary:** `#5b21b6` (Deep Purple)
* **Accent:** `#fbbf24` (Warm Gold)
* **Background:** `#1e1b4b` (Midnight Indigo)
* **Text:** `#e0e7ff` (Soft Blue-White)
* **Vibe:** Mystical, glowing edges, high contrast.

### B. Dungeons & Dragons (Red & Iron)
* **Primary:** `#991b1b` (Dragon Red)
* **Accent:** `#d4d4d4` (Iron Grey)
* **Background:** `#292524` (Warm Dark Grey)
* **Text:** `#f5f5f4` (Warm White)
* **Vibe:** Classic, sturdy, worn textures.

### C. Star Wars (Yellow & Grey)
* **Primary:** `#facc15` (Crawl Yellow)
* **Accent:** `#9ca3af` (Durasteel Grey)
* **Background:** `#111827` (Space Black)
* **Text:** `#f9fafb` (Crisp White)
* **Vibe:** Industrial, flat, technical (NO gradients).

### D. Generic (Green & Slate)
* **Primary:** `#16a34a` (Emerald Green)
* **Accent:** `#e5e7eb` (Light Grey)
* **Background:** `#18181b` (Zinc Dark)
* **Text:** `#ffffff` (White)
* **Vibe:** Modern SaaS, clean, accessible.

---

## 3. The Universal "Catch-All" Layout
**Use this layout for ANY page not explicitly defined (Settings, Profile, Tools, etc.)** to prevent breakage.

* **Container:** `max-w-7xl mx-auto p-6`.
* **Header:**
    * `h1`: 3xl, Bold, using the Theme Text Color.
    * `hr`: Border Theme Accent, opacity 30%.
* **Content Card:**
    * **Background:** `bg-white/5` (5% opacity white).
    * **Border:** `1px solid` Theme Accent (opacity 20%).
    * **Radius:** `rounded-lg`.
    * **Padding:** `p-6`.

---

## 4. Component Specifics

### A. Buttons (Functional)
* **Primary Button:** `bg-[var(--color-primary)]` text-white. Hover: Brightness 110%.
* **Secondary Button:** Border `1px solid [var(--color-accent)]` text-white.
* **Danger Button:** Always Red (`bg-red-600`), regardless of theme.

### B. Inputs & Forms
* **Input Fields:** `bg-black/20` border `border-white/10` text-white.
* **Focus State:** Ring `2px` using Theme Primary color.

---

## 5. CSS Variable Setup (Tailwind Config)
(Copy this into your `globals.css` to enforce the colors)

```css
:root[data-theme="daggerheart"] {
  --color-primary: 91 33 182; /* Purple */
  --color-accent: 251 191 36; /* Gold */
}
:root[data-theme="dnd"] {
  --color-primary: 153 27 27; /* Red */
  --color-accent: 212 212 212; /* Iron */
}
:root[data-theme="starwars"] {
  --color-primary: 250 204 21; /* Yellow */
  --color-accent: 156 163 175; /* Grey */
}
:root[data-theme="generic"] {
  --color-primary: 22 163 74; /* Green */
  --color-accent: 229 231 235; /* Grey */
}
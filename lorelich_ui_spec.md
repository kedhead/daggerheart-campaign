# Lorelich Design System: "Arcane OS 2026"
**Vision:** A unified, immersive interface for a full-featured TTRPG campaign manager.
**Core Aesthetic:** Deep depth, glassmorphism, rich gradients, and tactile interactions.

---

## 1. The Shell (Global Layout)
* **Sidebar (The Dock):**
    * **Visual:** Glassmorphism (`backdrop-filter: blur(12px)`), dark semi-transparent background.
    * **Icons:** High-quality SVG icons (Lucide/Phosphor) with an "Active Glow" state.
    * **Structure:** Grouped by utility:
        * *World:* Lore, Maps, Timeline.
        * *Party:* Characters, Inventory, Quests.
        * *DM Tools:* Soundboard, AI Chat, Encounter Builder.
* **Top Bar (Context):**
    * **Visual:** Minimal height. Breadcrumbs on left. Global Search (Cmd+K) in center.
    * **Profile:** User avatar + "Session Status" indicator (Online/Offline).

---

## 2. Module: Lore & Wiki (The "Reader" View)
* **Card Style:**
    * **Cover Image:** Full-width header image with gradient fade into the text.
    * **Typography:** Serif headings (Cinzel/Merriweather) for immersion. Sans-serif body (Inter) for readability.
* **Metadata Chips:**
    * Colored "Pills" for tags (e.g., "Location" = Blue, "NPC" = Green).
    * **Modern Touch:** Use `ring-1 ring-inset` instead of solid backgrounds for a cleaner look.
* **Relation Graph:**
    * A small "Network Visualization" in the sidebar showing linked entities.

---

## 3. Module: Inventory & Shops (The "Grid" View)
* **Visual Style:** "Slot-based" inventory (like Diablo/Video Games).
* **Item Cards:**
    * **Square Slots:** Dark background (`bg-gray-900`), 1px solid border (`border-white/10`).
    * **Rarity Glow:** Border color changes based on rarity (Common=Gray, Rare=Blue, Legendary=Gold).
    * **Hover Effect:** Scale up 105% and show a "Quick Stats" tooltip.
* **Currency Display:** Gold/Silver/Copper icons with rolling number counters.

---

## 4. Module: Characters (The "Sheet" View)
* **Layout:** "Dashboard" layout for each character.
* **Vitals Widget:**
    * **HP/Mana:** Thick, glossy progress bars with "liquid" animation effects.
    * **Portrait:** Large circular avatar with a "Level Ring" border.
* **Stats Grid:**
    * Hexagonal or circular containers for attributes (STR, DEX, etc.).
    * **modern:** Click a stat to roll 3D dice immediately over the screen.

---

## 5. Module: Maps (The "Atlas" View)
* **Interface:** Full-screen canvas. UI floats on top.
* **Floating Controls:**
    * "Map Tools" palette (Fog of War, Pins, Measure) in a floating glass pill at the bottom center.
* **Pin Style:**
    * Animated markers (bouncing slightly).
    * **Hover:** Expands a "Mini-Lore Card" preview instantly.

---

## 6. Module: Soundboard (The "DJ" View)
* **Layout:** Grid of "Trigger Pads" (Launchpad style).
* **Buttons:**
    * **Idle:** Dimly lit border.
    * **Active:** Bright internal glow + pulsing animation.
    * **Progress:** The button background fills up as the track plays (radial or linear fill).
* **Sliders:** Thick, tactile faders for volume.

---

## 7. Module: AI Tools (The "Oracle" View)
* **Interface:** Chat-based interface, but styled like a "Magical Scrying Pool."
* **Input:** Floating text bar at the bottom with a "Sparkle" send button.
* **Output:**
    * **Streaming Text:** Text fades in word-by-word.
    * **Formatted Cards:** If AI generates an item, it renders as an *Inventory Card*, not just text.
    * **Actions:** "Add to Lore" or "Save to Inventory" buttons appear on hover.

---

## 8. Common UI Patterns (The "Glue")
* **Modals:** Do not use browser alerts. Use centered "Glass" overlays with backdrop blur.
* **Toasts:** Notifications (e.g., "Saved", "Rolled 20") slide in from the bottom-right.
* **Empty States:** Never show a blank page. Show a relevant illustration + "Create New [Item]" button.
# Design System Specification: The Nocturnal Curator

## 1. Overview & Creative North Star
This design system is built to transform book management from a utility into a cinematic experience. Our Creative North Star is **"The Nocturnal Curator."** We are moving away from the cluttered, spreadsheet-like legacy of digital libraries and toward a high-end editorial gallery. 

The aesthetic is defined by **atmospheric depth and typographic authority.** We reject the "standard app" look by embracing intentional asymmetry—using large-scale serif typography juxtaposed against a rigid, functional sans-serif grid. We prioritize the "objecthood" of books, treating digital covers as physical artifacts resting on layered, obsidian-toned surfaces.

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, nocturnal base (`#080e1a`) punctuated by a sophisticated Violet accent. 

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders to define sections or containers. Visual separation must be achieved through:
1.  **Tonal Shifts:** Placing a `surface-container-high` element against a `surface-container-low` background.
2.  **Negative Space:** Using the spacing scale to create distinct groupings.
3.  **Translucency:** Using glassmorphic layers to indicate a new functional plane.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. 
- **Base Layer:** `surface` (`#080e1a`) — The foundation.
- **Structural Zones:** `surface-container-low` — Sidebars or secondary navigation.
- **Content Cards:** `surface-container-highest` — Individual book items or metadata panels.
- **Floating Elements:** Glassmorphic (`bg-gray-900/50` + `backdrop-blur`) — Used for context menus, overlays, and persistent navigation bars.

### The "Glass & Gradient" Rule
Flat color is the enemy of premium design. 
- Use **Glassmorphism** for elements that sit "above" the library (e.g., the Reading Progress overlay). 
- Apply **Subtle Gradients** to primary CTAs, transitioning from `primary` (`#bd9dff`) to `primary-dim` (`#8a4cfc`) at a 135-degree angle. This adds "soul" and prevents the interface from feeling static.

## 3. Typography
Our typography is a dialogue between the tradition of print and the precision of digital.

- **Display & Headlines (Newsreader):** Use these for book titles, section headers, and "Hero" moments. The serif typeface evokes the feeling of a physical book and provides an editorial "voice."
- **UI & Labels (Manrope):** Use these for all functional elements, metadata, and buttons. The sans-serif geometric construction ensures high legibility at small scales.
- **Scale Intent:** Use `display-lg` for empty states or featured collections to create a "poster" effect. Use `label-sm` in all-caps with 0.05em letter spacing for metadata (e.g., ISBN, File Format) to give it a technical, curated feel.

## 4. Elevation & Depth
We do not use shadows to simulate light; we use tonal layering to simulate proximity.

- **The Layering Principle:** To "lift" a component, move it up one tier in the surface-container scale. A `surface-container-lowest` card sitting on a `surface-container-low` background creates a "recessed" look, while a `surface-container-highest` card creates a "protruding" look.
- **Ambient Shadows:** Only use shadows for "Floating" states (Modals/Popovers). Shadows must be wide and soft: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4)`. The shadow color should never be pure black; it should be a deep tint of the `on-surface` color.
- **The "Ghost Border" Fallback:** If a layout feels muddy, you may use a "Ghost Border": `outline-variant` at 15% opacity. It should be felt, not seen.
- **Glassmorphism:** Apply `backdrop-blur: 12px` to any element with a semi-transparent background. This allows the vibrant book covers to "bleed" through the UI, making the app feel alive and integrated.

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-dim`). No border. White text (`on-primary-fixed`).
- **Secondary:** Glassmorphic background with a `Ghost Border`. Text in `primary`.
- **Tertiary:** Text-only in `on-surface-variant`, shifting to `primary` on hover.

### The Book Card
- **Structure:** No borders or visible containers. The book cover is the anchor. 
- **Hover State:** On hover, the cover should subtly scale (1.02x) and the `surface-container-highest` background should transition to a `primary-container` tint at 10% opacity.
- **Metadata:** Use `label-md` for the author and `title-sm` for the book title.

### Input Fields
- **Styling:** Use `surface-container-highest` as the background. 
- **Interaction:** On focus, do not change the border color. Instead, increase the background brightness to `surface-bright` and add a subtle `primary` glow (2px blur).

### Chips & Filters
- **Selection Chips:** Use `secondary-container` for the active state and `surface-container-high` for the inactive state.
- **Shape:** Rounded-full (pill-shaped) to contrast against the sharp, rectangular grid of book covers.

### Lists
- **Rule:** Absolute prohibition of horizontal dividers. 
- **Execution:** Use `body-md` for list content. Separate items with 12px of vertical padding. On hover, apply a subtle `surface-variant` background with a 4px corner radius.

## 6. Do's and Don'ts

### Do
- **Do** embrace white space. Treat the screen like a high-end magazine layout.
- **Do** use `display-lg` typography for "empty" library states to create a bold, intentional design moment.
- **Do** ensure all Glassmorphic elements have sufficient contrast against the content behind them.
- **Do** use the `tertiary` (pink) tokens for "Special Collections" or "Favorites" to provide a warm counterpoint to the violet.

### Don't
- **Don't** use 100% white for text. Always use `text-gray-200` or `on-surface` to reduce eye strain in the strict dark mode.
- **Don't** use standard Material Design "Drop Shadows." They look dated and "cheap" in this context.
- **Don't** align everything to a center axis. Use intentional asymmetry—place large titles on the left and metadata on the far right to create a sophisticated visual path.
- **Don't** ever use a solid border to separate the sidebar from the main content. Use the transition from `surface-container-low` to `surface`.
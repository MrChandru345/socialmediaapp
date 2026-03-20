# High-Fidelity Social Design System: The Digital Curator

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Curator."** 

We are moving away from the cluttered, "noisy" interface of traditional social media toward an editorial, high-end SaaS aesthetic. This system prioritizes the content as art and the interface as a silent, premium gallery. By leveraging intentional asymmetry, generous white space, and a sophisticated layering of surfaces, we create an experience that feels both authoritative and effortless. 

We challenge the rigid, "boxed-in" grid by using overlapping elements and high-contrast typography scales. The goal is to make the user feel they are navigating a bespoke digital magazine rather than a standard database.

## 2. Colors & Surface Logic
The palette is rooted in a deep Indigo and Cyan core, but its execution is defined by tonal depth rather than flat fills.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a feed of posts (on `surface-container-lowest`) should sit atop a `surface-container-low` background. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine vellum.
*   **Base Layer:** `surface` (#f8f9fa) – The canvas.
*   **Secondary Layouts:** `surface-container-low` (#f3f4f5) – Used for sidebars or navigation rails.
*   **Primary Content Cards:** `surface-container-lowest` (#ffffff) – The highest "physical" lift for the main feed.
*   **Active Overlays:** `surface-bright` (#f8f9fa) – Used for hovering states or active focus areas.

### The "Glass & Gradient" Rule
To escape the "bootstrap" look, main CTAs and floating navigation elements should utilize:
*   **Glassmorphism:** Use `surface` colors at 70-80% opacity with a `backdrop-blur` of 12px-20px.
*   **Signature Textures:** Apply a subtle linear gradient (135°) from `primary` (#3525cd) to `primary-container` (#4f46e5) for Hero buttons. This provides a "soul" and professional polish that flat hex codes cannot achieve.

## 3. Typography
Our typography strategy balances the architectural strength of **Plus Jakarta Sans** with the functional clarity of **Inter**.

*   **Display & Headlines (Plus Jakarta Sans):** Used for high-impact moments. These should feel editorial—use `display-md` (2.75rem) for profile headers to create an intentional "oversized" look that breaks the standard grid.
*   **Titles & Body (Inter):** The workhorse. `title-md` (1.125rem) is the default for post headers, while `body-md` (0.875rem) handles the main content.
*   **Hierarchy as Identity:** Use `label-sm` (0.6875rem) in all-caps with increased letter-spacing for metadata (e.g., TIMESTAMP or CATEGORY). This creates an authoritative, "SaaS-premium" feel.

## 4. Elevation & Depth
We convey hierarchy through **Tonal Layering** rather than traditional drop shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f3f4f5) section. This creates a soft, natural lift without the "dirty" look of heavy shadows.
*   **Ambient Shadows:** If a floating element (like a Create Post modal) requires a shadow, it must be an "Ambient Shadow":
    *   **Blur:** 32px – 64px.
    *   **Opacity:** 4% – 6%.
    *   **Color:** Use a tinted version of `on-surface` (#191c1d) to mimic natural light.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline-variant` token at **15% opacity**. Never use 100% opaque borders.

## 5. Components

### Buttons & Chips
*   **Primary Action:** Gradient fill (Primary to Primary-Container), `xl` (1.5rem) roundedness, and `body-lg` semibold text.
*   **Secondary/Ghost:** `surface-container-high` background with `primary` text. No border.
*   **Selection Chips:** Use `secondary-container` for active states. Use `xl` (full pill) rounding.

### Inputs & Fields
*   **Text Inputs:** Use `surface-container-low` as the background fill. Upon focus, shift the background to `surface-container-lowest` and apply a 2px `primary` "Ghost Border" (20% opacity).
*   **Forbid Divider Lines:** In lists or settings pages, do not use lines. Separate items using `spacing-4` (1rem) or `spacing-6` (1.5rem) of vertical white space.

### The "Curated Card" (Feed Post)
*   **Radius:** `xl` (1.5rem) for the outer container.
*   **Structure:** No border. High-contrast typography hierarchy (Plus Jakarta Sans for the user name, Inter for the body).
*   **Interaction:** Subtle scale-up (1.02x) on hover with an ambient shadow transition.

### Navigation Rail (SaaS Minimalist)
*   **Style:** `surface-container-lowest` background with a glassmorphism blur. 
*   **Active State:** Instead of a box, use a vertical "pill" indicator in `secondary` (#00687a) positioned 4px from the left edge of the active icon.

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins. If the left margin is `spacing-10`, try a right margin of `spacing-16` for a specific layout to create visual interest.
*   **Do** stack surfaces. A `surface-container-lowest` card inside a `surface-container-high` drawer is the correct way to show depth.
*   **Do** use `tertiary` (#684000) for subtle "warmth" in notifications or callouts to break the cool-tone monotony.

### Don't
*   **Don't** use 1px #E5E7EB borders. Use background tonal shifts instead.
*   **Don't** use pure black for text. Always use `on-surface` (#191c1d) to maintain the high-end, soft aesthetic.
*   **Don't** crowd the layout. If in doubt, double the spacing token (e.g., move from `spacing-4` to `spacing-8`).
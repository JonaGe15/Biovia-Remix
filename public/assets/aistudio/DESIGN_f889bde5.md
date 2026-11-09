---
name: BioVerdant Glass
colors:
  surface: '#101412'
  surface-dim: '#101412'
  surface-bright: '#363a38'
  surface-container-lowest: '#0b0f0d'
  surface-container-low: '#181c1a'
  surface-container: '#1c201e'
  surface-container-high: '#272b28'
  surface-container-highest: '#323633'
  on-surface: '#e0e3df'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#e0e3df'
  inverse-on-surface: '#2d312f'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#45dfa4'
  on-secondary: '#003825'
  secondary-container: '#00bd85'
  on-secondary-container: '#00452e'
  tertiary: '#62dcad'
  on-tertiary: '#003827'
  tertiary-container: '#37b78a'
  on-tertiary-container: '#00422e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#68fcbf'
  secondary-fixed-dim: '#45dfa4'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#80f9c8'
  tertiary-fixed-dim: '#62dcad'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#00513a'
  background: '#101412'
  on-background: '#e0e3df'
  surface-variant: '#323633'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-sm: 1rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system establishes a high-precision ecological operating environment tailored for environmental researchers, geospatial conservationists, and biodiversity analysts. The aesthetic merges hyper-refined optical glassmorphism with an organic, deep biosphere palette. 

The emotional tone balances analytical scientific rigor with ambient biophilic reverence. Interfaces must feel luminous, weightless, and alive—resembling thin, polished optical glass floating over dense topographical canopies and dark hydrological beds. Visual elements leverage translucent optical layers, refraction-simulating specular highlights, and liquid-light ambient glows that illuminate ecological metrics without compromising legibility.

## Colors

The palette is rooted in an ultra-deep obsidian-forest canvas (`#090D0B`), allowing bioluminescent emeralds, crystalline mints, and botanical sage accents to project crisp spatial hierarchy through glass substrates.

- **Primary (`#10B981`)**: Radiant Emerald. Applied to mission-critical telemetry activations, positive ecological balance indicators, and primary navigational states.
- **Secondary (`#34D399`)**: Crystal Mint. Used for dynamic biodiversity vector flows, active map controls, and illuminated vector pathways.
- **Tertiary (`#6EE7B7`)**: Soft Botanical Sage/Glow Mint. Reserved for high-value data tags, micro-badges, endangered species recovery milestones, and luminous specular highlights.
- **Neutral (`#090D0B`)**: Deep Obsidian Biosphere. Serves as the bedrock dark foundation, shifting upwards into translucent obsidian slate (`#111915`) for background glass tiers.

### Functional Glass Spectrum
- **Glass Panel Fill**: `rgba(17, 25, 21, 0.65)` layered over deep canvas with `backdrop-filter: blur(20px) saturate(180%)`.
- **Luminous Edge Strokes**: Gradient borders shifting from top-left `rgba(110, 231, 183, 0.35)` to bottom-right `rgba(16, 185, 129, 0.05)`.
- **Status & Telemetry Accents**:
  - Critical Extinction Risk: `#F87171` (Crimson Flora)
  - Threatened / Cautionary: `#FBBF24` (Amber Mycelium)
  - Stable / Thriving: `#34D399` (Vital Foliage)
  - Hydrological / Marine: `#38BDF8` (Glacial Aquifer)

## Typography

The type hierarchy pairs the technical, structural geometry of **Space Grotesk** with the neutral clarity of **Inter**.

- **Space Grotesk**: Deployed for display titles, spatial coordinates, analytical metrics, telemetry figures, and uppercase metadata badges. Its sharp mechanical counters emphasize precision instrumentation.
- **Inter**: Governs continuous reading surfaces, telemetry narratives, taxonomic field descriptions, and analytical logs, delivering uncompromised micro-legibility against frosted glass backdrops.

## Layout & Spacing

The application architecture utilizes an adaptive 12-column fluid grid system pinned inside an edge-to-edge spatial canvas. Desktop web views feature persistent floating glass rails alongside anchored modular telemetry pods.

- **Desktop (1440px+)**: 12-column grid with `2rem` gutters and `3rem` canvas margins. Floating map viewports stretch 100vw/100vh with pinned glass overlay pods docked `1.5rem` from screen boundaries.
- **Tablet Landscape (1024px - 1439px)**: 8-column layout with `1.5rem` gutters and `2rem` outer margins. Glass inspection drawers slide over telemetry canvases.
- **Micro-alignment**: Interior card sections and metric telemetry clusters follow an uncompromising 4px/8px modular rhythm (`space-xs` through `space-xl`) to maintain visual alignment across stacked transparent containers.

## Elevation & Depth

Depth is conveyed through liquid refraction, translucent layering, and dual-tone specular highlights rather than conventional opaque drop shadows.

1. **Substrate Base (Level 0)**: The base cartographic and topological engine canvas resting at `#090D0B`.
2. **Floated Glass Slab (Level 1)**: `rgba(15, 23, 19, 0.55)` background fill, `backdrop-filter: blur(16px) saturate(160%)`, bounded by a hairline stroke `1px solid rgba(255, 255, 255, 0.08)`. Subtle cast shadow: `0 8px 32px 0 rgba(0, 0, 0, 0.36)`.
3. **Interactive Overlays & Floating Map Tools (Level 2)**: `rgba(20, 32, 26, 0.72)` background fill, `backdrop-filter: blur(24px) saturate(180%)`. Border stroke transitions from `rgba(110, 231, 183, 0.3)` on the incident light edge (top/left) to `rgba(0, 0, 0, 0.4)` on the down-angle (bottom/right). Soft green ambient glow: `0 0 24px -4px rgba(16, 185, 129, 0.12)`.
4. **Modal Telemetry & Diagnostic Focus (Level 3)**: `rgba(9, 13, 11, 0.85)` background fill with multi-layered specular reflections: `box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.2), 0 20px 48px -8px rgba(0, 0, 0, 0.7)`.

## Shapes

The design uses balanced, modern curves (`roundedness: 2`, `0.5rem` / `8px` base) that scale to `1rem` (`16px`) on elevated glass card structures and `1.5rem` (`24px`) on major control surfaces.

- **Primary Panels & Cards**: `rounded-lg` (16px / 1rem) to simulate polished curved optical crystal lenses.
- **Controls & Micro-Badges**: Fully pill-shaped (`9999px`) for interactive status chips, map navigation buttons, and zoom controls.
- **Input Fields & Data Cells**: `0.5rem` (8px) for crisp structural integrity inside dense metric tables.

## Components

### Buttons
- **Primary Bio-Action**: Emerald fill (`#10B981`) with linear gradient overlay to `#059669`, white high-contrast text (`#FFFFFF`), Space Grotesk font, pill radius. Inset highlight `0 1px 0 rgba(255, 255, 255, 0.3)`, cast aura `0 4px 20px rgba(16, 185, 129, 0.35)`.
- **Glass Action (Secondary)**: Translucent liquid fill `rgba(110, 231, 183, 0.08)`, frosted backdrop blur `12px`, border `1px solid rgba(110, 231, 183, 0.25)`, hover state elevates fill to `rgba(110, 231, 183, 0.16)`.

### Chips & Ecological Impact Badges
- **Structure**: Pill-shaped status indicators with an integrated pulsing status dot (3px radius).
- **Extinction / Threat Levels**:
  - *Critically Endangered (CR)*: `rgba(248, 113, 113, 0.12)` fill, stroke `rgba(248, 113, 113, 0.4)`, text `#FCA5A5`.
  - *Vulnerable (VU)*: `rgba(251, 191, 36, 0.12)` fill, stroke `rgba(251, 191, 36, 0.4)`, text `#FDE68A`.
  - *Stable Biodiversity*: `rgba(16, 185, 129, 0.12)` fill, stroke `rgba(52, 211, 153, 0.4)`, text `#6EE7B7`.

### Lists & Telemetry Feeds
- Transparent table surfaces with alternating faint row highlights `rgba(255, 255, 255, 0.015)`.
- Dividers implemented via horizontal hairline borders `rgba(110, 231, 183, 0.08)`. Hover rows activate a lateral emerald light bar (2px width) on the left margin.

### Checkboxes & Switches
- **Switches**: Track rendered in `rgba(255, 255, 255, 0.1)` with 1px border. Active state shifts track to `#10B981` with an internal glowing thumb that carries an outer lens reflection.
- **Checkboxes**: 18px squircle with `1px solid rgba(110, 231, 183, 0.3)`. Checked state displays a glowing mint checkmark over emerald frosted background.

### Input Fields
- Form elements feature `rgba(6, 10, 8, 0.6)` inner inset backgrounds, recessed inner shadow `inset 0 2px 4px rgba(0, 0, 0, 0.5)`, framed by `1px solid rgba(255, 255, 255, 0.08)`. Focus states trigger an illuminated neon border of `#34D399` with `0 0 12px rgba(52, 211, 153, 0.2)`.

### Wildlife Species Cards
- Multi-layered glassmorphic structures containing species imagery with internal bottom gradient fade (`rgba(9, 13, 11, 0.95)` to `transparent`).
- Displays scientific nomenclature in Inter italic (`body-sm`), common name in Space Grotesk (`headline-sm`), an overlayed IUCN conservation badge in top-right, and horizontal micro-sparklines detailing population density telemetry.

### Floating Map Controls
- Clustered glass pill pods docked vertically or horizontally over cartographic viewports.
- Integrated icons utilize 1.5px stroke geometries in `#E2E8F0`, shifting to `#34D399` on active interaction with subtle refractive lens flare beneath the active icon.
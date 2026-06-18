![ManekiSakura](./logo.png)
#  Maneki-Sakura 招き桜

> 🌸 **Your digital cherry blossom `tree` who grows and blooms with `you` and which is  based on your real-life milestones.**
> A retro-themed, Japanese-inspired personal growth tracker built for the modern web using **Next.js**.

---

## 🕹️ System Features

* **🌸 Interactive Sakura Tree** — 5 dynamic growth stages rendered via a custom HTML5 pixel-art canvas.

* **💾 Local Storage Persistence** — Zero login required. Your progress stays 100% private, saved directly in `sakura-growth-v1`.

* **💾 Windows 95 UI** — Fully draggable, stackable, and nostalgic retro desktop windows.

* **🌆 Dynamic Day/Night Cycle** — The canvas sky seamlessly shifts hues based on your local system time.

* **📻 Zen Mode** — Strip away the clutter. Access a minimalist view paired with a built-in lo-fi radio.

* **🎆 Birthday Matsuri** — Trigger a special festival overlay complete with retro canvas fireworks when your day arrives.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/maneki-sakura.git
cd maneki-sakura
npm install

```

### 2. Boot the Engine

```bash
npm run dev

```

Now, open [http://localhost:3000](http://localhost:3000) inside your browser to start tracking.

---

## 🛠️ Developer Terminal

| Command | Action |
| --- | --- |
| `npm run dev` | Spins up the local development server |
| `npm run build` | Compiles the production-ready Next.js application |
| `npm run start` | Boots the compiled production server |
| `npm run lint` | Runs ESLint to check for code formatting issues |

---

## 📂 Project Architecture

```yaml
app/                   # Next.js App Router Core
 ┣ layout.tsx          # Global providers, metadata, & pixel fonts
 ┣ page.tsx            # Desktop Home Dashboard
 ┗ globals.css         # Retro Win95 theme variables & CRT scanline effects
components/            # UI Architecture
 ┣ SakuraApp.tsx       # Main desktop environment orchestrator
 ┣ RetroWindow.tsx     # Draggable & toggleable window components
 ┗ ZenModeView.tsx     # Minimalist audio-focused overlay
lib/                   # Core Systems & Canvas Engines
 ┣ tree-renderer.ts    # Procedural pixel-art Sakura canvas engine
 ┣ sky.ts              # Day/night ambient color matrix
 ┣ matsuri.ts          # Particle-based firework array
 ┣ audio.ts            # Web Audio API 8-bit sound fx & lo-fi streams
 ┣ storage.ts          # State hydrator & localStorage bridge
 ┗ types.ts            # Strict TypeScript definitions
hooks/                 # Custom React Lifecycle Hooks

```

---

## 🌲 Extending the Ecosystem

The Next.js architecture makes adding new layers to your desktop environment effortless:

* **New Desktop Apps:** Simply create a new route under `app/` (e.g., `app/stats/page.tsx`) to build out macro-analytics tracking.
* **Cloud Sync:** Drop an `app/api/` folder to instantly scale from `localStorage` to server-side Postgres or OAuth.
* **Performance First:** Keep static text/layouts as fast Server Components. Use the `'use client'` directive exclusively for interactive canvas, audio, and dragging systems.

---
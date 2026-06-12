<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0ea5e9&height=200&section=header&text=FM26%20Game&fontSize=50&fontAlignY=35&desc=Modern%20Next.js%20Canvas%20Game&descAlignY=55&descAlign=50" />

  <br />
  
  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)

  <br />

  **[🕹️ Play Now](#) • [📦 Download APK](https://github.com/gdeon99/fm26/releases) • [🐛 Report Bug](https://github.com/gdeon99/fm26/issues)**
</div>

---

## ✨ Features

- 🎮 **Smooth Canvas Rendering:** High-performance fixed aspect-ratio canvas.
- 📱 **Cross-Platform:** Available as a Web App and Native Android APK.
- ⚡ **Next.js Powered:** Rebuilt on the latest Next.js 15+ App Router.
- 🎨 **Modern UI:** Styled entirely with TailwindCSS.

<br />

> [!TIP]
> **Pro Tip:** Play on fullscreen mode for the best gaming experience!

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed, then simply run:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit `http://localhost:3000` to start playing!

---

## 🛠️ Tech Stack Architecture

```mermaid
graph TD;
    A[Next.js App Router] -->|Renders| B(React Components);
    B -->|Styles| C{TailwindCSS};
    B -->|Logic| D[Game Engine];
    D -->|Renders to| E[Canvas API];
    A -->|Static Export| F[Out Directory];
    F -->|Capacitor| G[Android APK];
```

---

## 📦 Android APK Build

We use **Capacitor** to compile the web app into a native Android APK.

1. Build the Next.js static files:
   ```bash
   npm run build
   ```
2. Sync with Android platform:
   ```bash
   npx cap sync
   ```
3. Open in Android Studio or build via Gradle!

> [!NOTE]
> Check the **[Releases](https://github.com/gdeon99/fm26/releases)** tab to download the latest `.apk` file directly!

<div align="center">
  <br />
  Made with ❤️ by <strong>Gdeon99</strong>
</div>

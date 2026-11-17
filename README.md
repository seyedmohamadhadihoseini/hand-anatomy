# 🖐️ Clinical 3D Acupuncture & Hand Anatomy Atlas

![WebGL 2.0](https://img.shields.io/badge/WebGL-2.0%20%7C%2060%20FPS-00d2ff?style=for-the-badge&logo=webgl&logoColor=white)
![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite&logoColor=white)

An interactive, real-time **60 FPS WebGL 2.0** spatial navigation and clinical visualization system for hand acupuncture points and surface-normal needle calibration. Built for medical education, clinical reference, and high-precision 3D anatomical inspection across desktop and mobile browsers.

---

## ✨ Key Features

### 🔬 Multi-Mode Real-Time Shader Pipeline

Switch seamlessly between four diagnostic rendering modes to inspect surface topology and internal spatial depth:

* **X-Ray Fresnel Mode:** Translucent volumetric glow highlighting deep meridian pathways and sub-surface needle trajectories.
* **Clinical Skin:** Realistic surface shading for anatomical landmark identification.
* **Matte Anatomy:** High-contrast clay/matte shading to study bone and tendon contours without specular distraction.
* **Engineering Mesh:** Wireframe topology view for inspecting 3D mesh density and surface normal alignment.

### 📍 Interactive Acupoint & Meridian Telemetry

* **Instant Search & Filtering:** Search acupoints by standardized code (e.g., `LI4`, `PC8`, `SI3`, `TE5`, `LU10`), meridian name, or clinical indication.
* **Clinical Metadata Panel:** Displays anatomical landmarks, therapeutic applications, insertion depth (in *Cun*), and recommended needle insertion angle.
* **3D Needle Simulation:** Toggleable virtual acupuncture needle aligned dynamically with the calibrated surface normal vector at each point.

### 🎥 Precision Camera & Spatial Calibration Tools

* **Preset Anatomical Views:** One-click smooth camera transitions for **Overview**, **Dorsal (Back of Hand)**, and **Palmar (Palm)** perspectives, plus camera angle locking.
* **Macro Focus:** Smoothly interpolates camera target and zoom directly onto the active acupoint.
* **Interactive Point Calibration & JSON Export:** Reposition markers directly on the 3D surface mesh and export updated 3D coordinates as structured JSON.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **3D Engine & Rendering** | Three.js, React Three Fiber, Custom GLSL Shaders |
| **Frontend Framework** | React, TypeScript |
| **Styling & UI** | Tailwind CSS, Glassmorphic Clinical Dark UI |
| **Build & Deployment** | Vite, Nginx / PM2 |

---

## 🚀 Getting Started

### Prerequisites

* Node.js `>= 18.x`
* npm or pnpm

### Local Development

Clone the repository and install dependencies:

    git clone https://github.com/seyedmohamadhadihoseini/acu-3d-demo.git
    cd acu-3d-demo
    npm install

Start the development server:

    npm run dev

Build for production:

    npm run build

---

## ⚡ Performance Engineering

* **Consistent 60 FPS:** Optimized geometry draw calls, memoized shader uniforms, and lightweight raycasting ensure smooth touch and mouse interaction on both mobile Safari/Chrome and desktop GPUs.
* **Responsive Spatial UI:** Floating clinical HUD panels collapse cleanly on smaller viewports without obstructing the central 3D canvas.

---

## 📄 License

This project is available for portfolio and educational showcase purposes. For custom 3D WebGL medical, product, or interactive visualization inquiries, feel free to connect via GitHub.

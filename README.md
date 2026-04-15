# EduQuest - Gamified Educational Web App

EduQuest is a modern, gamified educational web application designed for students (especially accounting learners). Inspired by Kahoot, Quizizz, and Duolingo, it makes learning fun and engaging.

## 🎯 Features

- **Gamified Learning**: Earn points, badges, and level up as you learn.
- **Interactive Quizzes**: Multiple-choice questions with timers and instant feedback.
- **AI Tutor**: A ChatGPT-like interface to ask questions about accounting concepts (mocked for this demo).
- **Teacher Dashboard**: A simple interface for teachers to manage quiz content and upload study materials.
- **Modern UI**: Built with Tailwind CSS and Framer Motion for a playful, 3D-like, and animated experience.

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Utility**: clsx, tailwind-merge

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd eduquest
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` (or the port specified in your terminal).

### Building for Production

To create a production build:

```bash
npm run build
```

This will generate a `dist` folder containing the optimized assets ready for deployment.

## 📦 Deployment Guide

### Deploying to Netlify

1. Push your code to a GitHub repository.
2. Log in to [Netlify](https://www.netlify.com/) and click "Add new site" -> "Import an existing project".
3. Connect your GitHub account and select your repository.
4. Netlify will automatically detect Vite. The build settings should be:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click "Deploy site".

### Deploying to Vercel

1. Push your code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com/) and click "Add New..." -> "Project".
3. Import your GitHub repository.
4. Vercel will automatically detect Vite. The build settings should be:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click "Deploy".

## 📁 Project Structure

```
/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Base UI elements (Button, Card)
│   │   ├── Layout.tsx  # Main layout wrapper
│   │   └── Navbar.tsx  # Navigation bar
│   ├── pages/          # Application routes
│   │   ├── Home.tsx    # Landing page
│   │   ├── Quiz.tsx    # Gamified quiz interface
│   │   ├── Chatbot.tsx # AI Tutor interface
│   │   └── Teacher.tsx # Teacher dashboard
│   ├── utils/          # Helper functions
│   │   └── cn.ts       # Tailwind class merger
│   ├── App.tsx         # Main application component & routing
│   ├── index.css       # Global styles & Tailwind config
│   └── main.tsx        # React entry point
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
└── README.md           # Project documentation
```

## 🎨 Design System

- **Primary Font**: Nunito (Rounded, friendly)
- **Primary Colors**: Gradient from Blue (`from-blue-500`) to Purple (`via-purple-500`) to Orange (`to-orange-500`)
- **UI Elements**: Soft shadows (`shadow-xl`), rounded corners (`rounded-2xl`, `rounded-3xl`), and hover animations.

# NewsAddaIndia - Angular Application

A modern news website built with Angular, featuring a beautiful dark theme with smooth animations and transitions.

## Features

- 🎨 Modern dark theme with glassmorphism effects
- 📱 Fully responsive design
- ⚡ Smooth animations and transitions
- 🎯 Standalone Angular components
- 🎨 Tailwind CSS for styling
- 📰 News ticker, hero section, news grid, and more

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:4200`

### Build

To build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── app/
│   ├── components/      # Reusable components
│   │   ├── header/
│   │   ├── footer/
│   │   ├── news-ticker/
│   │   ├── hero-section/
│   │   ├── news-grid/
│   │   ├── category-section/
│   │   ├── sidebar/
│   │   └── weather-widget/
│   ├── pages/           # Page components
│   │   ├── index/
│   │   └── not-found/
│   ├── ui/              # UI components
│   │   └── button/
│   ├── app.component.ts
│   └── app.routes.ts
├── lib/                 # Utility functions
├── styles.css           # Global styles
├── index.html
└── main.ts
```

## Technologies Used

- Angular 18
- TypeScript
- Tailwind CSS
- Standalone Components

## All Styles Preserved

All original styles, animations, transitions, and fonts have been preserved from the React version:
- Custom animations (ticker-scroll, float-animation, pulse-glow, shimmer)
- Tailwind CSS classes
- Custom design tokens
- Font families (Space Grotesk, DM Sans)
- Color scheme and gradients


# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Build the application for production 
- `npm start` - Start production server (uses custom server.js on port 3001)

## Architecture

This is a Next.js application for DATALYS Consulting with the following structure:

### Core Technologies
- **Framework**: Next.js 15 with TypeScript and App Router
- **Styling**: TailwindCSS with NextUI components and custom Satoshi fonts
- **UI Components**: Static interfaces with Link-based navigation
- **Deployment**: PM2 cluster mode with custom server configuration

### Key Directories
- `src/app/` - App Router pages and layouts
  - Main routes: connexion, mot-de-passe-oublie, tableaudebord
  - Dashboard sub-routes: profil, projet, lesdossiers, utilisateur, etc.
- `src/components/` - React components organized by feature
  - `TableauDeBord/` - Dashboard-specific components
  - `common/` - Shared components like Loader
- `src/context/` - React contexts for state management
- `src/types/` - TypeScript type definitions

### Navigation System
The app uses simple Link-based navigation between pages. All forms redirect to appropriate pages using Next.js router navigation.

### UI Components
The dashboard includes comprehensive UI components with:
- Static data display and forms
- Folder and file management interfaces
- Project organization views
- Support for multiple file format display (PDF, images, Office docs)

### Styling System
- Custom color scheme with primary color `#4ba9b7`
- Dark mode support via Tailwind classes
- Extensive custom spacing and sizing scales
- NextUI components for consistent UI elements

### Production Configuration
- PM2 ecosystem for process management
- Custom webpack optimization for browser compatibility
- Security headers configuration
- Static file serving
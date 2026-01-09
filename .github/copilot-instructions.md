# FilMark - GitHub Copilot Instructions

## Project Overview
FilMark is a React Native mobile application built with Expo for tracking movies and TV shows. Users can create lists, search for content, manage friends, and track their viewing history.

## Technology Stack
- **Framework**: React Native with Expo (v51.x)
- **Navigation**: Expo Router (v3.x)
- **Language**: TypeScript (v5.x)
- **Backend**: Supabase (v2.x)
- **UI Components**: Custom components with Lucide icons
- **State Management**: React hooks and AsyncStorage

## Project Structure
- `/app` - Main application screens using Expo Router
  - `(auth)/` - Authentication screens (login)
  - `(tabs)/` - Tab-based navigation screens (home, movies, TV shows, lists, profile)
  - Individual screens for movie details, TV show details, list details, friends, etc.
- `/components` - Reusable UI components (MovieSearchModal, NotificationBell, Toast, etc.)
- `/hooks` - Custom React hooks
- `/lib` - Utility libraries (Supabase client, etc.)
- `/assets` - Static assets (images, fonts)
- `/supabase` - Supabase configuration and migrations
- `/ios` - iOS native configuration
- `/watchbase` - Watch app configuration

## Coding Conventions
- Use TypeScript with strict mode enabled
- Use functional components with React hooks
- Follow Expo Router file-based routing conventions
- Import paths use `@/` alias for root-level imports (e.g., `@/lib/supabase`)
- Use Inter font family (Regular, Medium, SemiBold, Bold)

## Authentication Flow
- Supabase authentication with email/password
- Deep linking support for password recovery
- Session-based navigation (authenticated users → tabs, unauthenticated → login)

## Key Features
- Movie and TV show search and tracking
- User lists management
- Friend system with profiles
- Notifications
- Account and privacy settings
- Password reset functionality

## Development Commands
- `npm run dev` - Start Expo development server
- `npm run lint` - Run ESLint
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run build:web` - Build for web platform

## Important Notes
- The app uses Expo Router for navigation (file-based routing)
- Supabase is used for backend services (auth, database)
- The app supports deep linking for password recovery
- Fonts must be loaded before hiding splash screen

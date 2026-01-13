# FilMark 🎬

A mobile application for tracking movies and TV shows, built with React Native and Expo.

## Features

- 🎥 Search and discover movies and TV shows
- 📝 Create and manage custom lists
- 👥 Friend system with profiles
- 🔔 Notifications
- 🔐 Secure authentication with Supabase
- 📱 Cross-platform (iOS, Android)

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Backend**: Supabase
- **UI**: Custom components with Lucide icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Development with GitHub Copilot

This project is configured for use with GitHub Copilot. See [.github/COPILOT_SETUP.md](.github/COPILOT_SETUP.md) for detailed setup instructions.

### Quick Setup
1. Open this project in VS Code
2. Install recommended extensions (GitHub Copilot, GitHub Copilot Chat)
3. Sign in with your GitHub account
4. Start coding with AI assistance!

## Project Structure

```
/app              - Main application screens (Expo Router)
  /(auth)         - Authentication screens
  /(tabs)         - Tab navigation screens
/components       - Reusable UI components
/hooks            - Custom React hooks
/lib              - Utilities and libraries
/assets           - Images and fonts
/supabase         - Supabase configuration
```

## Available Scripts

- `npm run dev` - Start Expo development server
- `npm run lint` - Run ESLint
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run build:web` - Build for web platform

## License

This project is private and proprietary.
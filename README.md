
# Shiori

A modern React Native mobile application for discovering and using beautiful wallpapers powered by the Wallhaven API.

<img src="https://github.com/user-attachments/assets/6d1d5d51-b47f-40c1-9940-7cf6fb8392d1" width="200" />

## Overview

Shiori is a sleek, Material Design-inspired wallpaper application that allows users to browse, search, filter, and apply wallpapers directly to their devices. The app features Google Pixel-like icons and a modern UI/UX design for an intuitive user experience.

## Features

- **Curated Wallpapers**: Access thousands of high-quality wallpapers from Wallhaven
- **Material Design**: Modern UI with smooth animations and transitions
- **Advanced Filtering**: Filter wallpapers by category, resolution, colors, and more
- **Search Functionality**: Find specific wallpapers using keywords
- **Favorites**: Save your favorite wallpapers for quick access
- **Direct Apply**: Set wallpapers directly from the app
- **Download Manager**: Download wallpapers to your device
- **Dark Mode**: Full support for light and dark themes
- **Customizable Settings**: Personalize your experience

## App Structure

```
src/
├── assets/                 # Static assets like icons, fonts, etc.
├── components/             # Reusable UI components
│   ├── common/             # Shared components (buttons, cards, etc.)
│   ├── wallpaper/          # Wallpaper-specific components
│   └── navigation/         # Navigation-related components
├── hooks/                  # Custom React hooks
├── navigation/             # Navigation configuration
│   ├── MainTabNavigator.js # Main tab navigation setup
│   ├── StackNavigators.js  # Stack navigators for each tab
│   └── index.js            # Root navigation setup
├── screens/                # App screens
│   ├── Home/               # Home screen components
│   ├── Search/             # Search screen components
│   ├── Filters/            # Filters screen components
│   ├── Favorites/          # Favorites screen components
│   ├── Settings/           # Settings screen components
│   └── Detail/             # Wallpaper detail screen components
├── services/               # API and other service integrations
│   ├── api/                # API configuration and requests
│   ├── storage/            # Local storage utilities
│   └── wallpaper/          # Wallpaper-related services
├── store/                  # State management
│   ├── actions/            # Action creators
│   ├── reducers/           # Reducers
│   ├── selectors/          # State selectors
│   └── index.js            # Store configuration
├── theme/                  # App theming
│   ├── colors.js           # Color palette
│   ├── typography.js       # Text styles
│   ├── spacing.js          # Layout spacing
│   └── index.js            # Theme provider
├── utils/                  # Utility functions
└── App.js                  # Root component
```

## Screens

### Home Tab
- Featured wallpapers
- Latest uploads
- Popular wallpapers
- Categories showcase

### Search Tab
- Search bar with suggestions
- Recent searches
- Trending searches
- Search results with infinite scroll

### Filters Tab
- Category selection
- Color picker
- Resolution options
- Aspect ratio selection
- Sorting options (newest, popularity, random)
- Advanced filters (NSFW toggle, etc.)

### Favorites Tab
- Grid view of saved wallpapers
- Collection organization
- Download status

### Settings Tab
- Theme selection (Light/Dark/System)
- Download preferences
- Cache management
- Notification settings
- App information
- User preferences

## Technical Stack

- **React Native**: Core framework
- **React Navigation**: Navigation between screens
- **Redux Toolkit**: State management
- **Axios**: API requests
- **React Native Paper**: Material Design components
- **React Native Vector Icons**: Icon library for Google Pixel-like icons
- **React Native Fast Image**: Efficient image loading
- **Async Storage**: Local storage solution
- **React Native Reanimated**: Advanced animations

## API Integration

The app integrates with the Wallhaven API to fetch wallpapers. The API provides endpoints for:

- Searching wallpapers
- Filtering by various parameters
- Getting wallpaper details
- Accessing collections

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/shiori.git

# Navigate to the project directory
cd shiori

# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Configuration

Create a `.env` file in the root directory with your Wallhaven API key:

```
WALLHAVEN_API_KEY=your_api_key_here
API_BASE_URL=https://wallhaven.cc/api/v1
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.



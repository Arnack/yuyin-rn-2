# AI Code Generator Instructions - Yuyin RN 2 Project

## Project Overview
This is a **React Native mobile application** built with **Expo** focused on Chinese language learning, specifically tone recognition and pronunciation practice. The app includes audio processing, subscription management, and user authentication.

## Tech Stack & Architecture

### Core Framework
- **React Native** (0.79.3) with **Expo** (~53.0.11)
- **TypeScript** (~5.8.3) for type safety
- **Expo Router** (~5.1.0) for file-based navigation
- **New Architecture** enabled (Fabric/TurboModules)

### Navigation Structure
- **File-based routing** using Expo Router
- **Tab navigation** with bottom tabs: `(tabs)` folder
- **Authentication flow**: `(auth)` folder with login/register
- **Stack navigation** for main app structure

### Styling & UI
- **NativeWind** (^4.1.23) - Tailwind CSS for React Native
- **Gluestack UI** components for consistent design system
- **Expo Linear Gradient** for gradient effects
- **Custom theme system** with light/dark mode support
- **StyleSheet** for complex animations and native styling

### State Management & Data
- **React Context API** for global state (AuthContext, SubscriptionContext)
- **Supabase** (^2.50.0) for backend services and authentication
- **Expo Secure Store** for secure credential storage
- **Custom hooks** for reusable logic

### Audio & Media
- **Expo AV** (~15.1.6) for audio recording and playback
- **React Native SVG** for vector graphics and animations
- **Audio spectrum analysis** via AWS API integration
- **Voice recording** with real-time feedback

### Platform Features
- **In-App Purchases** (react-native-iap ^12.16.4)
- **Subscription management** with premium features
- **Cross-platform support** (iOS, Android, Web)
- **Haptic feedback** for enhanced UX

## Project Structure

### Directory Layout
```
app/
├── _layout.tsx              # Root layout with providers
├── (auth)/                  # Authentication flow
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/                  # Main app tabs
│   ├── _layout.tsx
│   ├── index.tsx           # Home screen
│   ├── practice.tsx        # Practice hub
│   ├── speak-tones.tsx     # Tone practice (main feature)
│   ├── recognise-tones.tsx # Tone recognition
│   ├── sentence-reading.tsx
│   ├── explore.tsx
│   ├── profile.tsx
│   └── subscription.tsx
└── +not-found.tsx

components/                  # Reusable UI components
├── ui/                     # Gluestack UI setup
├── ThemedText.tsx          # Theme-aware text
├── ThemedView.tsx          # Theme-aware containers
└── SubscriptionPlanCard.tsx

contexts/                   # Global state management
├── AuthContext.tsx         # User authentication
└── SubscriptionContext.tsx # Subscription state

hooks/                      # Custom React hooks
├── useColorScheme.ts       # Theme detection
├── useSubscriptionGuard.ts # Premium feature protection
└── useThemeColor.ts        # Dynamic theming

lib/                        # External service integrations
└── supabase.ts            # Supabase client setup
```

## Coding Standards & Conventions

### TypeScript Guidelines
- **Strict mode enabled** - all code must be fully typed
- **Interface definitions** for all props and data structures
- **Path aliases** using `@/` for imports from project root
- **Explicit return types** for functions when not obvious

### Component Structure
```typescript
// Import order: React, React Native, Expo, third-party, local
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';

// Interface definitions
interface ComponentProps {
  title: string;
  onPress?: () => void;
}

// Component with proper TypeScript
export default function ComponentName({ title, onPress }: ComponentProps) {
  const backgroundColor = useThemeColor({}, 'background');
  
  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <Text style={[styles.title, { color: backgroundColor }]}>{title}</Text>
    </LinearGradient>
  );
}

// StyleSheet at bottom
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

### Styling Approach
- **Dual styling system**: NativeWind for simple styles, StyleSheet for complex animations
- **Theme-aware components** using `useThemeColor` hook
- **Responsive design** using Dimensions API
- **Platform-specific styles** when needed
- **Gradient backgrounds** for visual appeal

### Navigation Patterns
- **expo-router** for navigation with typed routes
- **Stack navigation** for main flow
- **Tab navigation** for primary screens
- **Modal presentations** for overlays
- **Back button handling** in headers

## Key Features Implementation

### Audio Recording & Processing
- **Expo AV** for recording with proper permissions
- **Real-time feedback** during recording
- **Spectrum analysis** via external API
- **Audio playback** with controls
- **Error handling** for audio failures

### Authentication Flow
- **Supabase Auth** with secure token storage
- **Email/password** authentication
- **Session persistence** across app launches
- **Protected routes** with authentication guards

### Subscription System
- **React Native IAP** for in-app purchases
- **Premium feature gating** with subscription guards
- **Cross-platform purchase handling**
- **Subscription status tracking**

### Theme System
- **Dynamic color schemes** (light/dark)
- **Consistent color tokens** via Tailwind config
- **Theme-aware components** throughout app
- **System preference detection**

## External Integrations

### APIs
- **AWS Lambda API** for audio processing at `https://8q3aqjs3v1.execute-api.us-east-2.amazonaws.com/prod/api/`
- **Supabase** for backend services
- **Custom audio analysis** endpoints

### Environment Variables
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Guidelines

### Performance Considerations
- **Optimize images** and use appropriate formats
- **Lazy load** heavy components
- **Memoize** expensive calculations
- **Clean up** audio resources and subscriptions
- **Use native animations** where possible

### Error Handling
- **Graceful degradation** for network failures
- **User-friendly error messages**
- **Proper loading states**
- **Fallback UI** for missing data

### Testing Approach
- **Component testing** with React Native Testing Library
- **Audio functionality** testing on real devices
- **Cross-platform testing** (iOS/Android)
- **Subscription flow** testing

## Platform-Specific Considerations

### iOS
- **Audio session management** for background audio
- **Haptic feedback** integration
- **Safe area handling** for notched devices
- **App Store compliance** for subscription features

### Android
- **Audio permissions** handling
- **Edge-to-edge display** support
- **Hardware back button** handling
- **Google Play billing** integration

### Web
- **Audio API** limitations and fallbacks
- **Touch vs. mouse** interaction patterns
- **Responsive breakpoints** for larger screens

## Common Patterns

### Hook Usage
```typescript
// Custom hook for subscription features
const { hasActiveSubscription, checkSubscription } = useSubscriptionGuard();

// Theme-aware styling
const backgroundColor = useThemeColor({}, 'background');
const textColor = useThemeColor({}, 'text');
```

### Context Providers
```typescript
// Always wrap components with necessary providers
<AuthProvider>
  <SubscriptionProvider>
    <YourComponent />
  </SubscriptionProvider>
</AuthProvider>
```

### Animation Patterns
```typescript
// Use Animated API for smooth interactions
const scaleAnim = useRef(new Animated.Value(1)).current;

const startAnimation = () => {
  Animated.timing(scaleAnim, {
    toValue: 1.2,
    duration: 300,
    useNativeDriver: true,
  }).start();
};
```

## When Adding New Features

1. **Check subscription requirements** - gate premium features appropriately
2. **Implement proper error handling** - network, permissions, etc.
3. **Add loading states** - for async operations
4. **Consider offline functionality** - graceful degradation
5. **Test on both platforms** - iOS and Android
6. **Follow existing patterns** - navigation, styling, state management
7. **Add proper TypeScript types** - interfaces, enums, etc.
8. **Implement proper cleanup** - useEffect cleanup, audio resources

## Dependencies to Leverage

- **@expo/vector-icons** for consistent iconography
- **react-native-svg** for custom graphics
- **expo-haptics** for tactile feedback
- **expo-linear-gradient** for visual appeal
- **@gluestack-ui/** components for consistent UI
- **expo-av** for all audio functionality
- **@supabase/supabase-js** for backend integration

Remember: This is a production-ready app with real users. Prioritize stability, performance, and user experience in all implementations. 
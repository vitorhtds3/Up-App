# OnSpace AI - React Native / Expo App

## Overview
OnSpace AI is a mobile/web application built with React Native and Expo. It is a food marketplace/ordering platform that allows users to browse restaurants, add items to cart, and checkout. It integrates with Supabase for backend/auth and Stripe for payments.

## Tech Stack
- **Framework**: Expo SDK 53 + React Native 0.79
- **Language**: TypeScript
- **Routing**: Expo Router (file-based)
- **Backend/Database**: Supabase
- **UI**: React Native Paper, NativeWind (Tailwind CSS), Lucide icons
- **State Management**: Zustand + React Context
- **Payments**: Stripe React Native
- **Package Manager**: pnpm

## Project Structure
- `app/` - Screens and routing (Expo Router)
  - `(tabs)/` - Bottom tab navigation (Home, Orders, Profile, Search)
  - `restaurant/[id].tsx` - Dynamic restaurant detail page
  - `login.tsx`, `register.tsx` - Auth screens
  - `cart.tsx`, `checkout.tsx` - Commerce screens
  - `_layout.tsx` - Root layout with providers
- `assets/` - Static assets (images, fonts)
- `constants/` - Theme and colors
- `contexts/` - React Context providers (Auth, Cart)
- `hooks/` - Custom hooks
- `lib/` - Supabase client init
- `services/` - API service files (restaurants, orders, notifications)
- `metro.config.js` - Metro bundler configuration

## Environment Variables
The `.env` file contains:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Running the App
- **Web dev server**: `pnpm run web` (starts Expo web on port 5000)
- The workflow "Start application" runs `pnpm run web` automatically

## Deployment
- Static deployment via `expo export --platform web`
- Output directory: `dist/`

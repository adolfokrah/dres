# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DRES is a fashion/e-commerce marketplace platform consisting of two applications:

- **dres-web**: Payload CMS backend + Next.js frontend (admin panel and API)
- **dres-app**: Flutter mobile application (iOS/Android consumer app)

## Commands

### dres-web (Payload CMS / Next.js)

```bash
cd dres-web

# Development
pnpm dev                    # Start dev server (localhost:3000)
pnpm build                  # Production build
pnpm start                  # Start production server

# Code Quality
pnpm lint                   # Run ESLint
pnpm lint:fix               # Fix lint errors
tsc --noEmit                # Validate TypeScript

# Payload CMS
pnpm generate:types         # Regenerate payload-types.ts after schema changes
pnpm generate:importmap     # Regenerate import map after adding/modifying components

# Testing
pnpm test:int               # Integration tests (vitest)
pnpm test:e2e               # E2E tests (playwright)
pnpm test                   # Run all tests

# Database
pnpm seed                   # Seed database
```

### dres-app (Flutter)

```bash
cd dres-app

# Development
flutter run                 # Run on connected device/simulator
flutter run -d ios          # Run on iOS
flutter run -d android      # Run on Android

# Build
flutter build ios           # Build iOS
flutter build apk           # Build Android APK

# Code Generation
flutter gen-l10n            # Generate localization files

# Dependencies
flutter pub get             # Install dependencies
```

## Architecture

### dres-web (Payload CMS)

```
src/
├── app/
│   ├── (frontend)/         # Next.js frontend routes
│   └── (payload)/          # Payload admin panel routes
├── collections/            # Payload collection configs (Users, Products, Orders, etc.)
├── globals/                # Global configs (Header, Footer, SiteSettings)
├── endpoints/              # Custom API endpoints
├── access/                 # Access control functions
├── hooks/                  # Payload hook functions
├── fields/                 # Reusable field configurations
├── blocks/                 # Content block definitions
├── components/             # Custom React components for admin panel
└── payload.config.ts       # Main Payload configuration
```

**Collection Categories:**
- **Catalog**: Styles, Variations, SKUs, Categories, Brands, Materials, Attributes
- **Orders**: Carts, Orders, Transactions, ShippingRates, DeliveryCodes
- **Users**: Users, Favorites, Follows, Reviews, Notifications
- **Content**: Pages, Posts, Media
- **Locations**: Countries, Cities, Regions

### dres-app (Flutter)

Follows **feature-first architecture** with BLoC pattern for state management:

```
lib/
├── core/
│   ├── di/                 # Dependency injection (get_it)
│   ├── services/           # API, storage, site settings services
│   ├── models/             # Shared models
│   ├── widgets/            # Reusable widgets
│   └── theme/              # App theming
├── features/
│   └── [feature_name]/
│       ├── data/
│       │   ├── models/     # Data models (fromJson/toJson)
│       │   └── repositories/ # API calls only
│       ├── logic/
│       │   └── [bloc_name]_bloc/
│       │       ├── [bloc_name]_bloc.dart
│       │       ├── [bloc_name]_event.dart
│       │       └── [bloc_name]_state.dart
│       └── presentation/
│           ├── view/       # Screens
│           └── widgets/    # Feature-specific widgets
├── main.dart               # App entry point, BLoC initialization
└── routes.dart             # GoRouter navigation configuration
```

**Key Features**: auth, cart, orders, product_details, shop, profile, favorites, follows, sell, notifications

## Critical Patterns

### Payload CMS (dres-web)

1. **Always run `generate:types` after schema changes** - Types in `payload-types.ts` won't update automatically

2. **Local API bypasses access control by default**:
   ```typescript
   // When passing user, ALWAYS set overrideAccess: false
   await payload.find({
     collection: 'posts',
     user: someUser,
     overrideAccess: false, // REQUIRED for access control
   })
   ```

3. **Always pass `req` to nested operations in hooks** for transaction safety:
   ```typescript
   hooks: {
     afterChange: [async ({ doc, req }) => {
       await req.payload.create({
         collection: 'audit-log',
         data: { docId: doc.id },
         req, // Maintains atomicity
       })
     }],
   }
   ```

4. **Prevent infinite hook loops** using context flags:
   ```typescript
   if (context.skipHooks) return
   await req.payload.update({
     // ...
     context: { skipHooks: true },
   })
   ```

### Flutter (dres-app)

1. **BLoCs are registered in `lib/core/di/injection.dart`**:
   - `registerLazySingleton` for state that persists (Auth, Cart, Favorites)
   - `registerFactory` for disposable state (ProductDetails)

2. **Access BLoCs via GetIt**: `getIt<CartBloc>().add(CartFetchRequested())`

3. **Repositories only contain API calls** - Models go in separate files under `data/models/`

4. **Naming conventions**:
   - Models: `[name]_model.dart`, `[name]_response.dart`
   - Repositories: `[name]_repository.dart`
   - BLoCs: `[name]_bloc.dart`, `[name]_event.dart`, `[name]_state.dart`
   - Screens: `[name]_screen.dart`

## Environment

- **dres-web**: Requires `.env` with `MONGODB_URI`, `PAYLOAD_SECRET`, `RESEND_API_KEY`
- **dres-app**: Requires `.env` with API base URL, Firebase config
- Localization: en, fr, de, es, it (Payload); Flutter uses ARB files in `l10n/`
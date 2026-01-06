# PlayCompass Native Build Checklist

Last Updated: January 6, 2026

## Overview
This checklist tracks features that require a native development build to test properly.
These features are disabled in Expo Go/development client due to missing native modules.

---

## Pre-Build Setup

### RevenueCat (In-App Purchases)
- [ ] Replace test API keys with production keys in `src/services/purchaseService.js`
  - Current: `test_ycTHGMubpEaTHbnahLzhPoiHAgK` (test key)
  - Get real keys from: RevenueCat Dashboard > Project Settings > API Keys
- [ ] Create products in App Store Connect / Google Play Console:
  - `playcompass_plus_monthly` - Plus tier monthly subscription
  - `playcompass_family_monthly` - Family tier monthly subscription
- [ ] Set up entitlements in RevenueCat:
  - `plus` or `playcompass_plus` or `Watchlight Interactive Pro`
  - `family` or `playcompass_family` or `Watchlight Interactive Family`
- [ ] Link products to entitlements in RevenueCat dashboard

### Push Notifications
- [ ] Configure Firebase Cloud Messaging (FCM) for Android
- [ ] Configure Apple Push Notification Service (APNs) for iOS
- [ ] Add push notification credentials to EAS

---

## Build Commands

```bash
# Development build (for testing native features)
npx expo run:android
npx expo run:ios

# Preview build via EAS
eas build --profile preview --platform android
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform android
eas build --profile production --platform ios
```

---

## Features to Test After Native Build

### 1. Notifications (expo-notifications)
- [ ] "Enable Notifications" button on Schedule screen works
- [ ] Permission dialog appears when tapping enable
- [ ] Banner disappears after granting permission
- [ ] Activity reminders are received at scheduled times
- [ ] Notification sound plays
- [ ] Tapping notification opens the app

**Test Steps:**
1. Go to Schedule screen
2. Tap "Enable notifications for reminders" banner
3. Grant permission when prompted
4. Schedule an activity 5 minutes in the future
5. Wait for reminder notification

### 2. RevenueCat (In-App Purchases)
- [ ] Subscription screen loads available packages
- [ ] Purchase flow works (use sandbox/test accounts)
- [ ] Subscription status syncs correctly
- [ ] Restore purchases works
- [ ] Trial period tracking works
- [ ] Premium features unlock after purchase

**Test Steps:**
1. Go to Settings > Subscription
2. Verify packages load (Plus Monthly, Family Monthly)
3. Attempt purchase with test account
4. Verify tier updates in app
5. Test "Restore Purchases" button

### 3. Location Services (expo-location)
- [ ] Weather-based activity suggestions work
- [ ] Location permission prompt appears
- [ ] Current weather displays correctly

### 4. Clipboard (@react-native-clipboard/clipboard)
- [ ] Family invite code copy works on Family screen
- [ ] Share functionality works

### 5. Network Detection (@react-native-community/netinfo)
- [ ] Offline mode detection works
- [ ] Offline banner shows when disconnected
- [ ] Data syncs when reconnected

### 6. Print & Share (expo-print, expo-sharing)
- [ ] Activity sharing works
- [ ] PDF export works (if implemented)

### 7. Deep Linking (expo-linking)
- [ ] Social sharing links work
- [ ] App opens from shared links

---

## Recent Changes (Pre-Build)

### Unified Saved Activities Screen
- [x] Created `SavedActivitiesScreen.js` with 3 tabs:
  - Liked (from swipe history)
  - Favorites (explicitly starred)
  - Scheduled (upcoming activities)
- [x] Replaced separate History and Favorites screens
- [x] Updated navigation (AppNavigator.js)
- [x] Updated FABMenu with "Saved" option
- [x] Updated ProfileScreen menu

### Scheduling Improvements
- [x] Added schedule buttons to AcceptedActivitiesScreen
- [x] Expanded time slots (8 options instead of 4)
- [x] Added "already scheduled" badges
- [x] Added `onScheduled` callback to ScheduleActivityModal

### Notification Feedback
- [x] Added user feedback alerts when enabling notifications
- [x] Shows specific error message if module unavailable

---

## Known Issues

1. **Firebase Deprecation Warnings** - React Native Firebase namespaced API warnings
   - Not blocking, but should migrate to modular API eventually
   - See: https://rnfirebase.io/migrating-to-v22

2. **RevenueCat Test Keys** - Currently using test API keys
   - Must replace before production release

---

## Files Modified in This Session

- `src/screens/SavedActivitiesScreen.js` (NEW)
- `src/screens/ScheduleScreen.js`
- `src/screens/AcceptedActivitiesScreen.js`
- `src/screens/ProfileScreen.js`
- `src/navigation/AppNavigator.js`
- `src/components/ui/FABMenu.js`
- `src/components/ui/ScheduleActivityModal.js`
- `src/context/SchedulerContext.js`
- `src/screens/index.js`
- `src/components/index.js`

---

## Contact / Resources

- RevenueCat Dashboard: https://app.revenuecat.com
- Expo Documentation: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- Firebase Console: https://console.firebase.google.com

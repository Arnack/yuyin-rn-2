# Subscription Setup Guide

This guide will help you set up in-app subscriptions for your YuYin app on both Google Play Store and Apple App Store.

## Overview

The subscription system uses:
- **react-native-iap** for handling in-app purchases
- **Supabase** for subscription management and validation
- **Platform-specific** subscription products in Google Play Console and App Store Connect

## Prerequisites

Before you begin, ensure you have:
- Developer accounts on both Google Play Console and App Store Connect
- Your app uploaded to both platforms (at least in internal testing)
- Supabase database set up with the subscription schema

## Table of Contents

1. [Google Play Console Setup](#google-play-console-setup)
2. [App Store Connect Setup](#app-store-connect-setup)
3. [Environment Variables](#environment-variables)
4. [Testing Subscriptions](#testing-subscriptions)
5. [Production Considerations](#production-considerations)

## Google Play Console Setup

### 1. Create Subscription Products

1. **Navigate to Google Play Console**
   - Go to [Google Play Console](https://play.google.com/console)
   - Select your app

2. **Create Subscription Products**
   - Go to **Monetization** → **Products** → **Subscriptions**
   - Click **Create subscription**

3. **Configure Monthly Subscription**
   - **Product ID**: `premium_monthly`
   - **Name**: `Premium Monthly`
   - **Description**: `Access to all premium features`
   - **Price**: Set your desired price (e.g., $9.99)
   - **Billing period**: `1 month`
   - **Free trial**: Optional (e.g., 7 days)
   - **Grace period**: Recommended (e.g., 3 days)

4. **Configure Yearly Subscription**
   - **Product ID**: `premium_yearly`
   - **Name**: `Premium Yearly`
   - **Description**: `Best value - Save 40%!`
   - **Price**: Set your desired price (e.g., $59.99)
   - **Billing period**: `1 year`
   - **Free trial**: Optional (e.g., 7 days)
   - **Grace period**: Recommended (e.g., 3 days)

5. **Activate Products**
   - Make sure both products are **Active**
   - Save all changes

### 2. Set Up Play Console Service Account

1. **Create Service Account**
   - Go to **Setup** → **API access**
   - Click **Create new service account**
   - Follow the Google Cloud Console setup
   - Grant **Finance** permissions

2. **Download Service Account Key**
   - Download the JSON key file
   - Store it securely (needed for server-side validation)

### 3. Configure Real-Time Developer Notifications (Optional)

1. **Set up Cloud Pub/Sub**
   - Create a Pub/Sub topic in Google Cloud Console
   - Configure subscription endpoint in your backend

2. **Enable Real-Time Notifications**
   - Go to **Monetization** → **Monetization setup**
   - Enable **Real-time developer notifications**
   - Set your Pub/Sub topic

## App Store Connect Setup

### 1. Create Subscription Products

1. **Navigate to App Store Connect**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Select your app

2. **Create Subscription Group**
   - Go to **Features** → **In-App Purchases**
   - Click **Manage** next to **Auto-Renewable Subscriptions**
   - Click **Create Subscription Group**
   - **Reference Name**: `Premium Subscriptions`
   - **Group Name**: `Premium Plans`

3. **Create Monthly Subscription**
   - Click **Create Subscription**
   - **Product ID**: `com.yuyin.premium.monthly`
   - **Reference Name**: `Premium Monthly`
   - **Subscription Group**: Select the group you created
   - **Subscription Duration**: `1 Month`
   - **Price**: Set your desired price (e.g., $9.99)
   - **Display Name**: `Premium Monthly`
   - **Description**: `Access to all premium features`

4. **Create Yearly Subscription**
   - Click **Create Subscription**
   - **Product ID**: `com.yuyin.premium.yearly`
   - **Reference Name**: `Premium Yearly`
   - **Subscription Group**: Select the same group
   - **Subscription Duration**: `1 Year`
   - **Price**: Set your desired price (e.g., $59.99)
   - **Display Name**: `Premium Yearly`
   - **Description**: `Best value - Save 40%!`

5. **Configure Subscription Settings**
   - **Free Trial**: Optional (e.g., 7 days)
   - **Introductory Offer**: Optional
   - **Family Sharing**: Choose based on your preference

### 2. Set Up App Store Server Notifications

1. **Configure Server Notifications**
   - Go to **Features** → **In-App Purchases**
   - Click **App Store Server Notifications**
   - Set your server endpoint URL
   - Choose notification version (V2 recommended)

2. **Download Shared Secret**
   - Note down the **Shared Secret** (needed for receipt validation)

### 3. Create Sandbox Test Users

1. **Create Test Users**
   - Go to **Users and Access** → **Sandbox Testers**
   - Click **Add Tester**
   - Create test accounts for different regions

## Environment Variables

Add these environment variables to your `.env` file:

```bash
# iOS Configuration
EXPO_PUBLIC_IOS_SHARED_SECRET=your_ios_shared_secret_here

# Android Configuration (if using server-side validation)
GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PLAY_PRIVATE_KEY=your_service_account_private_key

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing Subscriptions

### Testing on iOS

1. **Use Sandbox Environment**
   - Make sure you're using sandbox testers
   - Sign out of production Apple ID in Settings
   - App will automatically use sandbox environment

2. **Test Subscription Flow**
   - Purchase subscription with test account
   - Verify subscription status in your app
   - Test restoration of purchases

### Testing on Android

1. **Use Internal Testing**
   - Upload your app to internal testing track
   - Add test users to the internal testing group
   - Install app through Play Store testing link

2. **Test Subscription Flow**
   - Purchase subscription with test account
   - Verify subscription status in your app
   - Test various scenarios (cancellation, renewal, etc.)

## Production Considerations

### 1. Receipt Validation

**Important**: The current implementation uses simplified validation. For production, implement server-side validation:

```typescript
// Example server-side validation for iOS
const validateiOSReceipt = async (receiptData: string) => {
  const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': process.env.IOS_SHARED_SECRET,
    }),
  })
  return response.json()
}
```

### 2. Webhook Handling

Set up webhooks to handle:
- Subscription renewals
- Cancellations
- Refunds
- Payment failures

### 3. Database Synchronization

Ensure your database stays in sync with platform subscription status:
- Regular status checks
- Webhook processing
- Grace period handling

### 4. User Experience

- **Clear pricing**: Display prices clearly
- **Terms of service**: Link to your terms and privacy policy
- **Easy cancellation**: Provide clear cancellation instructions
- **Restore purchases**: Always provide a restore option

### 5. Analytics and Monitoring

Track important metrics:
- Subscription conversion rates
- Churn rates
- Revenue metrics
- Failed transactions

## Product ID Configuration

Update the product IDs in your `SubscriptionContext.tsx`:

```typescript
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic_monthly',
    name: 'Premium Monthly',
    description: 'Access to all premium features',
    price: '$9.99',
    currency: 'USD',
    duration: 'monthly',
    features: [
      'Unlimited practice sessions',
      'Advanced tone recognition',
      'Personalized feedback',
      'Offline mode',
      'Progress tracking'
    ],
    productId: Platform.OS === 'ios' ? 'com.yuyin.premium.monthly' : 'premium_monthly'
  },
  {
    id: 'basic_yearly',
    name: 'Premium Yearly',
    description: 'Best value - Save 40%!',
    price: '$59.99',
    currency: 'USD',
    duration: 'yearly',
    features: [
      'All Monthly features',
      'Priority support',
      'Exclusive content',
      'Achievement badges'
    ],
    productId: Platform.OS === 'ios' ? 'com.yuyin.premium.yearly' : 'premium_yearly',
    isPopular: true
  }
]
```

## Common Issues and Solutions

### 1. Products Not Loading

**Issue**: Subscription products not appearing in the app.

**Solutions**:
- Ensure products are active in both stores
- Check product IDs match exactly
- Verify app is signed with correct certificates
- For iOS: Ensure you're using correct bundle ID

### 2. Test Purchases Not Working

**Issue**: Unable to complete test purchases.

**Solutions**:
- Verify test accounts are set up correctly
- Check internet connection
- Ensure app is in testing mode
- Clear app cache and restart

### 3. Subscription Status Not Updating

**Issue**: App doesn't reflect subscription status changes.

**Solutions**:
- Implement proper webhook handling
- Add periodic status checks
- Ensure database is updated correctly
- Check network connectivity

## Support and Resources

- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [App Store In-App Purchase Documentation](https://developer.apple.com/in-app-purchase/)
- [react-native-iap Documentation](https://github.com/dooboolab/react-native-iap)
- [Supabase Documentation](https://supabase.com/docs)

## Next Steps

1. Complete the platform setup following this guide
2. Test thoroughly in sandbox/testing environments
3. Implement proper server-side validation
4. Set up monitoring and analytics
5. Submit for app review (subscriptions require review approval)

Remember to comply with both platform's subscription policies and provide a great user experience for your subscribers! 
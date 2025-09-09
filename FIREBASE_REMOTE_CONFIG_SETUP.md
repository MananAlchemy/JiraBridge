# Firebase Remote Config Setup Guide

This guide explains how to set up Firebase Remote Config for the JiraBridge application to remotely control screenshot duration and other settings.

## Prerequisites

1. A Firebase project
2. Firebase Remote Config enabled in your project
3. The Firebase configuration values for your project

## Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Remote Config in the Firebase Console

### 2. Configure Remote Config Parameters

In the Firebase Console, go to Remote Config and add the following parameters:

| Parameter Name | Default Value | Description |
|----------------|---------------|-------------|
| `screenshot_interval` | `30` | Screenshot capture interval in seconds (5-3600) |
| `screenshot_quality` | `medium` | Screenshot quality: `low`, `medium`, or `high` |
| `max_screenshots` | `50` | Maximum number of screenshots to store (10-1000) |
| `auto_sync_enabled` | `true` | Whether to automatically sync screenshots |
| `notifications_enabled` | `true` | Whether to show notifications |

### 3. Set Up Environment Variables

Add the following environment variables to your `.env` file or production environment:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps" section
3. Click on the web app icon (`</>`) to add a web app
4. Copy the configuration values from the `firebaseConfig` object

### 5. Configure Remote Config Values

1. In Firebase Console, go to Remote Config
2. Add the parameters listed in step 2
3. Set appropriate default values
4. Optionally, set up conditions for different user segments
5. Publish the configuration

## Usage

### Automatic Configuration

The app will automatically:
- Fetch remote config values on startup
- Update settings when remote config changes
- Fall back to default values if Firebase is unavailable
- Refresh config every 5 minutes

### Manual Refresh

Users can manually refresh remote config by:
1. Opening the Settings modal
2. Clicking the "Refresh Remote" button

### Visual Indicators

The Settings modal shows:
- A "Remote" badge next to settings that are controlled by Firebase
- Suggested values from remote config when local settings differ
- A refresh button to manually update remote config

## Configuration Parameters

### screenshot_interval
- **Type**: Number
- **Range**: 5-3600 seconds
- **Default**: 30 seconds
- **Description**: Controls how often screenshots are automatically captured

### screenshot_quality
- **Type**: String
- **Options**: `low`, `medium`, `high`
- **Default**: `medium`
- **Description**: Controls the quality/compression of screenshots

### max_screenshots
- **Type**: Number
- **Range**: 10-1000
- **Default**: 50
- **Description**: Maximum number of screenshots to store locally

### auto_sync_enabled
- **Type**: Boolean
- **Default**: `true`
- **Description**: Whether to automatically sync screenshots to cloud storage

### notifications_enabled
- **Type**: Boolean
- **Default**: `true`
- **Description**: Whether to show system notifications

## Fallback Behavior

If Firebase Remote Config is unavailable:
- The app uses default values defined in the code
- No errors are shown to the user
- The app continues to function normally
- Settings can still be changed manually

## Testing

To test the remote config:

1. Set up Firebase with test values
2. Deploy the app with Firebase configuration
3. Change values in Firebase Console
4. Use the "Refresh Remote" button to fetch new values
5. Verify that settings update accordingly

## Security Considerations

- Firebase API keys are safe to expose in client-side code
- Remote config values are public and should not contain sensitive data
- Use Firebase Security Rules if you need to restrict access to certain config values
- Consider using Firebase App Check for additional security

## Troubleshooting

### Common Issues

1. **Config not updating**: Check if Firebase is properly configured and network is available
2. **Invalid values**: Ensure remote config values are within the expected ranges
3. **Firebase errors**: Check browser console for Firebase-related error messages

### Debug Mode

Enable debug logging by checking the browser console for Firebase-related messages.

## Advanced Configuration

### Conditional Values

You can set up conditions in Firebase Console to provide different values based on:
- User properties
- App version
- Platform
- Custom conditions

### A/B Testing

Use Firebase Remote Config's A/B testing features to gradually roll out changes to screenshot intervals or other settings.

## Support

For issues related to Firebase Remote Config setup, refer to:
- [Firebase Remote Config Documentation](https://firebase.google.com/docs/remote-config)
- [Firebase Console](https://console.firebase.google.com/)
- Application logs and browser console for debugging

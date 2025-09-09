# Firebase Remote Config Test Guide

## ✅ **Implementation Complete**

Your Firebase Remote Config is now fully implemented with the following features:

### 🔄 **Auto-Refresh Every Minute**
- Firebase Remote Config automatically fetches new values every **60 seconds**
- No manual intervention required
- Works in the background while the app is running

### ⚡ **Auto-Apply Changes**
- When `screenshot_interval` changes in Firebase Console, it's **automatically applied**
- The screenshot capture interval **immediately restarts** with the new duration
- All other settings (quality, max screenshots, etc.) are also auto-applied

### 📊 **Visual Feedback**
- Settings modal shows "Remote" badge when using Firebase values
- "Syncing..." indicator when fetching remote config
- Console logs show when intervals change

## 🧪 **How to Test**

### **Step 1: Set Up Firebase Remote Config**
1. Go to [Firebase Console](https://console.firebase.google.com/project/jira-bridge)
2. Navigate to **Remote Config**
3. Add these parameters:

| Parameter | Type | Default Value | Description |
|-----------|------|---------------|-------------|
| `screenshot_interval` | Number | `30` | Screenshot interval in seconds |
| `screenshot_quality` | String | `medium` | Screenshot quality |
| `max_screenshots` | Number | `50` | Max screenshots to store |
| `auto_sync_enabled` | Boolean | `true` | Auto-sync enabled |
| `notifications_enabled` | Boolean | `true` | Notifications enabled |

4. **Publish** the configuration

### **Step 2: Test Auto-Apply**
1. **Start time tracking** in your app
2. **Change `screenshot_interval`** in Firebase Console (e.g., from 30 to 10)
3. **Publish** the change
4. **Wait up to 1 minute** (or click "Refresh Remote" for immediate update)
5. **Observe** the screenshot interval changes automatically
6. **Check console logs** for confirmation

### **Step 3: Test Auto-Refresh**
1. **Change a value** in Firebase Console
2. **Publish** the change
3. **Wait 1 minute** - the app will automatically fetch and apply the new value
4. **No manual refresh needed**

## 📝 **Console Logs to Watch For**

When testing, you should see these logs:

```
📷 Setting up screenshot interval: 30 seconds
[INFO] Screenshot interval updated from Firebase Remote Config: {old: 30, new: 10}
📷 Clearing screenshot interval (30s)
📷 Setting up screenshot interval: 10 seconds
```

## 🎯 **Expected Behavior**

1. **Immediate Application**: When you change `screenshot_interval` in Firebase Console and publish, the app will use the new interval within 1 minute
2. **Automatic Restart**: The screenshot capture timer automatically restarts with the new interval
3. **No App Restart**: Changes apply without needing to restart the app
4. **Fallback Safety**: If Firebase is unavailable, the app uses default values

## 🔧 **Manual Testing Tools**

- **"Test Firebase"** button: Tests Firebase connection
- **"Refresh Remote"** button: Manually fetches latest remote config
- **Console logs**: Show all Firebase operations and interval changes

## 🚀 **Ready to Use**

Your Firebase Remote Config is now fully functional! You can:
- ✅ Control screenshot duration remotely
- ✅ Update settings without app updates
- ✅ A/B test different intervals
- ✅ Roll out changes gradually
- ✅ Monitor changes in real-time

The system will automatically fetch and apply changes every minute, ensuring your users always have the latest configuration.

# Machine ID Feature

This document describes the Machine ID feature that has been added to JiraBridge for identifying unique user machines.

## Overview

The Machine ID feature provides a unique identifier for each user's machine, which can be useful for:
- **Analytics and Usage Tracking**: Understanding how many unique machines are using the application
- **Debugging**: Identifying specific machines when troubleshooting issues
- **Security**: Tracking suspicious activity across different machines
- **Support**: Helping users identify their machine when reporting issues

## Implementation Details

### Backend (Electron Main Process)

The machine ID is retrieved using the `machine-id` npm package, which provides a unique identifier based on the machine's hardware characteristics.

**Location**: `electron/main.js`

```javascript
const machineId = require('machine-id');

// Get and log machine ID on app startup
app.whenReady().then(() => {
  try {
    const id = machineId();
    logger.info('Machine ID:', id);
    console.log('🖥️  Machine ID:', id);
  } catch (error) {
    logger.error('Failed to get machine ID:', error.message);
  }
  // ... rest of initialization
});

// IPC handler for exposing machine ID to renderer
ipcMain.handle('get-machine-id', async () => {
  try {
    const id = machineId();
    logger.info('Machine ID requested via IPC:', id);
    return { success: true, machineId: id };
  } catch (error) {
    logger.error('Failed to get machine ID via IPC:', error.message);
    return { success: false, error: error.message };
  }
});
```

### Frontend (Renderer Process)

The machine ID is exposed to the renderer process through IPC and logged when the app starts.

**Location**: `src/App.tsx`

```typescript
useEffect(() => {
  // Get and log machine ID
  const logMachineId = async () => {
    try {
      if (window.electronAPI && window.electronAPI.getMachineId) {
        const result = await window.electronAPI.getMachineId();
        if (result.success) {
          console.log('🖥️  Machine ID:', result.machineId);
          logger.info('Machine ID retrieved:', result.machineId);
        } else {
          console.error('❌ Failed to get machine ID:', result.error);
          logger.error('Failed to get machine ID:', result.error);
        }
      } else {
        console.log('🖥️  Running in web mode - machine ID not available');
        logger.info('Running in web mode - machine ID not available');
      }
    } catch (error) {
      console.error('❌ Error getting machine ID:', error);
      logger.error('Error getting machine ID:', error);
    }
  };

  logMachineId();
  // ... rest of useEffect
}, []);
```

### IPC Communication

The machine ID is exposed through the preload script for secure communication between main and renderer processes.

**Location**: `electron/preload.js`

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... other APIs
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  // ... other APIs
});
```

## TypeScript Support

The feature includes proper TypeScript definitions for type safety.

**Location**: `electron/types/index.ts`

```typescript
export interface ElectronAPI {
  // ... other methods
  getMachineId: () => Promise<{
    success: boolean;
    machineId?: string;
    error?: string;
  }>;
  // ... other methods
}
```

**Location**: `src/types/index.ts`

```typescript
export interface MachineIdResult {
  success: boolean;
  machineId?: string;
  error?: string;
}
```

## Testing

### Manual Testing

You can test the machine ID functionality using the provided test script:

```bash
npm run test:machine-id
```

This will:
- Retrieve the machine ID
- Verify it's a valid string
- Test consistency across multiple calls
- Display the ID and its properties

### Expected Output

```
🧪 Testing Machine ID Functionality...

📋 Getting machine ID...
✅ Machine ID retrieved successfully!
🖥️  Machine ID: 4d07e62f7c9f7822f3a76f9ad1c085bc
📏 Length: 32 characters
🔍 Type: string

🔄 Testing consistency...
✅ Machine ID is consistent across calls

🎉 Machine ID test completed successfully!
💡 This ID will be logged when the Electron app starts
```

### Application Testing

When you run the application, you should see the machine ID logged in both:

1. **Electron Main Process Console**:
   ```
   [INFO] Machine ID: 4d07e62f7c9f7822f3a76f9ad1c085bc
   🖥️  Machine ID: 4d07e62f7c9f7822f3a76f9ad1c085bc
   ```

2. **Browser DevTools Console**:
   ```
   🖥️  Machine ID: 4d07e62f7c9f7822f3a76f9ad1c085bc
   ```

## Machine ID Characteristics

- **Format**: 32-character hexadecimal string
- **Uniqueness**: Unique per machine (based on hardware characteristics)
- **Consistency**: Same ID returned every time on the same machine
- **Privacy**: No personal information is included in the ID
- **Cross-platform**: Works on Windows, macOS, and Linux

## Security Considerations

- **No Personal Data**: The machine ID does not contain any personal information
- **Hardware-Based**: Generated from machine hardware characteristics
- **Local Only**: The ID is generated locally and not transmitted anywhere by default
- **Consistent**: Same ID is generated each time on the same machine

## Usage Examples

### Getting Machine ID in Frontend

```typescript
// In a React component
const getMachineId = async () => {
  try {
    if (window.electronAPI?.getMachineId) {
      const result = await window.electronAPI.getMachineId();
      if (result.success) {
        console.log('Machine ID:', result.machineId);
        return result.machineId;
      } else {
        console.error('Failed to get machine ID:', result.error);
      }
    }
  } catch (error) {
    console.error('Error getting machine ID:', error);
  }
};
```

### Using Machine ID for Analytics

```typescript
// Example: Send machine ID with analytics data
const sendAnalytics = async (event: string, data: any) => {
  const machineId = await getMachineId();
  
  const analyticsData = {
    event,
    data,
    machineId,
    timestamp: new Date().toISOString(),
    appVersion: process.env.VITE_APP_VERSION
  };
  
  // Send to analytics service
  // Note: Only send if user has consented to analytics
};
```

## Troubleshooting

### Common Issues

1. **Machine ID not available in web mode**
   - **Cause**: Running in browser instead of Electron
   - **Solution**: This is expected behavior; machine ID is only available in Electron

2. **Failed to get machine ID**
   - **Cause**: Permission issues or hardware access problems
   - **Solution**: Check console logs for specific error messages

3. **Inconsistent machine ID**
   - **Cause**: Hardware changes or virtualization issues
   - **Solution**: This is rare but can happen with certain virtualization setups

### Debug Commands

```bash
# Test machine ID functionality
npm run test:machine-id

# Test environment variables
npm run test:env

# Run in development mode to see logs
npm run electron:dev
```

## Future Enhancements

Potential future improvements to the Machine ID feature:

1. **Caching**: Cache the machine ID to avoid repeated generation
2. **Fallback Methods**: Implement fallback methods if primary method fails
3. **User Consent**: Add user consent for machine ID usage
4. **Analytics Integration**: Integrate with analytics services
5. **Support Integration**: Use machine ID in support ticket system

## Dependencies

- **machine-id**: `^1.0.0` - Core package for generating machine IDs
- **electron**: `^38.0.0` - Required for IPC communication
- **typescript**: `^5.5.3` - For type definitions

## Files Modified

- `electron/main.js` - Added machine ID retrieval and IPC handler
- `electron/preload.js` - Exposed machine ID API to renderer
- `electron/types/index.ts` - Added TypeScript definitions
- `src/App.tsx` - Added machine ID logging in frontend
- `src/types/index.ts` - Added MachineIdResult interface
- `package.json` - Added machine-id dependency and test script
- `scripts/test-machine-id.js` - Created test script
- `MACHINE_ID_FEATURE.md` - Created documentation

## Conclusion

The Machine ID feature provides a reliable way to identify unique user machines while maintaining privacy and security. It's implemented with proper error handling, TypeScript support, and comprehensive testing to ensure reliability across different platforms and environments.

# Firebase Firestore Integration Guide

## 🎯 **Overview**

This guide explains the Firebase Firestore database integration for storing user daily time tracking and screenshot time data, organized by user email.

## 📊 **Database Structure**

### **Collections Overview**

| Collection | Description | Document ID Format |
|------------|-------------|-------------------|
| `dailyTimeTracking` | Daily time tracking summaries | `{userEmail}_{YYYY-MM-DD}` |
| `timeTrackingSessions` | Individual time tracking sessions | Auto-generated |
| `screenshotTimeTracking` | Screenshot capture time data | Auto-generated |
| `userProfiles` | User profile and preferences | `{userEmail}` |
| `weeklySummaries` | Weekly time tracking summaries | `{userEmail}_{YYYY-MM-DD}` |
| `monthlySummaries` | Monthly time tracking summaries | `{userEmail}_{YYYY-MM}` |

### **Data Models**

#### **Daily Time Tracking**
```typescript
interface DailyTimeTracking {
  id: string;
  userEmail: string;
  date: string; // YYYY-MM-DD format
  totalTimeSeconds: number;
  totalTimeFormatted: string; // e.g., "2h 30m 15s"
  sessionCount: number;
  screenshotCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### **Time Tracking Session**
```typescript
interface TimeTrackingSession {
  id: string;
  userEmail: string;
  date: string; // YYYY-MM-DD format
  sessionId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  durationSeconds: number;
  durationFormatted: string;
  isActive: boolean;
  jiraTaskKey?: string;
  jiraTaskSummary?: string;
  screenshotIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### **Screenshot Time Tracking**
```typescript
interface ScreenshotTimeTracking {
  id: string;
  userEmail: string;
  date: string; // YYYY-MM-DD format
  screenshotId: string;
  timestamp: Timestamp;
  timeSpentSeconds: number;
  timeSpentFormatted: string;
  sessionId?: string;
  jiraTaskKey?: string;
  jiraTaskSummary?: string;
  screenshotSize: number;
  screenshotQuality: 'low' | 'medium' | 'high';
  synced: boolean;
  createdAt: Timestamp;
}
```

## 🔧 **Implementation Details**

### **Automatic Data Storage**

#### **Time Tracking Integration**
- **Session Start**: Automatically stores new time tracking session in Firestore
- **Session End**: Updates session with end time and duration, stores daily summary
- **Real-time Updates**: Session duration updates every second while tracking

#### **Screenshot Integration**
- **Screenshot Capture**: Automatically stores screenshot time tracking data
- **Time Spent**: Tracks time spent on each screenshot (default: 1 second)
- **Metadata**: Includes screenshot size, quality, and Jira task information

### **User Organization**
- **Email-based**: All data is organized by user email address
- **Privacy**: Each user can only access their own data
- **Scalability**: Supports unlimited users with efficient querying

## 📈 **Data Flow**

### **Daily Time Tracking Flow**
1. User starts time tracking session
2. Session data stored in `timeTrackingSessions` collection
3. Screenshots captured during session
4. Screenshot data stored in `screenshotTimeTracking` collection
5. User stops time tracking session
6. Session updated with end time and duration
7. Daily summary calculated and stored in `dailyTimeTracking` collection

### **Screenshot Time Tracking Flow**
1. Screenshot captured (every X seconds based on Firebase Remote Config)
2. Screenshot metadata stored in `screenshotTimeTracking` collection
3. Time spent on screenshot recorded (1 second default)
4. Associated with current time tracking session if active
5. Linked to Jira task if selected

## 🗂️ **Firestore Collections Structure**

### **dailyTimeTracking**
```
dailyTimeTracking/
├── user1@example.com_2024-01-15/
│   ├── userEmail: "user1@example.com"
│   ├── date: "2024-01-15"
│   ├── totalTimeSeconds: 7200
│   ├── totalTimeFormatted: "2h 0m 0s"
│   ├── sessionCount: 3
│   ├── screenshotCount: 120
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
└── user1@example.com_2024-01-16/
    └── ...
```

### **timeTrackingSessions**
```
timeTrackingSessions/
├── auto-generated-id-1/
│   ├── userEmail: "user1@example.com"
│   ├── date: "2024-01-15"
│   ├── sessionId: "session-123"
│   ├── startTime: Timestamp
│   ├── endTime: Timestamp
│   ├── durationSeconds: 3600
│   ├── durationFormatted: "1h 0m 0s"
│   ├── isActive: false
│   ├── jiraTaskKey: "PROJ-123"
│   ├── jiraTaskSummary: "Fix bug in login"
│   ├── screenshotIds: ["screenshot-1", "screenshot-2"]
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
└── auto-generated-id-2/
    └── ...
```

### **screenshotTimeTracking**
```
screenshotTimeTracking/
├── auto-generated-id-1/
│   ├── userEmail: "user1@example.com"
│   ├── date: "2024-01-15"
│   ├── screenshotId: "screenshot-123"
│   ├── timestamp: Timestamp
│   ├── timeSpentSeconds: 1
│   ├── timeSpentFormatted: "1s"
│   ├── sessionId: "session-123"
│   ├── jiraTaskKey: "PROJ-123"
│   ├── jiraTaskSummary: "Fix bug in login"
│   ├── screenshotSize: 1024000
│   ├── screenshotQuality: "medium"
│   ├── synced: true
│   └── createdAt: Timestamp
└── auto-generated-id-2/
    └── ...
```

## 🔍 **Querying Data**

### **Get User's Daily Data**
```typescript
const dailyData = await firestoreService.getDailyTimeTracking(userEmail, '2024-01-15');
```

### **Get User's Sessions for a Date**
```typescript
const sessions = await firestoreService.getTimeTrackingSessions(userEmail, '2024-01-15');
```

### **Get User's Screenshots for a Date**
```typescript
const screenshots = await firestoreService.getScreenshotTimeTracking(userEmail, '2024-01-15');
```

### **Get All User Data**
```typescript
const allData = await firestoreService.getAllUserTimeTrackingData(userEmail);
```

## 📊 **Analytics Capabilities**

### **Daily Analytics**
- Total time tracked per day
- Number of sessions per day
- Number of screenshots per day
- Average session duration

### **Weekly Analytics**
- Total time tracked per week
- Most active days
- Average daily time
- Session patterns

### **Monthly Analytics**
- Total time tracked per month
- Working days count
- Average daily time
- Productivity trends

## 🔒 **Security Rules**

### **Firestore Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /dailyTimeTracking/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userEmail == request.auth.token.email;
    }
    
    match /timeTrackingSessions/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userEmail == request.auth.token.email;
    }
    
    match /screenshotTimeTracking/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userEmail == request.auth.token.email;
    }
    
    match /userProfiles/{document} {
      allow read, write: if request.auth != null && 
        document == request.auth.token.email;
    }
  }
}
```

## 🚀 **Usage Examples**

### **Store Daily Time Tracking**
```typescript
const { storeDailyTimeTracking } = useFirestore();

await storeDailyTimeTracking({
  userEmail: 'user@example.com',
  date: '2024-01-15',
  totalTimeSeconds: 7200,
  totalTimeFormatted: '2h 0m 0s',
  sessionCount: 3,
  screenshotCount: 120,
});
```

### **Store Time Tracking Session**
```typescript
const { storeTimeTrackingSession } = useFirestore();

await storeTimeTrackingSession({
  userEmail: 'user@example.com',
  date: '2024-01-15',
  sessionId: 'session-123',
  startTime: new Date(),
  durationSeconds: 3600,
  durationFormatted: '1h 0m 0s',
  isActive: false,
  jiraTaskKey: 'PROJ-123',
  jiraTaskSummary: 'Fix bug in login',
  screenshotIds: ['screenshot-1', 'screenshot-2'],
});
```

### **Store Screenshot Time Tracking**
```typescript
const { storeScreenshotTimeTracking } = useFirestore();

await storeScreenshotTimeTracking({
  userEmail: 'user@example.com',
  date: '2024-01-15',
  screenshotId: 'screenshot-123',
  timestamp: new Date(),
  timeSpentSeconds: 1,
  timeSpentFormatted: '1s',
  sessionId: 'session-123',
  jiraTaskKey: 'PROJ-123',
  jiraTaskSummary: 'Fix bug in login',
  screenshotSize: 1024000,
  screenshotQuality: 'medium',
  synced: true,
});
```

## 📱 **Integration Points**

### **Time Tracking Hook**
- Automatically stores session data when starting/stopping tracking
- Updates daily summaries in real-time
- Links sessions to Jira tasks

### **Screenshot Hook**
- Automatically stores screenshot time data on capture
- Tracks time spent on each screenshot
- Associates screenshots with active sessions

### **User Authentication**
- All data is tied to authenticated user email
- Automatic user profile creation and updates
- Secure data access based on user identity

## 🔄 **Data Synchronization**

### **Real-time Updates**
- Local storage for offline functionality
- Firestore for cloud backup and analytics
- Automatic sync when online

### **Conflict Resolution**
- Firestore data takes precedence
- Local data merged with cloud data
- Timestamp-based conflict resolution

## 📈 **Performance Considerations**

### **Optimizations**
- Batch writes for multiple operations
- Efficient indexing on user email and date
- Pagination for large datasets
- Caching frequently accessed data

### **Scalability**
- Horizontal scaling with Firestore
- Efficient querying with composite indexes
- Automatic sharding by user email
- Cost-effective storage and operations

## 🎯 **Benefits**

### **For Users**
- Complete time tracking history
- Detailed productivity analytics
- Cross-device data synchronization
- Secure cloud backup

### **For Administrators**
- User activity monitoring
- Productivity insights
- Usage analytics
- Data export capabilities

### **For Developers**
- Scalable data architecture
- Real-time data updates
- Comprehensive analytics
- Easy integration with existing systems

This Firestore integration provides a robust, scalable solution for storing and analyzing user time tracking and screenshot data, organized efficiently by user email for optimal performance and security.

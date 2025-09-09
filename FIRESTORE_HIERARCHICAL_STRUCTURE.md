# Firebase Firestore Hierarchical Structure

## 🎯 **Overview**

This document describes the new hierarchical Firestore structure for storing user time tracking and screenshot data, organized by user email and date with minute-based updates.

## 📊 **Database Structure**

### **Hierarchical Organization**
```
timetrackingSessions/
├── {userEmail}/
│   ├── {YYYY-MM-DD}/
│   │   ├── daily/
│   │   │   ├── totalTimeSeconds: number
│   │   │   ├── totalTimeFormatted: string
│   │   │   ├── sessionCount: number
│   │   │   ├── screenshotCount: number
│   │   │   ├── lastUpdated: Timestamp
│   │   │   └── tasks: {
│   │   │       ├── {taskKey}: {
│   │   │       │   ├── taskSummary: string
│   │   │       │   ├── project: string
│   │   │       │   ├── timeSpentSeconds: number
│   │   │       │   ├── timeSpentFormatted: string
│   │   │       │   ├── sessionCount: number
│   │   │       │   ├── screenshotCount: number
│   │   │       │   └── lastUpdated: Timestamp
│   │   │       └── ...
│   │   │   }
│   │   └── sessions/
│   │       ├── {sessionId}/
│   │       │   ├── sessionId: string
│   │       │   ├── startTime: Timestamp
│   │       │   ├── endTime?: Timestamp
│   │       │   ├── durationSeconds: number
│   │       │   ├── durationFormatted: string
│   │       │   ├── isActive: boolean
│   │       │   ├── jiraTaskKey?: string
│   │       │   ├── jiraTaskSummary?: string
│   │       │   ├── jiraProject?: string
│   │       │   ├── screenshotIds: string[]
│   │       │   └── lastUpdated: Timestamp
│   │       └── ...
│   └── {YYYY-MM-DD}/
│       └── ...
└── {userEmail}/
    └── ...
```

## 🔄 **Minute-Based Updates**

### **Automatic Time Updates**
- **Every Minute**: Time tracking data is automatically updated in Firestore
- **Real-time Sync**: Local state updates every second, Firestore updates every minute
- **Task-specific Tracking**: Time is tracked per Jira task within daily summaries

### **Update Flow**
1. **Session Start**: Initial session data stored in Firestore
2. **Every Minute**: 
   - Session duration updated
   - Daily total time incremented by 60 seconds
   - Task-specific time updated (if Jira task selected)
3. **Session End**: Final session data and daily summary stored

## 📱 **Data Models**

### **Daily Time Tracking**
```typescript
interface DailyTimeTracking {
  totalTimeSeconds: number;
  totalTimeFormatted: string; // e.g., "2h 30m 15s"
  sessionCount: number;
  screenshotCount: number;
  lastUpdated: Timestamp;
  tasks: {
    [taskKey: string]: {
      taskSummary: string;
      project: string;
      timeSpentSeconds: number;
      timeSpentFormatted: string;
      sessionCount: number;
      screenshotCount: number;
      lastUpdated: Timestamp;
    };
  };
}
```

### **Time Tracking Session**
```typescript
interface TimeTrackingSession {
  sessionId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  durationSeconds: number;
  durationFormatted: string;
  isActive: boolean;
  jiraTaskKey?: string;
  jiraTaskSummary?: string;
  jiraProject?: string;
  screenshotIds: string[];
  lastUpdated: Timestamp;
}
```

## 🎯 **Key Features**

### **Hierarchical Organization**
- **User Email**: Top-level organization by user email
- **Date**: Second-level organization by date (YYYY-MM-DD)
- **Daily Data**: Aggregated daily statistics
- **Sessions**: Individual time tracking sessions
- **Tasks**: Task-specific time tracking within daily data

### **Minute-Based Updates**
- **Automatic Updates**: Every 60 seconds during active tracking
- **Incremental Time**: Adds 60 seconds to daily and task totals
- **Real-time Sync**: Local updates every second, Firestore every minute
- **Efficient Storage**: Reduces Firestore write operations

### **Task-Specific Tracking**
- **Jira Integration**: Links time to specific Jira tasks
- **Project Organization**: Groups tasks by project
- **Detailed Analytics**: Time spent per task, per project
- **Session Counting**: Tracks number of sessions per task

## 🔧 **Implementation Details**

### **Firestore Service Methods**

#### **Store Daily Time Tracking**
```typescript
storeDailyTimeTracking(userEmail: string, date: string, data: DailyTimeTracking)
```
- **Path**: `timetrackingSessions/{userEmail}/{date}/daily`
- **Purpose**: Store/update daily aggregated data

#### **Store Time Tracking Session**
```typescript
storeTimeTrackingSession(userEmail: string, date: string, sessionId: string, data: TimeTrackingSession)
```
- **Path**: `timetrackingSessions/{userEmail}/{date}/sessions/{sessionId}`
- **Purpose**: Store individual session data

#### **Update Time Tracking Session**
```typescript
updateTimeTrackingSession(userEmail: string, date: string, sessionId: string, updates: Partial<TimeTrackingSession>)
```
- **Path**: `timetrackingSessions/{userEmail}/{date}/sessions/{sessionId}`
- **Purpose**: Update existing session data

#### **Update Daily Time Tracking (Minute-based)**
```typescript
updateDailyTimeTracking(userEmail: string, date: string, additionalTimeSeconds: number, taskKey?: string, taskSummary?: string, project?: string)
```
- **Path**: `timetrackingSessions/{userEmail}/{date}/daily`
- **Purpose**: Increment daily and task-specific time

### **React Hook Integration**

#### **useTimeTracking Hook**
- **Minute Timer**: Automatically updates Firestore every minute
- **Session Management**: Stores sessions in hierarchical structure
- **Task Integration**: Links time to selected Jira tasks
- **Real-time Updates**: Local state updates every second

#### **useFirestore Hook**
- **Hierarchical Methods**: Updated to use new structure
- **Minute Updates**: Provides `updateDailyTimeTracking` method
- **Error Handling**: Comprehensive error handling and logging

## 📊 **Data Flow Examples**

### **Example 1: User Starts Tracking**
```
User: john@example.com
Date: 2024-01-15
Task: PROJ-123 "Fix login bug"
Project: "MyProject"

Firestore Path: timetrackingSessions/john@example.com/2024-01-15/sessions/session-123
Data Stored:
- sessionId: "session-123"
- startTime: Timestamp
- isActive: true
- jiraTaskKey: "PROJ-123"
- jiraTaskSummary: "Fix login bug"
- jiraProject: "MyProject"
```

### **Example 2: Minute-Based Update**
```
Every 60 seconds during tracking:

1. Update Session:
   Path: timetrackingSessions/john@example.com/2024-01-15/sessions/session-123
   - durationSeconds: 120 (2 minutes)
   - durationFormatted: "2m 0s"
   - lastUpdated: Timestamp

2. Update Daily Data:
   Path: timetrackingSessions/john@example.com/2024-01-15/daily
   - totalTimeSeconds: 120
   - totalTimeFormatted: "2m 0s"
   - tasks.PROJ-123.timeSpentSeconds: 120
   - tasks.PROJ-123.timeSpentFormatted: "2m 0s"
```

### **Example 3: Session End**
```
When user stops tracking:

1. Update Session:
   - endTime: Timestamp
   - isActive: false
   - final duration

2. Update Daily Summary:
   - total session count
   - total screenshot count
   - final task time totals
```

## 🔒 **Security Rules**

### **Firestore Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own time tracking data
    match /timetrackingSessions/{userEmail}/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.email == userEmail;
    }
  }
}
```

## 📈 **Benefits**

### **Performance**
- **Efficient Queries**: Hierarchical structure enables fast queries
- **Reduced Writes**: Minute-based updates reduce Firestore operations
- **Scalable**: Supports unlimited users and dates

### **Organization**
- **Clear Structure**: Easy to understand and navigate
- **User Isolation**: Each user's data is completely separate
- **Date-based**: Natural organization by time periods

### **Analytics**
- **Daily Summaries**: Aggregated data for each day
- **Task Tracking**: Detailed time per Jira task
- **Project Analytics**: Time spent per project
- **Session History**: Complete session tracking

### **Real-time Updates**
- **Minute Precision**: Updates every minute during tracking
- **Local Sync**: Real-time local updates every second
- **Offline Support**: Local storage with cloud sync

## 🚀 **Usage Examples**

### **Start Time Tracking**
```typescript
const { startTracking } = useTimeTracking(selectedJiraTask);

// Automatically stores in Firestore:
// timetrackingSessions/user@example.com/2024-01-15/sessions/session-123
await startTracking();
```

### **Minute-Based Updates**
```typescript
// Automatically called every minute during tracking
await updateDailyTimeTracking(
  'user@example.com',
  '2024-01-15',
  60, // 1 minute
  'PROJ-123',
  'Fix login bug',
  'MyProject'
);
```

### **Get Daily Data**
```typescript
const dailyData = await firestoreService.getDailyTimeTracking('user@example.com', '2024-01-15');
// Returns: DailyTimeTracking with total time and task breakdowns
```

## 🎯 **Summary**

The new hierarchical Firestore structure provides:

1. **Organized Data**: Clear hierarchy by user email and date
2. **Minute Updates**: Automatic time tracking every minute
3. **Task Integration**: Detailed Jira task time tracking
4. **Efficient Storage**: Optimized for performance and cost
5. **Real-time Sync**: Local updates with cloud synchronization
6. **Scalable Architecture**: Supports unlimited users and data

This structure ensures that all time tracking and screenshot data is properly organized by user email and date, with automatic minute-based updates to Firestore for accurate time tracking and analytics.

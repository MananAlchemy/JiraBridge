import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase.service';
import { logger } from '../utils/logger';
import { 
  DailyTimeTracking, 
  TimeTrackingSession, 
  ScreenshotTimeTracking, 
  WeeklySummary, 
  MonthlySummary, 
  UserProfile 
} from '../types/firestore';

export class FirestoreService {
  private static instance: FirestoreService;

  private constructor() {}

  public static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  /**
   * Store daily time tracking data in hierarchical structure
   * Path: timetrackingSessions/{userEmail}/{date}
   */
  public async storeDailyTimeTracking(userEmail: string, date: string, data: DailyTimeTracking): Promise<boolean> {
    try {
      const docRef = doc(db, 'timetrackingSessions', userEmail, date, 'daily');
      
      // Convert Date objects to Timestamps in tasks
      const dailyData: any = { ...data };
      if (data.lastUpdated && data.lastUpdated instanceof Date) {
        dailyData.lastUpdated = Timestamp.fromDate(data.lastUpdated);
      } else {
        dailyData.lastUpdated = serverTimestamp();
      }

      // Convert timestamps in tasks
      if (data.tasks) {
        dailyData.tasks = {};
        for (const [taskKey, taskData] of Object.entries(data.tasks)) {
          dailyData.tasks[taskKey] = { ...taskData };
          if (taskData.lastUpdated && taskData.lastUpdated instanceof Date) {
            dailyData.tasks[taskKey].lastUpdated = Timestamp.fromDate(taskData.lastUpdated);
          } else {
            dailyData.tasks[taskKey].lastUpdated = serverTimestamp();
          }
        }
      }

      await setDoc(docRef, dailyData);
      logger.info('Daily time tracking data stored successfully', { userEmail, date });
      return true;
    } catch (error) {
      logger.error('Failed to store daily time tracking data:', error);
      return false;
    }
  }

  /**
   * Store time tracking session in hierarchical structure
   * Path: timetrackingSessions/{userEmail}/{date}/sessions/{sessionId}
   */
  public async storeTimeTrackingSession(userEmail: string, date: string, sessionId: string, data: TimeTrackingSession): Promise<boolean> {
    try {
      const docRef = doc(db, 'timetrackingSessions', userEmail, date, 'sessions', sessionId);
      
      // Convert Date objects to Timestamps
      const sessionData: any = { ...data };
      if (data.startTime && data.startTime instanceof Date) {
        sessionData.startTime = Timestamp.fromDate(data.startTime);
      }
      if (data.endTime && data.endTime instanceof Date) {
        sessionData.endTime = Timestamp.fromDate(data.endTime);
      }
      if (data.lastUpdated && data.lastUpdated instanceof Date) {
        sessionData.lastUpdated = Timestamp.fromDate(data.lastUpdated);
      } else {
        sessionData.lastUpdated = serverTimestamp();
      }

      await setDoc(docRef, sessionData);
      logger.info('Time tracking session stored successfully', { userEmail, date, sessionId });
      return true;
    } catch (error) {
      logger.error('Failed to store time tracking session:', error);
      return false;
    }
  }

  /**
   * Store screenshot time tracking data
   */
  public async storeScreenshotTimeTracking(data: Omit<ScreenshotTimeTracking, 'id' | 'createdAt'>): Promise<boolean> {
    try {
      const docRef = doc(collection(db, 'screenshotTimeTracking'));
      
      const screenshotData: ScreenshotTimeTracking = {
        ...data,
        id: docRef.id,
        createdAt: serverTimestamp() as Timestamp,
      };

      await setDoc(docRef, screenshotData);
      logger.info('Screenshot time tracking data stored successfully', { userEmail: data.userEmail, screenshotId: data.screenshotId });
      return true;
    } catch (error) {
      logger.error('Failed to store screenshot time tracking data:', error);
      return false;
    }
  }

  /**
   * Update time tracking session in hierarchical structure
   */
  public async updateTimeTrackingSession(userEmail: string, date: string, sessionId: string, updates: Partial<TimeTrackingSession>): Promise<boolean> {
    try {
      const docRef = doc(db, 'timetrackingSessions', userEmail, date, 'sessions', sessionId);
      
      // Convert Date objects to Timestamps
      const processedUpdates: any = { ...updates };
      if (updates.startTime && updates.startTime instanceof Date) {
        processedUpdates.startTime = Timestamp.fromDate(updates.startTime);
      }
      if (updates.endTime && updates.endTime instanceof Date) {
        processedUpdates.endTime = Timestamp.fromDate(updates.endTime);
      }
      
      await updateDoc(docRef, {
        ...processedUpdates,
        lastUpdated: serverTimestamp(),
      });

      logger.info('Time tracking session updated successfully', { userEmail, date, sessionId });
      return true;
    } catch (error) {
      logger.error('Failed to update time tracking session:', error);
      return false;
    }
  }

  /**
   * Update daily time tracking data every minute
   */
  public async updateDailyTimeTracking(userEmail: string, date: string, additionalTimeSeconds: number, taskKey?: string, taskSummary?: string, project?: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'timetrackingSessions', userEmail, date, 'daily');
      
      // Get current daily data
      const docSnap = await getDoc(docRef);
      let currentData: DailyTimeTracking;
      
      if (docSnap.exists()) {
        currentData = docSnap.data() as DailyTimeTracking;
      } else {
        // Create new daily data
        currentData = {
          totalTimeSeconds: 0,
          totalTimeFormatted: '0s',
          sessionCount: 0,
          screenshotCount: 0,
          lastUpdated: serverTimestamp() as Timestamp,
          tasks: {},
        };
      }

      // Update total time
      currentData.totalTimeSeconds += additionalTimeSeconds;
      currentData.totalTimeFormatted = this.formatTime(currentData.totalTimeSeconds);
      currentData.lastUpdated = serverTimestamp() as Timestamp;

      // Update task-specific time if task is provided
      if (taskKey && taskSummary && project) {
        if (!currentData.tasks[taskKey]) {
          currentData.tasks[taskKey] = {
            taskSummary,
            project,
            timeSpentSeconds: 0,
            timeSpentFormatted: '0s',
            sessionCount: 0,
            screenshotCount: 0,
            lastUpdated: serverTimestamp() as Timestamp,
          };
        }
        
        currentData.tasks[taskKey].timeSpentSeconds += additionalTimeSeconds;
        currentData.tasks[taskKey].timeSpentFormatted = this.formatTime(currentData.tasks[taskKey].timeSpentSeconds);
        currentData.tasks[taskKey].lastUpdated = serverTimestamp() as Timestamp;
      }

      await setDoc(docRef, currentData);
      logger.info('Daily time tracking updated successfully', { userEmail, date, additionalTimeSeconds });
      return true;
    } catch (error) {
      logger.error('Failed to update daily time tracking:', error);
      return false;
    }
  }

  /**
   * Helper method to format time in seconds to readable format
   */
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Get daily time tracking data for a user
   */
  public async getDailyTimeTracking(userEmail: string, date: string): Promise<DailyTimeTracking | null> {
    try {
      const docId = `${userEmail}_${date}`;
      const docRef = doc(db, 'dailyTimeTracking', docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as DailyTimeTracking;
      }
      return null;
    } catch (error) {
      logger.error('Failed to get daily time tracking data:', error);
      return null;
    }
  }

  /**
   * Get time tracking sessions for a user on a specific date
   */
  public async getTimeTrackingSessions(userEmail: string, date: string): Promise<TimeTrackingSession[]> {
    try {
      const q = query(
        collection(db, 'timeTrackingSessions'),
        where('userEmail', '==', userEmail),
        where('date', '==', date),
        orderBy('startTime', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as TimeTrackingSession);
    } catch (error) {
      logger.error('Failed to get time tracking sessions:', error);
      return [];
    }
  }

  /**
   * Get screenshot time tracking data for a user on a specific date
   */
  public async getScreenshotTimeTracking(userEmail: string, date: string): Promise<ScreenshotTimeTracking[]> {
    try {
      const q = query(
        collection(db, 'screenshotTimeTracking'),
        where('userEmail', '==', userEmail),
        where('date', '==', date),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as ScreenshotTimeTracking);
    } catch (error) {
      logger.error('Failed to get screenshot time tracking data:', error);
      return [];
    }
  }

  /**
   * Get user's time tracking data for a date range
   */
  public async getTimeTrackingDataRange(userEmail: string, startDate: string, endDate: string): Promise<{
    dailyData: DailyTimeTracking[];
    sessions: TimeTrackingSession[];
    screenshots: ScreenshotTimeTracking[];
  }> {
    try {
      // Get daily data
      const dailyQuery = query(
        collection(db, 'dailyTimeTracking'),
        where('userEmail', '==', userEmail),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );
      const dailySnapshot = await getDocs(dailyQuery);
      const dailyData = dailySnapshot.docs.map(doc => doc.data() as DailyTimeTracking);

      // Get sessions
      const sessionsQuery = query(
        collection(db, 'timeTrackingSessions'),
        where('userEmail', '==', userEmail),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc'),
        orderBy('startTime', 'asc')
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => doc.data() as TimeTrackingSession);

      // Get screenshots
      const screenshotsQuery = query(
        collection(db, 'screenshotTimeTracking'),
        where('userEmail', '==', userEmail),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc'),
        orderBy('timestamp', 'asc')
      );
      const screenshotsSnapshot = await getDocs(screenshotsQuery);
      const screenshots = screenshotsSnapshot.docs.map(doc => doc.data() as ScreenshotTimeTracking);

      return { dailyData, sessions, screenshots };
    } catch (error) {
      logger.error('Failed to get time tracking data range:', error);
      return { dailyData: [], sessions: [], screenshots: [] };
    }
  }

  /**
   * Store or update user profile
   */
  public async storeUserProfile(data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const docId = data.userEmail;
      const docRef = doc(db, 'userProfiles', docId);
      
      // Check if profile exists
      const docSnap = await getDoc(docRef);
      
      const profileData: UserProfile = {
        ...data,
        id: docId,
        createdAt: docSnap.exists() ? (docSnap.data() as UserProfile).createdAt : serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(docRef, profileData);
      logger.info('User profile stored successfully', { userEmail: data.userEmail });
      return true;
    } catch (error) {
      logger.error('Failed to store user profile:', error);
      return false;
    }
  }

  /**
   * Get user profile
   */
  public async getUserProfile(userEmail: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'userProfiles', userEmail);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Store weekly summary
   */
  public async storeWeeklySummary(data: Omit<WeeklySummary, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const docId = `${data.userEmail}_${data.weekStartDate}`;
      const docRef = doc(db, 'weeklySummaries', docId);
      
      const summaryData: WeeklySummary = {
        ...data,
        id: docId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(docRef, summaryData);
      logger.info('Weekly summary stored successfully', { userEmail: data.userEmail, weekStartDate: data.weekStartDate });
      return true;
    } catch (error) {
      logger.error('Failed to store weekly summary:', error);
      return false;
    }
  }

  /**
   * Store monthly summary
   */
  public async storeMonthlySummary(data: Omit<MonthlySummary, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const docId = `${data.userEmail}_${data.month}`;
      const docRef = doc(db, 'monthlySummaries', docId);
      
      const summaryData: MonthlySummary = {
        ...data,
        id: docId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(docRef, summaryData);
      logger.info('Monthly summary stored successfully', { userEmail: data.userEmail, month: data.month });
      return true;
    } catch (error) {
      logger.error('Failed to store monthly summary:', error);
      return false;
    }
  }

  /**
   * Get all time tracking data for a user (for analytics)
   */
  public async getAllUserTimeTrackingData(userEmail: string): Promise<{
    profile: UserProfile | null;
    dailyData: DailyTimeTracking[];
    sessions: TimeTrackingSession[];
    screenshots: ScreenshotTimeTracking[];
    weeklySummaries: WeeklySummary[];
    monthlySummaries: MonthlySummary[];
  }> {
    try {
      const [profile, dailySnapshot, sessionsSnapshot, screenshotsSnapshot, weeklySnapshot, monthlySnapshot] = await Promise.all([
        this.getUserProfile(userEmail),
        getDocs(query(collection(db, 'dailyTimeTracking'), where('userEmail', '==', userEmail), orderBy('date', 'desc'))),
        getDocs(query(collection(db, 'timeTrackingSessions'), where('userEmail', '==', userEmail), orderBy('startTime', 'desc'))),
        getDocs(query(collection(db, 'screenshotTimeTracking'), where('userEmail', '==', userEmail), orderBy('timestamp', 'desc'))),
        getDocs(query(collection(db, 'weeklySummaries'), where('userEmail', '==', userEmail), orderBy('weekStartDate', 'desc'))),
        getDocs(query(collection(db, 'monthlySummaries'), where('userEmail', '==', userEmail), orderBy('month', 'desc')))
      ]);

      return {
        profile,
        dailyData: dailySnapshot.docs.map(doc => doc.data() as DailyTimeTracking),
        sessions: sessionsSnapshot.docs.map(doc => doc.data() as TimeTrackingSession),
        screenshots: screenshotsSnapshot.docs.map(doc => doc.data() as ScreenshotTimeTracking),
        weeklySummaries: weeklySnapshot.docs.map(doc => doc.data() as WeeklySummary),
        monthlySummaries: monthlySnapshot.docs.map(doc => doc.data() as MonthlySummary),
      };
    } catch (error) {
      logger.error('Failed to get all user time tracking data:', error);
      return {
        profile: null,
        dailyData: [],
        sessions: [],
        screenshots: [],
        weeklySummaries: [],
        monthlySummaries: [],
      };
    }
  }
}

// Export singleton instance
export const firestoreService = FirestoreService.getInstance();

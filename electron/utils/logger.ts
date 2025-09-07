import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private logFile: string;
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
    this.logFile = path.join(app.getPath('userData'), 'app.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    const formattedMessage = this.formatMessage(level, message, ...args);
    
    // Always log to console in development
    if (this.isDev) {
      console.log(formattedMessage);
    }
    
    // Write to file for all levels except DEBUG in production
    if (!this.isDev && level !== LogLevel.DEBUG) {
      this.writeToFile(formattedMessage);
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

export const logger = new Logger();

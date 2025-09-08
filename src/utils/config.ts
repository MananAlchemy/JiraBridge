/**
 * Configuration utility for managing environment variables and app settings
 */
export class Config {
  private static instance: Config;
  
  private constructor() {}
  
  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
  
  private getEnvVar(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue;
  }
  
  // Jira configuration
  public get jira() {
    return {
      adminToken: this.getEnvVar('REACT_APP_JIRA_ADMIN_TOKEN', ''),
      url: this.getEnvVar('REACT_APP_JIRA_URL', 'https://jira.alchemytech.in'),
      debug: this.getEnvVar('REACT_APP_DEBUG_JIRA', 'false') === 'true',
    };
  }
  
  // App configuration
  public get app() {
    return {
      name: 'JiraBridge',
      version: '1.0.0',
      environment: this.getEnvVar('NODE_ENV', 'development'),
      isDevelopment: this.getEnvVar('NODE_ENV', 'development') === 'development',
      isProduction: this.getEnvVar('NODE_ENV', 'development') === 'production',
    };
  }
  
  // Screenshot configuration
  public get screenshot() {
    return {
      defaultQuality: parseInt(this.getEnvVar('REACT_APP_SCREENSHOT_QUALITY', '80')),
      maxThumbnailSize: {
        width: parseInt(this.getEnvVar('REACT_APP_THUMBNAIL_WIDTH', '200')),
        height: parseInt(this.getEnvVar('REACT_APP_THUMBNAIL_HEIGHT', '150')),
      },
      captureInterval: parseInt(this.getEnvVar('REACT_APP_CAPTURE_INTERVAL', '5')),
    };
  }
  
  // AWS configuration (if needed)
  public get aws() {
    return {
      region: this.getEnvVar('REACT_APP_AWS_REGION', 'us-east-1'),
      bucket: this.getEnvVar('REACT_APP_AWS_BUCKET', ''),
      accessKeyId: this.getEnvVar('REACT_APP_AWS_ACCESS_KEY_ID', ''),
      secretAccessKey: this.getEnvVar('REACT_APP_AWS_SECRET_ACCESS_KEY', ''),
    };
  }
}

export const config = Config.getInstance();

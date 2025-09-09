import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';

export interface S3UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = 'ap-south-1';
    this.bucketName = 'alchemy-empmonitor';
    
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: 'AKIA5JSYCXZ5FNXJ7XVD',
        secretAccessKey: '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',
      },
    });
  }

  async uploadScreenshot(
    screenshotId: string,
    dataURL: string,
    filename: string,
    userEmail: string,
    machineId: string,
    jiraKey?: string
  ): Promise<S3UploadResult> {
    try {
      logger.info('Starting S3 upload for screenshot:', { screenshotId, filename });

      // Convert dataURL to buffer - handle both browser and Node.js environments
      const base64Data = dataURL.replace(/^data:image\/[a-z]+;base64,/, '');
      let buffer: Uint8Array;
      
      if (typeof Buffer !== 'undefined') {
        // Node.js environment
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        // Browser environment - convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        buffer = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          buffer[i] = binaryString.charCodeAt(i);
        }
      }

      // Generate S3 key with new format: {user_email}/{node-machine-id}/{yyyy-MM-dd}/{jiraKey}/{HH-mm-ss-SSS}.png
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const jiraKeyPath = jiraKey || 'no-jira-key';
      const key = `${userEmail}/${machineId}/${date}/${jiraKeyPath}/${filename}`;

      // Console log for debugging
      console.log('🔍 S3 Upload Details:', {
        screenshotId,
        userEmail,
        machineId,
        date,
        jiraKey: jiraKeyPath,
        originalFilename: filename,
        s3Key: key,
        s3Path: `s3://${this.bucketName}/${key}`,
        bucketName: this.bucketName,
        region: this.region,
        fileSize: buffer.length
      });

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
        Metadata: {
          screenshotId,
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      
      console.log('✅ S3 Upload Success:', {
        screenshotId,
        s3Url: url,
        s3Key: key,
        s3Path: `s3://${this.bucketName}/${key}`,
        fileSize: buffer.length
      });
      
      logger.info('Screenshot uploaded to S3 successfully:', { 
        screenshotId, 
        key, 
        url,
        size: buffer.length 
      });

      return {
        success: true,
        url,
        key,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to upload screenshot to S3:', { 
        screenshotId, 
        filename, 
        error: errorMessage 
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async uploadScreenshotFromFile(
    screenshotId: string,
    filePath: string,
    filename: string,
    userEmail: string,
    machineId: string,
    jiraKey?: string
  ): Promise<S3UploadResult> {
    try {
      logger.info('Starting S3 upload from file:', { screenshotId, filePath, filename });

      // This method is only for Node.js environment (Electron main process)
      if (typeof window !== 'undefined') {
        throw new Error('uploadScreenshotFromFile is only available in Node.js environment');
      }

      const fs = await import('fs');
      const buffer = await fs.promises.readFile(filePath);

      // Generate S3 key with new format: {user_email}/{node-machine-id}/{yyyy-MM-dd}/{jiraKey}/{HH-mm-ss-SSS}.png
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const jiraKeyPath = jiraKey || 'no-jira-key';
      const key = `${userEmail}/${machineId}/${date}/${jiraKeyPath}/${filename}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
        Metadata: {
          screenshotId,
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      
      logger.info('Screenshot uploaded to S3 successfully from file:', { 
        screenshotId, 
        key, 
        url,
        size: buffer.length 
      });

      return {
        success: true,
        url,
        key,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to upload screenshot to S3 from file:', { 
        screenshotId, 
        filePath, 
        filename, 
        error: errorMessage 
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const s3Service = new S3Service();

// Error handling utility for Jira operations
export class JiraError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly originalError?: Error;
  
  constructor(
    message: string,
    code: string,
    statusCode?: number,
    originalError?: Error
  ) {
    super(message);
    this.name = 'JiraError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  
  private constructor() {}
  
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  // Handle API errors
  public handleApiError(error: any, context: string): JiraError {
    console.error(`Jira API Error in ${context}:`, error);
    
    if (error instanceof JiraError) {
      return error;
    }
    
    // Handle different types of errors
    if (error.response) {
      // HTTP error response
      const statusCode = error.response.status;
      const message = this.getHttpErrorMessage(statusCode, error.response.data);
      return new JiraError(
        message,
        `HTTP_${statusCode}`,
        statusCode,
        error
      );
    } else if (error.request) {
      // Network error
      return new JiraError(
        'Network error: Unable to reach Jira server',
        'NETWORK_ERROR',
        undefined,
        error
      );
    } else {
      // Other errors
      return new JiraError(
        error.message || 'An unexpected error occurred',
        'UNKNOWN_ERROR',
        undefined,
        error
      );
    }
  }
  
  // Get user-friendly error messages
  private getHttpErrorMessage(statusCode: number, responseData?: any): string {
    switch (statusCode) {
      case 401:
        return 'Authentication failed. Please check your credentials.';
      case 403:
        return 'Access denied. You do not have permission to access this resource.';
      case 404:
        return 'Resource not found. The requested Jira resource does not exist.';
      case 429:
        return 'Rate limit exceeded. Please wait before making another request.';
      case 500:
        return 'Jira server error. Please try again later.';
      case 503:
        return 'Jira service unavailable. Please try again later.';
      default:
        return responseData?.errorMessages?.[0] || 
               `HTTP ${statusCode}: An error occurred while communicating with Jira.`;
    }
  }
  
  // Validate Jira configuration
  public validateConfig(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.url) {
      errors.push('Jira URL is required');
    } else if (!this.isValidUrl(config.url)) {
      errors.push('Invalid Jira URL format');
    }
    
    if (!config.token) {
      errors.push('Jira token is required');
    } else if (config.token.length < 10) {
      errors.push('Jira token appears to be invalid');
    }
    
    if (!config.email) {
      errors.push('User email is required');
    } else if (!this.isValidEmail(config.email)) {
      errors.push('Invalid email format');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
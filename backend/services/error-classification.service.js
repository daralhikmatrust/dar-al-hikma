/**
 * Error Classification Service
 * 
 * Classifies errors into categories for proper handling:
 * - CLIENT_ERROR: User/client mistake (4xx)
 * - SERVER_ERROR: Internal server issue (5xx)
 * - EXTERNAL_ERROR: External service failure (Razorpay, etc.)
 * - VALIDATION_ERROR: Input validation failure
 */

export class ErrorClassification {
  static ERROR_TYPES = {
    CLIENT_ERROR: 'CLIENT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    EXTERNAL_ERROR: 'EXTERNAL_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR'
  };

  /**
   * Classify an error and return appropriate HTTP status and user message
   */
  static classify(error) {
    const errorMessage = error.message || String(error);
    const errorCode = error.code || error.name;

    // Validation errors
    if (errorMessage.includes('INVALID_AMOUNT') || 
        errorMessage.includes('MISSING_DONOR_INFO') ||
        errorMessage.includes('INVALID_SIGNATURE')) {
      return {
        type: this.ERROR_TYPES.VALIDATION_ERROR,
        statusCode: 400,
        userMessage: this._getUserMessage(errorMessage),
        internalMessage: errorMessage,
        logLevel: 'warn'
      };
    }

    // Not found errors
    if (errorMessage.includes('NOT_FOUND') || 
        errorMessage.includes('donation_not_found') ||
        errorCode === 'ENOENT') {
      return {
        type: this.ERROR_TYPES.CLIENT_ERROR,
        statusCode: 404,
        userMessage: 'Donation record not found',
        internalMessage: errorMessage,
        logLevel: 'warn'
      };
    }

    // State transition errors
    if (errorMessage.includes('INVALID_STATE_TRANSITION') ||
        errorMessage.includes('Cannot transition')) {
      return {
        type: this.ERROR_TYPES.CLIENT_ERROR,
        statusCode: 400,
        userMessage: 'Invalid donation state. Please contact support.',
        internalMessage: errorMessage,
        logLevel: 'error'
      };
    }

    // Amount mismatch - critical error
    if (errorMessage.includes('AMOUNT_MISMATCH')) {
      return {
        type: this.ERROR_TYPES.EXTERNAL_ERROR,
        statusCode: 500,
        userMessage: 'Payment verification failed. Please contact support.',
        internalMessage: errorMessage,
        logLevel: 'error',
        requiresAlert: true
      };
    }

    // Razorpay errors
    if (errorMessage.includes('RAZORPAY') || 
        errorCode === 'RAZORPAY_ERROR' ||
        errorMessage.includes('Razorpay')) {
      return {
        type: this.ERROR_TYPES.EXTERNAL_ERROR,
        statusCode: 503,
        userMessage: 'Payment service temporarily unavailable. Please try again later.',
        internalMessage: errorMessage,
        logLevel: 'error',
        retryable: true
      };
    }

    // Database errors
    if (errorCode === '23505' || // Unique violation
        errorCode === '23503' || // Foreign key violation
        errorCode === '42P01' || // Table does not exist
        errorCode === 'ECONNREFUSED') {
      return {
        type: this.ERROR_TYPES.SERVER_ERROR,
        statusCode: errorCode === '23505' ? 409 : 503,
        userMessage: errorCode === '23505' 
          ? 'This transaction has already been processed'
          : 'Service temporarily unavailable. Please try again later.',
        internalMessage: errorMessage,
        logLevel: 'error',
        retryable: errorCode !== '23505'
      };
    }

    // Authentication/Authorization
    if (errorMessage.includes('UNAUTHORIZED') || 
        errorMessage.includes('FORBIDDEN') ||
        errorCode === 'UNAUTHORIZED') {
      return {
        type: this.ERROR_TYPES.AUTHENTICATION_ERROR,
        statusCode: 401,
        userMessage: 'Authentication required',
        internalMessage: errorMessage,
        logLevel: 'warn'
      };
    }

    // Default: Server error
    return {
      type: this.ERROR_TYPES.SERVER_ERROR,
      statusCode: 500,
      userMessage: 'An unexpected error occurred. Please try again later.',
      internalMessage: errorMessage,
      logLevel: 'error',
      retryable: false
    };
  }

  /**
   * Get user-friendly error message
   */
  static _getUserMessage(errorMessage) {
    const messages = {
      'INVALID_AMOUNT': 'Invalid donation amount. Please enter a valid amount.',
      'MISSING_DONOR_INFO': 'Donor information is required. Please provide name and email.',
      'INVALID_SIGNATURE': 'Payment verification failed. Please try again.',
      'DONATION_NOT_FOUND': 'Donation record not found.',
      'AMOUNT_MISMATCH': 'Payment amount mismatch. Please contact support.',
      'RAZORPAY_FETCH_ERROR': 'Unable to verify payment. Please contact support.'
    };

    for (const [key, message] of Object.entries(messages)) {
      if (errorMessage.includes(key)) {
        return message;
      }
    }

    return 'An error occurred. Please try again.';
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error) {
    const classification = this.classify(error);
    return classification.retryable === true;
  }

  /**
   * Check if error requires alerting
   */
  static requiresAlert(error) {
    const classification = this.classify(error);
    return classification.requiresAlert === true;
  }
}

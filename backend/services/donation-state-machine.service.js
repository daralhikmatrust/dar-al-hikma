/**
 * Donation State Machine Service
 * 
 * Enforces valid state transitions and prevents invalid operations.
 * States: pending -> processing -> completed | failed | cancelled | refunded
 */

export class DonationStateMachine {
  static VALID_STATES = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  };

  static VALID_TRANSITIONS = {
    [this.VALID_STATES.PENDING]: [
      this.VALID_STATES.PROCESSING,
      this.VALID_STATES.COMPLETED, // Allow direct completion when payment is verified (already captured by Razorpay)
      this.VALID_STATES.FAILED,
      this.VALID_STATES.CANCELLED
    ],
    [this.VALID_STATES.PROCESSING]: [
      this.VALID_STATES.COMPLETED,
      this.VALID_STATES.FAILED,
      this.VALID_STATES.CANCELLED
    ],
    [this.VALID_STATES.COMPLETED]: [
      this.VALID_STATES.REFUNDED
    ],
    [this.VALID_STATES.FAILED]: [
      this.VALID_STATES.PROCESSING
    ],
    [this.VALID_STATES.CANCELLED]: [],
    [this.VALID_STATES.REFUNDED]: []
  };

  /**
   * Check if a state transition is valid
   */
  static canTransition(fromState, toState) {
    if (!this.isValidState(fromState)) {
      return { valid: false, reason: `Invalid source state: ${fromState}` };
    }

    if (!this.isValidState(toState)) {
      return { valid: false, reason: `Invalid target state: ${toState}` };
    }

    const allowedTransitions = this.VALID_TRANSITIONS[fromState] || [];
    const isValid = allowedTransitions.includes(toState);

    return {
      valid: isValid,
      reason: isValid 
        ? null 
        : `Cannot transition from ${fromState} to ${toState}. Allowed: ${allowedTransitions.join(', ')}`
    };
  }

  /**
   * Validate if a state is valid
   */
  static isValidState(state) {
    return Object.values(this.VALID_STATES).includes(state);
  }

  /**
   * Get the next valid states for a given state
   */
  static getNextValidStates(currentState) {
    if (!this.isValidState(currentState)) {
      return [];
    }
    return this.VALID_TRANSITIONS[currentState] || [];
  }

  /**
   * Check if donation can be processed (moved to processing)
   */
  static canProcess(currentState) {
    return this.canTransition(currentState, this.VALID_STATES.PROCESSING);
  }

  /**
   * Check if donation can be completed
   */
  static canComplete(currentState) {
    return this.canTransition(currentState, this.VALID_STATES.COMPLETED);
  }

  /**
   * Check if donation can be marked as failed
   */
  static canFail(currentState) {
    return this.canTransition(currentState, this.VALID_STATES.FAILED);
  }

  /**
   * Check if donation is in a terminal state (cannot be changed)
   */
  static isTerminalState(state) {
    return [
      this.VALID_STATES.COMPLETED,
      this.VALID_STATES.CANCELLED,
      this.VALID_STATES.REFUNDED
    ].includes(state);
  }

  /**
   * Check if donation is in a mutable state (can be changed)
   */
  static isMutableState(state) {
    return !this.isTerminalState(state);
  }
}

/**
 * Get the correct payment time for display
 * 
 * For completed payments: Uses payment capture time from Razorpay (if available)
 * For pending/other statuses: Uses order creation time
 * 
 * @param {Object} donation - Donation object
 * @returns {Date} - Date object representing the payment time
 */
export const getPaymentTime = (donation) => {
  // For completed payments, use payment capture time from Razorpay if available
  if (donation.status === 'completed') {
    // First priority: payment_captured_at from metadata (Razorpay payment capture time)
    if (donation.metadata?.payment_captured_at) {
      return new Date(donation.metadata.payment_captured_at);
    }
    
    // Second priority: statusChangedAt (when payment was verified)
    if (donation.statusChangedAt) {
      return new Date(donation.statusChangedAt);
    }
    
    // Third priority: updatedAt (last update time)
    if (donation.updatedAt || donation.updated_at) {
      return new Date(donation.updatedAt || donation.updated_at);
    }
  }
  
  // For pending/other statuses, use order creation time
  return new Date(donation.createdAt || donation.created_at);
};

/**
 * Format payment time for display
 * 
 * @param {Object} donation - Donation object
 * @param {Object} options - Formatting options
 * @returns {Object} - Object with date and time strings
 */
export const formatPaymentTime = (donation, options = {}) => {
  const paymentTime = getPaymentTime(donation);
  const {
    includeSeconds = true,
    hour12 = true
  } = options;
  
  return {
    date: paymentTime.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    time: paymentTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: hour12
    }),
    dateTime: paymentTime.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: hour12
    })
  };
};

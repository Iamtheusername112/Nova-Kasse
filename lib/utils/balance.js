/**
 * Utility functions for calculating account balance
 */

/**
 * Calculate current account balance from transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {number} Current account balance (never negative)
 */
export function calculateBalance(transactions) {
  const startingBalance = 0.00; // All accounts start at $0.00
  
  if (!transactions || transactions.length === 0) {
    return startingBalance;
  }

  // Sum all transaction amounts
  // Credits (deposits, income) are positive
  // Debits (withdrawals, transfers, payments) are negative
  // Only COMPLETED transactions affect the balance
  // Pending, failed, and cancelled transactions are EXCLUDED
  const totalBalance = transactions.reduce((sum, t) => {
    const amount = parseFloat(t.amount || 0);
    // Only include completed transactions - exclude pending, failed, and cancelled
    if (t.status !== 'completed') {
      return sum; // Skip non-completed transactions
    }
    // Include completed transactions
    return sum + amount;
  }, startingBalance);
  
  // Ensure balance never goes below $0.00
  return Math.max(0, totalBalance);
}

/**
 * Check if user has sufficient balance for a transaction
 * @param {Array} transactions - Array of transaction objects
 * @param {number} amount - Amount to check (should be positive for debit transactions)
 * @returns {boolean} True if balance is sufficient
 */
export function hasSufficientBalance(transactions, amount) {
  const currentBalance = calculateBalance(transactions);
  return currentBalance >= amount;
}

/**
 * Calculate balance after a potential transaction
 * @param {Array} transactions - Array of transaction objects
 * @param {number} transactionAmount - Amount of the transaction (positive for credits, negative for debits)
 * @returns {number} Balance after transaction
 */
export function calculateBalanceAfter(transactions, transactionAmount) {
  const currentBalance = calculateBalance(transactions);
  const newBalance = currentBalance + transactionAmount;
  return Math.max(0, newBalance);
}


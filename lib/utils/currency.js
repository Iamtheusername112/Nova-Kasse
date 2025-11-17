/**
 * Currency utility functions
 */

/**
 * Get currency symbol for a currency code
 * @param {string} currency - Currency code (USD, EUR, AUD)
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currency = 'USD') {
  const symbols = {
    USD: '$',
    EUR: '€',
    AUD: 'A$'
  };
  return symbols[currency] || '$';
}

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (USD, EUR, AUD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  const numAmount = parseFloat(amount) || 0;
  
  const currencyMap = {
    USD: 'en-US',
    EUR: 'de-DE', // German locale uses € symbol
    AUD: 'en-AU'
  };

  const locale = currencyMap[currency] || 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
}

/**
 * Get currency name
 * @param {string} currency - Currency code
 * @returns {string} Currency name
 */
export function getCurrencyName(currency = 'USD') {
  const names = {
    USD: 'US Dollar',
    EUR: 'Euro',
    AUD: 'Australian Dollar'
  };
  return names[currency] || 'US Dollar';
}


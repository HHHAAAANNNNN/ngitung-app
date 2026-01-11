// src/utils/currency.ts

/**
 * Format number to Indonesian currency format (10.000,00)
 * @param value - Number or string to format
 * @param includeDecimal - Whether to include decimal places (default: false)
 * @returns Formatted string
 */
export const formatCurrency = (value: number | string, includeDecimal: boolean = false): string => {
  if (!value && value !== 0) return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  
  if (isNaN(numValue)) return '';
  
  const parts = numValue.toFixed(includeDecimal ? 2 : 0).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  if (includeDecimal && parts[1]) {
    return `${integerPart},${parts[1]}`;
  }
  
  return integerPart;
};

/**
 * Parse Indonesian currency format back to number
 * @param value - Formatted currency string (10.000,00)
 * @returns Number value
 */
export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove thousand separators (.) and replace decimal comma (,) with dot
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format input as user types for currency fields
 * @param value - Current input value
 * @returns Formatted string
 */
export const formatCurrencyInput = (value: string): string => {
  // Remove all non-numeric characters except comma
  const cleaned = value.replace(/[^\d,]/g, '');
  
  // Split by comma to handle decimal
  const parts = cleaned.split(',');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Format integer part with thousand separators
  const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Rejoin with decimal if exists
  if (decimalPart !== undefined) {
    return `${formatted},${decimalPart.substring(0, 2)}`;
  }
  
  return formatted;
};

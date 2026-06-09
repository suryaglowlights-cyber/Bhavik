// ========================================
// Margin Calculator Utility
// ========================================

export interface MarginConfig {
  type: 'percentage' | 'fixed';
  value: number;
  applySurcharge?: boolean;
  surchargeAmount?: number;
}

/**
 * Calculate retail price from cost with margin
 * @param cost Base supplier cost
 * @param margin Margin configuration
 * @returns Retail price
 */
export function calculateRetailPrice(cost: number, margin: MarginConfig): number {
  let retailPrice: number;

  if (margin.type === 'percentage') {
    // Percentage markup: cost * (1 + margin/100)
    retailPrice = cost * (1 + margin.value / 100);
  } else {
    // Fixed amount markup: cost + margin amount
    retailPrice = cost + margin.value;
  }

  // Add surcharge if applicable (e.g., payment gateway fees)
  if (margin.applySurcharge && margin.surchargeAmount) {
    retailPrice += margin.surchargeAmount;
  }

  // Round to 2 decimals
  return Math.round(retailPrice * 100) / 100;
}

/**
 * Calculate profit from cost and retail price
 * @param cost Base supplier cost
 * @param retailPrice Final selling price
 * @returns Profit amount and percentage
 */
export function calculateProfit(cost: number, retailPrice: number): {
  amount: number;
  percentage: number;
} {
  const profit = retailPrice - cost;
  const percentage = (profit / cost) * 100;

  return {
    amount: Math.round(profit * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Get margin configuration from localStorage or use default
 * @returns Stored margin config or default 30% markup
 */
export function getMarginConfig(): MarginConfig {
  try {
    const stored = localStorage.getItem('dropshipping:margin:config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to parse margin config from localStorage', error);
  }

  return {
    type: 'percentage',
    value: 30, // Default 30% margin
    applySurcharge: false,
  };
}

/**
 * Save margin configuration to localStorage
 */
export function saveMarginConfig(config: MarginConfig): void {
  localStorage.setItem('dropshipping:margin:config', JSON.stringify(config));
}

/**
 * Calculate bulk pricing with tiered margins
 * @param cost Base cost
 * @param quantity Quantity ordered
 * @param margins Tiered margin config
 */
export function calculateBulkPrice(
  cost: number,
  quantity: number,
  margins: Array<{ minQty: number; margin: MarginConfig }>
): number {
  // Find applicable margin based on quantity
  const applicableMargin = margins
    .filter(m => quantity >= m.minQty)
    .sort((a, b) => b.minQty - a.minQty)[0];

  if (!applicableMargin) {
    return cost; // No margin if quantity threshold not met
  }

  return calculateRetailPrice(cost, applicableMargin.margin);
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = 'INR'): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(price);
}

/**
 * Calculate cart total with margins applied
 */
export function calculateCartTotal(
  items: Array<{ cost: number; quantity: number }>,
  margin: MarginConfig
): { subtotal: number; margin: number; total: number } {
  let subtotal = 0;
  let marginAmount = 0;

  for (const item of items) {
    const cost = item.cost * item.quantity;
    const retail = calculateRetailPrice(item.cost, margin) * item.quantity;

    subtotal += cost;
    marginAmount += retail - cost;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    margin: Math.round(marginAmount * 100) / 100,
    total: Math.round((subtotal + marginAmount) * 100) / 100,
  };
}

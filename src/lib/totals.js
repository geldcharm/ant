import { getTaxRate } from '../constants/tax';

export function calcLineAmount(item) {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const discount = parseFloat(item.discountPercent) || 0;
  const subtotal = qty * price;
  return subtotal - (subtotal * discount) / 100;
}

export function calcTotals(items) {
  let subtotal = 0;
  let gstAmount = 0;
  for (const item of items) {
    const amount = item.amount || 0;
    subtotal += amount;
    gstAmount += amount * (getTaxRate(item.tax) / 100);
  }
  return { subtotal, gstAmount, total: subtotal + gstAmount };
}

export function recalcItem(item) {
  return { ...item, amount: calcLineAmount(item) };
}

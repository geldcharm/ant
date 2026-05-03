export const TAX_OPTIONS = [
  { label: 'GST (15%)', rate: 15 },
  { label: 'GST (10%)', rate: 10 },
  { label: 'No Tax (0%)', rate: 0 },
];

export const DEFAULT_TAX_LABEL = 'GST (15%)';

export function getTaxRate(label) {
  return TAX_OPTIONS.find(t => t.label === label)?.rate ?? 0;
}

import { v4 as uuidv4 } from 'uuid';
import { Card } from '../../components/ui/Card';
import { TRADE_TYPES, PAYMENT_TERMS } from '../../constants/trades';
import { calcLineAmount, calcTotals } from '../../lib/totals';
import { ClientAddressFields, BusinessAddressFields } from './AddressFields';
import { LineItemsTable } from './LineItemsTable';
import { TotalsSummary } from './TotalsSummary';
import { LogoField } from './LogoField';
import { DEFAULT_TAX_LABEL } from '../../constants/tax';

const FIELD_CLASS = 'w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]';
const LABEL_CLASS = 'text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide';

export function emptyLineItem() {
  return {
    id: uuidv4(),
    item: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    tax: DEFAULT_TAX_LABEL,
    amount: 0,
  };
}

// Shared body for the QuoteForm and InvoiceForm. The two forms only differ in
// title, status palette, date labels, and the "trade/licence" row (quote-only).
export function BillingDocumentForm({
  title,
  numberLabel,
  numberValue,
  numberError,
  onNumberChange,
  dateLabel,
  dateValue,
  onDateChange,
  expiryLabel,
  expiryValue,
  onExpiryChange,
  status,
  statusOptions,
  onStatusChange,
  showTradeFields = false,
  tradeType,
  licenceNo,
  onTradeChange,
  onLicenceChange,
  client,
  business,
  onClientChange,
  onBusinessChange,
  clientError,
  items,
  onItemsChange,
  totals,
  notes,
  onNotesChange,
  paymentTerms,
  onPaymentTermsChange,
  bank,
  onBankChange,
  logo,
  onLogoChange,
  onLogoError,
  notesPlaceholder = '',
}) {
  function handleItemUpdate(itemId, field, value) {
    const updatedItems = items.map(item => {
      if (item.id !== itemId) return item;
      const next = { ...item, [field]: value };
      next.amount = calcLineAmount(next);
      return next;
    });
    onItemsChange(updatedItems, calcTotals(updatedItems));
  }

  function handleAddItem() {
    onItemsChange([...items, emptyLineItem()]);
  }

  function handleRemoveItem(itemId) {
    let updated = items.filter(i => i.id !== itemId);
    if (updated.length === 0) updated = [emptyLineItem()];
    onItemsChange(updated, calcTotals(updated));
  }

  return (
    <Card className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <LogoField value={logo} onChange={onLogoChange} onError={onLogoError} />
        <select
          value={status.value}
          onChange={e => onStatusChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-xs font-bold appearance-none cursor-pointer focus:outline-none"
          style={{ color: status.color, background: status.bg, borderColor: status.color + '30' }}
          aria-label="Status"
        >
          {statusOptions.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <h2 className="text-3xl font-black text-[#1A1A18] tracking-tight">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ClientAddressFields values={client} onChange={onClientChange} error={clientError} />

        <div className="space-y-3">
          <div>
            <label className={LABEL_CLASS}>{dateLabel}</label>
            <input type="date" value={dateValue} onChange={e => onDateChange(e.target.value)} className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>{expiryLabel}</label>
            <input type="date" value={expiryValue} onChange={e => onExpiryChange(e.target.value)} className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>{numberLabel}</label>
            <input
              value={numberValue}
              onChange={e => onNumberChange(e.target.value)}
              className={`${FIELD_CLASS} font-semibold ${numberError ? 'border-red-400' : ''}`}
            />
            {numberError && <p className="text-[10px] text-red-500 mt-1">{numberError}</p>}
          </div>
        </div>

        <BusinessAddressFields values={business} onChange={onBusinessChange} />
      </div>

      {showTradeFields && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={LABEL_CLASS}>Trade type</label>
            <select
              value={tradeType}
              onChange={e => onTradeChange(e.target.value)}
              className={`${FIELD_CLASS} cursor-pointer appearance-none`}
            >
              <option value="">Select trade...</option>
              {TRADE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Licence no.</label>
            <input
              placeholder="e.g. PL XXXXX"
              value={licenceNo}
              onChange={e => onLicenceChange(e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
        </div>
      )}

      <LineItemsTable
        items={items}
        onUpdate={handleItemUpdate}
        onAdd={handleAddItem}
        onRemove={handleRemoveItem}
      />

      <TotalsSummary subtotal={totals.subtotal} gstAmount={totals.gstAmount} total={totals.total} />

      <div className="border-t border-[#E0DED8] pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`${LABEL_CLASS} block mb-1.5`}>Terms & Notes</label>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            rows={4}
            placeholder={notesPlaceholder}
            className="w-full px-3 py-2.5 rounded-xl border border-dashed border-[#E0DED8] bg-transparent text-sm outline-none focus:border-[#E8611A] transition-colors placeholder:text-[#9E9E98] placeholder:italic resize-none"
          />
        </div>
        <div className="space-y-3">
          <div>
            <label className={LABEL_CLASS}>Payment Terms</label>
            <select
              value={paymentTerms}
              onChange={e => onPaymentTermsChange(e.target.value)}
              className={`${FIELD_CLASS} cursor-pointer appearance-none`}
            >
              {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={`${LABEL_CLASS} block mb-1`}>Bank Details</label>
            <input placeholder="Bank name" value={bank.bankName} onChange={e => onBankChange('bankName', e.target.value)} className={FIELD_CLASS} />
            <input placeholder="BSB" value={bank.bankBsb} onChange={e => onBankChange('bankBsb', e.target.value)} className={`${FIELD_CLASS} mt-1`} />
            <input placeholder="Account number" value={bank.bankAccount} onChange={e => onBankChange('bankAccount', e.target.value)} className={`${FIELD_CLASS} mt-1`} />
          </div>
        </div>
      </div>
    </Card>
  );
}

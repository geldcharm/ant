import { TAX_OPTIONS } from '../../constants/tax';
import { formatAmount } from '../../lib/currency';

const GRID = 'grid-cols-[100px_1fr_55px_80px_55px_90px_80px_28px]';
const HEADER_CLASS = `hidden sm:grid ${GRID} gap-1.5 text-[9px] font-bold text-[#6B6B66] uppercase tracking-wider mb-2 px-1`;
const ROW_CLASS = `hidden sm:grid ${GRID} gap-1.5 items-center mb-2`;
const FIELD_CLASS = 'w-full px-2 py-1.5 border-b border-dashed border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]';
const NUMERIC_CLASS = 'w-full px-1 py-1.5 border-b border-dashed border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent';

export function LineItemsTable({ items, onUpdate, onAdd, onRemove }) {
  return (
    <div className="border-t border-[#E0DED8] pt-4">
      <div className={HEADER_CLASS}>
        <span>Item</span>
        <span>Description</span>
        <span>Qty</span>
        <span>Unit Price</span>
        <span>Disc %</span>
        <span>Tax</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {items.map((item, idx) => (
        <LineItemRow
          key={item.id}
          item={item}
          index={idx}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}

      <button onClick={onAdd} className="text-sm text-[#E8611A] font-medium mt-2 hover:underline">
        + Add a line
      </button>
    </div>
  );
}

function LineItemRow({ item, index, onUpdate, onRemove }) {
  const update = (field, value) => onUpdate(item.id, field, value);
  return (
    <div>
      {/* Desktop row */}
      <div className={ROW_CLASS}>
        <input
          placeholder="e.g. Labour"
          value={item.item}
          onChange={e => update('item', e.target.value)}
          className={FIELD_CLASS}
        />
        <input
          value={item.description}
          onChange={e => update('description', e.target.value)}
          className={FIELD_CLASS}
        />
        <input
          type="number" min="0" step="any"
          value={item.quantity}
          onChange={e => update('quantity', e.target.value)}
          className={`${NUMERIC_CLASS} text-center`}
        />
        <input
          type="number" min="0" step="any" placeholder="0.00"
          value={item.unitPrice}
          onChange={e => update('unitPrice', e.target.value)}
          className={`${NUMERIC_CLASS} text-right`}
        />
        <input
          type="number" min="0" max="100" step="any"
          value={item.discountPercent}
          onChange={e => update('discountPercent', e.target.value)}
          className={`${NUMERIC_CLASS} text-center`}
        />
        <select
          value={item.tax}
          onChange={e => update('tax', e.target.value)}
          className="w-full px-0 py-1.5 border-b border-dashed border-[#E0DED8] text-[11px] outline-none focus:border-[#E8611A] transition-colors bg-transparent appearance-none cursor-pointer"
        >
          {TAX_OPTIONS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
        </select>
        <p className="text-sm font-semibold text-right text-[#1A1A18] pr-1">${formatAmount(item.amount)}</p>
        <button
          onClick={() => onRemove(item.id)}
          aria-label={`Remove line ${index + 1}`}
          className="w-7 h-7 rounded-lg text-[#9E9E98] hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors text-xs"
        >
          ✕
        </button>
      </div>

      {/* Mobile card */}
      <MobileCard item={item} index={index} update={update} onRemove={onRemove} />
    </div>
  );
}

function MobileCard({ item, index, update, onRemove }) {
  const labelClass = 'text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide block mb-1';
  const inputClass = 'w-full px-3 py-2 rounded-lg border border-[#E0DED8] bg-white text-sm outline-none focus:border-[#E8611A]';
  return (
    <div className="sm:hidden mb-4 p-3 rounded-xl border border-[#E0DED8] bg-[#F9F8F5] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#6B6B66]">Line {index + 1}</span>
        <button onClick={() => onRemove(item.id)} className="text-xs text-[#9E9E98] hover:text-red-500">✕ Remove</button>
      </div>
      <div>
        <label className={labelClass}>Item</label>
        <input
          placeholder="e.g. Labour"
          value={item.item}
          onChange={e => update('item', e.target.value)}
          className={`${inputClass} placeholder:text-[#9E9E98]`}
        />
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <input
          value={item.description}
          onChange={e => update('description', e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Qty</label>
          <input
            type="number" min="0" step="any"
            value={item.quantity}
            onChange={e => update('quantity', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Unit Price</label>
          <input
            type="number" min="0" step="any" placeholder="0.00"
            value={item.unitPrice}
            onChange={e => update('unitPrice', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Discount %</label>
          <input
            type="number" min="0" max="100" step="any"
            value={item.discountPercent}
            onChange={e => update('discountPercent', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tax</label>
          <select
            value={item.tax}
            onChange={e => update('tax', e.target.value)}
            className={`${inputClass} appearance-none`}
          >
            {TAX_OPTIONS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-[#E0DED8]">
        <span className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide">Amount</span>
        <span className="text-sm font-semibold text-[#1A1A18]">${formatAmount(item.amount)}</span>
      </div>
    </div>
  );
}

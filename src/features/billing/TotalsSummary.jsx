import { LOCALE } from '../../config/business';
import { formatAmount } from '../../lib/currency';

export function TotalsSummary({ subtotal, gstAmount, total }) {
  return (
    <div className="flex justify-end">
      <div className="w-64 space-y-2 border-t border-[#E0DED8] pt-3">
        <Row label="Subtotal" value={subtotal} accent />
        <Row label="GST"      value={gstAmount} accent />
        <div className="flex justify-between text-base font-bold pt-2 border-t border-[#E0DED8]">
          <span>Total {LOCALE.currencyCode}</span>
          <span>${formatAmount(total)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#6B6B66]">{label}</span>
      <span className={`font-semibold ${accent ? 'text-[#E8611A]' : 'text-[#1A1A18]'}`}>${formatAmount(value)}</span>
    </div>
  );
}

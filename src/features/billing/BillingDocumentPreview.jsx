import { Card } from '../../components/ui/Card';
import { LOCALE } from '../../config/business';
import { formatDate } from '../../lib/dates';
import { formatAmount } from '../../lib/currency';

const LABEL_CLASS = 'text-[10px] font-bold text-[#9E9E98] uppercase tracking-wide';

// Read-only "document preview" used by QuoteDetail and InvoiceDetail.
export function BillingDocumentPreview({
  doc,
  title,
  status,
  dateLabel,
  expiryLabel,
  expiryValue,
  numberLabel,
  numberValue,
  showTradeFields = false,
  jobLink,
}) {
  return (
    <Card className="p-6 md:p-8 space-y-5">
      <div className="flex items-start justify-between">
        {doc.logo
          ? <img src={doc.logo} alt="Logo" className="h-14 max-w-[140px] object-contain" />
          : <div />}
        <span
          style={{ color: status.color, background: status.bg, border: `1px solid ${status.color}30` }}
          className="px-3 py-1 text-xs rounded-full font-bold"
        >
          {status.label}
        </span>
      </div>

      <h2 className="text-3xl font-black text-[#1A1A18] tracking-tight">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div>
          <p className="font-semibold">{doc.contactName}</p>
          {doc.clientAddress && <p className="text-[#6B6B66]">{doc.clientAddress}</p>}
          {doc.clientSuburb && <p className="text-[#6B6B66]">{doc.clientSuburb}</p>}
          {doc.clientCountry && <p className="text-[#6B6B66]">{doc.clientCountry}</p>}
        </div>
        <div className="space-y-2">
          <div>
            <p className={LABEL_CLASS}>{dateLabel}</p>
            <p>{doc.date ? formatDate(doc.date) : '—'}</p>
          </div>
          <div>
            <p className={LABEL_CLASS}>{expiryLabel}</p>
            <p>{expiryValue ? formatDate(expiryValue) : '—'}</p>
          </div>
          <div>
            <p className={LABEL_CLASS}>{numberLabel}</p>
            <p className="font-semibold">{numberValue}</p>
          </div>
        </div>
        <div className="text-right">
          {doc.businessName && <p className="font-semibold">{doc.businessName}</p>}
          {doc.businessAddress && <p className="text-[#6B6B66]">{doc.businessAddress}</p>}
          {doc.businessSuburb && <p className="text-[#6B6B66]">{doc.businessSuburb}</p>}
          {doc.businessPhone && <p className="text-[#6B6B66]">Phone: {doc.businessPhone}</p>}
          {doc.businessEmail && <p className="text-[#6B6B66]">{doc.businessEmail}</p>}
          {doc.businessAbn && <p className="text-[#6B6B66]">{doc.businessAbn}</p>}
        </div>
      </div>

      {showTradeFields && (doc.tradeType || doc.licenceNo) && (
        <div className="flex gap-8 text-sm">
          {doc.tradeType && (
            <div>
              <p className={LABEL_CLASS}>Trade type</p>
              <p>{doc.tradeType}</p>
            </div>
          )}
          {doc.licenceNo && (
            <div>
              <p className={LABEL_CLASS}>Licence no.</p>
              <p>{doc.licenceNo}</p>
            </div>
          )}
        </div>
      )}

      {jobLink}

      <div className="overflow-x-auto border-t border-[#E0DED8] pt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F5F4F0]">
              <Th align="left">Item</Th>
              <Th align="left">Description</Th>
              <Th align="center">Qty</Th>
              <Th align="right">Unit Price</Th>
              <Th align="center">Disc %</Th>
              <Th align="center">Tax</Th>
              <Th align="right">Amount</Th>
            </tr>
          </thead>
          <tbody>
            {doc.items?.map(item => (
              <tr key={item.id} className="border-b border-[#F0EFEB]">
                <td className="py-2.5 px-2.5 text-[#1A1A18] font-medium">{item.item}</td>
                <td className="py-2.5 px-2.5 text-[#6B6B66]">{item.description}</td>
                <td className="py-2.5 px-2.5 text-center text-[#6B6B66]">{item.quantity}</td>
                <td className="py-2.5 px-2.5 text-right text-[#6B6B66]">${formatAmount(item.unitPrice)}</td>
                <td className="py-2.5 px-2.5 text-center text-[#6B6B66]">{item.discountPercent || 0}</td>
                <td className="py-2.5 px-2.5 text-center text-[#6B6B66] text-[11px]">{item.tax}</td>
                <td className="py-2.5 px-2.5 text-right font-semibold">${formatAmount(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-1.5">
          <SumRow label="Subtotal" value={doc.subtotal} accent />
          <SumRow label="GST" value={doc.gstAmount} accent />
          <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-[#1A1A18]">
            <span>Total {LOCALE.currencyCode}</span>
            <span>${formatAmount(doc.total)}</span>
          </div>
        </div>
      </div>

      {(doc.notes || doc.paymentTerms || doc.bankName || doc.bankBsb || doc.bankAccount) && (
        <div className="border-t border-[#E0DED8] pt-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          {doc.notes && (
            <div>
              <p className={`${LABEL_CLASS} mb-1`}>Terms & Notes</p>
              <p className="text-[#6B6B66] italic leading-relaxed">{doc.notes}</p>
            </div>
          )}
          <div className="space-y-3">
            {doc.paymentTerms && (
              <div>
                <p className={`${LABEL_CLASS} mb-1`}>Payment Terms</p>
                <p>{doc.paymentTerms}</p>
              </div>
            )}
            {(doc.bankName || doc.bankBsb || doc.bankAccount) && (
              <div>
                <p className={`${LABEL_CLASS} mb-1`}>Bank Details</p>
                {doc.bankName && <p>{doc.bankName}</p>}
                {doc.bankBsb && <p className="text-[#6B6B66]">BSB: {doc.bankBsb}</p>}
                {doc.bankAccount && <p className="text-[#6B6B66]">Acc: {doc.bankAccount}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function Th({ align, children }) {
  return (
    <th className={`text-${align} text-[9px] font-bold text-[#6B6B66] uppercase tracking-wider py-2 px-2.5`}>
      {children}
    </th>
  );
}

function SumRow({ label, value, accent }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#6B6B66]">{label}</span>
      <span className={`font-semibold ${accent ? 'text-[#E8611A]' : 'text-[#1A1A18]'}`}>${formatAmount(value)}</span>
    </div>
  );
}

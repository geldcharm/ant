// Underlined "document-style" address fields used by quote and invoice headers.
const FIELD_CLASS = 'w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]';

export function ClientAddressFields({ values, onChange, error }) {
  return (
    <div className="space-y-2">
      <input
        placeholder="Client name"
        value={values.contactName}
        onChange={e => onChange('contactName', e.target.value)}
        className={`${FIELD_CLASS} ${error ? 'border-red-400' : ''}`}
      />
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      <input
        placeholder="Street address"
        value={values.clientAddress}
        onChange={e => onChange('clientAddress', e.target.value)}
        className={FIELD_CLASS}
      />
      <input
        placeholder="Suburb, State, Postcode"
        value={values.clientSuburb}
        onChange={e => onChange('clientSuburb', e.target.value)}
        className={FIELD_CLASS}
      />
      <input
        placeholder="Country"
        value={values.clientCountry}
        onChange={e => onChange('clientCountry', e.target.value)}
        className={FIELD_CLASS}
      />
    </div>
  );
}

export function BusinessAddressFields({ values, onChange }) {
  const nameClass = `${FIELD_CLASS} font-semibold placeholder:font-normal`;
  return (
    <div className="space-y-2">
      <input placeholder="Business Name" value={values.businessName} onChange={e => onChange('businessName', e.target.value)} className={nameClass} />
      <input placeholder="Address" value={values.businessAddress} onChange={e => onChange('businessAddress', e.target.value)} className={FIELD_CLASS} />
      <input placeholder="Suburb, State, Postcode" value={values.businessSuburb} onChange={e => onChange('businessSuburb', e.target.value)} className={FIELD_CLASS} />
      <input placeholder="Phone" value={values.businessPhone} onChange={e => onChange('businessPhone', e.target.value)} className={FIELD_CLASS} />
      <input placeholder="Email" type="email" value={values.businessEmail} onChange={e => onChange('businessEmail', e.target.value)} className={FIELD_CLASS} />
      <input placeholder="ABN / Org No." value={values.businessAbn} onChange={e => onChange('businessAbn', e.target.value)} className={FIELD_CLASS} />
    </div>
  );
}

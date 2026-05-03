import { useRef } from 'react';
import { readFileAsDataURL } from '../../lib/files';

export function LogoField({ value, onChange, onError }) {
  const fileRef = useRef(null);

  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await readFileAsDataURL(file);
      onChange(result.url);
    } catch (err) {
      onError?.(err);
    }
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {value ? (
        <div className="relative group">
          <img src={value} alt="Logo" className="h-16 max-w-[160px] object-contain rounded-lg border border-[#E0DED8]" />
          <button
            onClick={() => onChange('')}
            aria-label="Remove logo"
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-24 h-16 rounded-xl border-2 border-dashed border-[#E0DED8] flex items-center justify-center text-xs text-[#9E9E98] hover:border-[#E8611A]/40 transition-colors"
        >
          + Logo
        </button>
      )}
    </div>
  );
}

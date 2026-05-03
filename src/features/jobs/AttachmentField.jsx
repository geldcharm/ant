import { useRef } from 'react';
import { readFilesAsDataURLs } from '../../lib/files';

export function PhotoGrid({ photos, onAdd, onRemove, onError }) {
  const fileRef = useRef(null);

  async function handleFiles(e) {
    try {
      const files = await readFilesAsDataURLs(e.target.files);
      onAdd(files);
    } catch (err) {
      onError?.(err);
    }
    e.target.value = '';
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-[#E0DED8] rounded-2xl p-10 flex flex-col items-center gap-2 hover:border-[#E8611A]/40 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-[#F5F4F0] flex items-center justify-center">
            <span className="text-2xl opacity-40" aria-hidden="true">🖼️</span>
          </div>
          <p className="text-sm text-[#9E9E98]">Tap to add photos</p>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(p => (
            <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden bg-[#F5F4F0]">
              <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
              <button
                onClick={() => onRemove(p.id)}
                aria-label={`Remove ${p.name}`}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Add more photos"
            className="aspect-square rounded-xl border-2 border-dashed border-[#E0DED8] flex items-center justify-center text-[#9E9E98] hover:border-[#E8611A]/50 transition-colors text-2xl"
          >
            +
          </button>
        </div>
      )}
    </>
  );
}

export function FileList({ items, kind, onRemove }) {
  const isReceipt = kind === 'receipt';
  const bg = isReceipt ? 'bg-[#FFFBEB]' : 'bg-[#F5F4F0]';
  const icon = isReceipt ? '🧾' : '📄';
  return items.map(f => (
    <div key={f.id} className={`flex items-center gap-3 p-3 ${bg} rounded-xl`}>
      <span aria-hidden="true">{icon}</span>
      <p className="text-xs font-medium text-[#1A1A18] flex-1 truncate">{f.name}</p>
      <button
        onClick={() => onRemove(f.id)}
        aria-label={`Remove ${f.name}`}
        className="text-red-400 hover:text-red-600 text-xs px-1"
      >
        ✕
      </button>
    </div>
  ));
}

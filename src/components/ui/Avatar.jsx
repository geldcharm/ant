const SIZE_CLASSES = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

function initialsOf(name) {
  return (
    name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??'
  );
}

export function Avatar({ name, color, size = 'md' }) {
  return (
    <div
      style={{ background: color || '#6366F1' }}
      className={`${SIZE_CLASSES[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
    >
      {initialsOf(name)}
    </div>
  );
}

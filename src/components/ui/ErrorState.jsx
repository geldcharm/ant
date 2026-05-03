import { Button } from './Button';

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 text-2xl">⚠️</div>
      <div>
        <p className="font-semibold text-[#1A1A18] text-sm">{title}</p>
        {message && <p className="text-xs text-[#9E9E98] mt-0.5 max-w-sm">{message}</p>}
      </div>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

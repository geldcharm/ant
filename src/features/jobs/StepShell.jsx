import { Card } from '../../components/ui/Card';

export function StepShell({ title, onBack, onNext, onPrev, prevLabel, nextLabel, step, total, isLast, children }) {
  return (
    <div className="p-5 md:p-8 max-w-2xl space-y-5 pb-12">
      <header className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Back to overview"
          className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#1A1A18]">{title}</h1>
          <p className="text-xs text-[#9E9E98]">Step {step} of {total}</p>
        </div>
      </header>

      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < step ? 'bg-[#E8611A]' : 'bg-[#F0EFEB]'}`} />
        ))}
      </div>

      <Card className="p-5 space-y-4">{children}</Card>

      <div className="flex gap-3">
        {onPrev ? (
          <NavButton onClick={onPrev} variant="secondary">← {prevLabel}</NavButton>
        ) : (
          <NavButton onClick={onBack} variant="secondary">← Overview</NavButton>
        )}
        {onNext && !isLast && (
          <NavButton onClick={onNext} variant="primary">{nextLabel} →</NavButton>
        )}
        {isLast && (
          <NavButton onClick={onBack} variant="primary">Done →</NavButton>
        )}
      </div>
    </div>
  );
}

function NavButton({ onClick, variant, children }) {
  const base = 'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors';
  const styles = variant === 'primary'
    ? 'bg-[#E8611A] text-white hover:bg-[#C44E10] shadow-sm'
    : 'border border-[#E0DED8] bg-white text-[#6B6B66] hover:bg-[#F5F4F0]';
  return <button onClick={onClick} className={`${base} ${styles}`}>{children}</button>;
}

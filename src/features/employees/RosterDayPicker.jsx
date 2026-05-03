import { ROSTER_DAYS } from '../../constants/roster';

export function RosterDayPicker({ value = [], onChange }) {
  function toggle(day) {
    onChange(value.includes(day) ? value.filter(d => d !== day) : [...value, day]);
  }
  return (
    <div className="flex gap-1.5 flex-wrap">
      {ROSTER_DAYS.map(d => {
        const active = value.includes(d.value);
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => toggle(d.value)}
            aria-pressed={active}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              active
                ? 'bg-[#E8611A] text-white border-[#E8611A]'
                : 'bg-white text-[#6B6B66] border-[#E0DED8] hover:border-[#E8611A]/30'
            }`}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

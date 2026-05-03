import { useNavigate } from 'react-router-dom';

export function BackButton({ to, className = '' }) {
  const navigate = useNavigate();
  function handleClick() {
    if (to) navigate(to);
    else if (window.history.length > 1) navigate(-1);
    else navigate('/');
  }
  return (
    <button
      onClick={handleClick}
      aria-label="Go back"
      className={`w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors ${className}`}
    >
      ←
    </button>
  );
}

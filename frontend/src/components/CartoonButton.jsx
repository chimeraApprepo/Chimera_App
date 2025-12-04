/**
 * Cartoon Button Component
 * Playful button with press animation
 */

export function CartoonButton({
  label,
  color = 'bg-orange-400',
  hasHighlight = true,
  disabled = false,
  onClick,
  className = '',
  size = 'md'
}) {
  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  const sizeClasses = {
    sm: 'h-10 px-4 text-base',
    md: 'h-12 px-6 text-xl',
    lg: 'h-14 px-8 text-2xl'
  };

  return (
    <div
      className={`inline-block ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <button
        disabled={disabled}
        onClick={handleClick}
        className={`relative ${sizeClasses[size]} rounded-full font-bold text-neutral-800 border-2 border-neutral-800 transition-all duration-150 overflow-hidden group
        ${color} hover:shadow-[0_4px_0_0_#262626]
        ${disabled ? 'opacity-50 pointer-events-none' : 'hover:-translate-y-1 active:translate-y-0 active:shadow-none'}`}
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}
      >
        <span className="relative z-10 whitespace-nowrap">{label}</span>
        {hasHighlight && !disabled && (
          <div className="absolute top-1/2 left-[-100%] w-16 h-24 bg-white/50 -translate-y-1/2 rotate-12 transition-all duration-500 ease-in-out group-hover:left-[200%]"></div>
        )}
      </button>
    </div>
  );
}


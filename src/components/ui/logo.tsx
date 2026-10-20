interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 22, text: 'text-base font-bold', sub: 'text-[9px]' },
  md: { icon: 26, text: 'text-lg font-bold', sub: 'text-[10px]' },
  lg: { icon: 32, text: 'text-xl font-extrabold', sub: 'text-[11px]' },
  xl: { icon: 40, text: 'text-2xl font-extrabold', sub: 'text-xs' },
};

export function Logo({
  size = 'md',
  showText = true,
  showTagline = false,
  className = '',
}: LogoProps) {
  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Corporate geometric brand mark */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-200 hover:scale-105"
        >
          {/* Outer corporate shield */}
          <path
            d="M20 3L35 11.66V28.34L20 37L5 28.34V11.66L20 3Z"
            fill="#172033"
          />
          {/* Top subtle indigo facet */}
          <path
            d="M20 3L35 11.66L20 20.32L5 11.66L20 3Z"
            fill="#4F46E5"
            fillOpacity="0.30"
          />
          {/* Core indigo aperture */}
          <circle cx="20" cy="20.3" r="5.5" fill="#4F46E5" />
          <circle cx="20" cy="20.3" r="2.2" fill="#FFFFFF" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`tracking-tight text-[#172033] ${s.text} flex items-center gap-0.5`}>
            Apti<span className="text-accent-600">Core</span>
          </span>
          {showTagline && (
            <span className={`text-[#64748B] font-medium tracking-normal mt-0.5 ${s.sub}`}>
              Prepare Smarter. Interview Better.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

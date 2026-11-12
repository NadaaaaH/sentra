function BatikLatar({ warna = '#FAF7E6', opacity = 0.07, className = '' }) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <svg className="batik-geser absolute -left-[60px] -top-[60px] h-[calc(100%+120px)] w-[calc(100%+120px)]">
          <defs>
            <pattern id="kawung" width="60" height="60" patternUnits="userSpaceOnUse">
              <g fill="none" stroke={warna} strokeOpacity={opacity} strokeWidth="1.2">
                <ellipse cx="30" cy="12" rx="8" ry="12" />
                <ellipse cx="30" cy="48" rx="8" ry="12" />
                <ellipse cx="12" cy="30" rx="12" ry="8" />
                <ellipse cx="48" cy="30" rx="12" ry="8" />
                <circle cx="30" cy="30" r="2.5" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kawung)" />
        </svg>
      </div>
    )
  }
  
export default BatikLatar
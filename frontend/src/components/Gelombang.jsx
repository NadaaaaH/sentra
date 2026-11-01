function Gelombang({ belakang, depan, className = '' }) {
    const garis1 = 'M0 50 C240 110 480 0 720 50 C960 100 1200 -10 1440 50 L1440 120 L0 120 Z'
    const garis2 = 'M0 80 C240 40 480 120 720 80 C960 40 1200 120 1440 80 L1440 120 L0 120 Z'
  
    return (
      <div className={`overflow-hidden ${className}`} aria-hidden="true">
        <svg
          className="ombak-belakang absolute bottom-0 left-0 h-full w-[200%]"
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
        >
          <g fill={belakang}>
            <path d={garis1} />
            <path transform="translate(1440 0)" d={garis1} />
          </g>
        </svg>
        <svg
          className="ombak-depan absolute bottom-0 left-0 h-full w-[200%]"
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
        >
          <g fill={depan}>
            <path d={garis2} />
            <path transform="translate(1440 0)" d={garis2} />
          </g>
        </svg>
      </div>
    )
  }
  
  export default Gelombang
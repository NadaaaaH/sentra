const skala = [0.35, 0.55, 0.75, 0.95, 1.15, 1.4]

function KonturLatar() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g transform="translate(900 300)">
        {skala.map((k) => (
          <path
            key={k}
            d="M-300 -20 C-280 -140 -120 -190 20 -170 C170 -150 290 -80 300 40 C310 150 170 200 20 190 C-130 180 -320 110 -300 -20 Z"
            transform={`scale(${k})`}
            fill="none"
            stroke="#FAF7E6"
            strokeOpacity="0.14"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  )
}

export default KonturLatar
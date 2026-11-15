const tones = {
  green: {
    circle: 'bg-sentra-lightgreen/40 group-hover:bg-sentra-green',
    icon: 'text-sentra-green group-hover:text-sentra-cream',
    accent: 'border-t-sentra-green',
  },
  yellow: {
    circle: 'bg-sentra-lightyellow/60 group-hover:bg-sentra-yellow',
    icon: 'text-sentra-orange group-hover:text-white',
    accent: 'border-t-sentra-yellow',
  },
  orange: {
    circle: 'bg-sentra-orange/15 group-hover:bg-sentra-orange',
    icon: 'text-sentra-orange group-hover:text-white',
    accent: 'border-t-sentra-orange',
  },
  soga: {
    circle: 'bg-sentra-soga/15 group-hover:bg-sentra-soga',
    icon: 'text-sentra-soga group-hover:text-white',
    accent: 'border-t-sentra-soga',
  },
  teal: {
    circle: 'bg-sentra-teal/15 group-hover:bg-sentra-teal',
    icon: 'text-sentra-teal group-hover:text-white',
    accent: 'border-t-sentra-teal',
  },
}

function FeatureCard({ icon: Icon, title, description, tone = 'green' }) {
  const color = tones[tone]

  return (
    <div
      className={`group h-full rounded-2xl border border-sentra-stroke border-t-4 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl ${color.accent}`}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl transition duration-300 group-hover:-rotate-6 ${color.circle}`}
      >
        <Icon
          className={`h-8 w-8 transition duration-300 ${color.icon}`}
          strokeWidth={1.5}
        />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-black transition group-hover:text-sentra-green">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
    </div>
  )
}

export default FeatureCard
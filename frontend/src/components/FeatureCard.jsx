const tones = {
    green: {
      circle: 'bg-sentra-lightergreen/30',
      icon: 'text-sentra-green',
    },
    yellow: {
      circle: 'bg-sentra-lightyellow/60',
      icon: 'text-sentra-orange',
    },
  }
  
  function FeatureCard({ icon: Icon, title, description, tone = 'green' }) {
    const color = tones[tone]
  
    return (
      <div className="rounded-lg border border-sentra-stroke bg-sentra-cream/33 p-5 shadow-md">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full ${color.circle}`}
        >
          <Icon className={`h-8 w-8 ${color.icon}`} strokeWidth={1.5} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-black">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
      </div>
    )
  }
  
  export default FeatureCard
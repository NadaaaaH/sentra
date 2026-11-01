import FeatureCard from './FeatureCard'

function FiturMarquee({ daftar }) {
  // satu "separuh" = daftar diulang 4x, supaya lebih lebar dari layar selebar apa pun
  const separuh = [...daftar, ...daftar, ...daftar, ...daftar]
  const gandaan = [...separuh, ...separuh]

  return (
    <div className="marquee overflow-hidden py-10 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="marquee-track flex w-max gap-6 pr-6">
        {gandaan.map((item, i) => (
          <div
            key={i}
            className="w-72 shrink-0 sm:w-80"
            aria-hidden={i >= daftar.length}
          >
            <FeatureCard {...item} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default FiturMarquee
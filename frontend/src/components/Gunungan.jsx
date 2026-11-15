import gambar from '../assets/gunungan.png'

// arah = 1  -> mulai bergerak ke kanan
// arah = -1 -> mulai bergerak ke kiri
function Gunungan({ className = '', arah = 1, style }) {
  return (
    <img
      src={gambar}
      alt=""
      aria-hidden="true"
      draggable="false"
      className={`pointer-events-none select-none dalang-a ${className}`}
      style={{ ...style, '--arah': arah }}
    />
  )
}

export default Gunungan
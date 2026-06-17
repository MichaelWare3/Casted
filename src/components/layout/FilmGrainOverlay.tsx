export default function FilmGrainOverlay() {
  return (
    <div
      className="film-grain vignette"
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9997 }}
    />
  )
}

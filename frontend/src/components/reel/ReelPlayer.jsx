export default function ReelPlayer({ reel }) {
  return (
    <article className="reel-card">
      <img alt={reel.title} className="reel-card__poster" src={reel.poster} />
      <div className="reel-card__overlay">
        <button className="reel-card__play" type="button">
          <span className="material-symbols-outlined filled">play_arrow</span>
        </button>
        <div>
          <p className="eyebrow">Curator reel</p>
          <h3>{reel.title}</h3>
          <span>{reel.subtitle}</span>
        </div>
      </div>
    </article>
  );
}

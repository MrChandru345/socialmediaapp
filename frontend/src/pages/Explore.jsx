import { exploreCards } from "../assets/mockData";

export default function Explore() {
  return (
    <div className="curated-page">
      <section className="hero-panel">
        <p className="eyebrow">Editorial discovery</p>
        <h2>Explore the curator network</h2>
        <p>
          Discover visual essays, gallery builds, motion studies, and social moments arranged with the same premium language as your feed.
        </p>
      </section>
      <div className="explore-grid">
        {exploreCards.map((card) => (
          <article className="explore-card" key={card.id}>
            <img alt={card.title} src={card.image} />
            <div>
              <p className="eyebrow">Curated collection</p>
              <h3>{card.title}</h3>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

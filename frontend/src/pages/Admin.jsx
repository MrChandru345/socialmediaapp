import { adminMetrics } from "../assets/mockData";

export default function Admin() {
  return (
    <div className="curated-page">
      <section className="hero-panel">
        <p className="eyebrow">Operations surface</p>
        <h2>Admin overview</h2>
        <p>Monitor platform health, moderation load, and active publishing energy in one calm operational dashboard.</p>
      </section>
      <div className="metrics-grid">
        {adminMetrics.map((metric) => (
          <article className="metric-card" key={metric.id}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>
    </div>
  );
}

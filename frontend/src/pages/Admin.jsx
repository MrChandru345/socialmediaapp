import { useEffect, useState } from "react";
import { adminService } from "../services/adminService";

export default function Admin() {
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getStats() {
      try {
        const stats = await adminService.getStats();
        // Transform the stats object into an array for rendering
        const metricsArray = Object.entries(stats).map(([key, value]) => ({
          id: key,
          label: key.replace(/([A-Z])/g, ' $1').toUpperCase(), // Format the label
          value: value,
        }));
        setMetrics(metricsArray);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    getStats();
  }, []);

  return (
    <div className="curated-page">
      <section className="hero-panel">
        <p className="eyebrow">Operations surface</p>
        <h2>Admin overview</h2>
        <p>
          Monitor platform health, moderation load, and active publishing
          energy in one calm operational dashboard.
        </p>
      </section>
      {isLoading ? (
        <p>Loading stats...</p>
      ) : (
        <div className="metrics-grid">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.id}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}


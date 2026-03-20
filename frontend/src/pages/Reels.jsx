import { reels } from "../assets/mockData";
import ReelPlayer from "../components/reel/ReelPlayer";

export default function Reels() {
  return (
    <div className="curated-page">
      <section className="hero-panel">
        <p className="eyebrow">Short-form motion</p>
        <h2>Curator reels</h2>
        <p>Scroll through launch teasers, studio process clips, and premium social cuts styled for a gallery-first experience.</p>
      </section>
      <div className="reels-grid">
        {reels.map((reel) => (
          <ReelPlayer key={reel.id} reel={reel} />
        ))}
      </div>
    </div>
  );
}

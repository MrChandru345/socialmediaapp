import { useEffect, useState } from "react";

import ReelPlayer from "../components/reel/ReelPlayer";
import { reelService } from "../services/reelService";

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getReels() {
      try {
        const data = await reelService.getAll();
        // data might be { items: [], meta: {} }
        const items = data?.items ? data.items : (Array.isArray(data) ? data : []);
        setReels(items);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    getReels();
  }, []);

  return (
    <div className="reels-container">
      {isLoading ? (
        <div className="reels-loading">
            <span className="material-symbols-outlined spin">progress_activity</span>
            <p>Loading reels...</p>
        </div>
      ) : reels.length > 0 ? (
        <div className="reels-scroll-snap">
          {reels.map((reel) => (
            <ReelPlayer key={reel.id} reel={reel} />
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ height: "100vh" }}>
          <span className="material-symbols-outlined">movie</span>
          <h3>No reels yet</h3>
        </div>
      )}
    </div>
  );
}

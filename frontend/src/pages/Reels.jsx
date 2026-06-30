import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import ReelPlayer from "../components/reel/ReelPlayer";
import { reelService } from "../services/reelService";

export default function Reels() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add("no-global-scroll", "reels-page-active");
    return () => {
      document.body.classList.remove("no-global-scroll", "reels-page-active");
    };
  }, []);

  function handlePostClick(post) {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("post", post.id);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  }

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
            <ReelPlayer key={reel.id} reel={reel} onPostClick={handlePostClick} />
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

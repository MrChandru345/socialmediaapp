import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storyService } from "../../services/storyService";
import { getAvatarForUser } from "../../utils/helpers";
import Loader from "../common/Loader";

export default function StoryViewersList({ storyId, onClose }) {
  const navigate = useNavigate();
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleUserClick = (username) => {
    onClose();
    navigate(`/profile/${username}`);
  };

  useEffect(() => {
    async function loadViewers() {
      try {
        const data = await storyService.getViewers(storyId);
        setViewers(data || []);
      } catch (err) {
        setError("Failed to load viewers");
      } finally {
        setLoading(false);
      }
    }
    loadViewers();
  }, [storyId]);

  return (
    <div className="story-viewers-panel modern-glass fadeIn">
      <div className="viewers-header">
        <h3>Viewers</h3>
        <button className="icon-button" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="viewers-list">
        {loading ? (
          <div className="viewers-loading"><Loader size="sm" /></div>
        ) : error ? (
          <p className="viewers-empty">{error}</p>
        ) : viewers.length === 0 ? (
          <p className="viewers-empty">No viewers yet</p>
        ) : (
          viewers.map((viewer) => (
            <div 
              key={viewer.id} 
              className="viewer-row" 
              onClick={() => handleUserClick(viewer.username)}
            >
              <img 
                src={getAvatarForUser(viewer, viewer.username)} 
                alt={viewer.username} 
                className="viewer-avatar" 
              />
              <div className="viewer-info">
                <strong>{viewer.username}</strong>
                <span>{viewer.fullName}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

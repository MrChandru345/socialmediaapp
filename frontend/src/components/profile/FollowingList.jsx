import { useNavigate } from "react-router-dom";
import { getAvatarForUser, getDisplayName } from "../../utils/helpers";

export default function FollowingList({ 
  users, 
  title, 
  onRefresh, 
  isLoading, 
  pendingFollowIds, 
  onToggleFollow,
  currentUser 
}) {
  const navigate = useNavigate();

  return (
    <aside className="info-column following-sidebar">
      <section className="sidebar-card modern-glass radius-xl">
        <div className="section-heading">
          <h3>{title}</h3>
          <button className="link-button" onClick={onRefresh} type="button">
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="sidebar-loading">
            <div className="skeleton-row" style={{ height: '40px', marginBottom: '1rem', borderRadius: '8px' }}></div>
            <div className="skeleton-row" style={{ height: '40px', marginBottom: '1rem', borderRadius: '8px' }}></div>
            <div className="skeleton-row" style={{ height: '40px', borderRadius: '8px' }}></div>
          </div>
        ) : users.length > 0 ? (
          <div className="stack-list">
            {users.map((u) => (
              <div className="suggestion-row hover-zoom" key={u.id}>
                <div 
                  className="suggestion-row__identity suggestion-row__identity--link" 
                  onClick={() => navigate(`/profile/${u.username || u.id}`)}
                >
                  <img
                    alt={getDisplayName(u)}
                    src={getAvatarForUser(u, getDisplayName(u))}
                    className="suggestion-avatar"
                  />
                  <div className="suggestion-info">
                    <strong>{getDisplayName(u)}</strong>
                    <span className="suggestion-bio">
                      {u.bio ? (u.bio.length > 30 ? u.bio.slice(0, 27) + "..." : u.bio) : `@${u.username}`}
                    </span>
                  </div>
                </div>
                {currentUser?.id !== u.id && (
                  <button
                    className={`mini-action radius-full btn-${u.isFollowing ? 'following' : 'follow'}`}
                    disabled={pendingFollowIds.includes(u.id)}
                    onClick={() => onToggleFollow(u.id)}
                    type="button"
                  >
                    {pendingFollowIds.includes(u.id) ? "..." : (u.isFollowing ? "Following" : "Follow")}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="sidebar-note" style={{ textAlign: 'center', padding: '1rem 0' }}>
            {title === 'Following' 
              ? "You are not following anyone yet." 
              : "No suggestions right now."}
          </p>
        )}
      </section>
    </aside>
  );
}

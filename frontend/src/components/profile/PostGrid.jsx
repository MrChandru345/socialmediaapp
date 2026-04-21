import Button from "../common/Button";
import Loader from "../common/Loader";
import { getPostMedia, isVideoMedia, getPostLikeCount, getPostCommentCount } from "../../utils/helpers";

export default function PostGrid({ posts = [], isOwnProfile, onCreatePost, activeTab, onPostClick, status = 'ready' }) {
  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0', width: '100%' }}>
        <Loader label="Loading content..." />
      </div>
    );
  }

  if (posts.length === 0) {
    if (activeTab === 'saved') {
      return (
        <section className="sidebar-card empty-state modern-glass radius-xl">
          <div className="empty-state-icon" style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            border: '2px solid var(--text)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' 
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>bookmark_border</span>
          </div>
          <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>Save photos and videos</h3>
          <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>
            When you save photos and videos, they'll appear here. <br/> Only you can see what you've saved.
          </p>
        </section>
      );
    }
    
    if (activeTab === 'tagged') {
        return (
          <section className="sidebar-card empty-state modern-glass radius-xl">
            <div className="empty-state-icon" style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              border: '2px solid var(--text)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' 
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>assignment_ind</span>
            </div>
            <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>Photos of you</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>
              When people tag you in photos, they'll appear here.
            </p>
          </section>
        );
    }

    return (
      <section className="sidebar-card empty-state modern-glass radius-xl">
        <div className="empty-state-icon" style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          border: '2px solid var(--text)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' 
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>photo_camera</span>
        </div>
        <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>{isOwnProfile ? "Share Photos" : "No posts yet"}</h3>
        <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>
          {isOwnProfile
            ? "When you share photos, they will appear on your profile."
            : "This user hasn't posted anything yet."}
        </p>
        {isOwnProfile && (
          <Button onClick={onCreatePost} size="sm" variant="primary" className="radius-full">
            Share your first photo
          </Button>
        )}
      </section>
    );
  }

  return (
    <div className="gallery-grid">
      {posts.map((post) => {
        const media = getPostMedia(post);
        return (
          <div
            key={post.id}
            className="gallery-tile radius-md hover-zoom"
            onClick={() => onPostClick?.(post)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onPostClick?.(post)}
          >
            {media && isVideoMedia(media) ? (
              <video src={media.url} className="gallery-tile__image" playsInline muted loop />
            ) : media ? (
              <img src={media.url} alt="Post" className="gallery-tile__image" />
            ) : (
              <div className="gallery-tile__image empty" />
            )}
            <div className="gallery-tile__overlay modern-glass-overlay">
              <span className="overlay-stat">
                <span className="material-symbols-outlined filled">favorite</span> 
                {getPostLikeCount(post)}
              </span>
              <span className="overlay-stat">
                <span className="material-symbols-outlined filled">chat_bubble</span> 
                {getPostCommentCount(post)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

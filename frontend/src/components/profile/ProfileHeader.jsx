import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import Stats from "./Stats";
import { getAvatarForUser, getDisplayName } from "../../utils/helpers";

function normalizeWebsite(value) {
  if (!value) return "";
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowPending,
  onEditProfile,
  onToggleFollow,
  onShareProfile,
  onMessage,
  onCreatePost,
  onFollowersClick,
  onFollowingClick
}) {
  const navigate = useNavigate();
  const websiteHref = normalizeWebsite(profile?.website);

  if (!profile) return null;

  return (
    <section className="profile-hero-premium modern-glass radius-xl">
      <div className="profile-hero-banner">
        {!isOwnProfile && (
          <button 
            onClick={() => navigate(-1)} 
            className="icon-button back-icon-glass" 
            title="Go Back"
            style={{ 
              position: 'absolute', 
              top: '1rem', 
              left: '1rem', 
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.4)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
          </button>
        )}
      </div>
      
      <div className="profile-hero-content">
        <div className="profile-hero-top">
          <div className="profile-avatar-wrap">
            <img
              alt={getDisplayName(profile)}
              className="profile-avatar premium-avatar"
              src={getAvatarForUser(profile, getDisplayName(profile))}
            />
          </div>
          
          <div className="profile-hero-actions">
            {isOwnProfile ? (
              <>
                <Button onClick={onEditProfile} size="sm" variant="outline" className="radius-full premium-btn">
                  Edit Profile
                </Button>
                <Button onClick={onCreatePost} size="sm" variant="primary" className="radius-full premium-btn">
                  Create Post
                </Button>
              </>
            ) : (
              <>
                <Button
                  disabled={isFollowPending}
                  onClick={onToggleFollow}
                  size="sm"
                  variant={profile.isFollowing ? "outline" : "primary"}
                  className="radius-full premium-btn"
                >
                  {isFollowPending ? "..." : profile.isFollowing ? "Following" : "Follow"}
                </Button>
                <Button onClick={onMessage} size="sm" variant="outline" className="radius-full premium-btn">
                  Message
                </Button>
              </>
            )}
            <Button onClick={onShareProfile} size="sm" variant="ghost" title="Share profile" className="radius-full premium-btn share-btn">
              <span className="material-symbols-outlined">share</span>
            </Button>
          </div>
        </div>
        
        <div className="profile-hero-main">
          <div className="profile-name-area">
            <h2 className="premium-username">{profile.username}</h2>
            <p className="profile-display-name">
              <strong>{getDisplayName(profile)}</strong> 
              {profile.role === "admin" && <span className="admin-badge premium-badge">Admin</span>}
            </p>
          </div>

          <div className="premium-stats-capsule">
            <Stats
              postCount={profile.postCount}
              followersCount={profile.followersCount}
              followingCount={profile.followingCount}
              onFollowersClick={onFollowersClick}
              onFollowingClick={onFollowingClick}
            />
          </div>

          <div className="profile-bio-container">
            <p className="profile-bio-text">{profile.bio || "No bio shared yet."}</p>
            
            <div className="profile-links-row">
              {profile.location && (
                <span className="profile-meta">
                  <span className="material-symbols-outlined">location_on</span> {profile.location}
                </span>
              )}
              {websiteHref && (
                <a href={websiteHref} rel="noreferrer" target="_blank" className="profile-website">
                  <span className="material-symbols-outlined">link</span> {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { formatCompactNumber } from "../../utils/helpers";

export default function Stats({ 
  postCount = 0, 
  followersCount = 0, 
  followingCount = 0,
  onFollowersClick,
  onFollowingClick
}) {
  return (
    <div className="profile-stats">
      <div className="stat-item">
        <strong>{formatCompactNumber(postCount)}</strong>
        <span>Posts</span>
      </div>
      <button 
        className="stat-item stat-btn" 
        onClick={onFollowersClick}
        disabled={!onFollowersClick}
      >
        <strong>{formatCompactNumber(followersCount)}</strong>
        <span>Followers</span>
      </button>
      <button 
        className="stat-item stat-btn" 
        onClick={onFollowingClick}
        disabled={!onFollowingClick}
      >
        <strong>{formatCompactNumber(followingCount)}</strong>
        <span>Following</span>
      </button>
    </div>
  );
}

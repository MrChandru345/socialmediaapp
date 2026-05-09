import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { getAvatarForUser, getDisplayName, formatCompactNumber } from "../../utils/helpers";
import { userService } from "../../services/userService";
import Button from "./Button";
import Loader from "./Loader";

const userCache = new Map();

export default function HoverCard({ user, children }) {
  const [show, setShow] = useState(false);
  const [fullUser, setFullUser] = useState(user);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (show && user) {
      const identifier = user.username || user.id || user._id;
      if (!identifier) return;

      if (userCache.has(identifier)) {
        setFullUser(userCache.get(identifier));
        return;
      }

      // If already has basic stats, maybe no need to fetch? 
      // But user said "not showing real data", so maybe they want latest.
      // Let's fetch if we are missing bio or stats are 0
      const hasDetailedData = user.bio !== undefined && user.followersCount !== undefined;
      
      if (hasDetailedData && !userCache.has(identifier)) {
         userCache.set(identifier, user);
         setFullUser(user);
      }

      async function fetchFullUser() {
        setIsLoading(true);
        try {
          const data = await userService.getProfile(identifier);
          setFullUser(data);
          userCache.set(identifier, data);
        } catch (error) {
          console.error("Failed to fetch hover card data", error);
        } finally {
          setIsLoading(false);
        }
      }
      
      fetchFullUser();
    }
  }, [show, user]);

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Position the card above or below the element
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX;

    // Flip to top if near bottom of viewport
    if (rect.bottom + 250 > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - 210; // Approx height of card
    }

    setPosition({ top, left });
    timeoutRef.current = setTimeout(() => setShow(true), 600);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setShow(false);
  };

  if (!user) return <>{children}</>;

  const cardContent = (
    <div 
      className="hover-card modern-glass animate-in"
      style={{ 
        position: 'absolute',
        top: position.top, 
        left: position.left,
        zIndex: 100000,
        pointerEvents: 'auto',
        minHeight: '160px'
      }}
      onMouseEnter={() => {
        clearTimeout(timeoutRef.current);
        setShow(true);
      }}
      onMouseLeave={handleMouseLeave}
    >
      <div className="hover-card__header">
        <img 
          src={getAvatarForUser(fullUser, getDisplayName(fullUser))} 
          alt={getDisplayName(fullUser)} 
          className="hover-card__avatar"
          onClick={() => navigate(`/profile/${fullUser.username || fullUser.id}`)}
        />
        <div className="hover-card__info">
          <h4 onClick={() => navigate(`/profile/${fullUser.username || fullUser.id}`)}>{getDisplayName(fullUser)}</h4>
          <p>@{fullUser.username}</p>
        </div>
      </div>
      
      {isLoading && !fullUser.bio && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <Loader size="sm" />
        </div>
      )}

      {!isLoading && (
        <>
          <div className="hover-card__stats">
            <div className="hover-stat">
              <strong>{formatCompactNumber(fullUser.followersCount || 0)}</strong>
              <span>Followers</span>
            </div>
            <div className="hover-stat">
              <strong>{formatCompactNumber(fullUser.followingCount || 0)}</strong>
              <span>Following</span>
            </div>
          </div>
          
          {fullUser.bio && (
            <p className="hover-card__bio">
              {fullUser.bio.length > 80 ? fullUser.bio.slice(0, 77) + "..." : fullUser.bio}
            </p>
          )}

          {fullUser.mutualFollowers && (
             <div className="hover-card__mutual" style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '8px', padding: '0 4px' }}>
                Followed by {fullUser.mutualFollowers.users[0].username} 
                {fullUser.mutualFollowers.totalCount > 1 && ` +${fullUser.mutualFollowers.totalCount - 1} more`}
             </div>
          )}
          
          <div className="hover-card__actions">
            <Button 
              size="sm" 
              variant={fullUser.isFollowing ? "outline" : "primary"} 
              className="radius-full"
              onClick={() => navigate(`/profile/${fullUser.username || fullUser.id}`)}
            >
              {fullUser.isFollowing ? "Following" : "Follow"}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="radius-full" 
              onClick={() => navigate(`/chat?userId=${fullUser.id || fullUser._id}`)}
            >
              Message
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div 
      className="hover-card-trigger" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      {children}
      {show && ReactDOM.createPortal(cardContent, document.body)}
    </div>
  );
}

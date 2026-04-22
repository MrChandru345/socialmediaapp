import { useEffect, useRef, useState } from "react";
import { getAvatarForUser, formatCompactNumber } from "../../utils/helpers";
import { reelService } from "../../services/reelService";
import { useAuth } from "../../hooks/useAuth";

export default function ReelPlayer({ reel, onPostClick }) {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(reel.likedByViewer);
  const [likesCount, setLikesCount] = useState(reel.likesCount || 0);
  const [isLikePending, setIsLikePending] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(e => console.log("Autoplay blocked:", e));
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  async function handleLike(e) {
    e.stopPropagation();
    if (isLikePending) return;
    
    setIsLikePending(true);
    // Optimistic UI update
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

    try {
      await reelService.toggleLike(reel.id);
    } catch (err) {
      // Revert if failed
      setIsLiked(!newLiked);
      setLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLikePending(false);
    }
  }

  return (
    <article className="reel-fullscreen" onClick={togglePlay}>
      <video
        ref={videoRef}
        className="reel-fullscreen__video"
        src={reel.video?.url}
        poster={reel.poster || reel.video?.url}
        loop
        playsInline
      />
      
      {!isPlaying && (
        <div className="reel-fullscreen__play-btn">
          <span className="material-symbols-outlined filled">play_arrow</span>
        </div>
      )}

      <div className="reel-fullscreen__overlay">
        <div className="reel-overlay-main">
          <div className="reel-overlay__content">
            <div className="reel-overlay__author">
              <img src={reel.author?.avatar || getAvatarForUser(reel.author, "User")} alt="Avatar" />
              <strong>{reel.author?.username || "creator"}</strong>
              <button className="mini-action" onClick={(e) => e.stopPropagation()}>Follow</button>
            </div>
            {reel.caption && <p className="reel-overlay__caption">{reel.caption}</p>}
            <div className="reel-overlay__music">
              <span className="material-symbols-outlined">music_note</span>
              <marquee scrollamount="3">Original Audio - {reel.author?.username || "creator"}</marquee>
            </div>
          </div>

          <div className="reel-overlay__actions">
            <button className={`reel-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
              <span className={`material-symbols-outlined ${isLiked ? 'filled' : ''}`}>favorite</span>
              <span>{formatCompactNumber(likesCount)}</span>
            </button>
            <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); onPostClick?.(reel); }}>
              <span className="material-symbols-outlined filled">chat_bubble</span>
              <span>{formatCompactNumber(reel.commentsCount || 0)}</span>
            </button>
            <button className="reel-action-btn" onClick={(e) => e.stopPropagation()}>
              <span className="material-symbols-outlined">send</span>
            </button>
            <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); onPostClick?.(reel); }}>
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
            <img className="reel-music-disc" src={reel.author?.avatar || getAvatarForUser(reel.author, "User")} alt="Audio" />
          </div>
        </div>
      </div>
    </article>
  );
}


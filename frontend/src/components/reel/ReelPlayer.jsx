import { useEffect, useRef, useState } from "react";
import { getAvatarForUser, formatCompactNumber } from "../../utils/helpers";

export default function ReelPlayer({ reel }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(reel.likedByViewer);
  const [likesCount, setLikesCount] = useState(reel.likesCount || 0);

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

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    // Actually call service here if we had the prop
  };

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
        <div className="reel-overlay__content">
          <div className="reel-overlay__author">
            <img src={reel.author?.avatar || getAvatarForUser(reel.author, "User")} alt="Avatar" />
            <strong>{reel.author?.username || "creator"}</strong>
            <button className="mini-action">Follow</button>
          </div>
          {reel.caption && <p className="reel-overlay__caption">{reel.caption}</p>}
          <div className="reel-overlay__music">
            <span className="material-symbols-outlined">music_note</span>
            <marquee>Original Audio - {reel.author?.username || "creator"}</marquee>
          </div>
        </div>

        <div className="reel-overlay__actions">
          <button className={`reel-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <span className={`material-symbols-outlined ${isLiked ? 'filled' : ''}`}>favorite</span>
            <span>{formatCompactNumber(likesCount)}</span>
          </button>
          <button className="reel-action-btn">
            <span className="material-symbols-outlined filled">chat_bubble</span>
            <span>{formatCompactNumber(reel.commentsCount || 0)}</span>
          </button>
          <button className="reel-action-btn">
            <span className="material-symbols-outlined">send</span>
          </button>
          <button className="reel-action-btn">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
          <img className="reel-music-disc" src={reel.author?.avatar || getAvatarForUser(reel.author, "User")} alt="Audio" />
        </div>
      </div>
    </article>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageSquare, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { getAvatarForUser, formatCompactNumber } from "../../utils/helpers";
import { followService } from "../../services/followService";
import { reelService } from "../../services/reelService";
import { useAuth } from "../../hooks/useAuth";
import ReelCommentModal from "./ReelCommentModal";
import ShareModal from "../common/ShareModal";

export default function ReelPlayer({ reel, onPostClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(reel.likedByViewer);
  const [likesCount, setLikesCount] = useState(reel.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(reel.commentsCount || 0);
  const [isLikePending, setIsLikePending] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [isSaved, setIsSaved] = useState(reel.savedByViewer);
  const [isSavePending, setIsSavePending] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(Boolean(reel.author?.isFollowing));
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [showStoryToast, setShowStoryToast] = useState(false);
  const clickTimeoutRef = useRef(null);
  const storyToastTimeoutRef = useRef(null);
  const authorId = reel.author?.id || reel.author?._id;
  const isOwnReel = authorId && user?.id && String(authorId) === String(user.id);

  useEffect(() => {
    setIsFollowingAuthor(Boolean(reel.author?.isFollowing));
    setIsFollowPending(false);
  }, [reel.id, reel.author?.isFollowing]);

  useEffect(() => {
    return () => {
      if (storyToastTimeoutRef.current) {
        window.clearTimeout(storyToastTimeoutRef.current);
      }
    };
  }, []);

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

  const handleVideoClick = (e) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      handleDoubleClick(e);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        togglePlay();
        clickTimeoutRef.current = null;
      }, 250);
    }
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    if (!isLiked) handleLike(e);
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 800);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  async function handleLike(e) {
    e.stopPropagation();
    if (isLikePending) return;
    setIsLikePending(true);
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    try {
      await reelService.toggleLike(reel.id);
    } catch (err) {
      setIsLiked(!newLiked);
      setLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLikePending(false);
    }
  }

  async function handleSave(e) {
    e.stopPropagation();
    if (isSavePending) return;
    setIsSavePending(true);
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    try {
      await reelService.toggleSave(reel.id || reel._id);
    } catch (err) {
      setIsSaved(!newSaved);
    } finally {
      setIsSavePending(false);
    }
  }

  async function handleFollowAuthor(e) {
    e.stopPropagation();

    if (!authorId || isOwnReel || isFollowPending) {
      return;
    }

    const nextFollowingState = !isFollowingAuthor;
    setIsFollowPending(true);
    setIsFollowingAuthor(nextFollowingState);

    try {
      const result = await followService.toggle(authorId);
      setIsFollowingAuthor(Boolean(result.following));
    } catch (err) {
      setIsFollowingAuthor(!nextFollowingState);
    } finally {
      setIsFollowPending(false);
    }
  }

  function handleAddedToStory() {
    setShowStoryToast(true);

    if (storyToastTimeoutRef.current) {
      window.clearTimeout(storyToastTimeoutRef.current);
    }

    storyToastTimeoutRef.current = window.setTimeout(() => {
      setShowStoryToast(false);
      storyToastTimeoutRef.current = null;
    }, 2400);
  }

  const CAPTION_LIMIT = 80;
  const hasLongCaption = reel.caption && reel.caption.length > CAPTION_LIMIT;
  const authorUsername = reel.author?.username || "creator";
  const musicName =
    reel.musicName ||
    reel.music?.name ||
    reel.audioName ||
    reel.audio?.title ||
    reel.soundName ||
    `${authorUsername} - Original audio`;

  return (
    <article id={`reel-${reel.id}`} className="reel-fullscreen">
      <div className="reel-layout-group">
        {/* LEFT INFO PANEL - outside the video, matching video height */}
        <div className="reel-left-panel">
          <div className="reel-left-panel__inner">
            {/* Author row */}
            <div className="reel-left__author">
              <img
                src={getAvatarForUser(reel.author, "User")}
                alt="Avatar"
                onClick={() => navigate(`/profile/${reel.author?.username}`)}
                style={{ cursor: 'pointer' }}
              />
              <div className="reel-left__author-info">
                <span
                  className="reel-left__username"
                  onClick={() => navigate(`/profile/${reel.author?.username}`)}
                >
                  {authorUsername}
                </span>
                {!isOwnReel && (
                  <button
                    className={`reel-left__follow-btn ${isFollowingAuthor ? "is-following" : ""}`}
                    disabled={isFollowPending}
                    onClick={handleFollowAuthor}
                    type="button"
                  >
                    {isFollowPending ? "..." : isFollowingAuthor ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            {/* Caption */}
            {reel.caption && (
              <div className={`reel-left__caption ${isCaptionExpanded ? "is-expanded" : ""}`}>
                <p>
                  {isCaptionExpanded || !hasLongCaption
                    ? reel.caption
                    : reel.caption.slice(0, CAPTION_LIMIT) + "..."}
                </p>
                {hasLongCaption && (
                  <button
                    className="reel-left__caption-toggle"
                    onClick={(e) => { e.stopPropagation(); setIsCaptionExpanded(!isCaptionExpanded); }}
                  >
                    {isCaptionExpanded ? "less" : "more"}
                  </button>
                )}
              </div>
            )}

            <div className="reel-left__music reel-left__music--mobile">
              <span className="material-symbols-outlined">music_note</span>
              <span className="reel-left__music-text">{musicName}</span>
            </div>
          </div>
        </div>

        {/* VIDEO */}
        <div className="reel-video-wrapper" onClick={handleVideoClick}>
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
              <span className="material-symbols-outlined filled" style={{ color: 'white' }}>play_arrow</span>
            </div>
          )}

          {showHeartPop && (
            <div className="reel-fullscreen__heart-pop">
              <span className="material-symbols-outlined filled" style={{ color: 'white' }}>favorite</span>
            </div>
          )}

          {/* Mute button bottom-right inside video */}
          <button className="reel-mute-btn" onClick={toggleMute}>
            <span className="material-symbols-outlined" style={{ color: 'white' }}>
              {isMuted ? "volume_off" : "volume_up"}
            </span>
          </button>
        </div>

        {/* ACTION BUTTONS - right of video */}
        <div className="reel-actions-sidebar">
          <button className={`reel-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <div className="icon-circle">
              <Heart size={28} fill={isLiked ? "#ed4956" : "none"} color={isLiked ? "#ed4956" : "currentColor"} strokeWidth={isLiked ? 0 : 2} />
            </div>
            <span className="action-label">{formatCompactNumber(likesCount)}</span>
          </button>
          <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); setShowComments(true); }}>
            <div className="icon-circle">
              <MessageSquare size={28} color="currentColor" />
            </div>
            <span className="action-label">{formatCompactNumber(commentsCount)}</span>
          </button>
          <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); setShowShare(true); }}>
            <div className="icon-circle">
              <Send size={28} color="currentColor" />
            </div>
          </button>
          <button className="reel-action-btn" onClick={handleSave}>
            <div className="icon-circle">
              <Bookmark size={28} fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 0 : 2} color="currentColor" />
            </div>
          </button>
          <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); setShowMore(true); }}>
            <div className="icon-circle">
              <MoreHorizontal size={28} color="currentColor" />
            </div>
          </button>
          <img className="reel-music-disc" src={getAvatarForUser(reel.author, "User")} alt="Audio" />
        </div>
      </div>

      {showShare && (
        <ShareModal
          isOpen={showShare}
          onAddedToStory={handleAddedToStory}
          onClose={() => setShowShare(false)}
          payload={{
            body: "Shared a reel",
            sharedReel: reel._id || reel.id,
            media: reel.video
          }}
        />
      )}

      {showStoryToast && (
        <div className="story-added-toast" role="status" aria-live="polite">
          <span className="material-symbols-outlined filled">check_circle</span>
          Added to story
        </div>
      )}

      {showMore && (
        <div className="reel-modal-overlay" onClick={(e) => { e.stopPropagation(); setShowMore(false); }}>
          <div className="reel-mini-modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => {
              setShowMore(false);
              navigate(`/profile/${reel.author?.username || reel.author?.id}`);
            }}>About this account</button>
          </div>
        </div>
      )}

      {showComments && (
        <ReelCommentModal
          reel={reel}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentsCount(prev => prev + 1)}
          onCommentDeleted={() => setCommentsCount(prev => Math.max(prev - 1, 0))}
        />
      )}
    </article>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Send, Bookmark, MoreHorizontal, Loader2, Image, Volume2, VolumeX, Play, Pause } from "lucide-react";
import ShareModal from "../common/ShareModal";
import ConfirmModal from "../common/ConfirmModal";
import PostModal from "./PostModal";

import { useAuth } from "../../hooks/useAuth";
import { followService } from "../../services/followService";
import { postService } from "../../services/postService";
import { reelService } from "../../services/reelService";
import {
  createOptimisticPost,
  getApiErrorMessage,
  getAuthorId,
  getPostAuthorName,
  getPostAvatar,
  getPostCaption,
  getPostCommentCount,
  getPostLikeCount,
  getPostLocation,
  getPostMedia,
  getPostTimestamp,
  isOwnResource,
  isVideoMedia,
  isReel
} from "../../utils/helpers";
import CommentSection from "./CommentSection";
import LikeButton from "./LikeButton";

let globalMuted = true;

export default function PostCard({ onRemove, post }) {
  const { user } = useAuth();
  const [currentPost, setCurrentPost] = useState(() => createOptimisticPost(post));
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLikePending, setIsLikePending] = useState(false);
  const [isSavePending, setIsSavePending] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  // Video autoplay & controls state
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(globalMuted);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    setCurrentPost(createOptimisticPost(post));
    setError("");
    setIsCaptionExpanded(false);
  }, [post]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (videoRef.current) {
              videoRef.current.muted = globalMuted;
              videoRef.current.volume = volume;
              setIsMuted(globalMuted);
              videoRef.current.play().catch((err) => console.log("Autoplay blocked:", err));
            }
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleVideoClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPostReel) {
      navigate(`/reels?reelId=${currentPost.id}`);
      return;
    }
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch((err) => console.log("Play failed:", err));
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleMuteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextMuted = !isMuted;
    globalMuted = nextMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = volume;
      }
    }
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
    }
    if (newVol > 0) {
      setIsMuted(false);
      globalMuted = false;
      if (videoRef.current) {
        videoRef.current.muted = false;
      }
    } else {
      setIsMuted(true);
      globalMuted = true;
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  };

  const media = getPostMedia(currentPost);
  const isPostReel = isReel(currentPost);
  const isOwnPost = isOwnResource(getAuthorId(currentPost.author), user?.id);
  const authorId = getAuthorId(currentPost.author);
  const authorUsername = currentPost.author?.username || getPostAuthorName(currentPost);
  const caption = getPostCaption(currentPost);
  const captionPreview = caption.length > 165 ? `${caption.slice(0, 165).trimEnd()}...` : caption;

  async function handleLike() {
    setIsLikePending(true);
    setError("");

    try {
      const result = isPostReel 
        ? await reelService.toggleLike(currentPost.id)
        : await postService.toggleLike(currentPost.id);
        
      setCurrentPost((existingPost) => ({
        ...existingPost,
        likedByViewer: result.liked,
        likesCount: result.likesCount
      }));
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to update the like right now."));
    } finally {
      setIsLikePending(false);
    }
  }

  async function handleSave() {
    setIsSavePending(true);
    setError("");

    try {
      const result = isPostReel
        ? await reelService.toggleSave(currentPost.id)
        : await postService.toggleSave(currentPost.id);

      setCurrentPost((existingPost) => ({
        ...existingPost,
        savedByViewer: result.saved,
        savesCount: result.savesCount
      }));
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to update saved posts right now."));
    } finally {
      setIsSavePending(false);
    }
  }

  async function handleDelete() {

    setIsDeleting(true);
    setError("");

    try {
      if (isPostReel) {
        await reelService.remove(currentPost.id);
      } else {
        await postService.remove(currentPost.id);
      }
      onRemove?.(currentPost.id);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to delete this post."));
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  }

  async function handleFollowAuthor(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!authorId || isOwnPost || isFollowPending) {
      return;
    }

    const nextFollowingState = !currentPost.author?.isFollowing;
    setIsFollowPending(true);
    setCurrentPost((existingPost) => ({
      ...existingPost,
      author: {
        ...existingPost.author,
        isFollowing: nextFollowingState
      }
    }));

    try {
      const result = await followService.toggle(authorId);
      setCurrentPost((existingPost) => ({
        ...existingPost,
        author: {
          ...existingPost.author,
          followersCount: result.followersCount,
          isFollowing: result.following
        }
      }));
    } catch (caughtError) {
      setCurrentPost((existingPost) => ({
        ...existingPost,
        author: {
          ...existingPost.author,
          isFollowing: !nextFollowingState
        }
      }));
      setError(getApiErrorMessage(caughtError, "Unable to update follow status right now."));
    } finally {
      setIsFollowPending(false);
    }
  }

  return (
    <article className="post-card">
      <header className="post-card__header">
        <Link className="post-card__author" to={`/profile/${currentPost.author?.username || currentPost.author?.id}`}>
          <img
            alt={getPostAuthorName(currentPost)}
            className="post-card__avatar"
            src={getPostAvatar(currentPost)}
          />
          <div className="post-card__author-copy">
            <div className="post-card__author-line">
              <h3>{authorUsername}</h3>
              <span className="post-card__dot">•</span>
              <span className="post-card__time">{getPostTimestamp(currentPost)}</span>
            </div>
            {getPostLocation(currentPost) !== "Global" ? (
              <p>{getPostLocation(currentPost)}</p>
            ) : null}
          </div>
        </Link>
        <div className="post-card__header-actions">
          {!isOwnPost ? (
            <button
              className={`post-card__follow-btn ${currentPost.author?.isFollowing ? "is-following" : ""}`}
              disabled={isFollowPending}
              onClick={handleFollowAuthor}
              type="button"
            >
              {isFollowPending ? "..." : currentPost.author?.isFollowing ? "Following" : "Follow"}
            </button>
          ) : null}
          <button 
            className="post-card__more-btn" 
            disabled={isDeleting} 
            onClick={() => setShowMoreMenu(true)} 
            type="button"
          >
            {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <MoreHorizontal size={20} />}
          </button>
        </div>
      </header>

      {media && isVideoMedia(media) ? (
        <div className={`post-card__video-wrapper ${isPlaying ? "is-playing" : "is-paused"}`}>
          <video
            ref={videoRef}
            className={isPostReel ? "post-card__cover post-card__cover--reel" : "post-card__cover"}
            preload="metadata"
            src={media.url}
            loop
            playsInline
            muted={isMuted}
            onClick={handleVideoClick}
          />
          
          <button className="post-card__video-center-btn" onClick={handleVideoClick} type="button" aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause size={32} fill="white" color="white" /> : <Play size={32} fill="white" color="white" />}
          </button>

          <div className="post-card__video-sound-control">
            <input 
              className="post-card__video-volume-slider"
              max="1"
              min="0"
              onChange={handleVolumeChange}
              step="0.05"
              type="range"
              value={isMuted ? 0 : volume}
            />
            <button className="post-card__video-mute-btn" onClick={handleMuteToggle} type="button" aria-label={isMuted ? "Unmute" : "Mute"}>
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>
      ) : null}

      {media && !isVideoMedia(media) ? (
        <img
          alt={getPostCaption(currentPost) || getPostAuthorName(currentPost)}
          className="post-card__cover"
          src={media.url}
          onClick={() => {
            if (isPostReel) {
              navigate(`/reels?reelId=${currentPost.id}`);
            } else {
              setIsModalOpen(true);
            }
          }}
          style={{ cursor: 'pointer' }}
        />
      ) : null}

      {!media ? (
        <div className="post-card__cover post-card__cover--empty">
          <Image size={48} />
          <p>No media attached</p>
        </div>
      ) : null}

      <div className="post-card__body">
        <div className="post-card__metrics">
          <div className="metric-cluster">
            <LikeButton
              count={getPostLikeCount(currentPost)}
              disabled={isLikePending}
              liked={currentPost.likedByViewer}
              onClick={handleLike}
            />
            <button className="metric-button" type="button" onClick={() => setIsModalOpen(true)}>
              <MessageSquare size={24} />
              <span>{getPostCommentCount(currentPost)}</span>
            </button>
            <button 
              className="metric-button" 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsShareOpen(true);
              }}
            >
              <Send size={24} />
            </button>
          </div>
          <button className="icon-button" disabled={isSavePending} onClick={handleSave} type="button">
            <Bookmark 
              size={24}
              className={currentPost.savedByViewer ? "metric-button__liked" : ""}
              fill={currentPost.savedByViewer ? "currentColor" : "none"}
            />
          </button>
        </div>

        <p className="post-card__caption">
          <strong>{authorUsername}</strong>
          {" "}{isCaptionExpanded ? caption : captionPreview}
          {!isCaptionExpanded && caption.length > captionPreview.length ? (
            <span 
              className="post-card__more-caption" 
              onClick={() => setIsCaptionExpanded(true)}
              style={{ cursor: "pointer", marginLeft: "4px" }}
            >
              more
            </span>
          ) : null}
        </p>

        {error ? <p className="form-error post-card__error">{error}</p> : null}


      </div>
      
      {isShareOpen && (
        <ShareModal 
          isOpen={isShareOpen} 
          onClose={() => setIsShareOpen(false)} 
          payload={{ 
            body: isReel(currentPost) ? "Shared a reel" : "Shared a post",
            sharedPost: isReel(currentPost) ? undefined : currentPost._id || currentPost.id,
            sharedReel: isReel(currentPost) ? currentPost._id || currentPost.id : undefined,
            media: getPostMedia(currentPost)
          }} 
        />
      )}

      <PostModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        post={currentPost}
        onPostUpdated={(updated) => {
          if (updated.deleted) {
            onRemove?.(updated.id);
          } else {
            setCurrentPost(prev => ({ ...prev, ...updated }));
          }
        }}
      />

      <ConfirmModal 
        isOpen={isConfirmOpen}
        isLoading={isDeleting}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Post?"
        message="Are you sure you want to delete this permanently? This action cannot be undone."
      />

      {showMoreMenu && (
        <div className="reel-modal-overlay" onClick={() => setShowMoreMenu(false)} style={{ alignItems: "center", justifyContent: "center" }}>
          <div className="reel-mini-modal" onClick={(e) => e.stopPropagation()}>
            {isOwnPost ? (
              <button 
                onClick={() => {
                  setShowMoreMenu(false);
                  setIsConfirmOpen(true);
                }} 
                style={{ color: "var(--danger)", fontWeight: "600" }}
              >
                Delete Post
              </button>
            ) : (
              <>
                <button 
                  onClick={() => {
                    setShowMoreMenu(false);
                    alert("Thank you for your report. We will review this post.");
                  }} 
                  style={{ color: "var(--danger)", fontWeight: "600" }}
                >
                  Report Post
                </button>
                <button 
                  onClick={() => {
                    setShowMoreMenu(false);
                    navigator.clipboard.writeText(`${window.location.origin}/post/${currentPost.id}`);
                    alert("Link copied to clipboard!");
                  }}
                >
                  Copy Link
                </button>
              </>
            )}
            <button onClick={() => setShowMoreMenu(false)}>Cancel</button>
          </div>
        </div>
      )}
    </article>
  );
}

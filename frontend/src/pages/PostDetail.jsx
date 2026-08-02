import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { postService } from "../services/postService";
import { reelService } from "../services/reelService";
import { commentService } from "../services/commentService";
import { followService } from "../services/followService";
import {
  getAvatarForUser,
  getPostAuthorName,
  getPostCaption,
  getPostLocation,
  getPostMedia,
  getPostTimestamp,
  isVideoMedia,
  getCommentAuthorLabel,
  getCommentMeta,
  getCommentId,
  isOwnResource,
  isReel,
  formatCompactNumber
} from "../utils/helpers";
import Loader from "../components/common/Loader";
import CommentIcon from "../components/common/CommentIcon";
import ShareModal from "../components/common/ShareModal";
import ConfirmModal from "../components/common/ConfirmModal";
import EmojiPicker from "emoji-picker-react";
import { Heart, Send, Bookmark, MoreHorizontal, ArrowLeft } from "lucide-react";

function CommentItemMenu({ onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} style={{ position: "relative", display: "inline-block", marginLeft: "auto" }}>
      <button
        aria-label="Comment options"
        className="icon-button comment-menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        type="button"
        style={{ padding: "2px", opacity: 0.7, background: "none", border: "none", cursor: "pointer", color: "inherit" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "16px", display: "block" }}>more_horiz</span>
      </button>

      {open && (
        <div className="comment-dropdown modern-glass animate-in" style={{
          position: "absolute",
          right: 0,
          top: "100%",
          zIndex: 60,
          background: "var(--surface-card, #1c1c1e)",
          border: "1px solid var(--surface-outline, #333)",
          borderRadius: "8px",
          padding: "4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
        }}>
          <button
            className="comment-dropdown-item danger"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: "var(--danger, #ff453a)",
              padding: "6px 12px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: "4px",
              width: "100%",
              whiteSpace: "nowrap"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLikePending, setIsLikePending] = useState(false);
  const [isSavePending, setIsSavePending] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("focusComment") === "true";
  });

  const videoRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("focusComment") === "true") {
      setShowCommentForm(true);
      setTimeout(() => {
        document.getElementById("comment-input")?.focus();
      }, 150);
    }
  }, [location.search]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (postId) {
      loadPostDetail(postId);
    }
  }, [postId]);

  async function loadPostDetail(id) {
    setIsLoading(true);
    try {
      let data;
      try {
        data = await postService.getById(id);
      } catch (e) {
        data = await reelService.getById(id);
      }
      setPost(data);
      setIsFollowingAuthor(Boolean(data.author?.isFollowing));
      loadComments(id);
    } catch (err) {
      console.error("Failed to load post detail:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadComments(id) {
    setIsLoadingComments(true);
    try {
      const response = await commentService.list(id, { limit: 100 });
      setComments(response.items || []);
    } catch (e) {
      console.error("Failed to load comments:", e);
    } finally {
      setIsLoadingComments(false);
    }
  }

  async function handleLike(e) {
    e?.stopPropagation();
    if (!post || isLikePending) return;
    setIsLikePending(true);
    const newLiked = !post.likedByViewer;
    const newCount = newLiked ? (post.likesCount || 0) + 1 : Math.max((post.likesCount || 0) - 1, 0);

    setPost((prev) => ({ ...prev, likedByViewer: newLiked, likesCount: newCount }));

    try {
      const isPostReel = isReel(post);
      if (isPostReel) {
        await reelService.toggleLike(post.id || post._id);
      } else {
        await postService.toggleLike(post.id || post._id);
      }
    } catch (err) {
      setPost((prev) => ({ ...prev, likedByViewer: !newLiked, likesCount: post.likesCount }));
    } finally {
      setIsLikePending(false);
    }
  }

  async function handleSave(e) {
    e?.stopPropagation();
    if (!post || isSavePending) return;
    setIsSavePending(true);
    const newSaved = !post.savedByViewer;
    setPost((prev) => ({ ...prev, savedByViewer: newSaved }));

    try {
      const isPostReel = isReel(post);
      if (isPostReel) {
        await reelService.toggleSave(post.id || post._id);
      } else {
        await postService.toggleSave(post.id || post._id);
      }
    } catch (err) {
      setPost((prev) => ({ ...prev, savedByViewer: !newSaved }));
    } finally {
      setIsSavePending(false);
    }
  }

  async function handleFollow(e) {
    e?.stopPropagation();
    const authorId = post.author?.id || post.author?._id;
    if (!authorId || isFollowPending) return;

    setIsFollowPending(true);
    const nextState = !isFollowingAuthor;
    setIsFollowingAuthor(nextState);

    try {
      const result = await followService.toggle(authorId);
      setIsFollowingAuthor(Boolean(result.following));
    } catch (err) {
      setIsFollowingAuthor(!nextState);
    } finally {
      setIsFollowPending(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!draft.trim() || isSubmitting || !post) return;
    setIsSubmitting(true);

    try {
      const created = await commentService.create(post.id || post._id, { content: draft.trim() });
      setComments((prev) => [...prev, created]);
      setPost((prev) => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }));
      setDraft("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await commentService.remove(commentId);
      setComments((prev) => prev.filter((c) => getCommentId(c) !== commentId));
      setPost((prev) => ({ ...prev, commentsCount: Math.max((prev.commentsCount || 0) - 1, 0) }));
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  }

  async function handleDeletePost() {
    if (!post || isDeletePending) return;
    setIsDeletePending(true);

    try {
      const isPostReel = isReel(post);
      if (isPostReel) {
        await reelService.remove(post.id || post._id);
      } else {
        await postService.remove(post.id || post._id);
      }
      navigate(-1);
    } catch (err) {
      console.error("Failed to delete post:", err);
    } finally {
      setIsDeletePending(false);
    }
  }

  const handleMediaClick = (e) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      if (!post.likedByViewer) handleLike(e);
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 800);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        if (videoRef.current) {
          if (videoRef.current.paused) videoRef.current.play();
          else videoRef.current.pause();
        }
      }, 250);
    }
  };

  if (isLoading) {
    return <Loader label="Loading post..." />;
  }

  if (!post) {
    return (
      <div className="single-post-view single-post-view--empty">
        <header className="single-post-header">
          <button className="icon-button" onClick={() => navigate(-1)} type="button">
            <ArrowLeft size={22} />
          </button>
          <h2>Post</h2>
          <div style={{ width: 24 }} />
        </header>
        <div className="empty-post-state">
          <span className="material-symbols-outlined">visibility_off</span>
          <h3>Post Unavailable</h3>
          <p>This post may have been deleted or is no longer accessible.</p>
          <button className="btn-primary-ig" onClick={() => navigate(-1)} type="button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwnAuthor = user && post && isOwnResource(post.author?.id || post.author?._id || post.author, user.id || user._id || user);
  const isAuthorPrivate = Boolean(post.author?.isPrivate);

  if (isAuthorPrivate && !isOwnAuthor && !isFollowingAuthor) {
    return (
      <div className="single-post-view single-post-view--empty">
        <header className="single-post-header">
          <button className="icon-button" onClick={() => navigate(-1)} type="button">
            <ArrowLeft size={22} />
          </button>
          <h2>Private Post</h2>
          <div style={{ width: 24 }} />
        </header>
        <div className="empty-post-state" style={{ gap: "0.75rem", paddingTop: "4rem" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", border: "2px solid var(--text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "36px" }}>lock</span>
          </div>
          <h3 style={{ margin: 0, fontWeight: 700 }}>This Post is Private</h3>
          <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "0.9rem" }}>
            Follow <strong>@{post.author?.username}</strong> to view their photos and videos.
          </p>
        </div>
      </div>
    );
  }

  const mediaList = Array.isArray(post.media) && post.media.length > 0
    ? post.media
    : (post.video ? [post.video] : (post.media ? [post.media] : []));

  const currentMediaItem = mediaList[activeMediaIndex] || mediaList[0] || post.media || post.video;
  const currentMediaUrl = typeof currentMediaItem === "string"
    ? currentMediaItem
    : (currentMediaItem?.url || post.url || post.video?.url || "");

  const isVideo = (currentMediaItem && typeof currentMediaItem === "object" && currentMediaItem.type === "video") ||
    Boolean(post.video) ||
    currentMediaUrl.match(/\.(mp4|webm|ogg)$/i) ||
    isReel(post);

  const author = post.author || {};
  const isOwnPost = author.id && user?.id && String(author.id) === String(user.id);
  const caption = getPostCaption(post);
  const locationText = getPostLocation(post);
  const timestamp = getPostTimestamp(post);

  return (
    <div className="single-post-page-wrap">
      <header className="single-post-header modern-glass">
        <button className="icon-button back-btn" onClick={() => navigate(-1)} type="button" title="Back">
          <ArrowLeft size={22} />
        </button>
        <h2 className="single-post-title">Post</h2>
        <div style={{ width: 24 }} />
      </header>

      <main className="single-post-container">
        {/* Author Header Row */}
        <div className="single-post-author-row">
          <Link className="author-info-link" to={`/profile/${author.username || author.id}`}>
            <img
              alt={getPostAuthorName(post)}
              className="author-avatar"
              src={getAvatarForUser(author, getPostAuthorName(post))}
            />
            <div className="author-text">
              <strong className="author-name">{getPostAuthorName(post)}</strong>
              {locationText && <span className="author-location">{locationText}</span>}
            </div>
          </Link>

          <div className="author-actions">
            {!isOwnPost && author.id && (
              <button
                className={`follow-btn-sm ${isFollowingAuthor ? "following" : ""}`}
                disabled={isFollowPending}
                onClick={handleFollow}
                type="button"
              >
                {isFollowPending ? "..." : isFollowingAuthor ? "Following" : "Follow"}
              </button>
            )}

            {isOwnPost && (
              <button
                aria-label="Options"
                className="icon-button"
                onClick={() => setShowConfirmDelete(true)}
                type="button"
              >
                <MoreHorizontal size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Media Container */}
        <div className="single-post-media-box" onClick={handleMediaClick}>
          {isVideo ? (
            <video
              autoPlay
              className="single-post-media-element"
              controls
              loop
              playsInline
              ref={videoRef}
              src={currentMediaUrl}
            />
          ) : (
            <img
              alt={caption || "Post Media"}
              className="single-post-media-element"
              src={currentMediaUrl}
            />
          )}

          {showHeartPop && (
            <div className="single-post-heart-pop">
              <span className="material-symbols-outlined filled">favorite</span>
            </div>
          )}

          {mediaList.length > 1 && (
            <div className="single-post-dots">
              {mediaList.map((_, idx) => (
                <span
                  className={`dot ${idx === activeMediaIndex ? "active" : ""}`}
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMediaIndex(idx);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="single-post-actions-bar">
          <div className="left-actions">
            <button
              className={`action-btn ${post.likedByViewer ? "liked" : ""}`}
              onClick={handleLike}
              type="button"
            >
              <Heart
                color={post.likedByViewer ? "#ed4956" : "currentColor"}
                fill={post.likedByViewer ? "#ed4956" : "none"}
                size={26}
                strokeWidth={post.likedByViewer ? 0 : 2}
              />
              <span className="action-count">{formatCompactNumber(post.likesCount || 0)}</span>
            </button>

            <button 
              className="action-btn" 
              onClick={() => {
                setShowCommentForm(true);
                setTimeout(() => document.getElementById("comment-input")?.focus(), 50);
              }} 
              type="button"
            >
              <CommentIcon color="currentColor" size={25} />
              <span className="action-count">{formatCompactNumber(post.commentsCount || 0)}</span>
            </button>

            <button className="action-btn" onClick={() => setShowShare(true)} type="button">
              <Send color="currentColor" size={24} />
            </button>
          </div>

          <button className="action-btn save-btn" onClick={handleSave} type="button">
            <Bookmark
              color="currentColor"
              fill={post.savedByViewer ? "currentColor" : "none"}
              size={24}
              strokeWidth={post.savedByViewer ? 0 : 2}
            />
          </button>
        </div>

        {/* Caption & Metadata */}
        <div className="single-post-caption-box">
          {caption && (
            <p className="caption-text">
              <strong className="author-username">{author.username}</strong> {caption}
            </p>
          )}
          {timestamp && <span className="timestamp-text">{timestamp}</span>}
        </div>

        {/* Comments Section */}
        <section className="single-post-comments-section">
          <h3 className="comments-heading">Comments ({comments.length})</h3>

          {isLoadingComments ? (
            <div className="comments-loading">
              <Loader label="Loading comments..." />
            </div>
          ) : comments.length > 0 ? (
            <div className="comments-list">
              {comments.map((comment) => {
                const commentId = getCommentId(comment);
                const commentAuthorName = getCommentAuthorLabel(comment);
                const isOwnComment = isOwnResource(comment.author?.id || comment.author?._id || comment.author, user?.id || user?._id || user);
                const canDelete = isOwnComment || isOwnPost;
                const authorUsername = typeof comment.author === 'object'
                  ? (comment.author?.username || comment.author?.id || comment.author?._id)
                  : comment.author;

                return (
                  <div className="single-comment-item" key={commentId}>
                    <Link to={`/profile/${authorUsername || ''}`}>
                      <img
                        alt={commentAuthorName}
                        className="comment-avatar"
                        src={getAvatarForUser(comment.author, commentAuthorName)}
                        style={{ cursor: 'pointer' }}
                      />
                    </Link>
                    <div className="comment-body">
                      <p>
                        <Link to={`/profile/${authorUsername || ''}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          <strong style={{ cursor: 'pointer' }}>{commentAuthorName}</strong>
                        </Link>{" "}
                        {comment.content}
                      </p>
                      <div className="comment-meta">
                        <span>{getCommentMeta(comment)}</span>
                        {canDelete && (
                          <CommentItemMenu onDelete={() => handleDeleteComment(commentId)} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-comments-text">No comments yet. Be the first to comment!</p>
          )}
        </section>

        {/* Sticky Comment Form (Only shown when comment button clicked) */}
        {showCommentForm && (
          <form className="single-post-comment-form modern-glass" onSubmit={handleAddComment}>
            <img
              alt={user?.username || "You"}
              className="user-comment-avatar"
              src={getAvatarForUser(user, user?.username || "You")}
            />

            <div className="single-post-input-pill">
              <div ref={emojiPickerRef} className="comment-emoji-wrapper">
                <button
                  type="button"
                  className="icon-button emoji-toggle-btn"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  title="Add Emoji"
                >
                  <span className="material-symbols-outlined">mood</span>
                </button>

                {showEmojiPicker && (
                  <div className="comment-emoji-popover">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setDraft((prev) => prev + emojiData.emoji);
                      }}
                      theme="dark"
                      width={280}
                      height={320}
                    />
                  </div>
                )}
              </div>

              <input
                id="comment-input"
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a comment..."
                type="text"
                value={draft}
              />

              <button className="post-comment-btn" disabled={!draft.trim() || isSubmitting} type="submit">
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        )}
      </main>

      {showShare && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          payload={{
            body: `Shared ${isReel(post) ? "a reel" : "a post"}`,
            sharedPost: post._id || post.id,
            media: mediaList[0]
          }}
        />
      )}

      {showConfirmDelete && (
        <ConfirmModal
          confirmLabel="Delete"
          isDanger
          isLoading={isDeletePending}
          isOpen={showConfirmDelete}
          message="Are you sure you want to delete this post permanently?"
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={handleDeletePost}
          title="Delete Post"
        />
      )}
    </div>
  );
}

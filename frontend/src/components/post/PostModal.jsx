import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ShareModal from "../common/ShareModal";
import ConfirmModal from "../common/ConfirmModal";
import { useAuth } from "../../hooks/useAuth";
import { postService } from "../../services/postService";
import { reelService } from "../../services/reelService";
import { commentService } from "../../services/commentService";
import {
  createOptimisticPost,
  getApiErrorMessage,
  getPostAuthorName,
  getPostAvatar,
  getPostCaption,
  getPostLocation,
  getPostMedia,
  getPostTimestamp,
  isVideoMedia,
  getCommentAuthorLabel,
  getAvatarForUser,
  getCommentMeta,
  getCommentId,
  isOwnResource,
  isReel
} from "../../utils/helpers";
import LikeButton from "./LikeButton";
import Loader from "../common/Loader";

/* Mini dropdown for each comment or post */
function ContentMenu({ onDelete, isDeletePending }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', marginLeft: 'auto' }}>
      <button
        className="icon-button comment-menu-btn"
        onClick={() => setOpen(o => !o)}
        style={{ opacity: 0.6, padding: '2px' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_horiz</span>
      </button>
      {open && (
        <div className="comment-dropdown">
          <button
            className="comment-dropdown-item danger"
            disabled={isDeletePending}
            onClick={() => { setOpen(false); onDelete(); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
            {isDeletePending ? "Deleting..." : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PostModal({ post, open, onClose, onPostUpdated }) {
  const { user } = useAuth();
  const [currentPost, setCurrentPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLikePending, setIsLikePending] = useState(false);
  const [isSavePending, setIsSavePending] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (post && open) {
      setCurrentPost(createOptimisticPost(post));
      loadComments(post.id);
    } else {
      setCurrentPost(null);
      setComments([]);
      setDraft("");
    }
  }, [post, open]);

  async function loadComments(postId) {
    setIsLoadingComments(true);
    try {
      const response = await commentService.list(postId, { limit: 100 });
      setComments(response.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingComments(false);
    }
  }

  async function handleLike() {
    if (!currentPost) return;
    setIsLikePending(true);
    try {
      const isPostReel = isReel(currentPost);
      const result = isPostReel 
        ? await reelService.toggleLike(currentPost.id)
        : await postService.toggleLike(currentPost.id);
        
      const updated = { ...currentPost, likedByViewer: result.liked, likesCount: result.likesCount };
      setCurrentPost(updated);
      onPostUpdated?.(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLikePending(false);
    }
  }

  async function handleDeletePost() {
    if (!currentPost) return;
    setIsDeletePending(true);
    try {
      const isPostReel = isReel(currentPost);
      if (isPostReel) {
        await reelService.remove(currentPost.id);
      } else {
        await postService.remove(currentPost.id);
      }
      onPostUpdated?.({ id: currentPost.id, deleted: true });
      onClose();
    } catch (e) {
      alert(getApiErrorMessage(e, "Failed to delete content."));
      setIsDeletePending(false);
      setIsConfirmDeleteOpen(false);
    }
  }

  async function handleSave() {
    if (!currentPost) return;
    setIsSavePending(true);
    try {
      const result = await postService.toggleSave(currentPost.id);
      const updated = { ...currentPost, savedByViewer: result.saved, savesCount: result.savesCount };
      setCurrentPost(updated);
      onPostUpdated?.(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavePending(false);
    }
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !currentPost) return;
    setIsSubmitting(true);
    try {
      const created = await commentService.create(currentPost.id, { content });
      setComments(prev => [...prev, created]);
      setDraft("");
      const updated = { ...currentPost, commentsCount: (currentPost.commentsCount || 0) + 1 };
      setCurrentPost(updated);
      onPostUpdated?.(updated);
    } catch (e) {
      console.error(getApiErrorMessage(e, "Failed to post comment."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await commentService.remove(commentId);
      setComments(prev => prev.filter(c => getCommentId(c) !== commentId));
      const updated = { ...currentPost, commentsCount: Math.max((currentPost.commentsCount || 0) - 1, 0) };
      setCurrentPost(updated);
      onPostUpdated?.(updated);
    } catch (e) {
      console.error(e);
    }
  }

  if (!open || !currentPost) return null;

  const media = getPostMedia(currentPost);

  return (
    /* Backdrop */
    <div className="post-backdrop" onClick={onClose} role="presentation">

      {/* Floating close button OUTSIDE the modal card */}
      <button
        className="post-backdrop-close"
        onClick={onClose}
        aria-label="Close"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      {/* Modal card */}
      <div
        className="instagram-post-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* LEFT: Media */}
        <div className="post-modal-media">
          {media && isVideoMedia(media) ? (
            <video className="post-modal-content" controls autoPlay loop muted src={media.url} />
          ) : media ? (
            <img className="post-modal-content" src={media.url} alt="Post" />
          ) : (
            <div className="post-modal-content empty-media">No Media</div>
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <div className="post-modal-sidebar">

          {/* Header — author + location only, no extra 3-dot cluttering top-right */}
          <div className="post-modal-header">
            <Link
              to={`/profile/${currentPost.author?.username || currentPost.author?.id}`}
              className="post-header-author"
              onClick={onClose}
            >
              <img src={getPostAvatar(currentPost)} alt={getPostAuthorName(currentPost)} className="author-avatar" />
              <div className="author-info">
                <strong>{currentPost.author?.username || getPostAuthorName(currentPost)}</strong>
                {getPostLocation(currentPost) !== "Global" && (
                  <span>{getPostLocation(currentPost)}</span>
                )}
              </div>
            </Link>

            {isOwnResource(currentPost.author?.id, user?.id) && (
              <ContentMenu onDelete={() => setIsConfirmDeleteOpen(true)} isDeletePending={isDeletePending} />
            )}
          </div>

          {/* Scrollable thread */}
          <div className="post-modal-thread">
            {/* Caption as first item */}
            {getPostCaption(currentPost) && (
              <div className="thread-item">
                <img src={getPostAvatar(currentPost)} alt="" className="thread-avatar" />
                <div className="thread-content">
                  <p>
                    <Link
                      to={`/profile/${currentPost.author?.username || currentPost.author?.id}`}
                      onClick={onClose}
                    >
                      <strong>{currentPost.author?.username || getPostAuthorName(currentPost)}</strong>
                    </Link>
                    {" "}{getPostCaption(currentPost)}
                  </p>
                  <span className="thread-time">{getPostTimestamp(currentPost)}</span>
                </div>
              </div>
            )}

            {/* Comments */}
            {isLoadingComments ? (
              <div style={{ padding: '1.5rem 0' }}><Loader /></div>
            ) : comments.length === 0 ? (
              <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
                No comments yet.
              </p>
            ) : (
              comments.map(comment => {
                const cid = getCommentId(comment);
                const isOwn = isOwnResource(comment?.author?.id, user?.id);
                return (
                  <div className="thread-item" key={cid}>
                    <img
                      src={getAvatarForUser(comment.author, getCommentAuthorLabel(comment))}
                      alt=""
                      className="thread-avatar"
                    />
                    <div className="thread-content" style={{ flex: 1, minWidth: 0 }}>
                      <p>
                        <strong>{comment.author?.username || getCommentAuthorLabel(comment)}</strong>
                        {" "}{comment.content}
                      </p>
                      <div className="thread-meta">
                        <span className="thread-time">{getCommentMeta(comment)}</span>
                      </div>
                    </div>
                    {isOwn && (
                      <ContentMenu onDelete={() => handleDeleteComment(cid)} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="post-modal-footer">
            <div className="post-actions-row">
              <div className="post-actions-left">
                <LikeButton
                  count={currentPost.likesCount || 0}
                  disabled={isLikePending}
                  liked={currentPost.likedByViewer}
                  onClick={handleLike}
                />
                <button
                  className="metric-button"
                  onClick={() => document.getElementById('modal-comment-input')?.focus()}
                >
                  <span className="material-symbols-outlined">chat_bubble</span>
                  <span>{currentPost.commentsCount || 0}</span>
                </button>
                <button
                  className="metric-button"
                  onClick={() => setIsShareOpen(true)}
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
              <button className="icon-button" disabled={isSavePending} onClick={handleSave}>
                <span className={
                  currentPost.savedByViewer
                    ? "material-symbols-outlined filled metric-button__liked"
                    : "material-symbols-outlined"
                }>bookmark</span>
              </button>
            </div>
            <p className="post-date">{getPostTimestamp(currentPost)}</p>
          </div>

          {/* Comment input */}
          <form className="post-modal-form" onSubmit={handleCommentSubmit}>
            <span className="material-symbols-outlined emoji-btn">mood</span>
            <input
              id="modal-comment-input"
              type="text"
              placeholder="Add a comment..."
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" disabled={!draft.trim() || isSubmitting} className="post-btn">
              {isSubmitting ? "..." : "Post"}
            </button>
          </form>
        </div>
      </div>

      {isShareOpen && (
        <ShareModal 
          isOpen={isShareOpen} 
          onClose={() => setIsShareOpen(false)} 
          payload={{ 
            body: isReel(currentPost) ? "Shared a reel" : "Shared a post", 
            sharedPost: currentPost.id,
            media: getPostMedia(currentPost)
          }} 
        />
      )}

      <ConfirmModal 
        isOpen={isConfirmDeleteOpen}
        isLoading={isDeletePending}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeletePost}
        title="Delete Post?"
        message="Are you sure you want to delete this permanently? This action cannot be undone."
      />
    </div>
  );
}

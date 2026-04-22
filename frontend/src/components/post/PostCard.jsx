import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ShareModal from "../common/ShareModal";
import ConfirmModal from "../common/ConfirmModal";

import { useAuth } from "../../hooks/useAuth";
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

export default function PostCard({ onRemove, post }) {
  const { user } = useAuth();
  const [currentPost, setCurrentPost] = useState(() => createOptimisticPost(post));
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLikePending, setIsLikePending] = useState(false);
  const [isSavePending, setIsSavePending] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    setCurrentPost(createOptimisticPost(post));
    setError("");
  }, [post]);

  const media = getPostMedia(currentPost);
  const isOwnPost = isOwnResource(getAuthorId(currentPost.author), user?.id);

  async function handleLike() {
    setIsLikePending(true);
    setError("");

    try {
      const isPostReel = isReel(currentPost);
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
      const result = await postService.toggleSave(currentPost.id);
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
      const isPostReel = isReel(currentPost);
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

  return (
    <article className="post-card">
      <header className="post-card__header">
        <Link className="post-card__author" to={`/profile/${currentPost.author?.username || currentPost.author?.id}`}>
          <img
            alt={getPostAuthorName(currentPost)}
            className="post-card__avatar"
            src={getPostAvatar(currentPost)}
          />
          <div>
            <h3>{getPostAuthorName(currentPost)}</h3>
            <p>
              {getPostTimestamp(currentPost)} / {getPostLocation(currentPost)}
            </p>
          </div>
        </Link>
        {isOwnPost ? (
          <button className="icon-button" disabled={isDeleting} onClick={() => setIsConfirmOpen(true)} type="button">
            <span className="material-symbols-outlined">
              {isDeleting ? "hourglass_top" : "delete"}
            </span>
          </button>
        ) : null}
      </header>

      {media && isVideoMedia(media) ? (
        <video className="post-card__cover" controls preload="metadata" src={media.url} />
      ) : null}

      {media && !isVideoMedia(media) ? (
        <img
          alt={getPostCaption(currentPost) || getPostAuthorName(currentPost)}
          className="post-card__cover"
          src={media.url}
        />
      ) : null}

      {!media ? (
        <div className="post-card__cover post-card__cover--empty">
          <span className="material-symbols-outlined">image</span>
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
            <button className="metric-button" type="button">
              <span className="material-symbols-outlined">chat_bubble</span>
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
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          <button className="icon-button" disabled={isSavePending} onClick={handleSave} type="button">
            <span
              className={
                currentPost.savedByViewer
                  ? "material-symbols-outlined filled metric-button__liked"
                  : "material-symbols-outlined"
              }
            >
              bookmark
            </span>
          </button>
        </div>

        <p className="post-card__caption">
          <strong>{getPostAuthorName(currentPost)}</strong> {getPostCaption(currentPost)}
        </p>

        {error ? <p className="form-error post-card__error">{error}</p> : null}

        <CommentSection
          count={getPostCommentCount(currentPost)}
          onCountChange={(nextCount) =>
            setCurrentPost((existingPost) => ({
              ...existingPost,
              commentsCount: nextCount
            }))
          }
          postId={currentPost.id}
        />
      </div>
      
      {isShareOpen && (
        <ShareModal 
          isOpen={isShareOpen} 
          onClose={() => setIsShareOpen(false)} 
          payload={{ 
            body: "Shared a post", 
            sharedPost: currentPost._id || currentPost.id,
            media: getPostMedia(currentPost)
          }} 
        />
      )}

      <ConfirmModal 
        isOpen={isConfirmOpen}
        isLoading={isDeleting}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Post?"
        message="Are you sure you want to delete this permanently? This action cannot be undone."
      />
    </article>
  );
}

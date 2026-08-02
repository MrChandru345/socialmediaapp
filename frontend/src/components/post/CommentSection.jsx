import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";

import { useAuth } from "../../hooks/useAuth";
import { commentService } from "../../services/commentService";
import {
  getApiErrorMessage,
  getAvatarForUser,
  getCommentAuthorLabel,
  getCommentId,
  getCommentMeta,
  isOwnResource
} from "../../utils/helpers";
import Button from "../common/Button";
import Loader from "../common/Loader";

export default function CommentSection({ count, onCountChange, postId, postAuthorId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedPostId, setLoadedPostId] = useState("");
  const [removingCommentId, setRemovingCommentId] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadComments() {
    setIsLoading(true);
    setError("");

    try {
      const response = await commentService.list(postId, { limit: 20 });
      setComments(response.items || []);
      setLoadedPostId(postId);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to load comments."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggle() {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);

    if (nextExpanded && loadedPostId !== postId) {
      await loadComments();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const content = draft.trim();
    if (!content) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const createdComment = await commentService.create(postId, { content });
      setComments((currentComments) => [createdComment, ...currentComments]);
      onCountChange?.(count + 1);
      setDraft("");
      setIsExpanded(true);
      setLoadedPostId(postId);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to add comment."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(commentId) {
    setRemovingCommentId(commentId);
    setError("");

    try {
      await commentService.remove(commentId);
      setComments((currentComments) =>
        currentComments.filter((comment) => getCommentId(comment) !== commentId)
      );
      onCountChange?.(Math.max(count - 1, 0));
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to delete comment."));
    } finally {
      setRemovingCommentId("");
    }
  }

  return (
    <div className="comment-preview">
      <button className="link-button" onClick={handleToggle} type="button">
        {isExpanded ? "Hide comments" : `View all ${count} comments`}
      </button>

      {isExpanded ? (
        <div className="comment-thread">
          {isLoading ? <Loader label="Loading comments..." /> : null}

          {!isLoading && comments.length === 0 ? (
            <p className="comment-thread__empty">No comments yet. Start the conversation.</p>
          ) : null}

          {!isLoading
            ? comments.map((comment) => {
                const commentId = getCommentId(comment);
                const isOwnComment = isOwnResource(comment?.author?.id || comment?.author?._id || comment?.author, user?.id || user?._id || user);
                const isPostAuthor = postAuthorId && isOwnResource(postAuthorId, user?.id || user?._id || user);
                const canDeleteComment = isOwnComment || isPostAuthor;
                const authorUsername = typeof comment.author === 'object'
                  ? (comment.author?.username || comment.author?.id || comment.author?._id)
                  : comment.author;

                return (
                  <div className="comment-item" key={commentId}>
                    <Link to={`/profile/${authorUsername || ''}`}>
                      <img
                        alt={getCommentAuthorLabel(comment)}
                        className="comment-item__avatar"
                        src={getAvatarForUser(comment.author, getCommentAuthorLabel(comment))}
                        style={{ cursor: 'pointer' }}
                      />
                    </Link>
                    <div className="comment-item__body">
                      <p>
                        <Link to={`/profile/${authorUsername || ''}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          <strong style={{ cursor: 'pointer' }}>{getCommentAuthorLabel(comment)}</strong>
                        </Link>
                        {" "}{comment.content}
                      </p>
                      <div className="comment-item__meta">
                        <span>{getCommentMeta(comment)}</span>
                        {canDeleteComment ? (
                          <div style={{ position: "relative", display: "inline-block", marginLeft: "auto" }}>
                            <button
                              aria-label="Delete comment"
                              className="link-button comment-item__delete"
                              disabled={removingCommentId === commentId}
                              onClick={() => handleDelete(commentId)}
                              type="button"
                              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 6px" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                              <span>{removingCommentId === commentId ? "..." : "Delete"}</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            : null}

          <form className="instagram-comment-box" onSubmit={handleSubmit}>
            <div ref={emojiRef} className="comment-emoji-wrapper">
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

            <textarea
              className="instagram-comment-input"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a comment..."
              rows="1"
              value={draft}
            />

            {draft.trim() ? (
              <button
                className="instagram-comment-submit"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "..." : "Post"}
              </button>
            ) : null}
            {error ? <p className="form-error instagram-comment-error">{error}</p> : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}

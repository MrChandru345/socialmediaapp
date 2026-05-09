import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { commentService } from "../../services/commentService";
import { useAuth } from "../../hooks/useAuth";
import { getAvatarForUser, getCommentAuthorLabel, getCommentMeta, getCommentId, isOwnResource } from "../../utils/helpers";
import Loader from "../common/Loader";

import EmojiPicker from "emoji-picker-react";

export default function ReelCommentModal({ reel, onClose, onCommentAdded, onCommentDeleted }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [likedComments, setLikedComments] = useState({});

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const response = await commentService.list(reel.id || reel._id, { limit: 100 });
        setComments(response.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    if (reel) {
      load();
    }
  }, [reel]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await commentService.create(reel.id || reel._id, { content: draft.trim() });
      setComments(prev => [...prev, created]);
      setDraft("");
      setShowEmojiPicker(false);
      onCommentAdded?.(created);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(commentId) {
    try {
      await commentService.remove(commentId);
      setComments(prev => prev.filter(c => getCommentId(c) !== commentId));
      onCommentDeleted?.(commentId);
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleLike(commentId) {
    // Optimistic UI update
    setComments(prev => prev.map(c => {
      if (getCommentId(c) === commentId) {
        const isLiked = c.likedByViewer;
        return {
          ...c,
          likedByViewer: !isLiked,
          likesCount: isLiked ? Math.max(0, (c.likesCount || 1) - 1) : (c.likesCount || 0) + 1
        };
      }
      return c;
    }));

    try {
      const result = await commentService.toggleLike(commentId);
      // Sync with real data from backend
      setComments(prev => prev.map(c => {
        if (getCommentId(c) === commentId) {
          return {
            ...c,
            likedByViewer: result.liked,
            likesCount: result.likesCount
          };
        }
        return c;
      }));
    } catch (e) {
      console.error("Failed to toggle like:", e);
      // Revert optimistic update on failure
      setComments(prev => prev.map(c => {
        if (getCommentId(c) === commentId) {
          const isLiked = !c.likedByViewer; // Current state is optimistic, so revert
          return {
            ...c,
            likedByViewer: isLiked,
            likesCount: isLiked ? (c.likesCount || 0) + 1 : Math.max(0, (c.likesCount || 1) - 1)
          };
        }
        return c;
      }));
    }
  }

  function handleEmojiClick(emojiObject) {
    setDraft((prev) => prev + emojiObject.emoji);
  }

  return (
    <div className="reel-modal-overlay" onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ alignItems: "center" }}>
      <div className="reel-comments-drawer" style={{ height: "70vh", maxWidth: "450px", borderRadius: "16px", background: "#262626" }} onClick={e => e.stopPropagation()}>
        
        <div className="drawer-header" style={{ position: "relative", justifyContent: "center", borderBottom: "1px solid #363636", padding: "16px" }}>
          <button onClick={onClose} style={{ position: "absolute", left: "16px", background: "none", border: "none", color: "white", cursor: "pointer", display: "flex" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>close</span>
          </button>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "white" }}>Comments</h3>
        </div>
        
        <div className="drawer-body" style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {isLoading ? (
            <Loader />
          ) : comments.length === 0 ? (
            <div style={{ textAlign: "center", color: "#a8a8a8", marginTop: "20px" }}>No comments yet.</div>
          ) : (
            comments.map(comment => {
              const cid = getCommentId(comment);
              const isLiked = comment.likedByViewer;
              const likesCount = comment.likesCount || 0;
              return (
                <div className="mock-comment" key={cid} style={{ gap: "12px", alignItems: "flex-start" }}>
                  <Link to={`/profile/${comment.author?.username || comment.author?.id}`} onClick={onClose}>
                    <img 
                      src={getAvatarForUser(comment.author, getCommentAuthorLabel(comment))} 
                      alt="" 
                      style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} 
                    />
                  </Link>
                  <div style={{ flex: 1, color: "white" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <Link to={`/profile/${comment.author?.username || comment.author?.id}`} onClick={onClose} style={{ textDecoration: "none", color: "inherit" }}>
                        <strong style={{ fontSize: "14px", fontWeight: "600" }}>{comment.author?.username || getCommentAuthorLabel(comment)}</strong>
                      </Link>
                      <span style={{ fontSize: "12px", color: "#a8a8a8" }}>{getCommentMeta(comment)}</span>
                    </div>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", lineHeight: "1.4" }}>{comment.content}</p>
                    <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#a8a8a8", fontWeight: "600" }}>
                      <span>Reply</span>
                      {isOwnResource(comment.author?.id, user?.id) && (
                        <span style={{ cursor: "pointer" }} onClick={() => handleDelete(cid)}>Delete</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: "#a8a8a8" }}>
                    <button 
                      onClick={() => toggleLike(cid)}
                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}
                    >
                      <span 
                        className={`material-symbols-outlined ${isLiked ? "filled" : ""}`} 
                        style={{ fontSize: "16px", color: isLiked ? "#ed4956" : "#a8a8a8" }}
                      >
                        favorite
                      </span>
                    </button>
                    {likesCount > 0 && <span style={{ fontSize: "10px" }}>{likesCount}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ position: "relative" }}>
          {showEmojiPicker && (
            <div style={{ position: "absolute", bottom: "100%", right: "16px", zIndex: 100 }}>
              <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ padding: "16px", borderTop: "1px solid #363636", display: "flex", gap: "12px", alignItems: "center" }}>
            <img 
              src={getAvatarForUser(user, "User")} 
              alt="Avatar" 
              style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} 
            />
            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={draft}
                onChange={e => setDraft(e.target.value)}
                style={{ 
                  width: "100%", 
                  background: "transparent", 
                  border: "1px solid #555", 
                  borderRadius: "24px", 
                  padding: "10px 40px 10px 16px", 
                  color: "white",
                  outline: "none",
                  fontSize: "14px"
                }}
              />
              <span 
                className="material-symbols-outlined" 
                style={{ position: "absolute", right: "12px", color: "#a8a8a8", cursor: "pointer" }}
                onClick={() => setShowEmojiPicker(prev => !prev)}
              >
                mood
              </span>
            </div>
            {draft.trim() && (
              <button type="submit" disabled={isSubmitting} style={{ background: "none", border: "none", color: "#0095f6", fontWeight: "600", cursor: "pointer" }}>
                Post
              </button>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}

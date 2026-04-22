import { useEffect, useState } from "react";
import { chatService } from "../../services/chatService";
import { userService } from "../../services/userService";
import { storyService } from "../../services/storyService";
import { getAuthorId, getAvatarForUser, getDisplayName } from "../../utils/helpers";
import Modal from "./Modal";
import Button from "./Button";
import Loader from "./Loader";

export default function ShareModal({ isOpen, onClose, payload }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInitialUsers();
      setSelectedUsers(new Set());
      setCustomMessage("");
      setQuery("");
      setIsSending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !query.trim()) return;
    
    const timeout = setTimeout(() => {
      search(query);
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, isOpen]);

  async function loadInitialUsers() {
    setIsLoading(true);
    try {
      const following = await userService.getFollowing();
      setUsers(following || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function search(q) {
    setIsLoading(true);
    try {
      const results = await userService.search(q);
      setUsers(results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleUserSelection(userId) {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  async function handleBatchSend() {
    if (selectedUsers.size === 0) return;
    setIsSending(true);

    const fullPayload = {
      ...payload,
      body: customMessage.trim() ? customMessage : payload.body || "Shared a post",
    };

    try {
      const promises = Array.from(selectedUsers).map(userId => 
        chatService.sendMessage(userId, fullPayload)
      );
      await Promise.all(promises);
      onClose();
    } catch (error) {
      console.error("Failed to forward/share message", error);
    } finally {
      setIsSending(false);
    }
  }

  async function handleAddToStory() {
    if (!payload.media) return;
    setIsSending(true);

    try {
      await storyService.create({
        mediaUrl: payload.media.url,
        mediaType: payload.media.type,
        sharedPost: payload.sharedPost,
        caption: ""
      });
      onClose();
    } catch (error) {
      console.error("Failed to add to story", error);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Modal onClose={onClose} open={isOpen} title="Share">
      <div className="share-modal-content instagram-share-modal">
        <div className="search-bar-wrapper" style={{ padding: "0 16px 12px", borderBottom: "1px solid var(--surface-outline)" }}>
          <div style={{ position: "relative" }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)", fontSize: "20px" }}>search</span>
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 10px 10px 40px",
                borderRadius: "8px",
                border: "none",
                background: "var(--surface-low)",
                color: "var(--text)",
                fontSize: "14px",
                outline: "none" // Prevents default outline on focus
              }}
            />
          </div>
        </div>
        
        <div className="share-story-option" style={{ padding: "12px 16px", borderBottom: "1px solid var(--surface-outline)" }}>
          <button 
            className="add-to-story-btn" 
            onClick={handleAddToStory}
            disabled={isSending}
            style={{ 
              width: "100%", 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              background: "transparent", 
              border: "none", 
              color: "var(--primary)", 
              fontWeight: "600",
              cursor: "pointer",
              padding: "8px 0"
            }}
          >
            <div style={{ 
              width: "36px", 
              height: "36px", 
              borderRadius: "50%", 
              background: "var(--primary-soft)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
            </div>
            <span>Add to story</span>
          </button>
        </div>

        <div className="share-users-grid" style={{ 
          height: "280px", 
          overflowY: "auto", 
          padding: "16px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(75px, 1fr))",
          gap: "16px 12px",
          alignContent: "start"
        }}>
          {isLoading ? (
            <div style={{ textAlign: "center", gridColumn: "1 / -1", padding: "40px 0" }}>
              <Loader label="Finding users..." />
            </div>
          ) : users.length > 0 ? (
            users.map((item) => {
              const userId = getAuthorId(item);
              const isSelected = selectedUsers.has(userId);
              return (
                <div 
                  key={userId} 
                  className="share-user-card" 
                  onClick={() => toggleUserSelection(userId)}
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  <div style={{ position: "relative", marginBottom: "8px" }}>
                    <img 
                      src={getAvatarForUser(item, getDisplayName(item))} 
                      alt={getDisplayName(item)} 
                      style={{ 
                        width: "60px", 
                        height: "60px", 
                        borderRadius: "50%", 
                        objectFit: "cover", 
                        background: "var(--surface-low)",
                        opacity: isSelected ? 0.8 : 1
                      }} 
                    />
                    {isSelected && (
                      <div style={{ 
                        position: "absolute", 
                        bottom: "0", 
                        right: "0", 
                        width: "22px", 
                        height: "22px", 
                        borderRadius: "50%", 
                        background: "var(--primary)", 
                        border: "2px solid var(--surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white"
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>check</span>
                      </div>
                    )}
                  </div>
                  <strong style={{ fontSize: "12px", fontWeight: "500", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {getDisplayName(item)}
                  </strong>
                </div>
              );
            })
          ) : (
            <p style={{ textAlign: "center", color: "var(--text-soft)", gridColumn: "1 / -1", marginTop: "40px" }}>No users found.</p>
          )}
        </div>

        <div className="share-modal-footer" style={{ padding: "16px", borderTop: "1px solid var(--surface-outline)" }}>
          {selectedUsers.size > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="Write a message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--surface-low)",
                  color: "var(--text)",
                  outline: "none"
                }}
              />
            </div>
          )}
          <Button 
            variant="primary" 
            style={{ width: "100%", padding: "12px", fontWeight: "600", borderRadius: "8px" }}
            onClick={handleBatchSend}
            disabled={selectedUsers.size === 0 || isSending}
          >
            {isSending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

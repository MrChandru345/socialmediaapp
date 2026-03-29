import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import { chatService } from "../../services/chatService";
import { userService } from "../../services/userService";
import Button from "../common/Button";
import MessageBubble from "./MessageBubble";

export default function ChatBox() {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const activeConversation = conversations.find((c) => c.otherUser.id === activeConversationId);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const requestedUserId = queryParams.get("userId");

  useEffect(() => {
    async function loadConversations() {
      try {
        const [chatData, followingData] = await Promise.all([
          chatService.getConversations(),
          userService.getFollowing().catch(() => [])
        ]);

        const convoItems = [...(chatData.items || [])];
        const existingIds = new Set(convoItems.map((c) => String(c.otherUser.id)));

        // Merge following into conversations list
        followingData.forEach((userItem) => {
          if (!existingIds.has(String(userItem.id))) {
            convoItems.push({
              isNew: true,
              otherUser: userItem,
              lastMessage: { body: "Say hi!", createdAt: new Date().toISOString() },
              unreadCount: 0
            });
            existingIds.add(String(userItem.id));
          }
        });

        // Ensure requested user from Profile exists
        if (requestedUserId && !existingIds.has(String(requestedUserId))) {
          try {
             const profileUser = await userService.getProfile(requestedUserId);
             convoItems.unshift({
               isNew: true,
               otherUser: profileUser,
               lastMessage: { body: "Start a conversation", createdAt: new Date().toISOString() },
               unreadCount: 0
             });
             existingIds.add(String(profileUser.id));
          } catch(e) {
             console.error("Failed to load requested user profile", e);
          }
        }

        setConversations(convoItems);

        if (requestedUserId && existingIds.has(String(requestedUserId))) {
          setActiveConversationId(requestedUserId);
        } else if (convoItems.length > 0 && !activeConversationId) {
          setActiveConversationId(convoItems[0].otherUser.id);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedUserId]);

  useEffect(() => {
    if (!activeConversationId) return;

    async function loadMessages() {
      try {
        const data = await chatService.getMessages(activeConversationId);
        setMessages(data.items);
        scrollToBottom();
        chatService.markConversationSeen(activeConversationId);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    }
    loadMessages();
    setOtherUserTyping(false);
  }, [activeConversationId]);

  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(message) {
      const isFromMe = message.sender.id === user.id;
      const isWithActive =
        message.sender.id === activeConversationId || message.receiver.id === activeConversationId;

      if (isWithActive) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
        if (!isFromMe) {
          chatService.markConversationSeen(activeConversationId);
        }
      }

      // Update conversation list preview/unread
      setConversations((prev) => {
        const otherId = isFromMe ? message.receiver.id : message.sender.id;
        const exists = prev.some((c) => c.otherUser.id === otherId);

        if (exists) {
          return prev
            .map((c) => {
              if (c.otherUser.id === otherId) {
                return {
                  ...c,
                  lastMessage: message,
                  unreadCount: !isFromMe && !isWithActive ? c.unreadCount + 1 : c.unreadCount
                };
              }
              return c;
            })
            .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
        } else {
          // If new conversation, we might need a full reload or just add it
          return [
            {
              otherUser: isFromMe ? message.receiver : message.sender,
              lastMessage: message,
              unreadCount: !isFromMe ? 1 : 0
            },
            ...prev
          ];
        }
      });
    }

    function handleTyping({ fromUserId, isTyping: otherIsTyping }) {
      if (fromUserId === activeConversationId) {
        setOtherUserTyping(otherIsTyping);
      }
    }

    function handlePresence({ userId, isOnline, onlineUserIds }) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.otherUser.id === userId) {
            return { ...c, otherUser: { ...c.otherUser, isOnline } };
          }
          return c;
        })
      );
    }

    function handleSeen({ byUserId, roomId }) {
      if (byUserId === activeConversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.receiver.id === byUserId ? { ...m, seenAt: new Date() } : m))
        );
      }
    }

    socket.on("chat:message", handleNewMessage);
    socket.on("chat:typing", handleTyping);
    socket.on("presence:update", handlePresence);
    socket.on("chat:seen", handleSeen);

    return () => {
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:typing", handleTyping);
      socket.off("presence:update", handlePresence);
      socket.off("chat:seen", handleSeen);
    };
  }, [socket, activeConversationId, user.id]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleDraftChange(e) {
    setDraft(e.target.value);

    if (!socket || !activeConversationId) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("chat:typing", { toUserId: activeConversationId, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("chat:typing", { toUserId: activeConversationId, isTyping: false });
    }, 3000);
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activeConversationId) return;

    try {
      setDraft("");
      setIsTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit("chat:typing", { toUserId: activeConversationId, isTyping: false });

      await chatService.sendMessage(activeConversationId, { body });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  if (loading) {
    return (
      <div className="chat-layout chat-layout--loading">
        <div className="empty-state">
          <span className="material-symbols-outlined spin">progress_activity</span>
          <p>Loading your conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="chat-layout">
      <div className="chat-sidebar">
        <div className="chat-sidebar__header">
          <div>
            <p className="eyebrow">Curator inbox</p>
            <h2>Messages</h2>
          </div>
        </div>
        <div className="chat-conversations">
          {conversations.length === 0 ? (
            <div className="empty-state">
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                className={
                  c.otherUser.id === activeConversationId
                    ? "conversation-card conversation-card--active"
                    : "conversation-card"
                }
                key={c.otherUser.id}
                onClick={() => setActiveConversationId(c.otherUser.id)}
                type="button"
              >
                <span className="conversation-card__avatar">
                  <img alt={c.otherUser.fullName} src={c.otherUser.avatar} />
                  <span
                    className={
                      c.otherUser.isOnline
                        ? "conversation-card__status"
                        : "conversation-card__status conversation-card__status--offline"
                    }
                  />
                </span>
                <span className="conversation-card__body">
                  <strong>{c.otherUser.fullName}</strong>
                  <span className={c.unreadCount > 0 ? "unread" : ""}>
                    {c.lastMessage.body || "Shared an attachment"}
                  </span>
                </span>
                <div className="conversation-card__meta">
                  <small>{new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                  {c.unreadCount > 0 && <span className="unread-badge">{c.unreadCount}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="chat-window">
        {activeConversation ? (
          <>
            <header className="chat-window__header">
              <div className="chat-window__identity">
                <img alt={activeConversation.otherUser.fullName} src={activeConversation.otherUser.avatar} />
                <div>
                  <h3>{activeConversation.otherUser.fullName}</h3>
                  <p>{activeConversation.otherUser.isOnline ? "Active now" : "Offline"}</p>
                </div>
              </div>
              <div className="chat-window__actions">
                <button className="icon-button" type="button">
                  <span className="material-symbols-outlined">call</span>
                </button>
                <button className="icon-button" type="button">
                  <span className="material-symbols-outlined">videocam</span>
                </button>
                <button className="icon-button" type="button">
                  <span className="material-symbols-outlined">info</span>
                </button>
              </div>
            </header>

            <div className="chat-window__messages">
              {messages.map((message) => (
                <MessageBubble
                  isMe={message.sender.id === user.id}
                  key={message.id}
                  message={{
                    text: message.body,
                    time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    avatar: message.sender.avatar,
                    seen: !!message.seenAt
                  }}
                />
              ))}
              {otherUserTyping && (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-composer" onSubmit={handleSendMessage}>
              <button className="icon-button" type="button">
                <span className="material-symbols-outlined">add_circle</span>
              </button>
              <button className="icon-button" type="button">
                <span className="material-symbols-outlined">image</span>
              </button>
              <input
                onChange={handleDraftChange}
                placeholder="Type your message..."
                type="text"
                value={draft}
              />
              <Button icon="send" size="sm" type="submit">
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="chat-window--empty">
            <span className="material-symbols-outlined">chat</span>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </section>
  );
}


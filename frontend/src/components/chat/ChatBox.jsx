import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";

import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import { chatService } from "../../services/chatService";
import { userService } from "../../services/userService";
import { getAvatarForUser } from "../../utils/helpers";
import MessageBubble from "./MessageBubble";

export default function ChatBox() {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  
  const [notes, setNotes] = useState([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showNoteDeleteConfirm, setShowNoteDeleteConfirm] = useState(null); // stores note object
  const [showNoteEmojiPicker, setShowNoteEmojiPicker] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  
  const [selectedNoteForReply, setSelectedNoteForReply] = useState(null);
  const [noteReplyContent, setNoteReplyContent] = useState("");
  const [showNoteReplyEmojiPicker, setShowNoteReplyEmojiPicker] = useState(false);
  
  const [showUserInfo, setShowUserInfo] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);

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

    async function loadNotes() {
      try {
        const notesData = await chatService.getNotes();
        setNotes(notesData);
      } catch (error) {
        console.error("Failed to load notes:", error);
      }
    }

    loadConversations();
    loadNotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedUserId]);

  useEffect(() => {
    if (!activeConversationId) return;

    setReplyingToMessage(null); // Clear any pending reply
    
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

    function handleMessageDeleted({ messageId }) {
      setMessages((prev) => prev.filter(m => m.id !== messageId));
    }

    socket.on("chat:message", handleNewMessage);
    socket.on("chat:typing", handleTyping);
    socket.on("presence:update", handlePresence);
    socket.on("chat:seen", handleSeen);
    socket.on("chat:message_deleted", handleMessageDeleted);

    return () => {
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:typing", handleTyping);
      socket.off("presence:update", handlePresence);
      socket.off("chat:seen", handleSeen);
      socket.off("chat:message_deleted", handleMessageDeleted);
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

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
    // clear value so the same file can be selected again
    event.target.value = null; 
  }

  function clearSelectedFile() {
    setSelectedFile(null);
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if ((!body && !selectedFile && !audioBlob) || !activeConversationId) return;

    try {
      setDraft("");
      setIsTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit("chat:typing", { toUserId: activeConversationId, isTyping: false });

      const payload = { body, file: selectedFile || audioBlob };
      if (replyingToMessage) {
        payload.replyTo = replyingToMessage.id;
      }

      await chatService.sendMessage(activeConversationId, payload);

      setSelectedFile(null);
      setAudioBlob(null);
      setReplyingToMessage(null);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please check your connection and try again.");
    }
  }

  async function handleDeleteMessage(messageId, action) {
    try {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      await chatService.deleteMessage(messageId, action);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  }

  async function handleSendHeart() {
    if (!activeConversationId) return;
    try {
      const heartPayload = { body: "❤️" };
      await chatService.sendMessage(activeConversationId, heartPayload);
    } catch (error) {
      console.error("Failed to send heart:", error);
    }
  }

  function handleReplyMessage(msgContext) {
    setReplyingToMessage(msgContext);
    // focus input?
  }

  function handleEmojiClick(emojiObject) {
    setDraft((prev) => prev + emojiObject.emoji);
  }

  async function handleCreateNote() {
    if (!noteContent.trim()) return;
    try {
      const newNote = await chatService.createNote(noteContent.trim());
      setNotes((prev) => {
        // Find existing note by user id (populated or not)
        const others = prev.filter((n) => (n.user?._id || n.user?.id || n.user) !== user.id);
        return [newNote, ...others];
      });
      setShowNoteModal(false);
      setShowNoteEmojiPicker(false);
      setNoteContent("");
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  }

  async function handleDeleteNote(noteId) {
    try {
      await chatService.deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      setShowNoteDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  }

  async function handleSendNoteReply() {
    if (!noteReplyContent.trim() || !selectedNoteForReply) return;
    const noteUser = selectedNoteForReply.user;
    const noteUserId = noteUser?._id || noteUser?.id;
    
    try {
      const formattedMessage = `Replied to your note: "${selectedNoteForReply.body}"\n${noteReplyContent}`;
      await chatService.sendMessage(noteUserId, { body: formattedMessage });
      
      setSelectedNoteForReply(null);
      setNoteReplyContent("");
      setActiveConversationId(noteUserId);
    } catch (error) {
      console.error("Failed to reply to note:", error);
    }
  }

  async function handleBlockUser() {
    if (!activeConversation?.otherUser) return;
    const confirmed = window.confirm(`Are you sure you want to block ${activeConversation.otherUser.fullName}?`);
    if (!confirmed) return;

    try {
      await userService.blockUser(activeConversation.otherUser.id || activeConversation.otherUser._id);
      alert("User blocked/unblocked successfully");
    } catch (error) {
      console.error("Failed to block user:", error);
    }
  }

  async function handleReportUser() {
    if (!activeConversation?.otherUser) return;
    const reason = window.prompt("Reason for reporting:");
    if (!reason) return;

    try {
      await userService.reportUser({
        reportedUserId: activeConversation.otherUser.id || activeConversation.otherUser._id,
        reason
      });
      alert("Report submitted successfully");
    } catch (error) {
      console.error("Failed to report user:", error);
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const audioFile = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setAudioBlob(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not supported.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      clearInterval(timerIntervalRef.current);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      clearInterval(timerIntervalRef.current);
      setIsRecording(false);
      setAudioBlob(null);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  const filteredConversations = conversations.filter(c => 
    c.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.otherUser.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="chat-layout">
      <div className="chat-sidebar">
        {/* Instagram Sidebar Header */}
        <div className="chat-sidebar__header">
          <button className="chat-sidebar__account-switcher">
            <span className="account-switcher__name">{user?.username || user?.fullName}</span>
            <span className="material-symbols-outlined shrink-icon">expand_more</span>
          </button>
          <button className="icon-button outline-icon" type="button">
            <span className="material-symbols-outlined">edit_square</span>
          </button>
        </div>
        
        {/* Instagram Search Bar */}
        <div className="chat-sidebar__search">
          <div className="chat-search-input">
            <span className="material-symbols-outlined search-icon">search</span>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Instagram Stories / Active Notes Row */}
        <div className="chat-sidebar__notes scroll-h">
          {(() => {
            const myNote = notes.find(n => (n.user?._id || n.user?.id) === user.id);
            return (
              <div 
                className="chat-note chat-note--self" 
                onClick={() => {
                  if (myNote) {
                    setShowNoteDeleteConfirm(myNote);
                  } else {
                    setShowNoteModal(true);
                  }
                }}
              >
                <div className="chat-note__avatar-wrapper">
                  <img src={getAvatarForUser(user)} alt="You" />
                  {myNote ? (
                    <div className="chat-note__bubble">
                       <span className="note-text">{myNote.body}</span>
                    </div>
                  ) : (
                    <div className="chat-note__bubble">
                      <span className="material-symbols-outlined">add</span>
                      <span className="note-text">Note...</span>
                    </div>
                  )}
                </div>
                <span className="chat-note__name">Your note</span>
              </div>
            );
          })()}

          {notes.filter(n => (n.user?._id || n.user?.id) !== user.id).map(note => (
            <div 
              key={note._id} 
              className="chat-note"
              onClick={() => setSelectedNoteForReply(note)}
            >
              <div className="chat-note__avatar-wrapper">
                <img src={getAvatarForUser(note.user)} alt={note.user.fullName} />
                <div className="chat-note__bubble">
                  <span className="note-text">{note.body}</span>
                </div>
                {note.user.isOnline && <span className="online-dot"></span>}
              </div>
              <span className="chat-note__name">{note.user.username}</span>
            </div>
          ))}
        </div>

        <div className="chat-sidebar__tabs">
          <button className="chat-tab active">Messages</button>
        </div>

        <div className="chat-conversations">
          {filteredConversations.length === 0 ? (
            <div className="explore-empty-state">
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((c) => (
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
                <div className="conversation-card__avatar">
                  <img alt={c.otherUser.fullName} src={getAvatarForUser(c.otherUser)} />
                  {c.otherUser.isOnline && <span className="conversation-card__status" />}
                </div>
                <div className="conversation-card__body">
                  <div className="conversation-card__name-row">
                    <strong>{c.otherUser.fullName}</strong>
                  </div>
                  <div className={`conversation-card__preview ${c.unreadCount > 0 ? "conversation-card__preview--unread" : ""}`}>
                    <span>
                      {c.lastMessage.attachments?.length > 0 ? "Sent an attachment" : (c.lastMessage.body || "Say hi!")}
                    </span>
                    <span className="preview-dot">•</span>
                    <span className="preview-time">{new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                {c.unreadCount > 0 && <span className="unread-dot"></span>}
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
                <img alt={activeConversation.otherUser.fullName} src={getAvatarForUser(activeConversation.otherUser)} />
                <div className="chat-identity__info">
                  <h3>{activeConversation.otherUser.fullName}</h3>
                  <p>{activeConversation.otherUser.username}</p>
                </div>
              </div>
              <div className="chat-window__actions">
                <button className="icon-button outline-icon" type="button">
                  <span className="material-symbols-outlined">call</span>
                </button>
                <button 
                  className={`icon-button outline-icon ${showUserInfo ? 'active' : ''}`} 
                  type="button" 
                  onClick={() => setShowUserInfo(!showUserInfo)}
                >
                  <span className="material-symbols-outlined">info</span>
                </button>
              </div>
            </header>

            <div className="chat-window__messages">
              {messages.map((message) => (
                <MessageBubble
                  isMe={message.sender.id === user.id}
                  key={message.id}
                  onDeleteMessage={handleDeleteMessage}
                  onReplyMessage={handleReplyMessage}
                  message={{
                    id: message.id,
                    text: message.body,
                    time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    avatar: getAvatarForUser(message.sender),
                    seen: !!message.seenAt,
                    attachments: message.attachments,
                    senderId: message.sender.id,
                    senderUsername: message.sender.username,
                    replyTo: message.replyTo
                  }}
                />
              ))}
              {otherUserTyping && (
                <div className="message-row message-row--incoming">
                  <img alt="Typing indicator" className="message-row__avatar" src={getAvatarForUser(activeConversation.otherUser)} />
                  <div className="typing-indicator-bubble">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} />
            </div>

            {replyingToMessage && (
              <div className="chat-reply-preview-bar">
                <div className="reply-preview-info">
                  <span className="material-symbols-outlined">reply</span>
                  <div className="reply-preview-text">
                    <span className="reply-preview-author">Replying to {replyingToMessage.sender}</span>
                    <span className="reply-preview-body">{replyingToMessage.text}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setReplyingToMessage(null)} className="close-reply-btn">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}

            {selectedFile && (
              <div className="chat-file-preview">
                <div className="file-preview-card">
                  <span className="material-symbols-outlined file-icon">draft</span>
                  <span className="file-name">{selectedFile.name}</span>
                  <button type="button" onClick={clearSelectedFile} className="file-clear-btn">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
            )}

            {audioBlob && (
              <div className="chat-file-preview">
                <div className="file-preview-card">
                  <span className="material-symbols-outlined file-icon">mic_external_on</span>
                  <span className="file-name">Voice recording (Ready)</span>
                  <button type="button" onClick={() => setAudioBlob(null)} className="file-clear-btn">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
            )}

            <div className="chat-composer-wrapper" style={{ position: "relative" }}>
              {showEmojiPicker && (
                <div style={{ position: "absolute", bottom: "100%", left: "10px", marginBottom: "10px", zIndex: 1000 }}>
                  <EmojiPicker 
                    onEmojiClick={handleEmojiClick} 
                    theme="auto" 
                    width={320} 
                    height={400} 
                  />
                </div>
              )}

              {isRecording ? (
                <div className="chat-recording-bar">
                  <div className="recording-indicator">
                    <div className="recording-dot"></div>
                    <span>Recording</span>
                  </div>
                  <div className="recording-timer">{formatTime(recordingSeconds)}</div>
                  <div className="recording-actions">
                    <button type="button" onClick={cancelRecording} className="recording-btn recording-btn--cancel">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                    <button type="button" onClick={stopRecording} className="recording-btn recording-btn--send">
                      <span className="material-symbols-outlined">check_circle</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form className="instagram-chat-composer" onSubmit={handleSendMessage}>
                  <button className="composer-icon" type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <span className="material-symbols-outlined">mood</span>
                  </button>
                  
                  <input
                    onChange={handleDraftChange}
                    placeholder="Message..."
                    type="text"
                    value={draft}
                  />
                  
                  <div className="composer-actions-right">
                    {draft.length > 0 || selectedFile || audioBlob ? (
                      <button className="composer-send-btn" type="submit">Send</button>
                    ) : (
                      <>
                        <button className="composer-icon" type="button" onClick={startRecording}>
                          <span className="material-symbols-outlined">mic</span>
                        </button>
                        
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileSelect} 
                          style={{ display: 'none' }} 
                          accept="image/*,video/*"
                        />
                        <button 
                          className="composer-icon" 
                          type="button" 
                          onClick={() => fileInputRef.current.click()}
                        >
                          <span className="material-symbols-outlined">image</span>
                        </button>
                        
                        <button className="composer-icon" type="button" onClick={handleSendHeart}>
                          <span className="material-symbols-outlined">favorite</span>
                        </button>
                      </>
                    )}
                  </div>
                </form>
              )}
            </div>

            {showUserInfo && activeConversation && (
              <div className="note-modal-overlay" onClick={() => setShowUserInfo(false)}>
                <div className="chat-info-sidebar modal-style" onClick={e => e.stopPropagation()}>
                  <div className="info-sidebar__header">
                    <h3>Details</h3>
                    <button className="close-btn" onClick={() => setShowUserInfo(false)}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  
                  <div className="info-sidebar__profile">
                    <img src={getAvatarForUser(activeConversation.otherUser)} alt={activeConversation.otherUser.fullName} />
                    <h3>{activeConversation.otherUser.fullName}</h3>
                    <p>@{activeConversation.otherUser.username}</p>
                  </div>

                  <div className="info-sidebar__section">
                    <h4 className="section-title">About</h4>
                    <div className="info-item">
                      <span className="material-symbols-outlined">calendar_today</span>
                      <div className="info-item__text">
                        <span className="label">Joined</span>
                        <span className="value">
                          {activeConversation.otherUser.createdAt 
                            ? new Date(activeConversation.otherUser.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                            : 'Recent'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="info-sidebar__section">
                    <h4 className="section-title">Privacy & Support</h4>
                    <button className="action-item danger" onClick={handleBlockUser}>
                      <span className="material-symbols-outlined">block</span>
                      <span>Block</span>
                    </button>
                    <button className="action-item danger" onClick={handleReportUser}>
                      <span className="material-symbols-outlined">report</span>
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="chat-window--empty">
            <div className="empty-chat-icon">
              <span className="material-symbols-outlined">send</span>
            </div>
            <h2>Your messages</h2>
            <p>Send private photos and messages to a friend or group</p>
            <button className="btn btn-primary">Send message</button>
          </div>
        )}
      </div>

      {showNoteModal && (
        <div className="note-modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="note-modal" onClick={e => e.stopPropagation()}>
            <div className="note-modal__header">
              <h3>Share a thought</h3>
              <button className="close-btn" onClick={() => setShowNoteModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="note-modal__input-wrapper">
              <textarea 
                placeholder="Share what's on your mind..." 
                maxLength={60}
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                autoFocus
              />
              <div className="note-modal__input-footer">
                <button 
                  className="emoji-btn" 
                  onClick={() => setShowNoteEmojiPicker(!showNoteEmojiPicker)}
                  type="button"
                >
                  <span className="material-symbols-outlined">mood</span>
                </button>
                <span className="char-count">{noteContent.length}/60</span>
              </div>
              
              {showNoteEmojiPicker && (
                <div className="note-emoji-picker-container">
                  <EmojiPicker 
                    onEmojiClick={(emoji) => {
                      setNoteContent(prev => (prev + emoji.emoji).slice(0, 60));
                      setShowNoteEmojiPicker(false);
                    }}
                    width={280}
                    height={350}
                  />
                </div>
              )}
            </div>
            <div className="note-modal__actions">
              <button 
                className="btn-ghost" 
                onClick={() => setShowNoteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary-ig" 
                disabled={!noteContent.trim()}
                onClick={handleCreateNote}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {showNoteDeleteConfirm && (
        <div className="note-modal-overlay" onClick={() => setShowNoteDeleteConfirm(null)}>
          <div className="note-action-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="btn-delete" 
              onClick={() => handleDeleteNote(showNoteDeleteConfirm._id)}
            >
              Delete Note
            </button>
            <button 
              className="btn-cancel" 
              onClick={() => setShowNoteDeleteConfirm(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedNoteForReply && (
        <div className="note-modal-overlay" onClick={() => setSelectedNoteForReply(null)}>
          <div className="note-modal" onClick={e => e.stopPropagation()}>
            <div className="note-modal__header">
              <h3>Reply to {selectedNoteForReply.user.username}'s note</h3>
              <button className="close-btn" onClick={() => setSelectedNoteForReply(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="note-modal__input-wrapper">
              <div className="note-reply-context">
                <span className="note-text-preview">"{selectedNoteForReply.body}"</span>
              </div>
              <textarea 
                placeholder="Send a message..." 
                value={noteReplyContent}
                onChange={e => setNoteReplyContent(e.target.value)}
                autoFocus
              />
              <div className="note-modal__input-footer">
                <button 
                  className="emoji-btn" 
                  onClick={() => setShowNoteReplyEmojiPicker(!showNoteReplyEmojiPicker)}
                  type="button"
                >
                  <span className="material-symbols-outlined">mood</span>
                </button>
              </div>

              {showNoteReplyEmojiPicker && (
                <div className="note-emoji-picker-container">
                  <EmojiPicker 
                    onEmojiClick={(emoji) => {
                      setNoteReplyContent(prev => (prev + emoji.emoji));
                      setShowNoteReplyEmojiPicker(false);
                    }}
                    width={280}
                    height={350}
                  />
                </div>
              )}
            </div>
            <div className="note-modal__actions">
              <button 
                className="btn-primary-ig" 
                disabled={!noteReplyContent.trim()}
                onClick={handleSendNoteReply}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



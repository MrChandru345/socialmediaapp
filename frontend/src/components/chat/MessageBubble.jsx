import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAvatarForUser, formatMessageTime, downloadResource } from "../../utils/helpers";

export default function MessageBubble({ 
  message, 
  isMe, 
  onDeleteMessage,
  onReactToMessage, 
  onReplyMessage, 
  onForwardMessage,
  onPostClick,
  onMediaClick,
  onShowEmojiPicker,
  currentUserId 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMoreEmojis, setShowMoreEmojis] = useState(false);
  const [reactionToManage, setReactionToManage] = useState(null);
  const reactionPickerRef = useRef(null);
  const reactionManageRef = useRef(null);
  const menuRef = useRef(null);
  const incoming = !isMe;
  const hasAttachments = message.attachments && message.attachments.length > 0;
  // If the text is exactly 'Shared a post' or 'Shared a reel', we hide it since the visual card handles the intent natively unless they wrote a custom message
  const hasText = message.text && message.text.trim().length > 0 && message.text !== "Shared a post" && message.text !== "Shared a reel";

  const quickEmojis = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target)) {
        setShowReactionPicker(false);
      }
      if (reactionManageRef.current && !reactionManageRef.current.contains(event.target)) {
        setReactionToManage(null);
      }
    }
    if (showMenu || showReactionPicker || reactionToManage) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu, showReactionPicker, reactionToManage]);

  const handleAction = (action) => {
    setShowMenu(false);
    if (onDeleteMessage) onDeleteMessage(message.id, action);
  };

  const handleReact = (emoji) => {
    setShowReactionPicker(false);
    if (onReactToMessage) onReactToMessage(message.id, emoji);
  };

  const handleReply = () => {
    if (onReplyMessage) {
      onReplyMessage({
        id: message.id,
        text: message.text || (hasAttachments ? "Shared Media" : ""),
        sender: message.senderUsername
      });
    }
  };

  const handleForward = () => {
    setShowMenu(false);
    if (onForwardMessage) {
      onForwardMessage({
        id: message.id,
        text: message.text || "",
        attachments: message.attachments || [],
        sharedPost: message.sharedPost || null
      });
    }
  };

  return (
    <div className={`message-row ${incoming ? "message-row--incoming" : "message-row--outgoing"}`}>
      {incoming && (
        <Link to={`/profile/${message.senderUsername || message.senderId}`}>
          <img alt="User avatar" className="message-row__avatar" src={message.avatar} style={{ cursor: 'pointer' }} />
        </Link>
      )}
      
      <div className="message-content-wrapper">
        {hasAttachments && (
          <div className={`message-attachments ${incoming ? "message-attachments--incoming" : "message-attachments--outgoing"}`}>
            {message.attachments.map((attachment, index) => {
              const url = typeof attachment === "string" ? attachment : (attachment?.url || "");
              const type = typeof attachment === "object" ? attachment?.type : null;

              // Priority 1: Backend provided type
              // Priority 2: Extension matching
              const hasAudioType = type === "audio" || url.match(/\.(mp3|wav|m4a|ogg|webm)$/i);
              const hasVideoType = type === "video" || url.match(/\.(mp4|webm|ogg)$/i);
              const hasImageType = type === "image" || url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
              
              if (hasAudioType) {
                return (
                  <VoicePlayer 
                    key={index}
                    url={url} 
                    incoming={incoming} 
                  />
                );
              } else if (hasVideoType) {
                return (
                  <video 
                    key={index} 
                    src={url} 
                    className="message-attachment-media" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => onMediaClick?.(url, 'video')}
                  />
                );
              } else if (hasImageType) {
                return (
                  <img 
                    key={index} 
                    src={url} 
                    alt="Attachment" 
                    className="message-attachment-media" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => onMediaClick?.(url, 'image')}
                  />
                );
              } else {
                // Fallback for document or unknown
                return (
                  <a 
                    key={index} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="message-attachment-doc"
                    onClick={(e) => {
                      e.preventDefault();
                      downloadResource(url, `attachment_${Date.now()}`);
                    }}
                  >
                    <span className="material-symbols-outlined">description</span>
                    <span>Document</span>
                  </a>
                );
              }
            })}
          </div>
        )}

        {message.replyTo && typeof message.replyTo === "object" && (
          <div className={`message-reply-preview ${incoming ? "message-reply-preview--incoming" : "message-reply-preview--outgoing"}`}>
            <span className="reply-preview-header">
              {incoming 
                ? `${message.senderUsername} replied to ${message.replyTo.sender.username === message.senderUsername ? "themselves" : "you"}` 
                : `You replied to ${message.replyTo.sender.username}`}
            </span>
            <div className="reply-preview-bubble">
              <p>{message.replyTo.body || "Attachment"}</p>
            </div>
          </div>
        )}

        {message.sharedPost && (
          <div className="message-shared-post-wrapper">
            {typeof message.sharedPost === "object" && (message.sharedPost.id || message.sharedPost._id) ? (
              <div 
                className={`message-shared-post-card ${incoming ? "message-shared-post-card--incoming" : "message-shared-post-card--outgoing"}`}
                onClick={() => onPostClick?.(message.sharedPost)}
                style={{ cursor: 'pointer' }}
              >
                  {/* Card Header: avatar + username */}
                  <div className="shared-post-card__header">
                    <img 
                      src={getAvatarForUser(message.sharedPost.author, message.sharedPost.author?.username || "User")}
                      alt={message.sharedPost.author?.username || "User"}
                      className="shared-post-card__avatar"
                    />
                    <span className="shared-post-card__username">
                      {message.sharedPost.author?.username || "Unknown"}
                    </span>
                  </div>

                  {/* Post Image / Media */}
                  {(() => {
                    const postObj = message.sharedPost;
                    const mediaItem = Array.isArray(postObj.media) ? postObj.media[0] : (postObj.media || postObj.video);
                    const mediaUrl = typeof mediaItem === "string" ? mediaItem : (mediaItem?.url || postObj.url || "");
                    
                    if (!mediaUrl) return (
                      <div className="shared-post-card__no-media">
                        <span className="material-symbols-outlined">image</span>
                      </div>
                    );

                    const isVid = (mediaItem && typeof mediaItem === "object" && mediaItem.type === "video") ||
                      mediaUrl.match(/\.(mp4|webm|ogg)$/i) ||
                      postObj.isReel;

                    return (
                      <div className="shared-post-card__media" style={{ cursor: 'pointer' }}>
                        {isVid ? (
                          <div style={{ position: 'relative' }}>
                            <video src={mediaUrl} className="shared-post-card__img" />
                            <span className="material-symbols-outlined shared-post-card__play">play_circle</span>
                          </div>
                        ) : (
                          <img src={mediaUrl} alt="Post" className="shared-post-card__img" />
                        )}
                      </div>
                    );
                  })()}

                  {/* Caption */}
                  {message.sharedPost.caption && (
                    <div className="shared-post-card__caption">
                      <strong>{message.sharedPost.author?.username}</strong>{" "}
                      {message.sharedPost.caption.length > 80
                        ? message.sharedPost.caption.slice(0, 80) + "..."
                        : message.sharedPost.caption
                      }
                    </div>
                  )}
                </div>
            ) : (
              <div className={`message-bubble ${incoming ? "message-bubble--incoming" : "message-bubble--outgoing"}`} style={{ fontStyle: 'italic', color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility_off</span>
                <span>Post unavailable</span>
              </div>
            )}
          </div>
        )}

        {hasText && (
          <div className="message-bubble-wrapper" style={{ position: 'relative' }}>
            <div className={`message-bubble ${incoming ? "message-bubble--incoming" : "message-bubble--outgoing"}`}>
              <p>{message.text}</p>
            </div>
            
            {message.reactions && message.reactions.length > 0 && (
              <div className={`message-reactions-pill ${incoming ? "message-reactions-pill--incoming" : "message-reactions-pill--outgoing"}`}>
                {Object.entries(
                  message.reactions.reduce((acc, r) => {
                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([emoji, count]) => {
                  const myReaction = message.reactions.find(r => r.emoji === emoji && (r.user.id === currentUserId || r.user === currentUserId));
                  
                  return (
                    <div key={emoji} className="reaction-item-container" style={{ position: 'relative' }}>
                      <span 
                        className={`reaction-item ${myReaction ? 'reaction-item--mine' : ''}`} 
                        title={`${count} reaction(s)`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setReactionToManage(emoji);
                        }}
                      >
                        {emoji} {count > 1 && <span className="reaction-count">{count}</span>}
                      </span>

                      {reactionToManage === emoji && (
                        <div className="reaction-manage-popup animate-in" ref={reactionManageRef}>
                          <div className="reaction-popup-header">
                            <span className="reaction-popup-emoji">{emoji}</span>
                            <span className="reaction-popup-info">{count} Reactions</span>
                          </div>
                          {myReaction && (
                            <button 
                              className="reaction-remove-btn" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReact(emoji);
                                setReactionToManage(null);
                              }}
                            >
                              <span className="material-symbols-outlined">delete</span>
                              <span>Remove Reaction</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* If no text but has attachments or shared post, put reactions on them */}
        {!hasText && (hasAttachments || message.sharedPost) && message.reactions && message.reactions.length > 0 && (
          <div className="message-reactions-pill--on-media" style={{ position: 'relative', marginTop: '-10px' }}>
             <div className={`message-reactions-pill ${incoming ? "message-reactions-pill--incoming" : "message-reactions-pill--outgoing"}`}>
                {Object.entries(
                  message.reactions.reduce((acc, r) => {
                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([emoji, count]) => {
                  const myReaction = message.reactions.find(r => r.emoji === emoji && (r.user.id === currentUserId || r.user === currentUserId));

                  return (
                    <div key={emoji} className="reaction-item-container" style={{ position: 'relative' }}>
                      <span 
                        className={`reaction-item ${myReaction ? 'reaction-item--mine' : ''}`}
                        title={`${count} reaction(s)`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setReactionToManage(emoji);
                        }}
                      >
                        {emoji} {count > 1 && <span className="reaction-count">{count}</span>}
                      </span>
                      
                      {reactionToManage === emoji && (
                        <div className="reaction-manage-popup animate-in" ref={reactionManageRef}>
                          <div className="reaction-popup-header">
                            <span className="reaction-popup-emoji">{emoji}</span>
                            <span className="reaction-popup-info">{count} Reactions</span>
                          </div>
                          {myReaction && (
                            <button 
                              className="reaction-remove-btn" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReact(emoji);
                                setReactionToManage(null);
                              }}
                            >
                              <span className="material-symbols-outlined">delete</span>
                              <span>Remove Reaction</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
          </div>
        )}


        <div className="message-bubble-row">
          <span className="message-timestamp message-timestamp--hover">
            {message.time}
          </span>
        </div>
      </div>

      <div className={`message-actions ${incoming ? "message-actions--incoming" : "message-actions--outgoing"}`} ref={menuRef}>
        <div className="reaction-picker-container" ref={reactionPickerRef}>
          <button 
            className={`message-action-btn ${showReactionPicker ? 'active' : ''}`}
            onClick={() => setShowReactionPicker(!showReactionPicker)}
          >
            <span className="material-symbols-outlined">sentiment_satisfied</span>
          </button>

          {showReactionPicker && (
            <div className={`reaction-picker-overlay animate-in ${showMoreEmojis ? 'expanded' : ''}`}>
              {quickEmojis.map(emoji => (
                <button key={emoji} className="reaction-emoji-btn" onClick={() => handleReact(emoji)}>
                  {emoji}
                </button>
              ))}
              
              {!showMoreEmojis && (
                <button 
                  className="reaction-emoji-btn plus-btn" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const rect = e.currentTarget.getBoundingClientRect();
                    onShowEmojiPicker?.(message.id, rect);
                    setShowReactionPicker(false);
                  }}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              )}

              {showMoreEmojis && (
                ["🙌", "👏", "✨", "💯", "🤝"].map(emoji => (
                  <button key={emoji} className="reaction-emoji-btn" onClick={() => handleReact(emoji)}>
                    {emoji}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button className="message-action-btn" onClick={handleReply}><span className="material-symbols-outlined">reply</span></button>
        <button className="message-action-btn" onClick={() => setShowMenu(prev => !prev)}>
          <span className="material-symbols-outlined">more_vert</span>
        </button>

        {showMenu && (
          <div className="message-actions-menu">
            <button className="neutral" onClick={handleForward}>Forward</button>
            {isMe && <button className="danger" onClick={() => handleAction("unsend")}>Unsend</button>}
            <button className="danger" onClick={() => handleAction("delete_for_me")}>Delete for me</button>
          </div>
        )}
      </div>
    </div>
  );
}

function VoicePlayer({ url, incoming }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const onLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const onTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (secs) => {
    if (!secs) return "0:00";
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  // Generate a bunch of bars for the waveform
  const barCount = 35;
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Generate some "random" but stable heights for the waveform
    const height = 10 + (Math.sin(i * 0.5) * 10) + (Math.cos(i * 0.8) * 5);
    const progress = (currentTime / duration) * barCount;
    const isActive = i < progress;
    
    return (
      <div 
        key={i} 
        className="waveform-bar" 
        style={{ 
          height: `${Math.max(4, height)}px`,
          opacity: isActive ? 1 : 0.4
        }} 
      />
    );
  });

  return (
    <div className={`message-bubble message-bubble--voice ${incoming ? "message-bubble--incoming" : "message-bubble--outgoing"}`}>
      <div className="voice-player-container">
        <div className="voice-bubble-content">
          <button className="play-button-circular" onClick={togglePlay}>
            <span className="material-symbols-outlined">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>
          
          <div className="waveform-simulation">
            {bars}
          </div>
          
          <div className="duration-badge-pill">
            {isPlaying ? formatTime(currentTime) : formatTime(duration || 0)}
          </div>
        </div>
        
        <div className="view-transcription-link">
          View transcription
        </div>

        <audio 
          ref={audioRef}
          src={url}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

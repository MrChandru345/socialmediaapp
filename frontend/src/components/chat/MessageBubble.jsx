export default function MessageBubble({ message, isMe }) {
  const incoming = !isMe;

  return (
    <div className={`message-row ${incoming ? "message-row--incoming" : "message-row--outgoing"}`}>
      {incoming ? <img alt="Conversation avatar" className="message-row__avatar" src={message.avatar} /> : null}
      <div className={`message-bubble ${incoming ? "message-bubble--incoming" : "message-bubble--outgoing"}`}>
        <p>{message.text}</p>
        {message.attachment ? <img alt="Shared media" className="message-bubble__attachment" src={message.attachment} /> : null}
        <div className="message-bubble__footer">
          <span>{message.time}</span>
          {isMe && message.seen && (
            <span className="material-symbols-outlined seen-icon">done_all</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessageBubble({ message }) {
  const incoming = message.from === "them";

  return (
    <div className={`message-row ${incoming ? "message-row--incoming" : "message-row--outgoing"}`}>
      {incoming ? <img alt="Conversation avatar" className="message-row__avatar" src={message.avatar} /> : null}
      <div className={`message-bubble ${incoming ? "message-bubble--incoming" : "message-bubble--outgoing"}`}>
        <p>{message.text}</p>
        {message.attachment ? <img alt="Shared media" className="message-bubble__attachment" src={message.attachment} /> : null}
        <span>{message.time}</span>
      </div>
    </div>
  );
}

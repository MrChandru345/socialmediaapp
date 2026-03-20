import { useState } from "react";

import { conversations as initialConversations, messageThreads } from "../../assets/mockData";
import Button from "../common/Button";
import MessageBubble from "./MessageBubble";

export default function ChatBox() {
  const [activeConversationId, setActiveConversationId] = useState(initialConversations[0].id);
  const [draft, setDraft] = useState("");
  const [threads, setThreads] = useState(() => JSON.parse(JSON.stringify(messageThreads)));

  const activeConversation =
    initialConversations.find((conversation) => conversation.id === activeConversationId) ||
    initialConversations[0];

  const activeMessages = threads[activeConversationId] || [];

  function handleSendMessage(event) {
    event.preventDefault();

    const value = draft.trim();
    if (!value) {
      return;
    }

    setThreads((currentThreads) => ({
      ...currentThreads,
      [activeConversationId]: [
        ...(currentThreads[activeConversationId] || []),
        {
          id: `message-${Date.now()}`,
          from: "me",
          text: value,
          time: "Now"
        }
      ]
    }));
    setDraft("");
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
        <div className="chat-sidebar__stories">
          {initialConversations.map((conversation) => (
            <div className="chat-story" key={`story-${conversation.id}`}>
              <img alt={conversation.name} src={conversation.avatar} />
              <span>{conversation.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>
        <div className="chat-conversations">
          {initialConversations.map((conversation) => (
            <button
              className={
                conversation.id === activeConversationId
                  ? "conversation-card conversation-card--active"
                  : "conversation-card"
              }
              key={conversation.id}
              onClick={() => setActiveConversationId(conversation.id)}
              type="button"
            >
              <span className="conversation-card__avatar">
                <img alt={conversation.name} src={conversation.avatar} />
                <span className={conversation.online ? "conversation-card__status" : "conversation-card__status conversation-card__status--offline"} />
              </span>
              <span className="conversation-card__body">
                <strong>{conversation.name}</strong>
                <span>{conversation.preview}</span>
              </span>
              <small>{conversation.time}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="chat-window">
        <header className="chat-window__header">
          <div className="chat-window__identity">
            <img alt={activeConversation.name} src={activeConversation.avatar} />
            <div>
              <h3>{activeConversation.name}</h3>
              <p>{activeConversation.online ? "Active now" : "Away from desk"}</p>
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
          <div className="date-pill">Today</div>
          {activeMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>

        <form className="chat-composer" onSubmit={handleSendMessage}>
          <button className="icon-button" type="button">
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <button className="icon-button" type="button">
            <span className="material-symbols-outlined">image</span>
          </button>
          <input
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type your message..."
            type="text"
            value={draft}
          />
          <Button icon="send" size="sm" type="submit">
            Send
          </Button>
        </form>
      </div>
    </section>
  );
}

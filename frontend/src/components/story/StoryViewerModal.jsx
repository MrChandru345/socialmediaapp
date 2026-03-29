import { useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import {
  getApiErrorMessage,
  getStoryAvatar,
  getStoryItems,
  getStoryMeta,
  getStoryTitle,
  isOwnResource,
  isVideoMedia
} from "../../utils/helpers";
import Button from "../common/Button";

// Utilizing portals or native overlays is best, we'll build a custom overlay here

export default function StoryViewerModal({ group, onClose, onDeleteStory, open }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [removingStoryId, setRemovingStoryId] = useState("");

  if (!group) {
    return null;
  }

  const isOwnStoryGroup = isOwnResource(group.author?.id, user?.id);

  async function handleDelete(storyId) {
    setRemovingStoryId(storyId);
    setError("");

    try {
      await onDeleteStory?.(storyId, group.author?.id);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to delete this story."));
      setRemovingStoryId("");
    }
  }

  return (
    <div className="story-fullscreen-backdrop">
      <div className="story-fullscreen-container">
        <header className="story-fullscreen-header">
          <div className="story-fullscreen-author">
            <img alt={getStoryTitle(group)} src={getStoryAvatar(group)} />
            <div className="story-author-info">
              <strong>{getStoryTitle(group)}</strong>
              <span>{getStoryItems(group).length} stories</span>
            </div>
          </div>
          <button className="story-fullscreen-close" onClick={onClose} type="button">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {error ? <div className="story-fullscreen-error">{error}</div> : null}

        <div className="story-fullscreen-content">
          {getStoryItems(group).map((story) => (
            <div className="story-fullscreen-item" key={story.id}>
              {isVideoMedia(story.media) ? (
                <video autoPlay controls preload="metadata" src={story.media.url} />
              ) : (
                <img alt={story.caption || getStoryTitle(group)} src={story.media.url} />
              )}
              <div className="story-fullscreen-meta">
                {story.caption ? <div className="story-caption">{story.caption}</div> : null}
                <div className="story-time">{getStoryMeta(story)}</div>
                
                {isOwnStoryGroup ? (
                  <Button
                    disabled={removingStoryId === story.id}
                    onClick={() => handleDelete(story.id)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <span className="material-symbols-outlined" style={{color: 'white'}}>delete</span>
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

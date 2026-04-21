import { useEffect, useRef, useState, useMemo } from "react";

import { useAuth } from "../../hooks/useAuth";
import { storyService } from "../../services/storyService";
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
import StoryViewersList from "./StoryViewersList";

const STORY_DURATION = 10000; // 10 seconds for images

export default function StoryViewerModal({ group, onClose, onDeleteStory, open }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [removingStoryId, setRemovingStoryId] = useState("");
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tapStartTime, setTapStartTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isViewersListOpen, setIsViewersListOpen] = useState(false);
  
  const videoRef = useRef(null);

  // Reverse the array so the oldest story plays first (chronological order)
  const stories = useMemo(() => {
    return group ? [...getStoryItems(group)].reverse() : [];
  }, [group]);
  
  const currentStory = stories[currentIndex];
  const isOwnStoryGroup = group && user ? isOwnResource(group.author?.id, user?.id) : false;

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setIsPaused(false);
      setError("");
      setRemovingStoryId("");
      setVideoDuration(0);
      setIsViewersListOpen(false);
    }
  }, [group, open]);

  useEffect(() => {
    if (open && currentStory && !isOwnStoryGroup) {
      storyService.view(currentStory.id).catch(() => {});
    }
  }, [currentStory?.id, open, isOwnStoryGroup]);

  useEffect(() => {
    if (isViewersListOpen) {
       setIsPaused(true);
       if (videoRef.current) videoRef.current.pause();
    } else {
       setIsPaused(false);
       if (videoRef.current) videoRef.current.play().catch(() => {});
    }
  }, [isViewersListOpen]);

  function handleNext() {
    setVideoDuration(0);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((p) => p + 1);
    } else {
      onClose();
    }
  }

  function handlePrev() {
    setVideoDuration(0);
    if (currentIndex > 0) {
      setCurrentIndex((p) => p - 1);
    } else {
      // Re-trigger the same progress animation (hacky way: reset index momentarily or just let it be)
      setCurrentIndex(0); 
    }
  }

  const handlePointerDown = () => {
    setIsPaused(true);
    setTapStartTime(Date.now());
    if (isVideoMedia(currentStory?.media) && videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handlePointerUp = (e) => {
    setIsPaused(false);
    if (isVideoMedia(currentStory?.media) && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    
    // If it was a quick tap, navigate
    const elapsed = Date.now() - tapStartTime;
    if (elapsed < 200 && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width * 0.3) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  if (!group || !open) return null;

  async function handleDelete(storyId) {
    setRemovingStoryId(storyId);
    setIsPaused(true);
    setError("");

    try {
      await onDeleteStory?.(storyId, group.author?.id);
      
      if (stories.length <= 1) {
        onClose();
      } else {
        if (currentIndex >= stories.length - 1) {
          setCurrentIndex((p) => p - 1);
        }
        setIsPaused(false);
        setRemovingStoryId("");
        setVideoDuration(0);
      }
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to delete this story."));
      setRemovingStoryId("");
      setIsPaused(false);
    }
  }

  return (
    <div className="story-fullscreen-backdrop">
      <div className="story-fullscreen-container">
        {/* Instagram style progress bars driven by CSS to avoid lag */}
        <div className="story-progress-container">
          {stories.map((story, idx) => {
            const isCurrent = idx === currentIndex;
            const isCompleted = idx < currentIndex;
            const isVideo = isVideoMedia(currentStory?.media);
            
            let classNames = "story-progress-bar";
            if (isCurrent) classNames += " active";
            if (isCompleted) classNames += " completed";
            if (isCurrent && isPaused) classNames += " paused";
            if (isCurrent && removingStoryId) classNames += " paused";

            // If it's the current video and we don't have duration yet, fallback to 10s till we do
            const duration = (isCurrent && isVideo && videoDuration) ? videoDuration : (STORY_DURATION / 1000);

            return (
              <div 
                key={`${story.id}-${isCurrent}`} // Force re-render of the specific bar when it becomes active
                className={classNames}
                style={{ '--duration': `${duration}s` }}
              >
                <div 
                  className="story-progress-fill" 
                  onAnimationEnd={(e) => {
                    if (isCurrent && !isVideo && e.animationName === 'storyRun') {
                      handleNext();
                    }
                  }}
                />
              </div>
            );
          })}
        </div>

        <header className="story-fullscreen-header" style={{ zIndex: 10 }}>
          <div className="story-fullscreen-author">
            <img alt={getStoryTitle(group)} src={getStoryAvatar(group)} />
            <div className="story-author-info">
              <strong>{getStoryTitle(group)}</strong>
              <span className="story-time-top">{currentStory && getStoryMeta(currentStory)}</span>
            </div>
          </div>
          <button className="story-fullscreen-close" onClick={onClose} type="button">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {error ? <div className="story-fullscreen-error" style={{ zIndex: 10 }}>{error}</div> : null}

        <div className="story-fullscreen-content" style={{ overflow: 'hidden' }}>
          {currentStory && (
            <div 
              className="story-fullscreen-item active-story-item" 
              key={currentStory.id} // Re-mounts the slide giving a smooth fade-in animation
            >
              <div 
                className="story-tap-zone"
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onContextMenu={(e) => e.preventDefault()}
              ></div>
              
              {isVideoMedia(currentStory.media) ? (
                <video 
                  autoPlay 
                  playsInline
                  preload="metadata" 
                  src={currentStory.media.url} 
                  ref={videoRef}
                  onLoadedMetadata={(e) => setVideoDuration(e.target.duration)}
                  onEnded={handleNext}
                />
              ) : (
                <img alt={currentStory.caption || getStoryTitle(group)} src={currentStory.media.url} />
              )}
              
              <div className="story-fullscreen-meta instagram-story-meta" style={{ zIndex: 10 }}>
                {currentStory.caption ? <div className="story-caption">{currentStory.caption}</div> : null}
                
                <div className="story-viewer-actions">
                  {isOwnStoryGroup && (
                    <button 
                      className="story-viewers-count-btn" 
                      onClick={() => setIsViewersListOpen(true)}
                      type="button"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                      <span className="count">{currentStory?.viewersCount || 0}</span>
                    </button>
                  )}

                  {isOwnStoryGroup ? (
                    <Button
                      disabled={removingStoryId === currentStory.id}
                      onClick={() => handleDelete(currentStory.id)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <span className="material-symbols-outlined" style={{color: 'white'}}>delete</span>
                    </Button>
                  ) : null}
                </div>
              </div>

              {isViewersListOpen && (
                <StoryViewersList 
                  storyId={currentStory.id} 
                  onClose={() => setIsViewersListOpen(false)} 
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

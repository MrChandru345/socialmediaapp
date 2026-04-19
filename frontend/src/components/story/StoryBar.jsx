import { getStoryAvatar, getStoryChipLabel, getStoryId, getStoryTitle } from "../../utils/helpers";

export default function StoryBar({ currentUser, onCreateStory, onSelectStory, stories }) {
  const ownStoryGroup = stories.find((group) => group.author.id === currentUser?.id);
  const otherStories = stories.filter((group) => group.author.id !== currentUser?.id);

  return (
    <section className="story-strip">
      {ownStoryGroup ? (
        <button
          className="story-chip"
          onClick={() => onSelectStory?.(ownStoryGroup)}
          type="button"
        >
          <span className="story-chip__avatar story-chip__avatar--active">
            <img alt="Your Story" src={getStoryAvatar(ownStoryGroup)} />
          </span>
          <span>Your Story</span>
        </button>
      ) : (
        <button className="story-chip" onClick={onCreateStory} type="button">
          <span className="story-chip__avatar story-chip__avatar--accent">
            <img alt={getStoryChipLabel(currentUser)} src={getStoryAvatar({ author: currentUser })} />
            <span className="story-chip__add">
              <span className="material-symbols-outlined filled">add</span>
            </span>
          </span>
          <span>Your Story</span>
        </button>
      )}

      {otherStories.map((storyGroup) => {
        const allViewed = storyGroup.items && storyGroup.items.length > 0
          ? storyGroup.items.every(story => story.viewedByViewer)
          : false;

        return (
          <button
            className="story-chip"
            key={getStoryId(storyGroup)}
            onClick={() => onSelectStory?.(storyGroup)}
            type="button"
          >
            <span 
              className={
                allViewed 
                  ? "story-chip__avatar story-chip__avatar--viewed" 
                  : "story-chip__avatar story-chip__avatar--accent"
              }
            >
              <img alt={getStoryTitle(storyGroup)} src={getStoryAvatar(storyGroup)} />
            </span>
            <span style={{ color: allViewed ? "var(--text-soft)" : "inherit" }}>
              {getStoryTitle(storyGroup)}
            </span>
          </button>
        );
      })}
    </section>
  );
}

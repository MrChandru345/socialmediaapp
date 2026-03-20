export default function StoryBar({ stories }) {
  return (
    <section className="story-strip">
      {stories.map((story) => (
        <button className="story-chip" key={story.id} type="button">
          <span className={`story-chip__avatar ${story.accent ? "story-chip__avatar--accent" : ""}`}>
            <img alt={story.name} src={story.avatar} />
            {story.own ? (
              <span className="story-chip__add">
                <span className="material-symbols-outlined filled">add</span>
              </span>
            ) : null}
          </span>
          <span>{story.name}</span>
        </button>
      ))}
    </section>
  );
}

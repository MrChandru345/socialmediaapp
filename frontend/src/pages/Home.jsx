import {
  feedPosts,
  latestActivity,
  onlineFriends,
  stories,
  suggestedUsers
} from "../assets/mockData";
import PostCard from "../components/post/PostCard";
import StoryBar from "../components/story/StoryBar";
import OnlineUsers from "../components/chat/OnlineUsers";

export default function Home() {
  return (
    <div className="home-layout">
      <section className="feed-column">
        <StoryBar stories={stories} />
        <div className="feed-stack">
          {feedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <aside className="info-column">
        <section className="sidebar-card">
          <div className="section-heading">
            <h3>Latest Activity</h3>
            <span className="status-pill">3 new</span>
          </div>
          <div className="stack-list">
            {latestActivity.map((item) => (
              <div className="activity-row" key={item.id}>
                {item.avatar ? (
                  <img alt={item.text} className="activity-row__avatar" src={item.avatar} />
                ) : (
                  <div className="activity-row__icon">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                )}
                <div>
                  <p>{item.text}</p>
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <OnlineUsers users={onlineFriends} />

        <section className="sidebar-card">
          <div className="section-heading">
            <h3>Suggestions</h3>
            <button className="link-button" type="button">
              See all
            </button>
          </div>
          <div className="stack-list">
            {suggestedUsers.map((user) => (
              <div className="suggestion-row" key={user.id}>
                <div className="suggestion-row__identity">
                  <img alt={user.name} src={user.avatar} />
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.subtitle}</span>
                  </div>
                </div>
                <button className="mini-action" type="button">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

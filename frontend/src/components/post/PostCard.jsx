import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";

export default function PostCard({ post }) {
  return (
    <article className="post-card">
      <header className="post-card__header">
        <div className="post-card__author">
          <img alt={post.author.name} className="post-card__avatar" src={post.author.avatar} />
          <div>
            <h3>{post.author.name}</h3>
            <p>
              {post.timestamp} • {post.author.location}
            </p>
          </div>
        </div>
        <button className="icon-button" type="button">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </header>

      {post.cover.type === "gradient" ? (
        <div className="post-card__cover post-card__cover--gradient" style={{ background: post.cover.value }} />
      ) : (
        <img alt={post.caption} className="post-card__cover" src={post.cover.value} />
      )}

      <div className="post-card__body">
        <div className="post-card__metrics">
          <div className="metric-cluster">
            <LikeButton count={post.likes} />
            <button className="metric-button" type="button">
              <span className="material-symbols-outlined">chat_bubble</span>
              <span>{post.comments}</span>
            </button>
            <button className="icon-button" type="button">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          <button className="icon-button" type="button">
            <span className="material-symbols-outlined">bookmark</span>
          </button>
        </div>

        <p className="post-card__caption">
          <strong>{post.author.name}</strong> {post.caption}
        </p>

        <CommentSection count={post.comments} preview={post.commentPreview} />
      </div>
    </article>
  );
}

export default function CommentSection({ count, preview }) {
  return (
    <div className="comment-preview">
      {preview ? (
        <div className="comment-preview__card">
          <p className="eyebrow">Top comment</p>
          <p>
            <strong>{preview.author}</strong> {preview.text}
          </p>
        </div>
      ) : null}
      <button className="link-button" type="button">
        View all {count} comments
      </button>
    </div>
  );
}

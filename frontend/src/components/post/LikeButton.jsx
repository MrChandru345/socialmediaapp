import { formatCompactNumber } from "../../utils/helpers";

export default function LikeButton({ count, disabled = false, liked = false, onClick }) {
  return (
    <button className="metric-button" disabled={disabled} onClick={onClick} type="button">
      <span className={`material-symbols-outlined ${liked ? "filled metric-button__liked" : ""}`}>
        favorite
      </span>
      <span>{formatCompactNumber(count)}</span>
    </button>
  );
}

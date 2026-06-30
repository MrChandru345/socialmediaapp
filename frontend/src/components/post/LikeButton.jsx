import { Heart } from "lucide-react";
import { formatCompactNumber } from "../../utils/helpers";

export default function LikeButton({ count, disabled = false, liked = false, onClick }) {
  return (
    <button className="metric-button" disabled={disabled} onClick={onClick} type="button">
      <Heart 
        size={24}
        className={liked ? "metric-button__liked" : ""}
        fill={liked ? "var(--danger)" : "none"}
      />
      <span>{formatCompactNumber(count)}</span>
    </button>
  );
}

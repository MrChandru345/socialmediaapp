import { useState } from "react";

import { formatCompactNumber } from "../../utils/helpers";

export default function LikeButton({ count, liked = true }) {
  const [isLiked, setIsLiked] = useState(liked);
  const [likes, setLikes] = useState(count);

  function toggleLike() {
    setIsLiked((current) => !current);
    setLikes((current) => current + (isLiked ? -1 : 1));
  }

  return (
    <button className="metric-button" onClick={toggleLike} type="button">
      <span className={`material-symbols-outlined ${isLiked ? "filled metric-button__liked" : ""}`}>
        favorite
      </span>
      <span>{formatCompactNumber(likes)}</span>
    </button>
  );
}

import defaultUserAvatar from "../assets/icons/user.webp";

export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function getApiErrorMessage(error, fallback = "Something went wrong.") {
  return error?.response?.data?.message || error?.message || fallback;
}

export function formatCompactNumber(value) {
  const safeValue = Number(value) || 0;

  if (safeValue >= 1000000) {
    return `${(safeValue / 1000000).toFixed(1)}m`;
  }

  if (safeValue >= 1000) {
    return `${(safeValue / 1000).toFixed(1)}k`;
  }

  return String(safeValue);
}

export function formatRelativeTime(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const diffMs = date.getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) {
    return formatter.format(diffSeconds, "second");
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return formatter.format(diffDays, "day");
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric"
  });
}

/**
 * Formats a message timestamp:
 * - Today        → "6:42 PM"
 * - Yesterday/within this week (< 7 days) → "Sun 6:42 PM"
 * - Older than 1 week → "Apr 14, 2026, 11:25 PM"
 */
export function formatMessageTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();

  // Strip times to compare calendar days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.round((today - msgDay) / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (diffDays === 0) {
    // Today — time only
    return timeStr;
  }

  if (diffDays < 7) {
    // Yesterday or within this week — "Sun 6:42 PM"
    const dayName = date.toLocaleString("en-US", { weekday: "short" });
    return `${dayName} ${timeStr}`;
  }

  // Older than 1 week — "Apr 14, 2026, 11:25 PM"
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Returns a centered date-separator label for chat messages:
 * - Today     → "Today"
 * - Yesterday → "Yesterday"
 * - Within 7 days → "Monday"
 * - Older     → "Apr 14, 2026"
 */
export function formatDateSeparator(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - msgDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleString("en-US", { weekday: "long" });

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function getDisplayName(user, fallback = "Curator") {
  return user?.fullName || user?.username || fallback;
}

export function formatLastSeen(user) {
  if (user?.isOnline) return "Active now";
  if (!user?.lastSeen) return "";
  
  const relative = formatRelativeTime(user.lastSeen);
  return `Active ${relative}`;
}

export function getHandle(user) {
  return user?.username ? `@${user.username}` : "@curator";
}

export function getUserLocation(user) {
  return user?.location || "Global";
}

export function resolvePrimaryMedia(post) {
  if (post?.video) return post.video;
  return post?.media?.[0] || null;
}

export function isReel(post) {
  return Boolean(post?.isReel || post?.video);
}

export function truncateText(value, maxLength = 140) {
  if (!value || value.length <= maxLength) {
    return value || "";
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

export function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function countItemsLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function buildStatusCopy(user) {
  if (user?.isOnline) {
    return "Active now";
  }

  if (user?.followersCount) {
    return `${formatCompactNumber(user.followersCount)} followers`;
  }

  return "Connect";
}

export function isOwnResource(resourceUserId, currentUserId) {
  return Boolean(resourceUserId && currentUserId && String(resourceUserId) === String(currentUserId));
}

export function createOptimisticPost(post) {
  return {
    ...post,
    commentsCount: post.commentsCount || 0,
    likedByViewer: Boolean(post.likedByViewer),
    likesCount: getPostLikeCount(post),
    savedByViewer: Boolean(post.savedByViewer),
    savesCount: getPostSaveCount(post)
  };
}

export function buildComposerMediaPayload(mediaUrl, mediaType) {
  if (!mediaUrl) {
    return null;
  }

  return {
    type: mediaType || "image",
    url: mediaUrl
  };
}

export function isVideoMedia(media) {
  return media?.type === "video";
}

export function getStoryChipLabel(user, fallback = "Your Story") {
  return user?.username || user?.fullName || fallback;
}

export function getCommentAuthorLabel(comment) {
  return getDisplayName(comment?.author, "Curator");
}

function normalizeAvatarUrl(avatar) {
  if (!avatar) {
    return "";
  }

  if (typeof avatar === "string") {
    return avatar.trim();
  }

  return avatar.url?.trim() || "";
}

export function getAvatarForUser(user, fallbackName) {
  return resolveAvatar(getDisplayName(user, fallbackName), user?.avatar);
}

export function buildSnapshotItems({ postsCount, storiesCount, suggestionsCount }) {
  return [
    {
      id: "snapshot-posts",
      icon: "dynamic_feed",
      label: "Posts in your feed",
      value: formatCompactNumber(postsCount)
    },
    {
      id: "snapshot-stories",
      icon: "auto_stories",
      label: "Story groups live",
      value: formatCompactNumber(storiesCount)
    },
    {
      id: "snapshot-suggestions",
      icon: "person_add",
      label: "Creators to follow",
      value: formatCompactNumber(suggestionsCount)
    }
  ];
}

export function fileToPreviewUrl(file) {
  if (!file) {
    return "";
  }

  return URL.createObjectURL(file);
}

export function revokePreviewUrl(url) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export function hasValue(value) {
  return Boolean(value && String(value).trim());
}

export function trimOrEmpty(value) {
  return value?.trim() || "";
}

export function getPostCommentCount(post) {
  return post?.commentsCount || 0;
}

export function getPostLikeCount(post) {
  if (post?.likesCount !== undefined) return post.likesCount;
  if (Array.isArray(post?.likes)) return post.likes.length;
  return 0;
}

export function getPostSaveCount(post) {
  if (post?.savesCount !== undefined) return post.savesCount;
  if (Array.isArray(post?.saves)) return post.saves.length;
  return 0;
}

export function getCommentMeta(comment) {
  return formatRelativeTime(comment?.createdAt);
}

export function getStoryMeta(story) {
  return story?.caption || formatRelativeTime(story?.createdAt);
}

export function getSuggestionSubtitle(user) {
  if (user?.bio) {
    return user.bio.length > 60 ? `${user.bio.slice(0, 57).trimEnd()}...` : user.bio;
  }

  return buildStatusCopy(user);
}

export function getFeedHeading(user) {
  return `${getDisplayName(user, "Curator")}'s feed`;
}

export function countUniqueAuthors(stories) {
  return toArray(stories).length;
}

export function countFeedPosts(feed) {
  return toArray(feed).length;
}

export function countSuggestions(suggestions) {
  return toArray(suggestions).length;
}

export function getStoryAuthor(group) {
  return group?.author || null;
}

export function getStoryItems(group) {
  return toArray(group?.items);
}

export function hasStories(group) {
  return getStoryItems(group).length > 0;
}

export function getStoryTitle(group) {
  return getDisplayName(getStoryAuthor(group), "Story");
}

export function getStoryAvatar(group) {
  return getAvatarForUser(getStoryAuthor(group), "Story");
}

export function getStoryId(group) {
  return getStoryAuthor(group)?.id || getStoryAuthor(group)?._id || getStoryTitle(group);
}

export function getAuthorId(user) {
  return user?.id || user?._id || null;
}

export function getPostAuthor(post) {
  return post?.author || null;
}

export function getPostAuthorName(post) {
  return getDisplayName(getPostAuthor(post), "Curator");
}

export function getPostAvatar(post) {
  return getAvatarForUser(getPostAuthor(post), getPostAuthorName(post));
}

export function getPostLocation(post) {
  return getUserLocation(getPostAuthor(post));
}

export function getPostTimestamp(post) {
  return formatRelativeTime(post?.createdAt);
}

export function getPostCaption(post) {
  return post?.caption || "";
}

export function getPostMedia(post) {
  return resolvePrimaryMedia(post);
}

export function hasComments(post) {
  return getPostCommentCount(post) > 0;
}

export function getCommentId(comment) {
  return comment?.id || comment?._id;
}

export function getMediaPreviewSource(file, mediaUrl) {
  if (file) {
    return fileToPreviewUrl(file);
  }

  return mediaUrl || "";
}

export function getMediaPreviewType(file, mediaType) {
  if (file?.type?.startsWith("video/")) {
    return "video";
  }

  return mediaType || "image";
}

export function getPostEmptyStateMessage() {
  return "Follow a few creators or publish your first post to bring your feed to life.";
}

export function getSuggestionEmptyStateMessage() {
  return "You are caught up on suggestions for now.";
}

export function getStoryEmptyStateMessage() {
  return "Share the first story in your circle.";
}

export function getInitials(name = "Curator") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function resolveAvatar(name, avatarUrl) {
  return normalizeAvatarUrl(avatarUrl) || defaultUserAvatar;
}

export function withDelay(value, ms = 350) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}
export async function downloadResource(url, filename = `file_${Date.now()}`) {
  if (!url) return;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Download failed:", error);
    // Fallback: Try opening in a new tab if fetch fails (e.g. CORS)
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = filename;
    link.click();
  }
}

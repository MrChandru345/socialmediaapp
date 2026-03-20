export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function formatCompactNumber(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}m`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return String(value);
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
  if (avatarUrl) {
    return avatarUrl;
  }

  const seed = encodeURIComponent(name || "Curator");
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundType=gradientLinear`;
}

export function withDelay(value, ms = 350) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

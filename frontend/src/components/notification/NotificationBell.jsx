export default function NotificationBell({ count = 0, onClick }) {
  const badgeLabel = count > 99 ? "99+" : String(count);

  return (
    <button className="icon-button icon-button--notice" onClick={onClick} type="button">
      <span className="material-symbols-outlined">notifications</span>
      {count > 0 ? <span className="notification-badge">{badgeLabel}</span> : null}
    </button>
  );
}
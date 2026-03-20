export default function NotificationBell({ count = 0 }) {
  return (
    <button className="icon-button icon-button--notice" type="button">
      <span className="material-symbols-outlined">notifications</span>
      {count > 0 ? <span className="notification-badge">{count}</span> : null}
    </button>
  );
}

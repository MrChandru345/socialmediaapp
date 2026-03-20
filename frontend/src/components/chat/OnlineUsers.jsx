export default function OnlineUsers({ title = "Friends Online", users }) {
  return (
    <section className="sidebar-card">
      <div className="section-heading">
        <h3>{title}</h3>
      </div>
      <div className="stack-list">
        {users.map((user) => (
          <button className="presence-row" key={user.id} type="button">
            <span className="presence-row__avatar">
              <img alt={user.name} src={user.avatar} />
              <span className="presence-row__status" />
            </span>
            <span className="presence-row__content">
              <strong>{user.name}</strong>
              <span>{user.status}</span>
            </span>
            <span className="material-symbols-outlined">chat</span>
          </button>
        ))}
      </div>
    </section>
  );
}

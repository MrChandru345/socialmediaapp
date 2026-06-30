export default function ProfileTabs({ activeTab, onTabChange, isOwnProfile }) {
  const tabs = [
    { id: 'posts', label: 'Posts', icon: 'grid_on' },
    { id: 'reels', label: 'Reels', icon: 'movie' },
    ...(isOwnProfile ? [{ id: 'saved', label: 'Saved', icon: 'bookmark_border' }] : [])
  ];

  return (
    <div className="profile-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="material-symbols-outlined">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

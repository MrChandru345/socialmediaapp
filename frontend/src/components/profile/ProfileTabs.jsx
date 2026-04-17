export default function ProfileTabs({ activeTab, onTabChange, isOwnProfile }) {
  const tabs = [
    { id: 'posts', label: 'Posts', icon: 'grid_on' },
    ...(isOwnProfile ? [{ id: 'saved', label: 'Saved', icon: 'bookmark_border' }] : []),
    { id: 'tagged', label: 'Tagged', icon: 'assignment_ind' }
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

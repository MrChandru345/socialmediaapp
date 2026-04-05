import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../common/Modal";
import Button from "../common/Button";
import api from "../../services/api";
import { getAvatarForUser, getDisplayName } from "../../utils/helpers";
import Loader from "../common/Loader";
import { followService } from "../../services/followService";

export default function NetworkModal({ open, onClose, targetUserId, type, title }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingIds, setPendingIds] = useState([]);

  useEffect(() => {
    if (!open || !targetUserId) return;

    let isMounted = true;
    setLoading(true);
    setError("");

    const fetchNetwork = async () => {
      try {
        const endpoint = type === 'followers' 
          ? `/users/${targetUserId}/followers` 
          : `/users/${targetUserId}/following`;
          
        const res = await api.get(endpoint);
        if (isMounted && res.data.success) {
          setUsers(res.data.data);
        }
      } catch (err) {
        if (isMounted) setError("Failed to load users");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNetwork();
    return () => { isMounted = false; };
  }, [open, targetUserId, type]);

  async function handleToggleFollow(e, user) {
    e.preventDefault();
    if (pendingIds.includes(user.id)) return;
    setPendingIds(prev => [...prev, user.id]);
    
    try {
      await followService.toggle(user.id);
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, isFollowing: !u.isFollowing } : u
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setPendingIds(prev => prev.filter(id => id !== user.id));
    }
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    getDisplayName(u).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="network-modal-body" style={{ minHeight: '350px', maxHeight: '65vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 0.5rem 1rem' }}>
          <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-low)', padding: '0.65rem 1rem', borderRadius: '12px', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-soft)', fontSize: '1.25rem' }}>search</span>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', width: '100%', fontSize: '0.95rem' }} 
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
          {loading ? (
            <Loader label="Loading users..." />
          ) : error ? (
            <p className="form-error" style={{ textAlign: 'center', marginTop: '2rem' }}>{error}</p>
          ) : filteredUsers.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-soft)', marginTop: '2rem' }}>No users found.</p>
          ) : (
            <div className="network-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredUsers.map(u => (
                <div key={u.id} className="suggestion-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Link to={`/profile/${u.username}`} onClick={onClose} className="suggestion-row__identity" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden', minWidth: 0 }}>
                    <div className="story-ring" style={{ flexShrink: 0, padding: '2px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', borderRadius: '50%' }}>
                      <img src={getAvatarForUser(u, getDisplayName(u))} alt={u.username} className="suggestion-avatar" style={{ width: '48px', height: '48px', margin: 0, border: '2px solid var(--surface-card)' }} />
                    </div>
                    <div className="suggestion-info" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                      <strong style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {u.username}
                        <span className="material-symbols-outlined" style={{ color: '#1d9bf0', fontSize: '14px' }}>verified</span>
                      </strong>
                      <span className="suggestion-bio" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {getDisplayName(u)} {u.bio ? `| ${u.bio}` : ''}
                      </span>
                    </div>
                  </Link>

                  <Button 
                    size="sm" 
                    variant={u.isFollowing ? "outline" : "primary"} 
                    className="radius-full premium-btn" 
                    style={{ whiteSpace: 'nowrap', minWidth: '95px', fontWeight: 'bold' }}
                    onClick={(e) => handleToggleFollow(e, u)}
                    disabled={pendingIds.includes(u.id)}
                  >
                    {pendingIds.includes(u.id) ? "..." : u.isFollowing ? "Following" : "Follow"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>

  );
}

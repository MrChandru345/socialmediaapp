import { profileGallery, profileSummary } from "../assets/mockData";
import Button from "../components/common/Button";
import { formatCompactNumber, resolveAvatar } from "../utils/helpers";
import { useAuth } from "../hooks/useAuth";

export default function Profile() {
  const { user } = useAuth();

  const fullName = user?.fullName || profileSummary.name;
  const username = user?.username || "alexrivera";
  const avatar = resolveAvatar(fullName, user?.avatar?.url || profileSummary.avatar);

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-avatar-wrap">
          <img alt={fullName} className="profile-avatar" src={avatar} />
        </div>
        <div className="profile-details">
          <div className="profile-headline-row">
            <h2>{fullName}</h2>
            <div className="profile-actions">
              <Button size="sm">Edit Profile</Button>
              <button className="icon-button" type="button">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </div>

          <div className="profile-stats">
            <div>
              <strong>{profileSummary.stats.posts}</strong>
              <span>Posts</span>
            </div>
            <div>
              <strong>{formatCompactNumber(profileSummary.stats.followers)}</strong>
              <span>Followers</span>
            </div>
            <div>
              <strong>{profileSummary.stats.following}</strong>
              <span>Following</span>
            </div>
          </div>

          <div className="profile-bio">
            <p className="profile-title">{profileSummary.title}</p>
            <p>{profileSummary.bio}</p>
            <a href={`https://${profileSummary.website}`} rel="noreferrer" target="_blank">
              {profileSummary.website}
            </a>
            <small>@{username}</small>
          </div>
        </div>
      </section>

      <section className="gallery-section">
        <div className="section-tabs">
          <button className="section-tab section-tab--active" type="button">
            <span className="material-symbols-outlined">grid_on</span>
            Posts
          </button>
          <button className="section-tab" type="button">
            <span className="material-symbols-outlined">collections</span>
            Collections
          </button>
          <button className="section-tab" type="button">
            <span className="material-symbols-outlined">assignment_ind</span>
            Tagged
          </button>
        </div>

        <div className="gallery-grid">
          {profileGallery.map((item) => (
            <div className="gallery-tile" key={item.id}>
              <img alt="Curated gallery post" src={item.image} />
              <div className="gallery-tile__overlay">
                <span className="material-symbols-outlined filled">favorite</span>
                <span className="material-symbols-outlined filled">chat_bubble</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/userService";
import { getApiErrorMessage, resolveAvatar } from "../../utils/helpers";
import Button from "../common/Button";
import Modal from "../common/Modal";

function buildFormState(profile) {
  return {
    bio: profile?.bio || "",
    file: null,
    fullName: profile?.fullName || "",
    location: profile?.location || "",
    website: profile?.website || "",
    username: profile?.username || ""
  };
}

export default function EditProfileModal({ onClose, onUpdated, open, profile }) {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState(() => buildFormState(profile));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    setForm(buildFormState(profile));
    setError("");
  }, [profile, open]);

  useEffect(() => {
    if (!form.file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [form.file]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose?.();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const updatedProfile = await userService.updateMyProfile(form);
      await refreshUser();
      onUpdated?.(updatedProfile);
      onClose?.();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to save your profile."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const avatarPreview =
    previewUrl || resolveAvatar(form.fullName || profile?.username, profile?.avatar?.url);

  return (
    <Modal onClose={handleClose} open={open} title="Edit Profile">
      <form className="composer-form" onSubmit={handleSubmit} style={{ gap: '0' }}>
        <div className="edit-profile-avatar-zone">
          <img alt={form.fullName || "Profile"} className="edit-profile-avatar-preview" src={avatarPreview} />
          <div className="edit-profile-avatar-actions">
            <strong>{profile?.username || "Curator"}</strong>
            <label className="edit-profile-change-btn">
              Change profile photo
              <input
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    file: event.target.files?.[0] || null
                  }))
                }
                type="file"
                className="hidden-file-input"
                accept="image/*"
              />
            </label>
          </div>
        </div>



        <div className="edit-profile-field">
          <label>Bio</label>
          <div>
            <textarea
              onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
              value={form.bio}
            />
          </div>
        </div>

        <div className="edit-profile-field">
          <label>Name</label>
          <input
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            placeholder="Name"
            type="text"
            value={form.fullName}
          />
        </div>

        <div className="edit-profile-field">
          <label>Username</label>
          <input
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            placeholder="Username"
            type="text"
            value={form.username}
          />
        </div>

        <div className="edit-profile-field">
          <label>Location</label>
          <input
            onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
            placeholder="City, Country"
            type="text"
            value={form.location}
          />
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="composer-actions" style={{ justifyContent: 'flex-end', marginTop: "16px" }}>
          <Button disabled={isSubmitting} type="submit" variant="primary">
            {isSubmitting ? "Saving..." : "Submit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

import { useEffect, useState } from "react";

import { postService } from "../../services/postService";
import { getApiErrorMessage, hasValue } from "../../utils/helpers";
import Button from "../common/Button";
import Modal from "../common/Modal";

const initialState = {
  caption: "",
  file: null,
  mediaType: "image",
  visibility: "public"
};

export default function CreatePostModal({ onClose, onCreated, open }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

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

  function resetForm() {
    setForm(initialState);
    setError("");
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose?.();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.file) {
      setError("Please select a photo or video to share.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const createdPost = await postService.create(form);
      onCreated?.(createdPost);
      resetForm();
      onClose?.();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to publish your post."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal onClose={handleClose} open={open} title="Create new post">
      <form className="composer-form instagram-composer" onSubmit={handleSubmit}>
        {!form.file ? (
          <div className="instagram-upload-zone">
            <span className="material-symbols-outlined upload-icon">photo_library</span>
            <h3>Drag photos and videos here</h3>
            <label className="upload-btn">
              Select from computer
              <input
                accept="image/*,video/*"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null;
                  const nextType = nextFile?.type?.startsWith("video/") ? "video" : "image";

                  setForm((current) => ({
                    ...current,
                    file: nextFile,
                    mediaType: nextFile ? nextType : current.mediaType
                  }));
                }}
                type="file"
                className="hidden-file-input"
              />
            </label>
            <p className="upload-hint">or click to browse files</p>
          </div>
        ) : (
          <div className="composer-preview-split">
            <div className="composer-preview-media">
              {form.mediaType === "video" ? (
                <video controls preload="metadata" src={previewUrl} />
              ) : (
                <img alt="Post preview" src={previewUrl} />
              )}
              <button 
                type="button" 
                className="preview-clear-btn"
                onClick={() => {
                  setForm((current) => ({ ...current, file: null }));
                  setPreviewUrl("");
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="composer-preview-details">
              <div className="composer-user-header">
                {/* Visual placeholder for user. In a real app we'd pass user avatar */}
                <span className="material-symbols-outlined avatar-placeholder">account_circle</span>
                <strong>New Post</strong>
              </div>
              
              <textarea
                className="instagram-caption-input"
                onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))}
                placeholder="Write a caption..."
                rows="6"
                value={form.caption}
              />
              
              <label className="field visibility-field">
                <span className="eyebrow">Visibility</span>
                <select
                  onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
                  value={form.visibility}
                >
                  <option value="public">Public - Anyone can see</option>
                  <option value="followers">Followers - Only your followers</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {error ? <p className="form-error">{error}</p> : null}

        <div className="composer-actions">
          {form.file && (
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {isSubmitting ? "Sharing..." : "Share"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

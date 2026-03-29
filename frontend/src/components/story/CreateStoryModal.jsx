import { useEffect, useState } from "react";

import { storyService } from "../../services/storyService";
import { getApiErrorMessage, hasValue } from "../../utils/helpers";
import Button from "../common/Button";
import Modal from "../common/Modal";

const initialState = {
  caption: "",
  file: null,
  mediaType: "image"
};

export default function CreateStoryModal({ onClose, onCreated, open }) {
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
      setError("Please select a photo or video for your story.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const createdStory = await storyService.create(form);
      onCreated?.(createdStory);
      resetForm();
      onClose?.();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to publish your story."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal onClose={handleClose} open={open} title="Add to story">
      <form className="composer-form instagram-composer story-composer" onSubmit={handleSubmit}>
        {!form.file ? (
          <div className="instagram-upload-zone">
            <span className="material-symbols-outlined upload-icon">photo_library</span>
            <h3>Select content for your story</h3>
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
            <p className="upload-hint">Vertical photos and videos look best</p>
          </div>
        ) : (
          <div className="composer-preview-split composer-preview-split--story">
            <div className="composer-preview-media">
              {form.mediaType === "video" ? (
                <video controls preload="metadata" src={previewUrl} />
              ) : (
                <img alt="Story preview" src={previewUrl} />
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
                <span className="material-symbols-outlined avatar-placeholder">account_circle</span>
                <strong>Your Story</strong>
              </div>
              
              <textarea
                className="instagram-caption-input"
                onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))}
                placeholder="Add text to this story..."
                rows="4"
                value={form.caption}
              />
            </div>
          </div>
        )}

        {error ? <p className="form-error">{error}</p> : null}

        <div className="composer-actions">
          {form.file && (
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {isSubmitting ? "Adding to Story..." : "Add to Story"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

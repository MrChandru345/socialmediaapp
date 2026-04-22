import { useEffect, useState } from "react";
import { reelService } from "../../services/reelService";
import { getApiErrorMessage } from "../../utils/helpers";
import Button from "../common/Button";
import Modal from "../common/Modal";

const initialState = {
  caption: "",
  video: null
};

export default function CreateReelModal({ onClose, onCreated, open }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!form.video) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.video);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [form.video]);

  function resetForm() {
    setForm(initialState);
    setError("");
    setPreviewUrl("");
  }

  function handleClose() {
    if (isSubmitting) return;
    resetForm();
    onClose?.();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.video) {
      setError("Please select a video for your reel.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const createdReel = await reelService.create(form);
      onCreated?.(createdReel);
      resetForm();
      onClose?.();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to publish your reel."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal onClose={handleClose} open={open} title="Create Reel">
      <form className="composer-form instagram-composer reel-composer" onSubmit={handleSubmit}>
        {!form.video ? (
          <div className="instagram-upload-zone">
            <span className="material-symbols-outlined upload-icon">movie</span>
            <h3>Drag video here to create a Reel</h3>
            <label className="upload-btn">
              Select from computer
              <input
                accept="video/*"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null;
                  setForm((current) => ({ ...current, video: nextFile }));
                }}
                type="file"
                className="hidden-file-input"
              />
            </label>
            <p className="upload-hint">Reels must be in video format</p>
          </div>
        ) : (
          <div className="composer-preview-split">
            <div className="composer-preview-media reel-preview">
              <video controls autoPlay muted loop preload="metadata" src={previewUrl} />
              <button 
                type="button" 
                className="preview-clear-btn"
                onClick={() => {
                  setForm((current) => ({ ...current, video: null }));
                  setPreviewUrl("");
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="composer-preview-details">
              <div className="composer-user-header">
                <span className="material-symbols-outlined avatar-placeholder">movie</span>
                <strong>New Reel</strong>
              </div>
              
              <textarea
                className="instagram-caption-input"
                onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))}
                placeholder="Write a caption for your reel..."
                rows="6"
                value={form.caption}
              />
              
              <div className="reel-info-note">
                <span className="material-symbols-outlined">info</span>
                <p>Reels are short-form videos that appear in your profile's Reels tab.</p>
              </div>
            </div>
          </div>
        )}

        {error ? <p className="form-error">{error}</p> : null}

        <div className="composer-actions">
          {form.video && (
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {isSubmitting ? "Sharing Reel..." : "Share Reel"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

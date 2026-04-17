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

const COLOR_PRESETS = [
  { id: "classic", gradient: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)", colors: ["#f09433", "#e6683c", "#dc2743", "#cc2366", "#bc1888"] },
  { id: "ocean", gradient: "linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)", colors: ["#4facfe", "#00f2fe"] },
  { id: "midnight", gradient: "linear-gradient(45deg, #232526 0%, #414345 100%)", colors: ["#232526", "#414345"] },
  { id: "forest", gradient: "linear-gradient(45deg, #11998e 0%, #38ef7d 100%)", colors: ["#11998e", "#38ef7d"] },
  { id: "sunset", gradient: "linear-gradient(45deg, #ff7e5f 0%, #feb47b 100%)", colors: ["#ff7e5f", "#feb47b"] },
  { id: "cyber", gradient: "linear-gradient(45deg, #ff0844 0%, #ffb199 100%)", colors: ["#ff0844", "#ffb199"] },
  { id: "purple", gradient: "linear-gradient(45deg, #8a2387 0%, #e94057 50%, #f27121 100%)", colors: ["#8a2387", "#e94057", "#f27121"] }
];

export default function CreateStoryModal({ onClose, onCreated, open }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  
  const [storyMode, setStoryMode] = useState("media"); // "media" | "text"
  const [currentPresetId, setCurrentPresetId] = useState("classic");

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
    setStoryMode("media");
    setCurrentPresetId("classic");
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
    setError("");

    let submissionPayload = { ...form };

    if (storyMode === "text") {
      if (!form.caption.trim()) {
        setError("Please add text for your story.");
        return;
      }
      setIsSubmitting(true);
      
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext("2d");
        
        const preset = COLOR_PRESETS.find(p => p.id === currentPresetId) || COLOR_PRESETS[0];
        
        if (preset.colors.length > 1) {
          const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
          preset.colors.forEach((c, i) => grad.addColorStop(i / (preset.colors.length - 1), c));
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = preset.colors[0];
        }
        ctx.fillRect(0, 0, 1080, 1920);
        
        ctx.fillStyle = "white";
        ctx.font = "bold 80px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        const textAreaVal = form.caption;
        // Handle explicit newlines as well
        const blocks = textAreaVal.split('\n');
        let lines = [];
        
        blocks.forEach(block => {
          if (!block.trim()) {
            lines.push("");
            return;
          }
          const words = block.split(/\s+/);
          let currentLine = words[0] || "";
          
          for (let i = 1; i < words.length; i++) {
            const w = words[i];
            const width = ctx.measureText(currentLine + " " + w).width;
            if (width < 900) {
              currentLine += " " + w;
            } else {
              lines.push(currentLine);
              currentLine = w;
            }
          }
          if (currentLine) lines.push(currentLine);
        });
        
        const lineHeight = 110;
        const startY = 1920 / 2 - ((lines.length - 1) * lineHeight) / 2;
        
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        
        lines.forEach((line, i) => {
          ctx.fillText(line, 1080 / 2, startY + (i * lineHeight));
        });
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        submissionPayload.file = new File([blob], "text-story.jpg", { type: "image/jpeg" });
        submissionPayload.mediaType = "image";
        submissionPayload.caption = ""; 
      } catch (err) {
        console.error(err);
        setError("Failed to generate story image.");
        setIsSubmitting(false);
        return;
      }
    } else {
      if (!form.file) {
        setError("Please select a photo or video for your story.");
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      const createdStory = await storyService.create(submissionPayload);
      onCreated?.(createdStory);
      resetForm();
      onClose?.();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Unable to publish your story."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeGrad = COLOR_PRESETS.find(p => p.id === currentPresetId)?.gradient;

  return (
    <Modal onClose={handleClose} open={open} title="Add to story">
      <form className="composer-form instagram-composer story-composer" onSubmit={handleSubmit}>
        
        <div className="story-type-tabs">
          <div 
            className={`story-type-tab ${storyMode === 'media' ? 'active' : ''}`}
            onClick={() => setStoryMode('media')}
          >
            Photo/Video
          </div>
          <div 
            className={`story-type-tab ${storyMode === 'text' ? 'active' : ''}`}
            onClick={() => setStoryMode('text')}
          >
            Create
          </div>
        </div>

        {storyMode === "text" ? (
          <div className="text-story-creator">
            <div 
              className="text-story-canvas-container" 
              style={{ background: activeGrad }}
            >
              <textarea
                className="text-story-input"
                placeholder="Type here..."
                value={form.caption}
                onChange={(e) => setForm(f => ({ ...f, caption: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="text-story-colors">
              {COLOR_PRESETS.map(preset => (
                <div 
                  key={preset.id} 
                  className={`color-swatch ${currentPresetId === preset.id ? 'active' : ''}`}
                  style={{ background: preset.gradient }}
                  onClick={() => setCurrentPresetId(preset.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          !form.file ? (
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
          )
        )}

        {error ? <p className="form-error">{error}</p> : null}

        <div className="composer-actions">
          {(form.file || storyMode === "text") && (
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {isSubmitting ? "Adding to Story..." : "Add to Story"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

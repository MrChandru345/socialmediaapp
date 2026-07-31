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

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function cropImageToSquareFile(file, zoom, offset, containerWidth, cropMode) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      
      // Target cropped size is based on cropMode
      if (cropMode === 'square') {
        const destSize = Math.min(img.width, img.height);
        canvas.width = destSize;
        canvas.height = destSize;
        const ctx = canvas.getContext("2d");

        const scaleToFit = containerWidth / Math.min(img.width, img.height);
        const displayedWidth = img.width * scaleToFit;
        const displayedHeight = img.height * scaleToFit;

        const canvasScale = destSize / containerWidth;

        const drawWidth = displayedWidth * canvasScale * zoom;
        const drawHeight = displayedHeight * canvasScale * zoom;

        const drawX = destSize / 2 + offset.x * canvasScale - drawWidth / 2;
        const drawY = destSize / 2 + offset.y * canvasScale - drawHeight / 2;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, destSize, destSize);
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      } else {
        // Original fit mode: keep natural proportions
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(croppedFile);
        } else {
          reject(new Error("Canvas toBlob failed"));
        }
      }, file.type);
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
}

export default function CreatePostModal({ onClose, onCreated, open }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [step, setStep] = useState("select");
  const [previewUrl, setPreviewUrl] = useState("");
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState("");
  const [croppedFile, setCroppedFile] = useState(null);

  const [cropMode, setCropMode] = useState("square");
  const [zoom] = useState(1); // Zoom fixed to 1 since there is no slider now
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [displayedSize, setDisplayedSize] = useState({ width: 0, height: 0 });

  const containerWidth = 350;

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

  useEffect(() => {
    return () => {
      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl);
      }
    };
  }, [croppedPreviewUrl]);

  function resetForm() {
    setForm(initialState);
    setError("");
    setStep("select");
    setOffset({ x: 0, y: 0 });
    setCroppedFile(null);
    setCropMode("square");
    if (croppedPreviewUrl) {
      URL.revokeObjectURL(croppedPreviewUrl);
      setCroppedPreviewUrl("");
    }
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose?.();
  }

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setDimensions({ width: naturalWidth, height: naturalHeight });
    
    // Fit dimension calculations
    if (naturalHeight > naturalWidth) {
      const w = containerWidth;
      const h = containerWidth * (naturalHeight / naturalWidth);
      setDisplayedSize({ width: w, height: h });
    } else {
      const h = containerWidth;
      const w = containerWidth * (naturalWidth / naturalHeight);
      setDisplayedSize({ width: w, height: h });
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    if (cropMode !== 'square') return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || cropMode !== 'square') return;
    
    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;
    
    const maxX = Math.max(0, (displayedSize.width * zoom - containerWidth) / 2);
    const maxY = Math.max(0, (displayedSize.height * zoom - containerWidth) / 2);
    
    setOffset({
      x: clamp(rawX, -maxX, maxX),
      y: clamp(rawY, -maxY, maxY)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (cropMode !== 'square') return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - offset.x,
      y: touch.clientY - offset.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || cropMode !== 'square') return;
    const touch = e.touches[0];
    const rawX = touch.clientX - dragStart.x;
    const rawY = touch.clientY - dragStart.y;
    
    const maxX = Math.max(0, (displayedSize.width * zoom - containerWidth) / 2);
    const maxY = Math.max(0, (displayedSize.height * zoom - containerWidth) / 2);
    
    setOffset({
      x: clamp(rawX, -maxX, maxX),
      y: clamp(rawY, -maxY, maxY)
    });
  };

  const handleNextStep = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const cropped = await cropImageToSquareFile(form.file, zoom, offset, containerWidth, cropMode);
      setCroppedFile(cropped);
      
      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl);
      }
      const url = URL.createObjectURL(cropped);
      setCroppedPreviewUrl(url);
      setStep("details");
    } catch (err) {
      console.error(err);
      setError("Failed to crop image. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.file) {
      setError("Please select a photo or video to share.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const fileToUpload = form.mediaType === "image" ? (croppedFile || form.file) : form.file;

      const createdPost = await postService.create({
        ...form,
        file: fileToUpload
      });
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
    <Modal onClose={handleClose} open={open} title={step === 'crop' ? 'Crop' : (step === 'details' ? 'Create new post' : 'Create new post')}>
      <form className="composer-form instagram-composer" onSubmit={handleSubmit}>
        {step === 'select' && (
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

                  if (nextFile) {
                    if (nextType === "image") {
                      setStep("crop");
                    } else {
                      setStep("details");
                    }
                  }
                }}
                type="file"
                className="hidden-file-input"
              />
            </label>
            <p className="upload-hint">or click to browse files</p>
          </div>
        )}

        {step === 'crop' && (
          <div className="crop-step-layout" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div className="crop-custom-header">
              <button type="button" className="crop-header-back-btn" onClick={resetForm}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <span className="crop-header-title">Crop</span>
              <button type="button" className="crop-header-next-btn" onClick={handleNextStep} disabled={isSubmitting}>
                {isSubmitting ? "..." : "Next"}
              </button>
            </div>

            <div className="crop-preview-container" style={{ padding: '24px 0', background: '#121212', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div 
                className="crop-box"
                style={{
                  width: `${containerWidth}px`,
                  height: `${containerWidth}px`,
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#000',
                  borderRadius: '12px',
                  cursor: cropMode === 'square' ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  touchAction: 'none',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <img
                  src={previewUrl}
                  alt="Crop preview"
                  onLoad={handleImageLoad}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: cropMode === 'square' ? 'cover' : 'contain',
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                />

                {/* Grid Overlay */}
                <div className="crop-grid-overlay">
                  <div className="crop-grid-line crop-grid-line-h1"></div>
                  <div className="crop-grid-line crop-grid-line-h2"></div>
                  <div className="crop-grid-line crop-grid-line-v1"></div>
                  <div className="crop-grid-line crop-grid-line-v2"></div>
                </div>

                {/* Brackets aspect toggle button in bottom left */}
                <button
                  type="button"
                  className="crop-mode-toggle-btn"
                  onClick={() => {
                    setCropMode(prev => prev === "square" ? "original" : "square");
                    setOffset({ x: 0, y: 0 });
                  }}
                  title={cropMode === "square" ? "Show full image size" : "Crop to square (1:1)"}
                >
                  <span className="material-symbols-outlined">
                    {cropMode === "square" ? "aspect_ratio" : "crop_free"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="composer-preview-split">
            <div className="composer-preview-media">
              {form.mediaType === "video" ? (
                <video controls preload="metadata" src={previewUrl} />
              ) : (
                <img alt="Post preview" src={croppedPreviewUrl || previewUrl} />
              )}
              <button 
                type="button" 
                className="preview-clear-btn"
                onClick={resetForm}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="composer-preview-details">
              <div className="composer-user-header">
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

              {form.mediaType === "image" && (
                <button 
                  type="button" 
                  onClick={() => setStep("crop")}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    padding: 0,
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    alignSelf: 'flex-start'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>crop</span> Re-crop image
                </button>
              )}
            </div>
          </div>
        )}

        {error ? <p className="form-error">{error}</p> : null}

        {step === 'details' && (
          <div className="composer-actions">
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {isSubmitting ? "Sharing..." : "Share"}
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}

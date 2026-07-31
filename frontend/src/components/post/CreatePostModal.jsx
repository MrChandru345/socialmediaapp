import { useEffect, useState } from "react";
import Cropper from "react-easy-crop";

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

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, pixelCrop, fileName) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      const croppedFile = new File([blob], fileName, {
        type: "image/jpeg",
        lastModified: Date.now()
      });
      resolve(croppedFile);
    }, "image/jpeg", 0.95);
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

  // react-easy-crop states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(1); // Default to 1:1
  const [activeAspectName, setActiveAspectName] = useState("1:1");
  const [originalAspect, setOriginalAspect] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspect(1);
    setActiveAspectName("1:1");
    setCroppedFile(null);
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

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const selectAspect = (name) => {
    setActiveAspectName(name);
    if (name === "original") {
      setAspect(originalAspect);
    } else if (name === "1:1") {
      setAspect(1);
    } else if (name === "4:5") {
      setAspect(4 / 5);
    } else if (name === "1.91:1") {
      setAspect(1.91);
    }
  };

  const handleNextStep = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      if (!croppedAreaPixels) {
        throw new Error("No crop area selected.");
      }
      const cropped = await getCroppedImg(previewUrl, croppedAreaPixels, form.file.name);
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
    <Modal onClose={handleClose} open={open} title={step === "crop" ? "Crop" : "Create new post"}>
      <form className="composer-form instagram-composer" onSubmit={handleSubmit}>
        {step === "select" && (
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
                      const img = new Image();
                      img.onload = () => {
                        const originalRatio = img.naturalWidth / img.naturalHeight;
                        setOriginalAspect(originalRatio);
                        setAspect(1);
                        setActiveAspectName("1:1");
                        setStep("crop");
                      };
                      img.src = URL.createObjectURL(nextFile);
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

        {step === "crop" && (
          <div className="crop-step-layout">
            <div className="crop-custom-header">
              <button type="button" className="crop-header-back-btn" onClick={resetForm}>
                Cancel
              </button>
              <span className="crop-header-title">Crop Image</span>
              <button 
                type="button" 
                className="crop-header-next-btn" 
                onClick={handleNextStep} 
                disabled={isSubmitting}
              >
                {isSubmitting ? "..." : "Next"}
              </button>
            </div>

            <div className="cropper-container-wrapper">
              <div className="cropper-inner-container">
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  restrictPosition={true}
                />
              </div>
            </div>

            <div className="cropper-controls-panel">
              <div className="aspect-ratio-selector">
                <button
                  type="button"
                  className={`aspect-btn ${activeAspectName === "original" ? "active" : ""}`}
                  onClick={() => selectAspect("original")}
                >
                  Original
                </button>
                <button
                  type="button"
                  className={`aspect-btn ${activeAspectName === "1:1" ? "active" : ""}`}
                  onClick={() => selectAspect("1:1")}
                >
                  1:1
                </button>
                <button
                  type="button"
                  className={`aspect-btn ${activeAspectName === "4:5" ? "active" : ""}`}
                  onClick={() => selectAspect("4:5")}
                >
                  4:5
                </button>
                <button
                  type="button"
                  className={`aspect-btn ${activeAspectName === "1.91:1" ? "active" : ""}`}
                  onClick={() => selectAspect("1.91:1")}
                >
                  1.91:1
                </button>
              </div>

              <div className="zoom-slider-container">
                <span className="zoom-label">Zoom</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="zoom-slider-input"
                />
              </div>
            </div>
          </div>
        )}

        {step === "details" && (
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
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    padding: 0,
                    marginTop: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    alignSelf: "flex-start"
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>crop</span> Re-crop image
                </button>
              )}
            </div>
          </div>
        )}

        {error ? <p className="form-error">{error}</p> : null}

        {step === "details" && (
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

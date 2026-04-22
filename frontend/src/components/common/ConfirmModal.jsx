import "./ConfirmModal.css";

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Content?", 
  message = "Are you sure you want to permanently delete this? This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isDanger = true,
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-backdrop" onClick={onClose}>
      <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal-actions">
          <button 
            className="confirm-btn-cancel" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button 
            className={`confirm-btn-action ${isDanger ? 'danger' : ''}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

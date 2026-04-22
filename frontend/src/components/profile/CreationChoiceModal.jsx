import React from 'react';
import Modal from '../common/Modal';

export default function CreationChoiceModal({ open, onClose, onChoosePost, onChooseReel }) {
  return (
    <Modal open={open} onClose={onClose} title="Create" maxWidth="400px">
      <div className="creation-choice-container">
        <button 
          className="choice-card modern-glass hover-zoom" 
          onClick={() => {
            onChoosePost();
            onClose();
          }}
        >
          <div className="choice-icon-wrap post-icon">
            <span className="material-symbols-outlined">grid_on</span>
          </div>
          <div className="choice-info">
            <strong>Post</strong>
            <span>Share photos and videos</span>
          </div>
          <span className="material-symbols-outlined arrow">chevron_right</span>
        </button>

        <button 
          className="choice-card modern-glass hover-zoom" 
          onClick={() => {
            onChooseReel();
            onClose();
          }}
        >
          <div className="choice-icon-wrap reel-icon">
            <span className="material-symbols-outlined">movie</span>
          </div>
          <div className="choice-info">
            <strong>Reel</strong>
            <span>Share short-form videos</span>
          </div>
          <span className="material-symbols-outlined arrow">chevron_right</span>
        </button>
      </div>
    </Modal>
  );
}

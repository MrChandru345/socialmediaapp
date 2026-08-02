import React from 'react';
import Modal from '../common/Modal';
import ReelIcon from '../common/ReelIcon';

export default function CreationChoiceModal({ open, onClose, onChoosePost, onChooseReel, onChooseStory }) {
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
            <ReelIcon size={22} />
          </div>
          <div className="choice-info">
            <strong>Reel</strong>
            <span>Share short-form videos</span>
          </div>
          <span className="material-symbols-outlined arrow">chevron_right</span>
        </button>

        <button 
          className="choice-card modern-glass hover-zoom" 
          onClick={() => {
            onChooseStory();
            onClose();
          }}
        >
          <div className="choice-icon-wrap story-icon">
            <span className="material-symbols-outlined">auto_stories</span>
          </div>
          <div className="choice-info">
            <strong>Story</strong>
            <span>Share vanishing photos/videos</span>
          </div>
          <span className="material-symbols-outlined arrow">chevron_right</span>
        </button>
      </div>
    </Modal>
  );
}

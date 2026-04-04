import React from 'react';
import logo from '../assets/logo.svg';

export default function Header({ currentView, setCurrentView, selectedTranscriptId, setSelectedTranscriptId, handleLogout }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className='header-brand-wrapper'>
          <img src={logo} alt="Meeting Intelligence Hub Logo" className="header-logo" />
          <div className="header-brand">Meeting Intelligence Hub</div>
        </div>
      </div>
      <div className='header-nav-container'>
        <div className='header-nav'>
          <div 
            className={`header-nav-item clickable ${!selectedTranscriptId && currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setCurrentView('dashboard'); setSelectedTranscriptId(null); }}
          >
            Dashboard
          </div>
          <div 
            className={`header-nav-item clickable ${!selectedTranscriptId && currentView === 'upload' ? 'active' : ''}`}
            onClick={() => { setCurrentView('upload'); setSelectedTranscriptId(null); }}
          >
            Upload Transcripts
          </div>
          <div className="header-logout clickable" onClick={handleLogout}>Logout</div>
        </div>
      </div>
    </header>
  );
}

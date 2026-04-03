import React from 'react';
import logo from '../assets/logo.svg';
export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  currentView,
  setCurrentView,
  selectedTranscriptId,
  setSelectedTranscriptId
}) {
  return (
    <>
      <aside className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>

        <div className="sidebar-brand-wrapper">
          <img src={logo} alt="Meeting Intelligence Hub Logo" className="sidebar-logo" />
          <div className='sidebar-brand'>Intelligence Hub</div>
        </div>

        <div className='sidebar-header-info'>Upload transcripts, track decisions, and analyze speaker sentiment instantly.</div>
        <nav className="sidebar-nav">
          <div
            className={`sidebar-link clickable ${!selectedTranscriptId && currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setCurrentView('dashboard'); setSelectedTranscriptId(null); setIsSidebarOpen(false); }}
          >
            Dashboard
          </div>
          <div
            className={`sidebar-link clickable ${!selectedTranscriptId && currentView === 'upload' ? 'active' : ''}`}
            onClick={() => { setCurrentView('upload'); setSelectedTranscriptId(null); setIsSidebarOpen(false); }}
          >
            Upload Transcripts
          </div>
          <div
            className={`sidebar-link clickable ${!selectedTranscriptId && currentView === 'about' ? 'active' : ''}`}
            onClick={() => { setCurrentView('about'); setSelectedTranscriptId(null); setIsSidebarOpen(false); }}
          >
            About Us
          </div>
        </nav>
      </aside>

      {/* Overlay to close sidebar on mobile/small screens */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </>
  );
}

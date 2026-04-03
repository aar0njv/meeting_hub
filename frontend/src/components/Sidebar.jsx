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
        <h2 className='brand'>Intelligence Hub</h2>
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
        </nav>
      </aside>

      {/* Overlay to close sidebar on mobile/small screens */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </>
  );
}

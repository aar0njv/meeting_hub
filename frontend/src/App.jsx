import { useState } from 'react';
import DashboardPage from './pages/DashboardPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import TranscriptDetailPage from './pages/TranscriptDetailPage.jsx';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTranscriptId, setSelectedTranscriptId] = useState(null);

  const renderContent = () => {
    if (selectedTranscriptId) {
      return <TranscriptDetailPage id={selectedTranscriptId} onBack={() => setSelectedTranscriptId(null)} />;
    }
    if (currentView === 'upload') {
      return <UploadPage onUploadSuccess={() => setCurrentView('dashboard')} />;
    }
    return <DashboardPage onSelectTranscript={(id) => setSelectedTranscriptId(id)} />;
  };
  return (
    <div className="app">
      <aside className="app-sidebar">
        <nav className="sidebar-nav">
          <div
            className={`sidebar-link ${!selectedTranscriptId && currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setCurrentView('dashboard'); setSelectedTranscriptId(null); }}
            style={{ cursor: 'pointer' }}
          >
            Dashboard
          </div>
          <div
            className={`sidebar-link ${!selectedTranscriptId && currentView === 'upload' ? 'active' : ''}`}
            onClick={() => { setCurrentView('upload'); setSelectedTranscriptId(null); }}
            style={{ cursor: 'pointer' }}
          >
            Upload Transcripts
          </div>
        </nav>
      </aside>

      <div className="app-content">
        <header className="app-header">
          <div className="header-brand">Meeting Intelligence Hub</div>
          <div className="header-logout">Logout</div>
        </header>
        <main className="app-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;

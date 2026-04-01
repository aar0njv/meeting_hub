import { useState, useEffect } from 'react';
import DashboardPage from './pages/DashboardPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import TranscriptDetailPage from './pages/TranscriptDetailPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTranscriptId, setSelectedTranscriptId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderContent = () => {
    if (selectedTranscriptId) {
      return <TranscriptDetailPage id={selectedTranscriptId} session={session} onBack={() => setSelectedTranscriptId(null)} />;
    }
    if (currentView === 'upload') {
      return <UploadPage session={session} onUploadSuccess={() => setCurrentView('dashboard')} />;
    }
    return <DashboardPage session={session} onSelectTranscript={(id) => setSelectedTranscriptId(id)} />;
  };

  if (!session) {
    return <AuthPage />;
  }

  return (
    <div className="app">
      <aside className="app-sidebar">
        <nav className="sidebar-nav">
          <div
            className={`sidebar-link clickable ${!selectedTranscriptId && currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setCurrentView('dashboard'); setSelectedTranscriptId(null); }}
          >
            Dashboard
          </div>
          <div
            className={`sidebar-link clickable ${!selectedTranscriptId && currentView === 'upload' ? 'active' : ''}`}
            onClick={() => { setCurrentView('upload'); setSelectedTranscriptId(null); }}
          >
            Upload Transcripts
          </div>
        </nav>
      </aside>

      <div className="app-content">
        <header className="app-header">
          <div className="header-brand">Meeting Intelligence Hub</div>
          <div className="header-logout clickable" onClick={handleLogout}>Logout</div>
        </header>
        <main className="app-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;

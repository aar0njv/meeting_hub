import { useState, useEffect } from 'react';
import DashboardPage from './pages/DashboardPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import TranscriptDetailPage from './pages/TranscriptDetailPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTranscriptId, setSelectedTranscriptId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
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
    setCurrentView('dashboard');
    setSelectedTranscriptId(null);
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

  if (loading) return <div>Loading...</div>
  if (!session) {
    return <AuthPage />;
  }

  return (
    <div className="app">
      <div className="app-content">
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          selectedTranscriptId={selectedTranscriptId}
          setSelectedTranscriptId={setSelectedTranscriptId}
          handleLogout={handleLogout}
        />
        <main className="app-main">
          {renderContent()}
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;

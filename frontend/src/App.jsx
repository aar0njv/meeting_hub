import { Routes, Route, NavLink, Link } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import TranscriptDetailPage from './pages/TranscriptDetailPage.jsx';

function App() {
  return (
    <div className="app">
      <aside className="app-sidebar">
        <Link to="/" className="brand">Meeting Hub</Link>
        <nav className="sidebar-nav">
          <NavLink 
            to="/" 
            className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/upload" 
            className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
          >
            Upload Transcripts
          </NavLink>
        </nav>
      </aside>

      <div className="app-content">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/transcripts/:id" element={<TranscriptDetailPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;

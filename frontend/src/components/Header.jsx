export default function Header({ isSidebarOpen, setIsSidebarOpen, handleLogout }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <div className="header-brand">Meeting Intelligence Hub</div>
      </div>
      <div className="header-logout clickable" onClick={handleLogout}>Logout</div>
    </header>
  );
}

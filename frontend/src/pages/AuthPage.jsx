import { useState } from 'react';
import { supabase } from '../supabaseClient';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Success! Check your email for confirmation or log in if auto-confirm is enabled.");
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Invalid email or password.' : err.message);
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-split-wrapper">
        <div className="auth-info-side">
          <h2 style={{ color: '#f39c12' }}>Meeting Intelligence Hub</h2>
          <p>Transform your meetings into actionable insights. Upload transcripts, track decisions, and analyze speaker sentiment instantly.</p>

          <div className="auth-features">
            <div className="feature-item">

              <div>
                <h4>AI-Powered Extraction</h4>
                <p>Automatically detect action items and key decisions from any meeting transcript.</p>
              </div>
            </div>
            <div className="feature-item">
              <div>
                <h4>Sentiment Analysis</h4>
                <p>Understand the emotional tone of your meetings to improve team dynamics.</p>
              </div>
            </div>
            <div className="feature-item">
              <div>
                <h4>Interactive Chat</h4>
                <p>Chat directly with your meeting transcripts to answer questions and get summaries.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-card">
            <h2 className="auth-title">Welcome</h2>
            <p className="auth-subtitle">{isLogin ? 'Please enter your details to login.' : 'Create an account to get started.'}</p>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                Log In
              </button>
              <button
                type="button"
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="toast-popup error-toast">
          {error}
        </div>
      )}
    </div>
  );
}

export default AuthPage;

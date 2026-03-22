import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function DashboardPage() {
    const [transcripts, setTranscripts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTranscripts = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/transcripts');
                if (res.ok) {
                    const data = await res.json();
                    setTranscripts(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTranscripts();
    }, []);

    const getSentimentBadge = (score) => {
        if (score > 0.3) return <span className="badge positive">Positive ({score.toFixed(2)})</span>;
        if (score < -0.3) return <span className="badge negative">Negative ({score.toFixed(2)})</span>;
        return <span className="badge neutral">Neutral ({score.toFixed(2)})</span>;
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}><h2>Loading Dashboard...</h2></div>;

    return (
        <div className="dashboard-page">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1>Dashboard</h1>
                    <p className="text-muted">A complete list of your analyzed meeting transcripts.</p>
                </div>
                <div>
                    <Link to="/upload" className="btn btn-gradient">
                        + Upload Transcript
                    </Link>
                </div>
            </div>

            <div className="card-grid">
                {transcripts.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
                        <p className="text-muted">No transcripts found. Upload your first transcript to get started.</p>
                    </div>
                ) : (
                    transcripts.map(t => (
                        <Link to={`/transcripts/${t.id}`} className="card" key={t.id}>
                            <div className="card-title">{t.fileName}</div>
                            <div className="card-meta">
                                Uploaded: {t.date}
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                {getSentimentBadge(t.overallSentimentScore)}
                            </div>
                            <div className="card-stats">
                                <div className="stat">
                                    <span className="stat-value">{t.wordCount}</span>
                                    <span className="stat-label">Words</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{t.totalActionItems}</span>
                                    <span className="stat-label">Action Items</span>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}

export default DashboardPage;

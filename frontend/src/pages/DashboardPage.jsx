import { useState, useEffect } from 'react';

function DashboardPage({ onSelectTranscript }) {
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



    if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}><h2>Loading Dashboard...</h2></div>;

    return (
        <div className="dashboard-page">
            <div style={{ marginBottom: '2rem' }}>
                <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '500' }}>Complete list of your analyzed meeting transcripts.</p>
            </div>

            <div className="card-grid">
                {transcripts.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
                        <p className="text-muted">No transcripts found. Upload your first transcript to get started.</p>
                    </div>
                ) : (
                    transcripts.map(t => (
                        <div className="card" key={t.id} onClick={() => onSelectTranscript(t.id)} style={{ cursor: 'pointer' }}>
                            <div className="card-title">{t.fileName}</div>
                            <div className="card-meta">
                                Uploaded: {t.date}
                            </div>
                            <div className="card-stats">
                                <div className="stat">
                                    <span className="stat-value">{t.wordCount}</span>
                                    <span className="stat-label">Words</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default DashboardPage;

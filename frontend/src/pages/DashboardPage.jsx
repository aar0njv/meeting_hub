import { useState, useEffect } from 'react';

function DashboardPage({ session, onSelectTranscript }) {
    const [transcripts, setTranscripts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTranscripts = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/transcripts', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
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

        if (session) fetchTranscripts();
    }, [session]);

    // Group transcripts by meeting_id
    const grouped = transcripts.reduce((acc, t) => {
        const meetingId = t.meeting_id;
        if (!acc[meetingId]) {
            acc[meetingId] = {
                meetingTitle: t.meetings?.title || 'Standalone Transcript',
                meetingDate: t.meetings?.date || '',
                transcripts: []
            };
        }
        acc[meetingId].transcripts.push(t);
        return acc;
    }, {});

    if (loading) return <div className="loading-container"><h2>Loading Dashboard...</h2></div>;

    return (
        <div className="dashboard-page">
            <div className="page-description">
                <p>Complete list of your analyzed meeting transcripts, grouped by Project.</p>
            </div>

            {Object.keys(grouped).length === 0 ? (
                <div className="empty-state-container">
                    <p className="text-muted">No transcripts found. Upload your first transcript to get started.</p>
                </div>
            ) : (
                Object.keys(grouped).map(meetingId => {
                    const group = grouped[meetingId];
                    return (
                        <div key={meetingId} className="meeting-group-container">
                            <div className="meeting-group-header">
                                <h3 className="meeting-group-title">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                    {group.meetingTitle}
                                    {group.meetingDate && <span className="meeting-group-date">({group.meetingDate})</span>}
                                </h3>
                                <div className="transcript-count-badge">
                                    {group.transcripts.length} Transcript{group.transcripts.length !== 1 && 's'}
                                </div>
                            </div>
                            <div className="card-grid">
                                {group.transcripts.map(t => (
                                    <div className="card clickable-card" key={t.id} onClick={() => onSelectTranscript(t.id)}>
                                        <div className="card-title">{t.file_name.replace(/\.txt$/, '')}</div>
                                        <div className="card-meta">
                                            Uploaded on: {new Date(t.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="card-stats">
                                            <div className="stat">
                                                <span className="stat-value">{t.word_count}</span>
                                                <span className="stat-label">Words</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-value">{t.speaker_count}</span>
                                                <span className="stat-label">Speakers</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default DashboardPage;

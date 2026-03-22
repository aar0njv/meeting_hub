import { useState } from 'react';

function SentimentDashboard({ transcriptId, sentiment, onRefresh }) {
    const [loading, setLoading] = useState(false);
    const [selectedSegment, setSelectedSegment] = useState(null);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/transcripts/${transcriptId}/sentiment`, { method: 'POST' });
            if (res.ok) {
                onRefresh();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!sentiment.timeline || sentiment.timeline.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p className="text-muted">No sentiment analysis performed yet.</p>
                <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? 'Analyzing...' : 'Run Sentiment Analysis'}
                </button>
            </div>
        );
    }

    const getScoreColor = (score) => {
        if (score > 0.3) return 'var(--success-color)';
        if (score < -0.3) return 'var(--danger-color)';
        return 'var(--text-muted)';
    };

    return (
        <div className="sentiment-dashboard">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Sentiment & Tone</h2>
                <button className="btn" onClick={handleAnalyze} disabled={loading}>
                    {loading ? 'Re-analyzing...' : 'Re-analyze'}
                </button>
            </div>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(200px, 1fr) 2fr' }}>
                {/* Overview & Speakers */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: '700', color: getScoreColor(sentiment.overallScore) }}>
                            {(sentiment.overallScore * 100).toFixed(0)}%
                        </div>
                        <div className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', textAlign: 'center' }}>Overall Vibe</div>
                    </div>

                    <div className="card">
                        <h3 className="card-title" style={{ fontSize: '1rem' }}>Speaker Breakdown</h3>
                        {sentiment.speakerBreakdown.map((speaker, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingBottom: '12px', borderBottom: idx !== sentiment.speakerBreakdown.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                <span style={{ fontWeight: '500' }}>{speaker.speaker}</span>
                                <span style={{ color: getScoreColor(speaker.score), fontWeight: '600' }}>
                                    {speaker.score > 0 ? '+' : ''}{speaker.score.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline */}
                <div className="card">
                    <h3 className="card-title">Meeting Timeline</h3>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Click a segment to view exact transcript snippets.</p>
                    
                    <div style={{ display: 'flex', height: '60px', borderRadius: '8px', overflow: 'hidden', marginTop: '2rem', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                        {sentiment.timeline.map((segment) => (
                            <div 
                                key={segment.id} 
                                onClick={() => setSelectedSegment(segment)}
                                style={{ 
                                    flex: 1, 
                                    background: getScoreColor(segment.score), 
                                    opacity: selectedSegment?.id === segment.id ? 1 : 0.7,
                                    transition: 'var(--transition)',
                                    position: 'relative',
                                    borderRight: '1px solid var(--bg-color)'
                                }}
                                title={`${segment.start} - ${segment.end} | Score: ${segment.score}`}
                            ></div>
                        ))}
                    </div>

                    {selectedSegment && (
                        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px', borderLeft: `4px solid ${getScoreColor(selectedSegment.score)}` }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>
                                SEGMENT: {selectedSegment.start} TO {selectedSegment.end}
                            </div>
                            <div style={{ fontStyle: 'italic', lineHeight: '1.6' }}>
                                "{selectedSegment.textSnippet}"
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SentimentDashboard;

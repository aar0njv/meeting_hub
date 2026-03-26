import { useState, useEffect } from 'react';

function TranscriptDetailPage({ id, onBack }) {
    const [transcript, setTranscript] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTranscript = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/transcripts/${id}`);
            if (!res.ok) throw new Error('Transcript not found');
            const data = await res.json();
            setTranscript(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTranscript();
    }, [id]);

    if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}><h2>Loading Details...</h2></div>;
    if (error) return <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--danger-color)' }}>{error}</div>;
    if (!transcript) return null;

    return (
        <div className="transcript-detail-page">
            <button className="btn" style={{ marginBottom: '2rem', background: 'transparent', color: 'var(--text-main)', border: 'none', cursor: 'pointer', padding: 0 }} onClick={onBack}>&larr; Back to Dashboard</button>
            
            <div className="flex-between" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>{transcript.fileName}</h1>
                    <div className="text-muted" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span>Uploaded: {transcript.date}</span>
                        <span style={{ fontSize: '1.2rem' }}>•</span>
                        <span>{transcript.wordCount} words</span>
                        <span style={{ fontSize: '1.2rem' }}>•</span>
                        <span>{transcript.speakerCount} speakers detected</span>
                    </div>
                </div>
            </div>

            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-main)' }}>
                {transcript.content || 'No transcript content available.'}
            </div>
        </div>
    );
}

export default TranscriptDetailPage;

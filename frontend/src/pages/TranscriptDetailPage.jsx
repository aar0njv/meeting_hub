import { useState, useEffect } from 'react';

function TranscriptDetailPage({ id, session, onBack }) {
    const [transcript, setTranscript] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTranscript = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/transcripts/${id}`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
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

    if (loading) return <div className="loading-container"><h2>Loading Details...</h2></div>;
    if (error) return <div className="error-container">{error}</div>;
    if (!transcript) return null;

    return (
        <div className="transcript-detail-page">
            <button className="btn btn-back-transparent" onClick={onBack}>&larr; Back to Dashboard</button>
            
            <div className="flex-between page-header-container">
                <div>
                    <h1 className="page-title">{transcript.file_name}</h1>
                    <div className="text-muted page-meta-row">
                        <span>Uploaded: {new Date(transcript.created_at).toLocaleDateString()}</span>
                        <span className="meta-separator">•</span>
                        <span>{transcript.word_count} words</span>
                        <span className="meta-separator">•</span>
                        <span>{transcript.speaker_count} speakers detected</span>
                    </div>
                </div>
            </div>

            <div className="transcript-content">
                {transcript.content || 'No transcript content available.'}
            </div>
        </div>
    );
}

export default TranscriptDetailPage;

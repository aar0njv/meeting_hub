import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DecisionsActionsPanel from '../components/DecisionsActionsPanel';
import SentimentDashboard from '../components/SentimentDashboard';
import ChatPanel from '../components/ChatPanel';

function TranscriptDetailPage() {
    const { id } = useParams();
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
            <Link to="/" className="btn" style={{ marginBottom: '2rem' }}>&larr; Back to Dashboard</Link>
            
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

            {/* Layout Grid: Left column for Main Content, Right Column for Chat */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    <section>
                        <DecisionsActionsPanel 
                            transcriptId={transcript.id} 
                            extractions={transcript.extractions} 
                            onRefresh={fetchTranscript} 
                        />
                    </section>

                    <section>
                        <SentimentDashboard 
                            transcriptId={transcript.id} 
                            sentiment={transcript.sentiment} 
                            onRefresh={fetchTranscript} 
                        />
                    </section>
                </div>

                {/* Cross-Meeting Chat Sidebar */}
                <div style={{ position: 'sticky', top: '2rem' }}>
                    <ChatPanel transcriptId={transcript.id} />
                </div>
            </div>
        </div>
    );
}

export default TranscriptDetailPage;

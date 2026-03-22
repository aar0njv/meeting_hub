import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import UploadDropzone from '../components/UploadDropzone';
import DecisionsActionsPanel from '../components/DecisionsActionsPanel';
import SentimentDashboard from '../components/SentimentDashboard';
import ChatPanel from '../components/ChatPanel';

function MeetingDetailPage() {
    const { meetingId } = useParams();
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchMeeting = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}`);
            if (!res.ok) throw new Error('Meeting not found');
            const data = await res.json();
            setMeeting(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeeting();
    }, [meetingId]);

    const handleUploadSuccess = (newTranscripts) => {
        // Optimistically update the UI by fetching the meeting again
        fetchMeeting();
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}><h2>Loading Meeting Details...</h2></div>;
    if (error) return <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--danger-color)' }}>{error}</div>;
    if (!meeting) return null;

    return (
        <div className="meeting-detail-page">
            <Link to="/" className="btn" style={{ marginBottom: '2rem' }}>&larr; Back to Dashboard</Link>
            
            <div className="flex-between" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>{meeting.title}</h1>
                    <div className="text-muted" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span>Date: {meeting.date}</span>
                        <span style={{ fontSize: '1.2rem' }}>•</span>
                        <span>Transcripts: {meeting.transcripts?.length || 0}</span>
                    </div>
                </div>
            </div>

            {/* Layout Grid: Left column for Main Content, Right Column for Chat */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    
                    {/* Transcript Uploads */}
                    <section>
                        <h2 style={{ marginBottom: '1rem' }}>Manage Transcripts</h2>
                        <UploadDropzone meetingId={meeting.id} onUploadSuccess={handleUploadSuccess} />
                        
                        {meeting.transcripts && meeting.transcripts.length > 0 && (
                            <div className="card">
                                <h3 className="card-title">Uploaded Transcripts</h3>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {meeting.transcripts.map(t => (
                                        <li key={t.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: '500' }}>{t.fileName}</span>
                                            <span className="text-muted">
                                                {t.wordCount} words • {t.speakerCount} speakers
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>

                    {/* Decisions and Action Items */}
                    <section>
                        <DecisionsActionsPanel 
                            meetingId={meeting.id} 
                            extractions={meeting.extractions} 
                            onRefresh={fetchMeeting} 
                        />
                    </section>

                    {/* Sentiment Dashboard */}
                    <section>
                        <SentimentDashboard 
                            meetingId={meeting.id} 
                            sentiment={meeting.sentiment} 
                            onRefresh={fetchMeeting} 
                        />
                    </section>
                </div>

                <div style={{ position: 'sticky', top: '100px' }}>
                    <ChatPanel meetingId={meeting.id} />
                </div>
            </div>
        </div>
    );
}

export default MeetingDetailPage;

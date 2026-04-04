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

    if (loading) return <div className="loading-container"><h2>Loading Meeting Details...</h2></div>;
    if (error) return <div className="error-container">{error}</div>;
    if (!meeting) return null;

    return (
        <div className="meeting-detail-page">
            <Link to="/" className="btn btn-back">&larr; Back to Dashboard</Link>

            <div className="flex-between page-header-container">
                <div>
                    <h1 className="meeting-title">{meeting.title}</h1>
                    <div className="text-muted page-meta-row">
                        <span>Date: {meeting.date}</span>
                        <span className="meta-separator">•</span>
                        <span>Transcripts: {meeting.transcripts?.length || 0}</span>
                    </div>
                </div>
            </div>

            {/* Layout Grid: Left column for Main Content, Right Column for Chat */}
            <div className="meeting-layout-grid">
                <div className="meeting-main-column">

                    {/* Transcript Uploads */}
                    <section>
                        <h2 className="section-title">Manage Transcripts</h2>
                        <UploadDropzone meetingId={meeting.id} onUploadSuccess={handleUploadSuccess} />

                        {meeting.transcripts && meeting.transcripts.length > 0 && (
                            <div className="card">
                                <h3 className="card-title">Uploaded Transcripts</h3>
                                <ul className="transcript-list">
                                    {meeting.transcripts.map(t => (
                                        <li key={t.id} className="transcript-list-item">
                                            <span className="transcript-item-name">{t.fileName.replace(/\.txt$/, '')}</span>
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

                <div className="chat-sidebar-container">
                    <ChatPanel meetingId={meeting.id} />
                </div>
            </div>
        </div>
    );
}

export default MeetingDetailPage;

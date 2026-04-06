import { useState, useEffect } from 'react';
import { exportTranscriptSummary } from '../utils/exportPdf';
import { Download } from 'lucide-react';
import ChatBot from '../components/ChatBot';
import SentimentBox from '../components/SentimentBox';

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

    const handleExport = () => {
        const meetingTitle = transcript.meetings?.title || "Meeting";
        const transcriptTitle = transcript.file_name?.replace(/\.txt$/, '') || "Transcript";

        if (transcript.analysis_results) {
            exportTranscriptSummary(meetingTitle, transcriptTitle, transcript.analysis_results);
        } else {
            alert("Analysis data not ready for export.");
        }
    };

    if (loading) return <div className="loading-container"><h2>Loading Details...</h2></div>;
    if (error) return <div className="error-container">{error}</div>;
    if (!transcript) return null;

    return (
        <div className="transcript-detail-page">
            <button className="btn" style={{ marginBottom: '2rem' }} onClick={onBack}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Back to Dashboard
            </button>

            <div className="page-header-container">
                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                    <div className="header-title-group">
                        <h1 className="page-title" style={{ margin: 0 }}>
                            {transcript.file_name.replace(/\.txt$/, '')}
                        </h1>
                        {/* Added a small margin to separate title from chatbot */}
                        <div style={{ marginTop: '10px' }}>
                            <ChatBot transcriptId={id} session={session} />
                        </div>
                    </div>

                    {/* --- NEW EXPORT BUTTON --- */}
                    <button
                        className="btn primary-btn"
                        onClick={handleExport}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px'
                        }}
                    >
                        <Download size={18} />
                        Export Summary
                    </button>
                    {/* ------------------------- */}
                </div>

                <div className="text-muted page-meta-row" style={{ marginTop: '15px' }}>
                    <span>Date: {transcript.meetings?.date || new Date(transcript.created_at).toLocaleDateString()}</span>
                    <span className="meta-separator">•</span>
                    <span>{transcript.speaker_count} speakers</span>
                    <span className="meta-separator">•</span>
                    {transcript.analysis_results?.sentiment && (
                        <span style={{
                            color: transcript.analysis_results.sentiment === 'positive' ? 'var(--success-color)' :
                                transcript.analysis_results.sentiment === 'negative' ? 'var(--danger-color)' : 'var(--warning-color)',
                            fontWeight: '600'
                        }}>
                            Sentiment: {transcript.analysis_results.sentiment.charAt(0).toUpperCase() + transcript.analysis_results.sentiment.slice(1)}
                        </span>
                    )}
                </div>
            </div>

            <div className="vertical-analysis-stack">
                <SentimentBox
                    segments={transcript.analysis_results?.segments}
                    focusScore={transcript.analysis_results?.focus_score}
                />

                {transcript.analysis_results?.decisions?.length > 0 && (
                    <div className="card">
                        <h3 className="card-title">Key Decisions</h3>
                        <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            {transcript.analysis_results.decisions.map((decision, index) => (
                                <li key={index} style={{ marginBottom: '0.75rem', lineHeight: '1.4' }}>{decision}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {transcript.analysis_results?.action_items?.length > 0 && (
                    <div className="card">
                        <h3 className="card-title">Action Items</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {transcript.analysis_results.action_items.map((item, index) => (
                                <li key={index} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: index < transcript.analysis_results.action_items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                    <div style={{ fontWeight: '600', color: '#fff', marginBottom: '0.5rem' }}>{item.task}</div>
                                    <div className="flex-between">
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assignee: <span style={{ color: 'var(--primary-color)' }}>{item.owner}</span></span>
                                        <span className="badge neutral">{item.due_date}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TranscriptDetailPage;
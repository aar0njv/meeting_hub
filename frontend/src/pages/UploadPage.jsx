import { useState, useEffect } from 'react';
import UploadDropzone from '../components/UploadDropzone';

function UploadPage({ session, onUploadSuccess }) {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, [session]);

  const fetchMeetings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/meetings', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
        if (data.length > 0) setSelectedMeetingId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!newMeetingTitle) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ title: newMeetingTitle, date: newMeetingDate })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMeetings([data, ...meetings]);
        setSelectedMeetingId(data.id);
        setIsCreating(false);
        setNewMeetingTitle('');
      } else {
        alert(data.message || 'Failed to create meeting');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while creating meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-page-container">
      <h1 className="page-title">Upload Transcripts</h1>
      <p className="text-muted upload-subtitle">Group your transcripts by project or meeting.</p>
      
      <div className="meeting-selector-card">
        <div className="meeting-header">Assign Transcripts to Meeting</div>
        {isCreating ? (
          <form onSubmit={handleCreateMeeting} className="meeting-form-row">
            <div className="form-group meeting-form-group">
              <label>Meeting / Project Title</label>
              <input type="text" className="form-control" placeholder="e.g. Q3 Marketing Sync" value={newMeetingTitle} onChange={e => setNewMeetingTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" className="form-control" value={newMeetingDate} onChange={e => setNewMeetingDate(e.target.value)} required />
            </div>
            <div className="meeting-btn-group">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Create'}</button>
              <button type="button" className="btn" onClick={() => setIsCreating(false)} disabled={isSubmitting}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="meeting-form-row">
             <div className="form-group meeting-form-group">
               <label>Select existing Meeting</label>
               <select className="form-control" value={selectedMeetingId} onChange={e => setSelectedMeetingId(e.target.value)}>
                 {meetings.length === 0 && <option value="" disabled>No meetings found (Create one!)</option>}
                 {meetings.map(m => (
                   <option key={m.id} value={m.id}>{m.title} ({m.date})</option>
                 ))}
               </select>
             </div>
             <button className="btn btn-primary" onClick={() => setIsCreating(true)}>+ New Meeting Group</button>
          </div>
        )}
      </div>

      {selectedMeetingId ? (
        <UploadDropzone session={session} meetingId={selectedMeetingId} onUploadSuccess={onUploadSuccess} />
      ) : (
        <div className="empty-state-container" style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
          <p className="text-muted">Please select or create a meeting group above to upload transcripts.</p>
        </div>
      )}
    </div>
  );
}

export default UploadPage;

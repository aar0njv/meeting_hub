import { useState, useRef } from 'react';

function UploadDropzone({ session, meetingId, onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const fileInputRef = useRef(null);

  const validateFiles = (files) => {
    let valid = true;
    for (let i = 0; i < files.length; i++) {
      if (!files[i].name.endsWith('.txt') && !files[i].name.endsWith('.vtt')) {
        valid = false;
        break;
      }
    }
    return valid;
  };

  const handleFiles = async (files) => {
    setError('');
    const fileArray = Array.from(files);
    
    if (fileArray.length === 0) return;

    if (!validateFiles(fileArray)) {
      setError('Invalid format. Please upload .txt or .vtt files only.');
      return;
    }

    setUploading(true);
    setStatusText('Uploading files...');
    const formData = new FormData();
    fileArray.forEach(f => formData.append('files', f));
    formData.append('meeting_id', meetingId);

    try {
      const res = await fetch(`http://localhost:5000/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        let errorMsg = 'Upload failed';
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          errorMsg = `Server returned ${res.status}. Please make sure you restarted your backend server!`;
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
      setStatusText('');
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="upload-dropzone">
      <div 
        className={`dropzone-area ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onClick={() => !uploading && fileInputRef.current.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="dropzone-icon-container">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <h3 className="dropzone-title">Drag & Drop Transcripts Here</h3>
        <p className="text-muted dropzone-subtitle">or click to browse (.txt, .vtt only)</p>
        
        <input 
          type="file" 
          multiple 
          accept=".txt,.vtt"
          ref={fileInputRef} 
          className="hidden-input" 
          onChange={(e) => handleFiles(e.target.files)}
        />
        
        {uploading && <p className="upload-status-text">{statusText}</p>}
      </div>
      
      {error && <div className="upload-error-alert">{error}</div>}
    </div>
  );
}

export default UploadDropzone;

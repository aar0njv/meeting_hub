import { useState, useRef } from 'react';

function UploadDropzone({ onUploadSuccess }) {
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

    try {
      const res = await fetch(`http://localhost:5000/api/upload`, {
        method: 'POST',
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
    <div className="upload-dropzone" style={{ marginBottom: '2rem' }}>
      <div 
        onClick={() => !uploading && fileInputRef.current.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary-color)' : 'var(--border-color)'}`,
          borderRadius: 'var(--border-radius)',
          padding: '4rem',
          textAlign: 'center',
          background: isDragging ? 'rgba(88, 166, 255, 0.1)' : 'var(--surface-color)',
          cursor: uploading ? 'wait' : 'pointer',
          transition: 'var(--transition)',
          opacity: uploading ? 0.7 : 1
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Drag & Drop Transcripts Here</h3>
        <p className="text-muted" style={{ margin: 0 }}>or click to browse (.txt, .vtt only)</p>
        
        <input 
          type="file" 
          multiple 
          accept=".txt,.vtt"
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={(e) => handleFiles(e.target.files)}
        />
        
        {uploading && <p style={{ color: 'var(--primary-color)', marginTop: '2rem', fontWeight: '600' }}>{statusText}</p>}
      </div>
      
      {error && <div style={{ color: 'var(--danger-color)', marginTop: '1rem', padding: '1rem', background: 'rgba(218,54,51,0.1)', borderRadius: '8px' }}>{error}</div>}
    </div>
  );
}

export default UploadDropzone;

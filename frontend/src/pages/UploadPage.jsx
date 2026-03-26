import UploadDropzone from '../components/UploadDropzone';

function UploadPage({ onUploadSuccess }) {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Upload Transcripts</h1>
      <p className="text-muted" style={{ marginBottom: '2.5rem' }}>Upload meeting transcripts as .txt or .vtt. They will be processed automatically.</p>
      
      <UploadDropzone onUploadSuccess={onUploadSuccess} />
    </div>
  );
}

export default UploadPage;

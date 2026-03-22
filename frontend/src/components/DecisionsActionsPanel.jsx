import { useState } from 'react';

function DecisionsActionsPanel({ transcriptId, extractions, onRefresh }) {
    const [loading, setLoading] = useState(false);

    const handleExtract = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/transcripts/${transcriptId}/extract`, { method: 'POST' });
            if (res.ok) {
                onRefresh();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Type,Who,What,When\n";
        
        extractions.decisions.forEach(d => {
            csvContent += `Decision, N/A, "${d.text}", N/A\n`;
        });
        
        extractions.actionItems.forEach(a => {
            csvContent += `Action Item, "${a.who}", "${a.what}", "${a.when}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transcript_${transcriptId}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!extractions.decisions.length && !extractions.actionItems.length) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p className="text-muted">No decisions or action items extracted yet.</p>
                <button className="btn btn-primary" onClick={handleExtract} disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? 'Extracting...' : 'Run Extraction'}
                </button>
            </div>
        );
    }

    return (
        <div className="decisions-actions-panel">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Discoveries</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" onClick={handleExtract} disabled={loading}>
                        {loading ? 'Re-extracting...' : 'Re-extract'}
                    </button>
                    <button className="btn btn-gradient" onClick={exportToCSV}>
                        Export CSV
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(250px, 1fr) minmax(250px, 1fr)' }}>
                <div className="card">
                    <h3 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Decisions</h3>
                    <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)', marginTop: '1rem' }}>
                        {extractions.decisions.map(d => (
                            <li key={d.id} style={{ marginBottom: '0.5rem' }}>{d.text}</li>
                        ))}
                    </ul>
                </div>

                <div className="card">
                    <h3 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Action Items</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', marginTop: '1rem', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '8px 12px 8px 0' }}>Who</th>
                                    <th style={{ padding: '8px 12px 8px 0' }}>What</th>
                                    <th style={{ padding: '8px 0' }}>When</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extractions.actionItems.map(a => (
                                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 12px 12px 0', fontWeight: '500' }}>{a.who}</td>
                                        <td style={{ padding: '12px 12px 12px 0', whiteSpace: 'normal' }}>{a.what}</td>
                                        <td style={{ padding: '12px 0' }}>
                                            <span className="badge">{a.when}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DecisionsActionsPanel;

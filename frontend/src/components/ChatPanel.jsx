import { useState, useRef, useEffect } from 'react';

function ChatPanel({ transcriptId }) {
    const [messages, setMessages] = useState([
        { id: 1, role: 'assistant', text: "Hello! I'm your Meeting Intelligence Hub assistant. I can answer questions across all uploaded transcripts.", citations: [] }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), role: 'user', text: input, citations: [] };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(`http://localhost:5000/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMsg.text })
            });

            if (res.ok) {
                const data = await res.json();
                const aiMsg = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    text: data.answer,
                    citations: data.citations || []
                };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                setMessages(prev => [...prev, { id: Date.now()+1, role: 'assistant', text: 'Error fetching response.', citations: [] }]);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { id: Date.now()+1, role: 'assistant', text: 'Connection error.', citations: [] }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px', maxHeight: '100vh', padding: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="card-title" style={{ margin: 0, fontSize: '1.25rem' }}>Cross-Meeting AI</h3>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>I have context of all transcripts</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {messages.map(m => (
                    <div key={m.id} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                        <div style={{ 
                            padding: '1rem', 
                            borderRadius: '12px',
                            background: m.role === 'user' ? 'var(--primary-gradient)' : 'var(--bg-color)',
                            color: m.role === 'user' ? '#fff' : 'var(--text-main)',
                            border: m.role === 'user' ? 'none' : '1px solid var(--border-color)',
                            lineHeight: '1.5',
                            boxShadow: m.role === 'user' ? '0 4px 12px rgba(88, 166, 255, 0.2)' : 'none'
                        }}>
                            {m.text}
                        </div>
                        {m.citations && m.citations.length > 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span style={{ fontWeight: '600' }}>Sources:</span>
                                <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.25rem' }}>
                                    {m.citations.map((cit, idx) => (
                                        <li key={idx} style={{ fontStyle: 'italic' }}>{cit.text}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                        AI is thinking...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', borderTop: '1px solid var(--border-color)', padding: '1.5rem', background: 'var(--surface-color)' }}>
                <input 
                    type="text" 
                    className="form-control" 
                    style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none', padding: '1rem' }}
                    placeholder="Ask a cross-meeting question..." 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={loading}
                />
                <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0 1.5rem' }}
                    disabled={loading || !input.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

export default ChatPanel;

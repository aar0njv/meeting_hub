import { useState, useRef, useEffect } from 'react';

function ChatBot({ transcriptId, session }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hi! I've indexed this transcript. Ask me anything about the discussion or specific details." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ transcript_id: transcriptId, question: userMsg })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Error: AI Service offline." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chatbot-container">
            <button
                className={`chatbot-toggle-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>

            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <span>Meeting AI Assistant</span>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>&times;</button>
                    </div>
                    <div className="chatbot-messages">
                        {messages.map((m, i) => (
                            <div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>
                        ))}
                        {loading && <div className="chat-msg assistant">Thinking...</div>}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSend} className="chatbot-input-area">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            disabled={loading}
                        />
                    </form>
                </div>
            )}
        </div>
    );
}

export default ChatBot;
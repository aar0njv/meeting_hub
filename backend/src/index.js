const express = require('express');
const cors = require('cors');
const multer = require('multer');
const storage = require('./data/storage');
const aiService = require('./services/mockAiService');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.txt') || file.originalname.endsWith('.vtt')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file format. Only .txt and .vtt are supported.'));
        }
    }
});

app.get('/', (_req, res) => {
    res.send('Meeting Intelligence Hub API running...');
});

// TRANSCRIPTS
app.get('/api/transcripts', (req, res) => {
    // Return all transcripts with basic summary stats
    const list = storage.transcripts.map(t => {
        const extraction = storage.extractions[t.id];
        const sentiment = storage.sentiments[t.id];
        return {
            ...t,
            totalActionItems: extraction ? extraction.actionItems.length : 0,
            overallSentimentScore: sentiment ? sentiment.overallScore : 0,
            // exclude full content for the list view to save bandwidth
            content: undefined
        };
    });
    res.json(list);
});

app.get('/api/transcripts/:id', (req, res) => {
    const id = Number(req.params.id);
    const transcript = storage.transcripts.find(t => t.id === id);
    if (!transcript) return res.status(404).json({ message: 'Transcript not found' });
    
    // Attach analysis state
    const extractions = storage.extractions[id] || { decisions: [], actionItems: [] };
    const sentiment = storage.sentiments[id] || { overallScore: 0, timeline: [], speakerBreakdown: [] };

    res.json({ ...transcript, extractions, sentiment });
});

// UPLOADS
app.post('/api/upload', upload.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No valid files uploaded.' });
    }

    const uploadedTranscripts = req.files.map((file, idx) => {
        const text = file.buffer.toString('utf-8');
        const wordCount = text.split(/\s+/).length;
        const speakerMatches = text.match(/^[A-Z][a-z]+:/gm);
        const uniqueSpeakers = speakerMatches ? new Set(speakerMatches).size : 1;
        
        const transcript = {
            id: storage.transcripts.length + idx + 1,
            fileName: file.originalname,
            date: new Date().toISOString().split('T')[0],
            wordCount,
            speakerCount: uniqueSpeakers,
            content: text
        };
        storage.transcripts.push(transcript);
        return transcript;
    });

    res.json({ message: 'Upload successful', transcripts: uploadedTranscripts });
});

// Error handling middleware for Multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ message: err.message });
    }
    next();
});

// AI FEATURES
app.post('/api/transcripts/:id/extract', (req, res) => {
    const id = Number(req.params.id);
    const transcript = storage.transcripts.find(t => t.id === id);
    if (!transcript) return res.status(404).json({ message: 'Transcript not found' });

    // Call mock AI service
    const extractedData = aiService.extractDecisionsAndActions(transcript.content);
    storage.extractions[id] = extractedData;
    
    res.json(extractedData);
});

app.post('/api/transcripts/:id/sentiment', (req, res) => {
    const id = Number(req.params.id);
    const transcript = storage.transcripts.find(t => t.id === id);
    if (!transcript) return res.status(404).json({ message: 'Transcript not found' });

    const sentimentData = aiService.analyzeSentiment(transcript.content);
    storage.sentiments[id] = sentimentData;

    res.json(sentimentData);
});

// Chat endpoint (cross-meeting queries)
app.post('/api/chat', (req, res) => {
    const { question } = req.body;
    
    if (!question) {
        return res.status(400).json({ message: 'Question is required' });
    }
    
    // Provide ALL transcripts context for cross-meeting capability
    const answerData = aiService.answerQuestion(question, storage.transcripts);

    res.json(answerData);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API on port ${PORT}`));

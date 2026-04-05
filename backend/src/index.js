require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Auth Middleware
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ message: 'Invalid or expired token' });

    req.user = user;

    // Attach a scoped Supabase client to enforce Postgres RLS properly
    req.supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });

    next();
};

// MEETINGS
app.get('/api/meetings', requireAuth, async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('meetings')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/meetings', requireAuth, async (req, res) => {
    try {
        const { title, date } = req.body;
        if (!title || !date) return res.status(400).json({ message: 'Title and date required' });

        const { data, error } = await req.supabase
            .from('meetings')
            .insert([{ user_id: req.user.id, title, date }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// TRANSCRIPTS
app.get('/api/transcripts', requireAuth, async (req, res) => {
    try {
        const { meeting_id } = req.query;
        let query = req.supabase
            .from('transcripts')
            .select('*, meetings(title, date)')
            .eq('user_id', req.user.id);

        if (meeting_id) {
            query = query.eq('meeting_id', meeting_id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/transcripts/:id', requireAuth, async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('transcripts')
            .select('*, meetings(title, date)')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Transcript not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPLOADS
app.post('/api/upload', requireAuth, upload.array('files'), async (req, res) => {
    const userId = req.user.id;
    let meetingId = req.body.meeting_id;

    if (!meetingId || meetingId === "undefined" || meetingId === "null") {
        return res.status(400).json({ message: 'meeting_id is required.' });
    }

    // Try to parse to integer if it's a numeric ID
    if (!isNaN(meetingId)) {
        meetingId = parseInt(meetingId, 10);
    }

    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded.' });

    try {
        // --- PRE-FLIGHT CHECK: Verify the meeting exists and belongs to the user ---
        const { data: meetingExists, error: meetingCheckError } = await req.supabase
            .from('meetings')
            .select('id')
            .eq('id', meetingId)
            // .eq('user_id', userId) -> user_id check omitted if RLS handles it
            .single();

        if (meetingCheckError || !meetingExists) {
            return res.status(404).json({ message: `The meeting group (ID: ${meetingId}) does not exist or has been deleted. Please refresh the page and select a valid meeting.` });
        }

        const uploadedTranscripts = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const text = file.buffer.toString('utf-8');

            // --- EXISTING SUPABASE LOGIC ---
            const filePath = `${userId}/${Date.now()}_${file.originalname}`;
            await req.supabase.storage.from('transcripts').upload(filePath, file.buffer);
            const { data: publicUrlData } = req.supabase.storage.from('transcripts').getPublicUrl(filePath);

            // Extract word and speaker count
            const wordCount = text.trim().split(/\s+/).length || 0;
            const speakerSet = new Set();
            const lines = text.split('\n');
            for (const line of lines) {
                const match = line.match(/^([A-Za-z0-9\s_-]+):/);
                if (match) {
                    const name = match[1].trim();
                    if (name.length > 0 && name.length < 30) {
                        speakerSet.add(name);
                    }
                }
            }
            const speakerCount = speakerSet.size || 0;

            const { data: transcriptRecord, error: dbError } = await req.supabase
                .from('transcripts')
                .insert([{
                    meeting_id: meetingId,
                    user_id: userId,
                    file_name: file.originalname,
                    file_url: publicUrlData.publicUrl || filePath,
                    content: text,
                    word_count: wordCount,
                    speaker_count: speakerCount,
                    is_analyzed: false // Default to false
                }])
                .select().single();

            if (dbError) throw dbError;

            // --- NEW: AI INTEGRATION STEP ---
            try {
                // 1. Send to Python Service for Analysis (Features 1 & 2)
                // We call /analyze for the table and /vectorize for the chatbot memory
                const [analysisRes, vectorRes] = await Promise.all([
                    axios.post('http://localhost:8000/analyze', { transcript: text }),
                    axios.post('http://localhost:8000/vectorize', {
                        transcript_id: transcriptRecord.id.toString(),
                        filename: file.originalname,
                        content: text
                    })
                ]);

                // 2. Update the record in Supabase with the AI's findings
                const { data: finalRecord, error: updateError } = await req.supabase
                    .from('transcripts')
                    .update({
                        analysis_results: analysisRes.data, // Stores the JSON table data
                        is_analyzed: true
                    })
                    .eq('id', transcriptRecord.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                uploadedTranscripts.push(finalRecord);

            } catch (aiError) {
                console.error("AI Service failed, but file was saved:", aiError.message);
                // If AI fails, we still return the basic record so the UI doesn't break
                uploadedTranscripts.push(transcriptRecord);
            }
        }

        res.json({ message: 'Upload successful', transcripts: uploadedTranscripts });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ message: err.message });
    }
});



app.post('/api/chat', requireAuth, async (req, res) => {
    const { meeting_id, transcript_id, question } = req.body;
    let targetIds = [];

    try {
        if (meeting_id) {
            const { data, error } = await req.supabase
                .from('transcripts')
                .select('id')
                .eq('meeting_id', meeting_id)

            if (error) throw error;
            targetIds = data.map(t => t.id.toString());
        } else if (transcript_id) {
            targetIds = [transcript_id.toString()];
        }

        if (targetIds.length === 0) {
            return res.status(400).json({ message: "No transcripts found for the given meeting or transcript ID." });
        }

        const response = await axios.post('http://localhost:8000/chat', {
            transcript_ids: targetIds,
            question: question
        });

        res.json({
            reply: response.data.answer,
            sources: response.data.sources_used
        });
    } catch (err) {
        console.error("Chat Error: ", err.message);
        res.status(500).json({ message: "AI Services currently  offline." });
    }
});


app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ message: err.message });
    }
    next();
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API on port ${PORT}`));

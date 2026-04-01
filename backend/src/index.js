require('dotenv').config();
const express = require('express');
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
            .select('*')
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
    const meetingId = req.body.meeting_id;

    if (!meetingId) {
        return res.status(400).json({ message: 'meeting_id is required. Please assign this upload to a meeting.' });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No valid files uploaded.' });
    }

    try {
        const uploadedTranscripts = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const text = file.buffer.toString('utf-8');
            const wordCount = text.split(/\s+/).length;
            const speakerMatches = text.match(/^[A-Z][a-z]+:/gm);
            const uniqueSpeakers = speakerMatches ? new Set(speakerMatches).size : 1;

            // 2. Define path starting with user's ID
            const filePath = `${userId}/${Date.now()}_${file.originalname}`;

            // 3. Upload to Supabase Storage
            const { data: storageData, error: storageError } = await req.supabase.storage
                .from('transcripts')
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (storageError) throw storageError;

            // Get the URL (if bucket is private this will be a generic path we can use later)
            const { data: publicUrlData } = req.supabase.storage.from('transcripts').getPublicUrl(filePath);

            // 4. Insert into PostgreSQL transcripts table
            const { data: transcriptRecord, error: dbError } = await req.supabase
                .from('transcripts')
                .insert([{
                    meeting_id: meetingId,
                    user_id: userId,
                    file_name: file.originalname,
                    file_url: publicUrlData.publicUrl || filePath,
                    content: text,
                    word_count: wordCount,
                    speaker_count: uniqueSpeakers
                }])
                .select()
                .single();

            if (dbError) throw dbError;

            uploadedTranscripts.push(transcriptRecord);
        }

        res.json({ message: 'Upload successful', transcripts: uploadedTranscripts });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ message: err.message });
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

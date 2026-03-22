let transcripts = [];
let extractions = {}; // mapping transcriptId -> { decisions: [], actionItems: [] }
let sentiments = {}; // mapping transcriptId -> { overallScore: number, timeline: [], speakerBreakdown: [] }

module.exports = {
    transcripts,
    extractions,
    sentiments
};

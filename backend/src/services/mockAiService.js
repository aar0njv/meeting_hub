// Mock AI Service to simulate extraction, sentiment, and Q&A

function extractDecisionsAndActions(text) {
    // A simple mock since we don't have an LLM connected
    // Let's pretend it parsed out some interesting data based on length
    return {
        decisions: [
            { id: 1, text: "Approved the new budget for Q3." },
            { id: 2, text: "We will delay the API launch by two weeks to ensure stability." }
        ],
        actionItems: [
            { id: 1, who: "Alice", what: "Update the project timeline", when: "Friday" },
            { id: 2, who: "Bob", what: "Schedule meeting with Finance", when: "Next Tuesday" }
        ]
    };
}

function analyzeSentiment(text) {
    // Mocking segmenting the text and giving timeline & scores
    return {
        overallScore: 0.6, // positive
        timeline: [
            { id: 1, start: "00:00", end: "05:00", score: 0.8, textSnippet: "Great start, everyone!" },
            { id: 2, start: "05:00", end: "10:00", score: -0.2, textSnippet: "We have some blockers regarding the API..." },
            { id: 3, start: "10:00", end: "15:00", score: 0.9, textSnippet: "Blockers resolved, moving forward!" }
        ],
        speakerBreakdown: [
            { speaker: "Alice", score: 0.7 },
            { speaker: "Bob", score: 0.1 },
            { speaker: "Charlie", score: 0.4 }
        ]
    };
}

function answerQuestion(question, transcripts) {
    // Mock response based on the question
    let answer = "Based on the transcripts, the main focus was on the upcoming launch and resolving the blockers.";
    if (question.toLowerCase().includes('finance')) {
        answer = "The Finance lead raised concerns about the Q3 budget alignment and requested a separate review meeting.";
    } else if (question.toLowerCase().includes('delay') || question.toLowerCase().includes('api')) {
        answer = "It was decided to delay the API launch by two weeks to ensure completely stable endpoints before beta testing.";
    }

    return {
        answer,
        citations: [
            { id: 1, text: "Meeting 1, segment 5:00 - 10:00" }
        ]
    };
}

module.exports = {
    extractDecisionsAndActions,
    analyzeSentiment,
    answerQuestion
};

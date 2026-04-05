import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = {
    high: '#029500ff',    // green
    neutral: '#d5c424ff', // yellow
    low: '#c72516ff'      // Red
};

function SentimentBox({ segments, overallSentiment }) {
    if (!segments) return null;

    const data = segments.map(s => {
        let status = 'neutral';
        if (['enthusiasm', 'agreement'].includes(s.vibe?.toLowerCase())) status = 'high';
        if (['conflict', 'frustration'].includes(s.vibe?.toLowerCase())) status = 'low';

        return {
            name: s.segment_index,
            value: status === 'high' ? 80 : status === 'neutral' ? 50 : 30,
            status: status,
            topic: s.topic
        };
    });

    return (
        <div className="analysis-summary-row">
            {/* SENTIMENT TIMELINE */}
            <div className="card sentiment-timeline-card">
                <div className="flex-between">
                    <div>
                        <p className="stat-label">SENTIMENT TIMELINE</p>
                    </div>
                    <div className="chart-legend-dots">
                        <span className="dot high"></span> Positive
                        <span className="dot neutral"></span> Neutral
                        <span className="dot low"></span> Negative
                    </div>
                </div>

                <div className="graph" style={{ width: '100%', height: 350, marginTop: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap="95%">
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={45}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.status]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* FOCUS SCORE MOCKUP */}
            <div className="card focus-score-card">
                <p className="stat-label">FOCUS SCORE</p>
                <div className="focus-circle-container">
                    <div className="focus-circle">
                        <span className="focus-percent">85%</span>
                    </div>
                </div>
                <p className="focus-subtext">High topical consistency detected throughout the call.</p>
            </div>
        </div>
    );
}

export default SentimentBox;
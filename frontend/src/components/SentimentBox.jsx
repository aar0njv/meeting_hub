import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = {
    high: '#06ff00',    // green
    neutral: '#ffe400', // yellow
    low: '#ff1700'      // Red
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

                <div style={{ width: '100%', height: 250, marginTop: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="custom-tooltip">
                                                <p>{payload[0].payload.topic}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
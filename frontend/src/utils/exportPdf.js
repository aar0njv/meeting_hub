import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";


export const exportTranscriptSummary = (meetingTitle, transcriptTitle, analysisResults) => {
    const doc = new jsPDF();
    const { decisions, action_items, sentiment, focus_score } = analysisResults;

    doc.setFontSize(20);
    doc.text("Meeting Summary", 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Project: ${meetingTitle}`, 14, 32);
    doc.text(`Sentiment: ${sentiment} | Focus Score: ${focus_score}%`, 14, 38);

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Key Decisions", 14, 55);

    doc.setFontSize(11);
    let decisionY = 62;

    const safeDecisions = decisions || [];
    safeDecisions.forEach((decision, index) => {
        doc.text(`${index + 1}. ${decision}`, 14, decisionY);
        decisionY += 7;
    });

    doc.setFontSize(16);
    doc.text("Action Items", 14, decisionY + 10);

    const tableColumn = ["Owner", "Task", "Deadline"];
    const tableRows = action_items.map(item => [
        item.owner, item.task, item.due_date
    ]);

    autoTable(doc, {
        startY: decisionY + 15,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [63, 81, 181] },
    });

    const safeMeeting = meetingTitle.replace(/\s+/g, '_');
    const safeTranscript = transcriptTitle.replace(/\s+/g, '_');
    doc.save(`${safeMeeting}_${safeTranscript}.pdf`);

}


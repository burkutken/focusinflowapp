
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ChartData = {
    daily: { name: string; count: number }[];
    weekly: { name: string; count: number }[];
    monthly: { name: string; count: number }[];
    byTask: { name: string; count: number }[];
    monthlyTaskDistribution: { name: string; value: number }[];
};

type UserInfo = {
    userName: string;
    totalSessions: number;
    totalMinutes: number;
}

export function generatePdf(chartData: ChartData, userInfo: UserInfo) {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.text("focusinflow Productivity Report", 14, 22);

    // User Info
    doc.setFontSize(12);
    doc.text(`Report for: ${userInfo.userName}`, 14, 32);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);

    // Summary Stats
    doc.setFontSize(16);
    doc.text("Overall Summary", 14, 55);
    autoTable(doc, {
        startY: 60,
        head: [['Metric', 'Value']],
        body: [
            ['Total Focus Sessions', userInfo.totalSessions],
            ['Total Focus Minutes', userInfo.totalMinutes],
        ],
        theme: 'striped',
        headStyles: { fillColor: [35, 131, 226] },
    });


    let currentY = (doc as any).lastAutoTable.finalY + 15;

    // This Month's Distribution
    doc.setFontSize(16);
    doc.text("This Month's Focus Distribution (minutes)", 14, currentY);
    autoTable(doc, {
        startY: currentY + 5,
        head: [['Task', 'Minutes']],
        body: chartData.monthlyTaskDistribution.map(d => [d.name, d.value]),
        theme: 'striped',
        headStyles: { fillColor: [35, 131, 226] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Total Focus Time by Task
    doc.setFontSize(16);
    doc.text("Total Focus Time by Task (minutes)", 14, currentY);
    autoTable(doc, {
        startY: currentY + 5,
        head: [['Task', 'Total Minutes']],
        body: chartData.byTask.map(d => [d.name, d.count]),
        theme: 'striped',
        headStyles: { fillColor: [35, 131, 226] },
    });

    // Add a new page for session history
    doc.addPage();
    currentY = 22;

    // Session History by Period
    doc.setFontSize(16);
    doc.text("Session History (# of Sessions)", 14, currentY);
    
    // Monthly
    doc.setFontSize(12);
    doc.text("Monthly Sessions", 14, currentY + 10);
    autoTable(doc, {
        startY: currentY + 15,
        head: [['Month', 'Sessions']],
        body: chartData.monthly.map(d => [d.name, d.count]),
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
    
    // Weekly
    doc.setFontSize(12);
    doc.text("Weekly Sessions", 14, currentY);
    autoTable(doc, {
        startY: currentY + 5,
        head: [['Week', 'Sessions']],
        body: chartData.weekly.map(d => [d.name, d.count]),
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Daily
    doc.setFontSize(12);
    doc.text("Daily Sessions", 14, currentY);
    autoTable(doc, {
        startY: currentY + 5,
        head: [['Day', 'Sessions']],
        body: chartData.daily.map(d => [d.name, d.count]),
    });

    // Save the PDF
    doc.save(`focusinflow_report_${new Date().toISOString().split('T')[0]}.pdf`);
}

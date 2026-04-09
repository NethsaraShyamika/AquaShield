import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * GenerateUsersPDF Component
 * Props:
 * - users: array of user objects
 * - onClose: function to close the modal
 */
export default function GenerateUsersPDF({ users, onClose }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const totalUsers = users.length;
    const activeUsers = users.filter((u) => !u.isBlocked).length;
    const blockedUsers = users.filter((u) => u.isBlocked).length;
    const adminUsers = users.filter((u) => u.isAdmin).length;
    const regularUsers = users.filter((u) => !u.isAdmin).length;
    const generatedDate = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
    });
    const generatedTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit",
    });

    // Draw a simple donut/pie segment helper
    const drawDonutSegment = (doc, cx, cy, r, startAngle, endAngle, color) => {
        const steps = 40;
        const angleStep = (endAngle - startAngle) / steps;
        doc.setFillColor(...color);
        // Draw as filled wedge
        for (let i = 0; i < steps; i++) {
            const a1 = startAngle + i * angleStep;
            const a2 = startAngle + (i + 1) * angleStep;
            const x1 = cx + r * Math.cos(a1);
            const y1 = cy + r * Math.sin(a1);
            const x2 = cx + r * Math.cos(a2);
            const y2 = cy + r * Math.sin(a2);
            // Triangle from center
            doc.triangle(cx, cy, x1, y1, x2, y2, "F");
        }
    };

    const generatePDF = async () => {
        setIsGenerating(true);

        try {
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();

            // ── PAGE 1: ANALYTICS SUMMARY ──────────────────────────

            // White background
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageW, pageH, "F");

            // Top accent bar
            doc.setFillColor(0, 119, 182);
            doc.rect(0, 0, pageW, 3, "F");
            doc.setFillColor(0, 180, 216);
            doc.rect(0, 3, pageW, 1.5, "F");

            // Header area
            doc.setFillColor(245, 248, 252);
            doc.rect(0, 4.5, pageW, 22, "F");

            // Logo box
            doc.setFillColor(0, 119, 182);
            doc.roundedRect(14, 9, 12, 12, 2, 2, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text("AS", 20, 17, { align: "center" });

            doc.setFontSize(14);
            doc.setTextColor(15, 30, 60);
            doc.setFont("helvetica", "bold");
            doc.text("AquaShield", 30, 16);

            doc.setFontSize(7);
            doc.setTextColor(100, 130, 160);
            doc.setFont("helvetica", "normal");
            doc.text("Marine Protection Intelligence System", 30, 21);

            doc.setFontSize(9);
            doc.setTextColor(100, 130, 160);
            doc.text(`Generated: ${generatedDate} at ${generatedTime}`, pageW - 14, 16, { align: "right" });
            doc.text(`Report ID: AS-USR-${Date.now().toString().slice(-8)}`, pageW - 14, 21, { align: "right" });

            doc.setDrawColor(200, 215, 230);
            doc.setLineWidth(0.4);
            doc.line(14, 26.5, pageW - 14, 26.5);

            // Page title
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 119, 182);
            doc.text("Analytics Summary", 14, 40);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 120, 150);
            doc.text("Overview of user distribution and system health", 14, 47);

            // ── ANALYTICS CARDS (User Distribution + Account Status) ──
            const cards = [
                {
                    title: "User Distribution",
                    items: [
                        { label: "Regular Users", value: regularUsers, pct: totalUsers ? Math.round((regularUsers / totalUsers) * 100) : 0, color: [0, 119, 182] },
                        { label: "Admin Users", value: adminUsers, pct: totalUsers ? Math.round((adminUsers / totalUsers) * 100) : 0, color: [180, 130, 0] },
                    ],
                },
                {
                    title: "Account Status",
                    items: [
                        { label: "Active Accounts", value: activeUsers, pct: totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0, color: [22, 163, 74] },
                        { label: "Blocked Accounts", value: blockedUsers, pct: totalUsers ? Math.round((blockedUsers / totalUsers) * 100) : 0, color: [220, 38, 38] },
                    ],
                },
            ];

            cards.forEach((card, ci) => {
                const cx = 14 + ci * 96;
                const cy = 53;
                const cw = 88;
                const ch = 52;

                doc.setFillColor(245, 248, 252);
                doc.roundedRect(cx, cy, cw, ch, 2, 2, "F");
                doc.setDrawColor(210, 225, 240);
                doc.setLineWidth(0.3);
                doc.roundedRect(cx, cy, cw, ch, 2, 2, "S");

                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(30, 50, 80);
                doc.text(card.title, cx + 6, cy + 10);

                doc.setDrawColor(210, 225, 240);
                doc.line(cx + 6, cy + 13, cx + cw - 6, cy + 13);

                card.items.forEach((item, ii) => {
                    const iy = cy + 22 + ii * 16;

                    doc.setFontSize(8);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(80, 100, 130);
                    doc.text(item.label, cx + 6, iy);

                    doc.setFontSize(11);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(...item.color);
                    doc.text(String(item.value), cx + cw - 6, iy, { align: "right" });

                    const barY = iy + 3;
                    const barW = cw - 12;
                    doc.setFillColor(215, 225, 238);
                    doc.roundedRect(cx + 6, barY, barW, 2.5, 1, 1, "F");
                    const fillW = (item.pct / 100) * barW;
                    if (fillW > 0) {
                        doc.setFillColor(...item.color);
                        doc.roundedRect(cx + 6, barY, fillW, 2.5, 1, 1, "F");
                    }

                    doc.setFontSize(6);
                    doc.setTextColor(120, 140, 165);
                    doc.text(`${item.pct}%`, cx + 6 + barW + 2, barY + 2);
                });
            });

            // ── VISUAL SUMMARY TABLE ──
            // A clean summary table replacing the removed boxes
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 119, 182);
            doc.text("User Overview", 14, 120);

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 120, 150);
            doc.text("Breakdown of all registered accounts in the system", 14, 127);

            autoTable(doc, {
                startY: 131,
                head: [["Category", "Count", "Percentage", "Status"]],
                body: [
                    ["Total Registered Users", String(totalUsers), "100%", "All Accounts"],
                    ["Active Users", String(activeUsers), totalUsers ? `${Math.round((activeUsers / totalUsers) * 100)}%` : "0%", "In Good Standing"],
                    ["Blocked Users", String(blockedUsers), totalUsers ? `${Math.round((blockedUsers / totalUsers) * 100)}%` : "0%", blockedUsers > 0 ? "Requires Attention" : "None"],
                    ["Admin Users", String(adminUsers), totalUsers ? `${Math.round((adminUsers / totalUsers) * 100)}%` : "0%", "Elevated Access"],
                    ["Regular Users", String(regularUsers), totalUsers ? `${Math.round((regularUsers / totalUsers) * 100)}%` : "0%", "Standard Access"],
                ],
                styles: {
                    fontSize: 8,
                    cellPadding: 4,
                    fillColor: [255, 255, 255],
                    textColor: [40, 60, 90],
                    lineColor: [210, 225, 240],
                    lineWidth: 0.3,
                },
                headStyles: {
                    fillColor: [0, 119, 182],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 8,
                },
                alternateRowStyles: {
                    fillColor: [245, 248, 252],
                },
                columnStyles: {
                    0: { cellWidth: 55 },
                    1: { cellWidth: 20, halign: "center", fontStyle: "bold", textColor: [0, 119, 182] },
                    2: { cellWidth: 30, halign: "center" },
                    3: { cellWidth: 50 },
                },
                didDrawCell: (data) => {
                    if (data.section === "body" && data.column.index === 3) {
                        const val = data.cell.text[0];
                        doc.setFontSize(8);
                        if (val === "In Good Standing") doc.setTextColor(22, 163, 74);
                        else if (val === "Requires Attention") doc.setTextColor(220, 38, 38);
                        else if (val === "Elevated Access") doc.setTextColor(180, 130, 0);
                        else doc.setTextColor(70, 100, 140);
                        doc.text(val, data.cell.x + 4, data.cell.y + data.cell.height / 2 + 1);
                    }
                },
                margin: { left: 14, right: 14 },
            });

            // Footer page 1
            doc.setFillColor(245, 248, 252);
            doc.rect(0, pageH - 10, pageW, 10, "F");
            doc.setDrawColor(210, 225, 240);
            doc.setLineWidth(0.3);
            doc.line(0, pageH - 10, pageW, pageH - 10);
            doc.setFontSize(7);
            doc.setTextColor(130, 150, 175);
            doc.text("AquaShield Confidential — For authorized personnel only", 14, pageH - 4);
            doc.text("Page 1", pageW - 14, pageH - 4, { align: "right" });

            // ── PAGE 2: USER TABLE ──────────────────────────────────
            doc.addPage();

            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageW, pageH, "F");

            doc.setFillColor(0, 119, 182);
            doc.rect(0, 0, pageW, 3, "F");
            doc.setFillColor(0, 180, 216);
            doc.rect(0, 3, pageW, 1.5, "F");

            doc.setFillColor(245, 248, 252);
            doc.rect(0, 4.5, pageW, 22, "F");

            doc.setFillColor(0, 119, 182);
            doc.roundedRect(14, 9, 12, 12, 2, 2, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text("AS", 20, 17, { align: "center" });

            doc.setFontSize(14);
            doc.setTextColor(15, 30, 60);
            doc.setFont("helvetica", "bold");
            doc.text("AquaShield", 30, 16);

            doc.setFontSize(7);
            doc.setTextColor(100, 130, 160);
            doc.setFont("helvetica", "normal");
            doc.text("Marine Protection Intelligence System", 30, 21);

            doc.setFontSize(9);
            doc.setTextColor(100, 130, 160);
            doc.text(`${generatedDate}`, pageW - 14, 16, { align: "right" });

            doc.setDrawColor(200, 215, 230);
            doc.setLineWidth(0.4);
            doc.line(14, 26.5, pageW - 14, 26.5);

            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 119, 182);
            doc.text("Complete User Registry", 14, 40);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 120, 150);
            doc.text(`All ${totalUsers} registered users as of ${generatedDate}`, 14, 47);

            autoTable(doc, {
                startY: 52,
                head: [["UID", "Full Name", "Email Address", "Role", "Status"]],
                body: users.map((user) => [
                    user.uid || "—",
                    `${user.firstName} ${user.lastName}`,
                    user.email,
                    user.isAdmin ? "Admin" : "User",
                    user.isBlocked ? "Blocked" : "Active",
                ]),
                styles: {
                    fontSize: 8,
                    cellPadding: 4,
                    fillColor: [255, 255, 255],
                    textColor: [40, 60, 90],
                    lineColor: [210, 225, 240],
                    lineWidth: 0.3,
                },
                headStyles: {
                    fillColor: [0, 119, 182],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 8,
                },
                alternateRowStyles: {
                    fillColor: [245, 248, 252],
                },
                columnStyles: {
                    0: { cellWidth: 22, fontStyle: "bold", textColor: [0, 119, 182] },
                    1: { cellWidth: 38 },
                    2: { cellWidth: 55 },
                    3: { cellWidth: 20, halign: "center" },
                    4: { cellWidth: 22, halign: "center" },
                },
                didDrawCell: (data) => {
                    if (data.section === "body" && data.column.index === 4) {
                        const val = data.cell.text[0];
                        doc.setFontSize(8);
                        if (val === "Active") doc.setTextColor(22, 163, 74);
                        else if (val === "Blocked") doc.setTextColor(220, 38, 38);
                        doc.text(val, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: "center" });
                    }
                    if (data.section === "body" && data.column.index === 3) {
                        const val = data.cell.text[0];
                        doc.setFontSize(8);
                        if (val === "Admin") doc.setTextColor(180, 130, 0);
                        else doc.setTextColor(70, 100, 140);
                        doc.text(val, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: "center" });
                    }
                },
                margin: { left: 14, right: 14 },
                didDrawPage: (data) => {
                    const pg = doc.internal.getCurrentPageInfo().pageNumber;
                    doc.setFillColor(245, 248, 252);
                    doc.rect(0, pageH - 10, pageW, 10, "F");
                    doc.setDrawColor(210, 225, 240);
                    doc.setLineWidth(0.3);
                    doc.line(0, pageH - 10, pageW, pageH - 10);
                    doc.setFontSize(7);
                    doc.setTextColor(130, 150, 175);
                    doc.text("AquaShield Confidential — For authorized personnel only", 14, pageH - 4);
                    doc.text(`Page ${pg}`, pageW - 14, pageH - 4, { align: "right" });
                    if (pg > 2) {
                        doc.setFillColor(0, 119, 182);
                        doc.rect(0, 0, pageW, 3, "F");
                    }
                },
            });

            const filename = `AquaShield_Users_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(filename);

        } catch (err) {
            console.error("PDF generation error:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
                <div
                    className="relative w-full max-w-lg bg-[#0a1628]/98 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    style={{ animation: "modal-in 0.25s ease-out" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-600/5 pointer-events-none rounded-3xl" />
                    <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400" />

                    <div className="relative z-10 flex items-center justify-between px-7 pt-6 pb-4 border-b border-white/8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl flex items-center justify-center text-xl">📄</div>
                            <div>
                                <h2 className="text-lg font-black text-white">Generate PDF Report</h2>
                                <p className="text-white/30 text-xs mt-0.5">Industry-grade user intelligence report</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/40 hover:text-white flex items-center justify-center transition-all">✕</button>
                    </div>

                    <div className="relative z-10 px-7 py-6 flex flex-col gap-5">
                        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-4">Report Contents</p>
                            <div className="flex flex-col gap-2.5">
                                {[
                                    { icon: "📊", label: "Analytics Summary", desc: "Distribution charts & user overview table — Page 1" },
                                    { icon: "📋", label: "Complete User Registry", desc: `All ${totalUsers} users with roles and status — Page 2+` },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <span className="text-lg w-7">{item.icon}</span>
                                        <div>
                                            <p className="text-white/70 text-sm font-semibold">{item.label}</p>
                                            <p className="text-white/30 text-xs">{item.desc}</p>
                                        </div>
                                        <span className="ml-auto text-emerald-400 text-xs">✓</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { label: "Total", value: totalUsers, color: "text-cyan-400" },
                                { label: "Active", value: activeUsers, color: "text-emerald-400" },
                                { label: "Blocked", value: blockedUsers, color: "text-rose-400" },
                                { label: "Admins", value: adminUsers, color: "text-amber-400" },
                            ].map((s) => (
                                <div key={s.label} className="bg-white/[0.03] border border-white/8 rounded-xl p-3 text-center">
                                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                                    <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                            <span className="text-blue-400 text-lg">📁</span>
                            <div>
                                <p className="text-blue-300 text-sm font-semibold">
                                    AquaShield_Users_Report_{new Date().toISOString().slice(0, 10)}.pdf
                                </p>
                                <p className="text-blue-400/60 text-xs">2+ pages · White professional theme · Auto-download</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-3 bg-white/5 border border-white/10 text-white/50 hover:text-white font-medium rounded-xl text-sm transition-all hover:bg-white/10">
                                Cancel
                            </button>
                            <button type="button" onClick={generatePDF} disabled={isGenerating}
                                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                {isGenerating ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <span>Generate & Download →</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes modal-in {
                    from { transform: scale(0.95) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </>
    );
}
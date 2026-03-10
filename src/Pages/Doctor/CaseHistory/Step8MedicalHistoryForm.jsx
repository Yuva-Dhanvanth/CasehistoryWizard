import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Step8MedicalHistoryForm({ formData, updateFormData, selectedChild }) {
  const data = formData.medicalHistory || {
    pedigreeMembers: [],
    prenatalHistory: "",
    natalHistory: "",
    postnatalHistory: "",
  };

  const handlePrint = () => {
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let startY = 40;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(171, 28, 28);
    doc.text("Medical History Sheet", pageWidth / 2, startY, { align: "center" });
    startY += 30;

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Child Name: ${formData.childName || selectedChild?.name || "N/A"}`, margin, startY);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, startY, { align: "right" });
    startY += 30;

    const addSectionTitle = (title) => {
      if (startY > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        startY = 40;
      }
      doc.setFontSize(14);
      doc.setTextColor(171, 28, 28);
      doc.text(title, margin, startY);
      startY += 8;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, startY, pageWidth - margin, startY);
      startY += 20;
    };

    // 1. Pedigree Chart
    if (data.pedigreeMembers && data.pedigreeMembers.length > 0) {
      addSectionTitle("Pedigree Chart Members");
      const pedigreeBody = data.pedigreeMembers.map((member, idx) => [
        idx + 1,
        member.symbol.charAt(0).toUpperCase() + member.symbol.slice(1),
        member.note || "-"
      ]);

      autoTable(doc, {
        startY: startY,
        head: [["#", "Symbol (Type)", "Notes"]],
        body: pedigreeBody,
        theme: "grid",
        headStyles: { fillColor: [171, 28, 28], textColor: 255 },
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin }
      });
      startY = doc.lastAutoTable.finalY + 30;
    }

    const printTextSection = (title, text) => {
      if (!text) return;
      addSectionTitle(title);
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const splitText = doc.splitTextToSize(text, pageWidth - margin * 2);
      if (startY + (splitText.length * 12) > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        startY = 40;
      }
      doc.text(splitText, margin, startY);
      startY += splitText.length * 12 + 30;
    };

    printTextSection("Pre-natal History", data.prenatalHistory);
    printTextSection("Natal History", data.natalHistory);
    printTextSection("Post-natal History", data.postnatalHistory);

    const fileName = `Medical_History_${(formData.childName || "Child").replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  };

  const handleChange = (e) => {
    updateFormData("medicalHistory", {
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const addPedigreeMember = () => {
    const newMembers = [...(data.pedigreeMembers || []), { symbol: "male", note: "" }];
    updateFormData("medicalHistory", { ...data, pedigreeMembers: newMembers });
  };

  const updatePedigreeMember = (index, field, value) => {
    const newMembers = [...data.pedigreeMembers];
    newMembers[index][field] = value;
    updateFormData("medicalHistory", { ...data, pedigreeMembers: newMembers });
  };

  const removePedigreeMember = (index) => {
    const newMembers = data.pedigreeMembers.filter((_, i) => i !== index);
    updateFormData("medicalHistory", { ...data, pedigreeMembers: newMembers });
  };

  const renderSymbol = (symbol) => {
    switch (symbol) {
      case "male":
        return <div className="w-8 h-8 border-2 border-blue-600 bg-blue-100 flex items-center justify-center font-bold text-xs">M</div>;
      case "female":
        return <div className="w-8 h-8 rounded-full border-2 border-pink-600 bg-pink-100 flex items-center justify-center font-bold text-xs">F</div>;
      case "dead":
        return (
          <div className="w-8 h-8 relative flex items-center justify-center">
            <div className="absolute w-full h-1 bg-gray-800 rotate-45"></div>
            <div className="absolute w-full h-1 bg-gray-800 -rotate-45"></div>
          </div>
        );
      case "twin":
        return (
          <div className="flex">
            <div className="w-4 h-4 border border-blue-600 bg-blue-100"></div>
            <div className="w-4 h-4 border border-blue-600 bg-blue-100 ml-1"></div>
          </div>
        );
      case "miscarriage":
        return <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-600"></div>;
      case "stillbirth":
        return <div className="w-8 h-8 rounded-full border-2 border-gray-600 bg-gray-300 flex items-center justify-center text-xs">SB</div>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Step 8: Medical History Form</h2>
          <p className="text-sm text-gray-500">Record developmental and family history.</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-[#ab1c1c] text-white font-semibold rounded-lg shadow-md hover:bg-[#8e1818] transition-colors flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
          </svg>
          Print Medical History Sheet
        </button>
      </div>

      {/* Pedigree Chart Section */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Pedigree Chart</h3>
        <p className="text-sm text-gray-600 mb-4">Visually represent family relationships.</p>

        <div className="space-y-3 mb-4">
          {(data.pedigreeMembers || []).map((member, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded shadow-sm border border-gray-100">
              <div className="flex-shrink-0 w-12 flex justify-center">
                {renderSymbol(member.symbol)}
              </div>
              <div className="flex-1">
                <select
                  value={member.symbol}
                  onChange={(e) => updatePedigreeMember(idx, "symbol", e.target.value)}
                  className="w-full sm:w-48 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#ab1c1c] focus:outline-none mb-2 sm:mb-0 sm:mr-3 text-sm"
                >
                  <option value="male">Male (Square)</option>
                  <option value="female">Female (Circle)</option>
                  <option value="dead">Dead (Cross)</option>
                  <option value="twin">Twin</option>
                  <option value="miscarriage">Miscarriage</option>
                  <option value="stillbirth">Still birth</option>
                </select>
                <input
                  type="text"
                  placeholder="Notes (e.g., Father, ASD diagnosed)"
                  value={member.note}
                  onChange={(e) => updatePedigreeMember(idx, "note", e.target.value)}
                  className="w-full sm:w-64 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#ab1c1c] focus:outline-none text-sm"
                />
              </div>
              <button
                onClick={() => removePedigreeMember(idx)}
                className="text-red-500 hover:text-red-700 font-medium text-sm px-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addPedigreeMember}
          className="text-sm px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
        >
          + Add Family Member
        </button>

        {/* Visual Preview */}
        {data.pedigreeMembers?.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Chart Preview</p>
            <div className="flex flex-wrap gap-8 items-center justify-center bg-white p-6 rounded-lg border border-gray-200 min-h-[100px]">
              {data.pedigreeMembers.map((member, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  {renderSymbol(member.symbol)}
                  <span className="text-xs text-gray-600 max-w-[80px] text-center truncate" title={member.note}>
                    {member.note || "-"}
                  </span>
                  {idx < data.pedigreeMembers.length - 1 && (
                    <div className="absolute w-8 h-0.5 bg-gray-300 ml-[100px] mt-4 hidden sm:block"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pre-natal History */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pre-natal History</label>
        <p className="text-xs text-gray-500 mb-2">Pregnancy details (complications, medications, etc.)</p>
        <textarea
          name="prenatalHistory"
          value={data.prenatalHistory || ""}
          onChange={handleChange}
          rows="4"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ab1c1c] focus:outline-none"
          placeholder="Enter details here..."
        ></textarea>
      </div>

      {/* Natal History */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Natal History</label>
        <p className="text-xs text-gray-500 mb-2">Birth conditions (term, type of delivery, birth weight, complications, etc.)</p>
        <textarea
          name="natalHistory"
          value={data.natalHistory || ""}
          onChange={handleChange}
          rows="4"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ab1c1c] focus:outline-none"
          placeholder="Enter details here..."
        ></textarea>
      </div>

      {/* Post-natal History */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Post-natal History</label>
        <p className="text-xs text-gray-500 mb-2">Development after birth (milestones, early illnesses, etc.)</p>
        <textarea
          name="postnatalHistory"
          value={data.postnatalHistory || ""}
          onChange={handleChange}
          rows="4"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ab1c1c] focus:outline-none"
          placeholder="Enter details here..."
        ></textarea>
      </div>

    </div>
  );
}

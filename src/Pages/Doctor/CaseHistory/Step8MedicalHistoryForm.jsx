import React from "react";
import PedigreeChart from "./PedigreeChart";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";

export const buildPedigreeHierarchy = (members) => {
  const hierarchy = {
    "Great grandparents": [],
    "Grandparents": [],
    "Parents": [],
    "Uncles / Aunts": [],
    "Patient": [],
    "Siblings": [],
    "Cousins": [],
    "Other": []
  };

  if (!members || !Array.isArray(members)) return hierarchy;

  members.forEach((member) => {
    const rel = (member.relation_to_patient || "").toLowerCase().trim();
    
    if (rel.includes("great") && rel.includes("grand")) {
      hierarchy["Great grandparents"].push(member);
    } else if (rel.includes("grand")) {
      hierarchy["Grandparents"].push(member);
    } else if (["father", "mother", "parent", "dad", "mom"].includes(rel)) {
      hierarchy["Parents"].push(member);
    } else if (rel.includes("uncle") || rel.includes("aunt")) {
      hierarchy["Uncles / Aunts"].push(member);
    } else if (["self", "patient", "child", "me"].includes(rel)) {
      hierarchy["Patient"].push(member);
    } else if (["brother", "sister", "sibling"].includes(rel)) {
      hierarchy["Siblings"].push(member);
    } else if (rel.includes("cousin")) {
      hierarchy["Cousins"].push(member);
    } else {
      hierarchy["Other"].push(member);
    }
  });

  return hierarchy;
};

export default function Step8MedicalHistoryForm({ formData, updateFormData, selectedChild }) {
  const data = formData.medicalHistory || {
    pedigreeMembers: [],
    parentsBloodRelatives: "Unknown",
    prenatalHistory: "",
    natalHistory: "",
    postnatalHistory: "",
  };

  const handlePrint = async () => {
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
      addSectionTitle("Family History Members");
      const pedigreeBody = data.pedigreeMembers.map((member, idx) => {
        let parentsInfo = [];
        if (member.father_id) {
          const f = data.pedigreeMembers.find(m => m.id === member.father_id);
          if (f) parentsInfo.push(`F: ${f.name || '?'}`);
        }
        if (member.mother_id) {
          const m = data.pedigreeMembers.find(m => m.id === member.mother_id);
          if (m) parentsInfo.push(`M: ${m.name || '?'}`);
        }
        
        return [
          idx + 1,
          member.name || "-",
          parentsInfo.length ? parentsInfo.join(", ") : "-",
          member.gender.charAt(0).toUpperCase() + member.gender.slice(1),
          member.health_condition || "-",
          member.alive ? "Yes" : "No"
        ];
      });

      autoTable(doc, {
        startY: startY,
        head: [["#", "Name", "Parents", "Gender", "Health Condition", "Alive"]],
        body: pedigreeBody,
        theme: "grid",
        headStyles: { fillColor: [171, 28, 28], textColor: 255 },
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin }
      });
      startY = doc.lastAutoTable.finalY + 15;
    }

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Parents blood relatives (Consanguineous): ${data.parentsBloodRelatives || "Unknown"}`, margin, startY);
    startY += 30;

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

    // Capture and embed Pedigree Diagram
    try {
      const flowEl = document.querySelector('.react-flow');
      if (false && flowEl && data.pedigreeMembers?.length > 0) {
        const dataUrl = await toPng(flowEl, {
          backgroundColor: '#f8fafc',
          filter: (node) => {
            if (node.classList && node.classList.contains('react-flow__controls')) {
              return false;
            }
            return true;
          }
        });

        doc.addPage();
        startY = 40;
        doc.setFontSize(14);
        doc.setTextColor(171, 28, 28);
        doc.text("Pedigree Diagram", margin, startY);
        startY += 8;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, startY, pageWidth - margin, startY);
        startY += 20;

        const imgProps = doc.getImageProperties(dataUrl);
        const pdfWidth = pageWidth - 2 * margin;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Make sure it fits on the page
        const maxHeight = doc.internal.pageSize.getHeight() - startY - 40;
        const finalHeight = Math.min(pdfHeight, maxHeight);
        const finalWidth = (finalHeight * imgProps.width) / imgProps.height;

        // Center the image if it was scaled down by height
        const xOffset = margin + (pdfWidth - finalWidth) / 2;

        doc.addImage(dataUrl, 'PNG', xOffset, startY, finalWidth, finalHeight);
      }
    } catch (err) {
      console.error("Could not capture pedigree diagram to PDF:", err);
    }

    const fileName = `Medical_History_${(formData.childName || "Child").replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  };

  const printPedigreeChart = async () => {
    try {
      const flowEl = document.querySelector('.react-flow');
      if (flowEl && data.pedigreeMembers?.length > 0) {
        const dataUrl = await toPng(flowEl, {
          backgroundColor: '#ffffff',
          filter: (node) => {
            if (node.classList && node.classList.contains('react-flow__controls')) {
              return false;
            }
            return true;
          }
        });
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head><title>Print Pedigree Chart</title></head>
              <body style="margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh;">
                <img src="${dataUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                <script>
                  window.onload = () => {
                    setTimeout(() => {
                      window.print();
                      window.close();
                    }, 500);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      } else {
        alert("Please add family members to view the chart first.");
      }
    } catch (err) {
      console.error("Could not print pedigree diagram:", err);
    }
  };

  const handleChange = (e) => {
    updateFormData("medicalHistory", {
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const addPedigreeMember = () => {
    const newMember = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      name: "",
      gender: "unknown",
      affected: false,
      health_condition: "",
      alive: true,
      type: "normal",
      twin_status: "none",
      father_id: "",
      mother_id: "",
      spouse_ids: []
    };
    const newMembers = [...(data.pedigreeMembers || []), newMember];
    updateFormData("medicalHistory", { ...data, pedigreeMembers: newMembers });
  };

  const updatePedigreeMember = (index, field, value) => {
    const newMembers = [...data.pedigreeMembers];
    newMembers[index][field] = value;
    if (field === "health_condition") {
      newMembers[index].affected = value.trim() !== "";
    }
    updateFormData("medicalHistory", { ...data, pedigreeMembers: newMembers });
  };

  const removePedigreeMember = (index) => {
    const newMembers = data.pedigreeMembers.filter((_, i) => i !== index);
    updateFormData("medicalHistory", { ...data, pedigreeMembers: newMembers });
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
        <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Family History (Pedigree)</h3>
        <p className="text-sm text-gray-600 mb-4">Record structured pedigree data about family relationships.</p>

        <div className="mb-6 bg-white p-3 rounded shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Are the parents blood relatives? (Consanguineous)
          </label>
          <select
            name="parentsBloodRelatives"
            value={data.parentsBloodRelatives || "Unknown"}
            onChange={handleChange}
            className="w-full sm:w-64 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#ab1c1c] focus:outline-none text-sm"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>

        <div className="space-y-4 mb-4">
          {(data.pedigreeMembers || []).map((member, idx) => (
            <div key={member.id || idx} className="bg-white p-4 rounded shadow-sm border border-gray-100 relative">
              <button
                onClick={() => removePedigreeMember(idx)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-medium px-2"
              >
                ✕
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={member.name || ""}
                    onChange={(e) => updatePedigreeMember(idx, "name", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#ab1c1c] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Father</label>
                  <select
                    value={member.father_id || ""}
                    onChange={(e) => updatePedigreeMember(idx, "father_id", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#ab1c1c] focus:outline-none text-sm"
                  >
                    <option value="">None / Unknown</option>
                    {(data.pedigreeMembers || []).filter(m => m.id !== member.id && m.gender === 'male').map(m => (
                      <option key={m.id} value={m.id}>{m.name || 'Unnamed Member'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mother</label>
                  <select
                    value={member.mother_id || ""}
                    onChange={(e) => updatePedigreeMember(idx, "mother_id", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#ab1c1c] focus:outline-none text-sm"
                  >
                    <option value="">None / Unknown</option>
                    {(data.pedigreeMembers || []).filter(m => m.id !== member.id && m.gender === 'female').map(m => (
                      <option key={m.id} value={m.id}>{m.name || 'Unnamed Member'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Spouse</label>
                  <select
                    value={member.spouse_ids && member.spouse_ids.length > 0 ? member.spouse_ids[0] : ""}
                    onChange={(e) => updatePedigreeMember(idx, "spouse_ids", e.target.value ? [e.target.value] : [])}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#ab1c1c] focus:outline-none text-sm"
                  >
                    <option value="">None / Unknown</option>
                    {(data.pedigreeMembers || []).filter(m => m.id !== member.id).map(m => (
                      <option key={m.id} value={m.id}>{m.name || 'Unnamed Member'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                  <select
                    value={member.gender || "unknown"}
                    onChange={(e) => updatePedigreeMember(idx, "gender", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#ab1c1c] focus:outline-none text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type (Pregnancy/Loss)</label>
                  <select
                    value={member.type || "normal"}
                    onChange={(e) => updatePedigreeMember(idx, "type", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#ab1c1c] focus:outline-none text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="pregnancy">Pregnancy (P)</option>
                    <option value="miscarriage">Miscarriage</option>
                    <option value="stillbirth">Stillbirth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Twin Status</label>
                  <select
                    value={member.twin_status || "none"}
                    onChange={(e) => updatePedigreeMember(idx, "twin_status", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#ab1c1c] focus:outline-none text-sm"
                  >
                    <option value="none">None</option>
                    <option value="identical">Identical Twin</option>
                    <option value="non-identical">Non-identical Twin</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Health condition (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Asthma, ASD"
                    value={member.health_condition || ""}
                    onChange={(e) => updatePedigreeMember(idx, "health_condition", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#ab1c1c] focus:outline-none text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-5">
                    <input
                      type="checkbox"
                      checked={member.alive === false}
                      onChange={(e) => updatePedigreeMember(idx, "alive", !e.target.checked)}
                      className="w-4 h-4 text-[#ab1c1c] focus:ring-[#ab1c1c]"
                    />
                    <span className="text-sm font-medium text-gray-700">Deceased</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addPedigreeMember}
          className="text-sm px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
        >
          + Add Family Member
        </button>

        {/* Visual Preview Disabled for now */}
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


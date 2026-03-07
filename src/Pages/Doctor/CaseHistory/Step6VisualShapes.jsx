import { useRef } from "react";

export default function Step6VisualShapes({ formData, updateFormData }) {
  const printRef = useRef();
  const data = formData.visualShapes;

  const handleFieldChange = (field, value) => {
    updateFormData("visualShapes", (prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Visual Shapes Task</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { background: #2d5016; color: white; padding: 10px 30px; display: inline-block; border-radius: 5px; font-size: 20px; font-weight: bold; }
            .subtitle { color: #666; margin-top: 10px; font-style: italic; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 1px solid #333; padding-bottom: 5px; }
            .shape-section { display: flex; margin-bottom: 40px; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            .shape-image { width: 150px; height: 150px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; margin-right: 20px; }
            .shape-details { flex: 1; }
            .shape-name { background: #ab1c1c; color: white; padding: 5px 15px; display: inline-block; border-radius: 3px; font-weight: bold; }
            .expected-age { color: #ab1c1c; font-weight: bold; float: right; }
            .copy-box { border: 2px dashed #ccc; height: 120px; margin-top: 10px; border-radius: 5px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">VISUAL SHAPES TASK</div>
            <div class="subtitle">Copy the shapes in the box given below</div>
          </div>
          <div class="info-row">
            <span>Name: ${data.childName || "___________________"}</span>
            <span>Date: ${data.date || "___________________"}</span>
          </div>
          <div class="shape-section">
            <div class="shape-image">
              <svg width="80" height="100" viewBox="0 0 80 100">
                <ellipse cx="40" cy="15" rx="35" ry="12" fill="none" stroke="#333" stroke-width="1.5"/>
                <line x1="5" y1="15" x2="5" y2="85" stroke="#333" stroke-width="1.5"/>
                <line x1="75" y1="15" x2="75" y2="85" stroke="#333" stroke-width="1.5"/>
                <ellipse cx="40" cy="85" rx="35" ry="12" fill="none" stroke="#333" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="shape-details">
              <span class="shape-name">1. Cylinder</span>
              <span class="expected-age">Expected Age: 9 yrs</span>
              <p style="margin-top: 10px; color: #666;">Copy this shape below:</p>
              <div class="copy-box"></div>
            </div>
          </div>
          <div class="shape-section">
            <div class="shape-image">
              <svg width="80" height="100" viewBox="0 0 80 100">
                <rect x="15" y="25" width="50" height="50" fill="none" stroke="#333" stroke-width="1.5"/>
                <line x1="15" y1="25" x2="35" y2="10" stroke="#333" stroke-width="1.5"/>
                <line x1="65" y1="25" x2="75" y2="10" stroke="#333" stroke-width="1.5"/>
                <line x1="35" y1="10" x2="75" y2="10" stroke="#333" stroke-width="1.5"/>
                <line x1="75" y1="10" x2="75" y2="55" stroke="#333" stroke-width="1.5" stroke-dasharray="4"/>
                <line x1="65" y1="75" x2="75" y2="55" stroke="#333" stroke-width="1.5" stroke-dasharray="4"/>
              </svg>
            </div>
            <div class="shape-details">
              <span class="shape-name">2. Cube (Cuboid)</span>
              <span class="expected-age">Expected Age: 12 yrs</span>
              <p style="margin-top: 10px; color: #666;">Copy this shape below:</p>
              <div class="copy-box"></div>
            </div>
          </div>
          <div class="shape-section">
            <div class="shape-image">
              <svg width="80" height="100" viewBox="0 0 80 100">
                <rect x="10" y="25" width="60" height="45" fill="none" stroke="#333" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="shape-details">
              <span class="shape-name">3. Rectangle</span>
              <p style="margin-top: 10px; color: #666;">Copy this shape below:</p>
              <div class="copy-box"></div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#ab1c1c] mb-6">
        Visual Shapes Task
      </h2>

      {/* Child Info for Print */}
      <div className="border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Child Name
            </label>
            <input
              type="text"
              value={data.childName}
              onChange={(e) => handleFieldChange("childName", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ab1c1c] focus:outline-none"
              placeholder="Child's name for print"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={data.date}
              onChange={(e) => handleFieldChange("date", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ab1c1c] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div ref={printRef} className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
        <div className="text-center mb-6">
          <h3 className="inline-block bg-green-700 text-white px-6 py-2 rounded font-bold text-lg">
            VISUAL SHAPES TASK
          </h3>
          <p className="text-gray-500 mt-2 italic">
            Copy the shapes in the box given below
          </p>
        </div>

        <div className="flex justify-between text-sm text-gray-700 mb-6 border-b pb-2">
          <span>
            Name: <strong>{data.childName || "____________"}</strong>
          </span>
          <span>
            Date: <strong>{data.date || "____________"}</strong>
          </span>
        </div>

        {/* Shape 1: Cylinder */}
        <div className="flex gap-4 mb-6 border border-gray-200 rounded-lg p-4">
          <div className="w-32 h-32 border border-dashed border-gray-300 rounded flex items-center justify-center shrink-0">
            <svg width="60" height="80" viewBox="0 0 60 80">
              <ellipse cx="30" cy="12" rx="25" ry="10" fill="none" stroke="#333" strokeWidth="1.5" />
              <line x1="5" y1="12" x2="5" y2="68" stroke="#333" strokeWidth="1.5" />
              <line x1="55" y1="12" x2="55" y2="68" stroke="#333" strokeWidth="1.5" />
              <ellipse cx="30" cy="68" rx="25" ry="10" fill="none" stroke="#333" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <span className="bg-[#ab1c1c] text-white px-3 py-1 rounded text-sm font-bold">
                1. Cylinder
              </span>
              <span className="text-sm">
                Expected Age: <strong className="text-[#ab1c1c]">9 yrs</strong>
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-2">Copy this shape below:</p>
            <div className="border-2 border-dashed border-gray-300 h-24 rounded mt-2" />
          </div>
        </div>

        {/* Shape 2: Cube */}
        <div className="flex gap-4 mb-6 border border-gray-200 rounded-lg p-4">
          <div className="w-32 h-32 border border-dashed border-gray-300 rounded flex items-center justify-center shrink-0">
            <svg width="60" height="80" viewBox="0 0 60 80">
              <rect x="10" y="25" width="35" height="35" fill="none" stroke="#333" strokeWidth="1.5" />
              <line x1="10" y1="25" x2="25" y2="12" stroke="#333" strokeWidth="1.5" />
              <line x1="45" y1="25" x2="55" y2="12" stroke="#333" strokeWidth="1.5" />
              <line x1="25" y1="12" x2="55" y2="12" stroke="#333" strokeWidth="1.5" />
              <line x1="55" y1="12" x2="55" y2="45" stroke="#333" strokeWidth="1.5" strokeDasharray="3" />
              <line x1="45" y1="60" x2="55" y2="45" stroke="#333" strokeWidth="1.5" strokeDasharray="3" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <span className="bg-[#ab1c1c] text-white px-3 py-1 rounded text-sm font-bold">
                2. Cube (Cuboid)
              </span>
              <span className="text-sm">
                Expected Age: <strong className="text-[#ab1c1c]">12 yrs</strong>
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-2">Copy this shape below:</p>
            <div className="border-2 border-dashed border-gray-300 h-24 rounded mt-2" />
          </div>
        </div>

        {/* Shape 3: Rectangle */}
        <div className="flex gap-4 border border-gray-200 rounded-lg p-4">
          <div className="w-32 h-32 border border-dashed border-gray-300 rounded flex items-center justify-center shrink-0">
            <svg width="60" height="80" viewBox="0 0 60 80">
              <rect x="5" y="20" width="50" height="35" fill="none" stroke="#333" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <span className="bg-[#ab1c1c] text-white px-3 py-1 rounded text-sm font-bold">
                3. Rectangle
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-2">Copy this shape below:</p>
            <div className="border-2 border-dashed border-gray-300 h-24 rounded mt-2" />
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="flex justify-center">
        <button
          onClick={handlePrint}
          className="px-8 py-3 bg-[#ab1c1c] text-white rounded-lg hover:bg-[#8e1818] transition-colors flex items-center gap-2"
        >
          🖨️ Print Visual Shapes Sheet
        </button>
      </div>
    </div>
  );
}

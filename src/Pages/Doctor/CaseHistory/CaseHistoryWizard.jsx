import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import "jspdf-autotable";

import Step1Demographics from "./Step1Demographics";
import Step2DocumentsChecklist from "./Step2DocumentsChecklist";
import Step3IncreasingBehaviour from "./Step3IncreasingBehaviour";
import Step4DecreasingBehaviour from "./Step4DecreasingBehaviour";
import Step5TrialExamination from "./Step5TrialExamination";
import Step6ScreeningDrawingTest from "./Step6ScreeningDrawingTest";
import Step7AssessmentNotes from "./Step7AssessmentNotes";
import Step8MedicalHistoryForm from "./Step8MedicalHistoryForm";

const STEPS = [
  { label: "Child Demographics", shortLabel: "Demographics", component: Step1Demographics },
  { label: "Documents Checklist", shortLabel: "Documents", component: Step2DocumentsChecklist },
  { label: "Increasing Behaviour", shortLabel: "IBP+", component: Step3IncreasingBehaviour },
  { label: "Decreasing Behaviour", shortLabel: "IBP−", component: Step4DecreasingBehaviour },
  { label: "Trial Examination", shortLabel: "Trials", component: Step5TrialExamination },
  { label: "Screening Drawing Test", shortLabel: "Screening Test", component: Step6ScreeningDrawingTest },
  { label: "Assessment Notes", shortLabel: "Assessment", component: Step7AssessmentNotes },
  { label: "Medical History", shortLabel: "Medical History", component: Step8MedicalHistoryForm },
];

const initialFormData = {
  // Step 1 – Child Demographics
  childName: "",
  dob: "",
  dateOfJoining: "",
  therapistName: "",
  fatherName: "",
  fatherPhone: "",
  fatherWhatsApp: "",
  fatherEmail: "",
  motherName: "",
  motherPhone: "",
  motherWhatsApp: "",
  motherEmail: "",
  address: "",
  preTherapyVideoRef: "",
  newTherapyAdded: "",
  newTherapyDate: "",
  newTherapistName: "",
  therapyStarted: [
    { type: "OT", startedDate: "", therapistName: "", uploadRef: "" },
    { type: "BT", startedDate: "", therapistName: "", uploadRef: "" },
    { type: "RT", startedDate: "", therapistName: "", uploadRef: "" },
    { type: "ST", startedDate: "", therapistName: "", uploadRef: "" },
    { type: "BM", startedDate: "", therapistName: "", uploadRef: "" },
    { type: "Parent Training", startedDate: "", therapistName: "", uploadRef: "" },
  ],

  // Step 2 – Documents Checklist
  consultationPaper: false,
  previousMedicalDocs: false,
  testReports: false,
  consentForm: false,
  parentConcerns: false,
  parentConcernsText: "",
  therapyChange: false,
  therapistChange: false,
  foodAllergy: false,

  // Step 3 – Increasing Behaviour Plan
  increasingBehaviour: {
    longTermGoal: "",
    shortTermGoals: Array.from({ length: 5 }, () => ({
      text: "",
      month1: "",
      month2: "",
      month3: "",
    })),
    materialUsed: "",
    methodsUsed: "",
    parentalInvolvement: "",
    overallFeedback: "",
  },

  // Step 4 – Decreasing Behaviour Plan
  decreasingBehaviour: {
    rows: [
      { type: "Attention Seeking", month1: "", month2: "", month3: "" },
      { type: "Escape", month1: "", month2: "", month3: "" },
      { type: "Skill Deficit", month1: "", month2: "", month3: "" },
      { type: "Tangible", month1: "", month2: "", month3: "" },
      { type: "Automatic Reinforcement", month1: "", month2: "", month3: "" },
      { type: "Self Stimulation", month1: "", month2: "", month3: "" },
    ],
    rewardsForConsequences: "",
    methodsUsed: "",
    parentalInvolvement: "",
  },

  // Step 5 – Trial Examination
  trialExamination: {
    targetBehaviour: "",
    trials: Array.from({ length: 5 }, () => ({
      promptUsed: "",
      maxScore: "",
      achievedScore: "",
    })),
    totalScore: 0,
    percentage: 0,
  },

  // Step 6 – Screening Drawing Test (previously Visual Shapes Task)
  visualShapes: {
    childName: "",
    date: "",
  },

  // Step 7 – Assessment Notes
  assessmentNotes: {
    cylinderResult: "",
    cubeResult: "",
    rectangleResponse: "",
    therapistNotes: "",
    observationNotes: "",
    assessmentDate: "",
  },

  // Step 8 - Medical History
  medicalHistory: {
    prenatalHistory: "",
    natalHistory: "",
    postnatalHistory: "",
  },
};

// Calculate age from DOB string
function calculateAge(dobString) {
  if (!dobString) return "";
  const dob = new Date(dobString);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years > 0) return `${years} yr${years > 1 ? "s" : ""} ${months} mo`;
  return `${months} mo`;
}

export default function CaseHistoryWizard() {
  // Child selector state
  const [children, setChildren] = useState([]);
  const [filteredChildren, setFilteredChildren] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChild, setSelectedChild] = useState(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  const [isSaving, setIsSaving] = useState(false);
  const [savedHistories, setSavedHistories] = useState([]);
  const [loadingHistories, setLoadingHistories] = useState(false);
  const contentRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getChildren = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token || token === "null") {
          const mockData = [
            {
              _id: "mock-id-123",
              name: "Rahul",
              dob: "2018-05-12T00:00:00.000Z",
              gender: "Male",
              therapistId: { name: "Tejesh" },
              centreId: { name: "Test Centre" },
            },
            {
              _id: "mock-id-456",
              name: "Riya",
              dob: "2020-11-20T00:00:00.000Z",
              gender: "Female",
              therapistId: { name: "Tejesh" },
              centreId: { name: "Test Centre" },
            }
          ];
          setChildren(mockData);
          setFilteredChildren(mockData);
          setLoadingChildren(false);
          return;
        }

        const res = await axios.get("/api/doctors/assigned", {
          headers: {
            Authorization: `${token}`,
          },
        });
        setChildren(res.data);
        setFilteredChildren(res.data);
      } catch (error) {
        console.error(error.response?.data || error.message);
        toast.error("Error fetching children. Showing mock data.");
        // Fallback to mock data on error just in case for testing
        const mockData = [
          {
            _id: "mock-id-123",
            name: "Rahul",
            dob: "2018-05-12T00:00:00.000Z",
            gender: "Male",
            therapistId: { name: "Tejesh" },
            centreId: { name: "Test Centre" },
          }
        ];
        setChildren(mockData);
        setFilteredChildren(mockData);
      } finally {
        setLoadingChildren(false);
      }
    };
    getChildren();
  }, []);

  // Filter children based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChildren(children);
    } else {
      const filtered = children.filter((child) =>
        child.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChildren(filtered);
    }
  }, [searchQuery, children]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle child selection — pre-fill demographics
  const handleSelectChild = (child) => {
    setSelectedChild(child);
    setSearchQuery(child.name);
    setShowDropdown(false);

    // Pre-fill Step 1 fields with available child data
    setFormData((prev) => ({
      ...prev,
      childName: child.name || "",
      dob: child.dob ? child.dob.split("T")[0] : "",
      therapistName: child.therapistId?.name || "",
    }));

    // Also set for Visual Shapes step
    setFormData((prev) => ({
      ...prev,
      visualShapes: {
        ...prev.visualShapes,
        childName: child.name || "",
      },
    }));

    // Fetch past case histories
    fetchSavedHistories(child._id);
  };

  const fetchSavedHistories = async (childId) => {
    setLoadingHistories(true);
    try {
      const res = await axios.get(`/api/case-history/${childId}`, {
        headers: { Authorization: `${sessionStorage.getItem("token")}` },
      });
      // Assuming response is an array of case history objects
      setSavedHistories(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error.response?.data || error.message);
      // Soft fail, just clear table if no past data or 404
      setSavedHistories([]);
    } finally {
      setLoadingHistories(false);
    }
  };

  const handleViewHistory = (history) => {
    // Populate wizard with the saved data, mimicking initialFormData structure
    setFormData({
      ...initialFormData,
      ...history.demographics,
      childName: history.demographics?.childName || selectedChild.name,
      dob: history.demographics?.dob || (selectedChild.dob ? selectedChild.dob.split("T")[0] : ""),

      consultationPaper: history.documentsChecklist?.consultationPaper || false,
      previousMedicalDocs: history.documentsChecklist?.previousMedicalDocs || false,
      testReports: history.documentsChecklist?.testReports || false,
      consentForm: history.documentsChecklist?.consentForm || false,
      parentConcerns: history.documentsChecklist?.parentConcerns || false,
      parentConcernsText: history.documentsChecklist?.parentConcernsText || "",
      therapyChange: history.documentsChecklist?.therapyChange || false,
      therapistChange: history.documentsChecklist?.therapistChange || false,
      foodAllergy: history.documentsChecklist?.foodAllergy || false,

      increasingBehaviour: history.increasingBehaviourPlan || initialFormData.increasingBehaviour,
      decreasingBehaviour: history.decreasingBehaviourPlan || initialFormData.decreasingBehaviour,
      trialExamination: history.trialExamination || initialFormData.trialExamination,
      visualShapes: history.visualShapes || initialFormData.visualShapes,
      assessmentNotes: history.assessmentNotes || initialFormData.assessmentNotes,
      medicalHistory: history.medicalHistory || initialFormData.medicalHistory,
    });

    // Reset to step 1
    setCurrentStep(0);
    setVisitedSteps(new Set([0]));
    toast.info("Loaded previous case history.");
  };

  const handleGeneratePDF = (history) => {
    try {
      const doc = new jsPDF("p", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      let startY = 40;

      // Header
      doc.setFontSize(22);
      doc.setTextColor(171, 28, 28); // #ab1c1c
      doc.text("Total Solutions", pageWidth / 2, startY, { align: "center" });
      startY += 20;

      doc.setFontSize(16);
      doc.setTextColor(50, 50, 50);
      doc.text("Case History Report", pageWidth / 2, startY, { align: "center" });
      startY += 30;

      // Metadata
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Centre: ${selectedChild?.centreId?.name || "N/A"}`, margin, startY);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, startY, { align: "right" });
      startY += 30;

      // Helper function for section titles
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

      // 1. Child Information
      addSectionTitle("Child Information");
      const demo = history.demographics || {};
      const childInfo = [
        ["Child Name", demo.childName || selectedChild.name, "DOB", demo.dob || "N/A"],
        ["Therapist", demo.therapistName || "N/A", "Date of Joining", demo.dateOfJoining || "N/A"],
        ["Father Name", demo.fatherName || "N/A", "Father Phone", demo.fatherPhone || "N/A"],
        ["Mother Name", demo.motherName || "N/A", "Mother Phone", demo.motherPhone || "N/A"],
        ["Address", demo.address || "N/A", "", ""]
      ];

      doc.autoTable({
        startY: startY,
        body: childInfo,
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: "bold", textColor: [80, 80, 80], cellWidth: 100 },
          2: { fontStyle: "bold", textColor: [80, 80, 80], cellWidth: 100 }
        },
        margin: { left: margin, right: margin }
      });
      startY = doc.lastAutoTable.finalY + 30;

      // 2. Documents Checklist
      addSectionTitle("Documents Checklist");
      const docs = history.documentsChecklist || {};
      const docList = [
        ["Consultation Paper", docs.consultationPaper ? "Yes" : "No", "Previous Medical Docs", docs.previousMedicalDocs ? "Yes" : "No"],
        ["Test Reports", docs.testReports ? "Yes" : "No", "Consent Form", docs.consentForm ? "Yes" : "No"],
        ["Therapy Change", docs.therapyChange ? "Yes" : "No", "Therapist Change", docs.therapistChange ? "Yes" : "No"],
        ["Food Allergy", docs.foodAllergy ? "Yes" : "No", "Parent Concerns", docs.parentConcerns ? "Yes" : "No"]
      ];

      doc.autoTable({
        startY: startY,
        body: docList,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: "bold", fillColor: [249, 250, 251] },
          2: { fontStyle: "bold", fillColor: [249, 250, 251] }
        },
        margin: { left: margin, right: margin }
      });
      startY = doc.lastAutoTable.finalY + 30;

      // Parent Concerns text if any
      if (docs.parentConcerns && docs.parentConcernsText) {
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text("Parent Concerns Description:", margin, startY);
        startY += 15;
        doc.setTextColor(50, 50, 50);
        const splitText = doc.splitTextToSize(docs.parentConcernsText, pageWidth - margin * 2);
        doc.text(splitText, margin, startY);
        startY += splitText.length * 12 + 20;
      }

      // 3. Increasing Behaviour Plan
      const ibp = history.increasingBehaviourPlan || {};
      if (ibp.shortTermGoals && ibp.shortTermGoals.length > 0) {
        addSectionTitle("Increasing Behaviour Plan");

        doc.setFontSize(10);
        doc.text(`Long Term Goal: ${ibp.longTermGoal || "N/A"}`, margin, startY);
        startY += 20;

        const ibpBody = ibp.shortTermGoals
          .filter(g => g.text)
          .map(g => [g.text, g.month1 || "-", g.month2 || "-", g.month3 || "-"]);

        if (ibpBody.length > 0) {
          doc.autoTable({
            startY: startY,
            head: [["Short Term Goal", "Month 1", "Month 2", "Month 3"]],
            body: ibpBody,
            theme: "grid",
            headStyles: { fillColor: [171, 28, 28], textColor: 255 },
            styles: { fontSize: 10 },
            margin: { left: margin, right: margin }
          });
          startY = doc.lastAutoTable.finalY + 30;
        }
      }

      // 4. Decreasing Behaviour Plan
      const dbp = history.decreasingBehaviourPlan || {};
      if (dbp.rows && dbp.rows.length > 0) {
        addSectionTitle("Decreasing Behaviour Plan");

        const dbpBody = dbp.rows.map(r => [
          r.type,
          r.month1 || "-",
          r.month2 || "-",
          r.month3 || "-"
        ]);

        doc.autoTable({
          startY: startY,
          head: [["Behaviour Type", "Month 1", "Month 2", "Month 3"]],
          body: dbpBody,
          theme: "grid",
          headStyles: { fillColor: [171, 28, 28], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: margin, right: margin }
        });
        startY = doc.lastAutoTable.finalY + 30;
      }

      // 5. Trial Examination
      const trails = history.trialExamination || {};
      if (trails.trials && trails.trials.length > 0) {
        addSectionTitle("Trial Examination");

        doc.setFontSize(10);
        doc.text(`Target Behaviour: ${trails.targetBehaviour || "N/A"}`, margin, startY);
        startY += 20;

        const trialBody = trails.trials.map((t, idx) => [
          `Trial ${idx + 1}`,
          t.promptUsed || "-",
          t.maxScore || "0",
          t.achievedScore || "0"
        ]);

        doc.autoTable({
          startY: startY,
          head: [["Trial", "Prompt Used", "Max Score", "Achieved Score"]],
          body: trialBody,
          theme: "grid",
          headStyles: { fillColor: [171, 28, 28], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: margin, right: margin }
        });

        startY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.text(`Total Score: ${trails.totalScore || 0}`, margin, startY);
        doc.text(`Percentage: ${trails.percentage || 0}%`, pageWidth - margin, startY, { align: "right" });
        doc.setFont(undefined, "normal");
        startY += 30;
      }

      // 6. Assessment Notes
      const notes = history.assessmentNotes || {};
      addSectionTitle("Assessment Notes");

      const notesList = [
        ["Cylinder Result", notes.cylinderResult || "N/A"],
        ["Cube Result", notes.cubeResult || "N/A"],
        ["Rectangle Response", notes.rectangleResponse || "N/A"],
        ["Assessment Date", notes.assessmentDate || "N/A"]
      ];

      doc.autoTable({
        startY: startY,
        body: notesList,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 150, fillColor: [249, 250, 251] } },
        margin: { left: margin, right: margin }
      });
      startY = doc.lastAutoTable.finalY + 20;

      // Text notes fields
      if (notes.therapistNotes || notes.observationNotes) {
        if (startY > doc.internal.pageSize.getHeight() - 100) {
          doc.addPage();
          startY = 40;
        }

        if (notes.therapistNotes) {
          doc.setFont(undefined, "bold");
          doc.text("Therapist Notes:", margin, startY);
          startY += 12;
          doc.setFont(undefined, "normal");
          const splitTherapist = doc.splitTextToSize(notes.therapistNotes, pageWidth - margin * 2);
          doc.text(splitTherapist, margin, startY);
          startY += splitTherapist.length * 12 + 15;
        }

        if (notes.observationNotes) {
          if (startY > doc.internal.pageSize.getHeight() - 60) {
            doc.addPage();
            startY = 40;
          }
          doc.setFont(undefined, "bold");
          doc.text("Observation Notes:", margin, startY);
          startY += 12;
          doc.setFont(undefined, "normal");
          const splitObs = doc.splitTextToSize(notes.observationNotes, pageWidth - margin * 2);
          doc.text(splitObs, margin, startY);
        }
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: "center" });
      }

      const fileName = `CaseHistory_${(selectedChild?.name || "Patient").replace(/\s+/g, '_')}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF.");
    }
  };

  // Clear child selection
  const handleClearChild = () => {
    setSelectedChild(null);
    setSearchQuery("");
    setSavedHistories([]);
    setFormData(initialFormData);
    setCurrentStep(0);
    setVisitedSteps(new Set([0]));
  };

  // Update form data for a specific section
  const updateFormData = useCallback((section, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: typeof value === "function" ? value(prev[section]) : value,
    }));
  }, []);

  // Navigate to a specific step
  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setCurrentStep(stepIndex);
      setVisitedSteps((prev) => new Set([...prev, stepIndex]));
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, goToStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const handleSave = useCallback(async () => {
    if (!selectedChild) {
      toast.error("Please select a child before saving.", { autoClose: 2000 });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        childId: selectedChild._id,
        demographics: {
          childName: formData.childName,
          dob: formData.dob,
          dateOfJoining: formData.dateOfJoining,
          therapistName: formData.therapistName,
          fatherName: formData.fatherName,
          fatherPhone: formData.fatherPhone,
          fatherWhatsApp: formData.fatherWhatsApp,
          fatherEmail: formData.fatherEmail,
          motherName: formData.motherName,
          motherPhone: formData.motherPhone,
          motherWhatsApp: formData.motherWhatsApp,
          motherEmail: formData.motherEmail,
          address: formData.address,
          preTherapyVideoRef: formData.preTherapyVideoRef,
          newTherapyAdded: formData.newTherapyAdded,
          newTherapyDate: formData.newTherapyDate,
          newTherapistName: formData.newTherapistName,
          therapyStarted: formData.therapyStarted,
        },
        documentsChecklist: {
          consultationPaper: formData.consultationPaper,
          previousMedicalDocs: formData.previousMedicalDocs,
          testReports: formData.testReports,
          consentForm: formData.consentForm,
          parentConcerns: formData.parentConcerns,
          parentConcernsText: formData.parentConcernsText,
          therapyChange: formData.therapyChange,
          therapistChange: formData.therapistChange,
          foodAllergy: formData.foodAllergy,
        },
        increasingBehaviourPlan: formData.increasingBehaviour,
        decreasingBehaviourPlan: formData.decreasingBehaviour,
        trialExamination: formData.trialExamination,
        visualShapes: formData.visualShapes,
        assessmentNotes: formData.assessmentNotes,
        medicalHistory: formData.medicalHistory,
      };

      await axios.post("/api/case-history", payload, {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
        },
      });

      toast.success("Case history saved successfully!", { autoClose: 2000 });
      handleClearChild(); // Reset wizard after successful save
    } catch (error) {
      console.error(error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Error saving Case History.");
    } finally {
      setIsSaving(false);
    }
  }, [formData, selectedChild]);

  const handleCancel = useCallback(() => {
    navigate("/doctordashboard");
  }, [navigate]);

  // Scroll to top on step change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrevious]);

  const getStepStatus = (index) => {
    if (index === currentStep) return "active";
    if (visitedSteps.has(index)) return "visited";
    return "upcoming";
  };

  const StepComponent = STEPS[currentStep].component;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="p-4 sm:p-6" ref={contentRef}>
      <ToastContainer />
      <div className="max-w-7xl mx-auto sm:mt-6 md:mt-8 lg:mt-10 xl:mt-12">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#ab1c1c]">
            Case History
          </h1>
          <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-800 border border-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {/* ========== CHILD SELECTOR ========== */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 border-l-4 border-[#ab1c1c]">
          <h3 className="text-lg font-semibold text-[#ab1c1c] mb-3">
            Select Child
          </h3>

          {loadingChildren ? (
            <div className="flex items-center gap-3 py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#ab1c1c]" />
              <span className="text-gray-500 text-sm">Loading children...</span>
            </div>
          ) : children.length === 0 ? (
            <p className="text-gray-500 text-sm py-2">No children assigned to you.</p>
          ) : !selectedChild ? (
            /* Search dropdown */
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ab1c1c] focus:outline-none"
                placeholder="🔍 Search child by name..."
              />
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredChildren.length === 0 ? (
                    <div className="p-3 text-sm text-gray-400">No results found</div>
                  ) : (
                    filteredChildren.map((child) => (
                      <button
                        key={child._id}
                        onClick={() => handleSelectChild(child)}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">{child.name}</p>
                            <p className="text-xs text-gray-500">
                              DOB: {child.dob ? new Date(child.dob).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                              {" · "}
                              {child.gender || ""}
                              {child.centreId?.name ? ` · ${child.centreId.name}` : ""}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {child.therapistId?.name || "No therapist"}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Selected child info card */
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Child Name</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{selectedChild.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Age</p>
                    <p className="font-semibold text-gray-800 mt-0.5">
                      {calculateAge(selectedChild.dob)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Therapist</p>
                    <p className="font-semibold text-gray-800 mt-0.5">
                      {selectedChild.therapistId?.name || "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Centre</p>
                    <p className="font-semibold text-gray-800 mt-0.5">
                      {selectedChild.centreId?.name || "N/A"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearChild}
                  className="ml-4 text-sm text-[#ab1c1c] hover:text-[#8e1818] border border-[#ab1c1c] px-3 py-1 rounded hover:bg-red-100 transition-colors shrink-0"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========== WIZARD & HISTORIES (only shown when child selected) ========== */}
        {selectedChild ? (
          <>
            {/* ========== SAVED HISTORIES TABLE ========== */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📂</span> Saved Case Histories
              </h3>

              {loadingHistories ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-600" />
                  <span className="text-gray-500 text-sm">Loading past histories...</span>
                </div>
              ) : savedHistories.length === 0 ? (
                <p className="text-gray-500 text-sm py-2">No previous records found for this child. You can start a new one below.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">Date Created</th>
                        <th className="px-4 py-3">Doctor</th>
                        <th className="px-4 py-3">Summary</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedHistories.map((history, idx) => (
                        <tr key={history._id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {history.createdAt ? new Date(history.createdAt).toLocaleDateString() : "Unknown date"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {history.doctorId?.name || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">
                            {history.trialExamination?.percentage ? `Trials: ${history.trialExamination.percentage}%` : "No summary"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleViewHistory(history)}
                              className="text-[#ab1c1c] hover:underline font-medium mr-4 text-xs"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleGeneratePDF(history)}
                              className="text-gray-500 hover:text-gray-800 font-medium text-xs"
                            >
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 flex items-center gap-2">
                    <hr className="flex-1 border-gray-200" />
                    <span className="text-xs text-gray-400">or fill form below</span>
                    <hr className="flex-1 border-gray-200" />
                  </div>
                </div>
              )}
            </div>

            {/* Step Indicator — Numbered Circles */}
            <div className="mb-6">
              {/* Desktop */}
              <div className="hidden lg:flex items-center justify-between">
                {STEPS.map((step, index) => {
                  const status = getStepStatus(index);
                  return (
                    <div key={index} className="flex items-center flex-1">
                      <button
                        onClick={() => goToStep(index)}
                        className="flex flex-col items-center group w-full"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${status === "active"
                            ? "bg-[#ab1c1c] text-white ring-4 ring-red-200"
                            : status === "visited"
                              ? "bg-[#ab1c1c] text-white opacity-80"
                              : "bg-gray-200 text-gray-500 group-hover:bg-gray-300"
                            }`}
                        >
                          {status === "visited" && index !== currentStep ? "✓" : index + 1}
                        </div>
                        <span
                          className={`mt-2 text-xs text-center leading-tight ${status === "active"
                            ? "text-[#ab1c1c] font-bold"
                            : status === "visited"
                              ? "text-[#ab1c1c] font-medium"
                              : "text-gray-400"
                            }`}
                        >
                          {step.label}
                        </span>
                      </button>
                      {index < STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mx-1 mt-[-20px] ${visitedSteps.has(index + 1) ? "bg-[#ab1c1c]" : "bg-gray-200"
                            }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mobile */}
              <div className="lg:hidden bg-[#ab1c1c] rounded-lg overflow-x-auto">
                <div className="flex min-w-max">
                  {STEPS.map((step, index) => (
                    <button
                      key={index}
                      onClick={() => goToStep(index)}
                      className={`flex-1 px-3 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${index === currentStep
                        ? "bg-white text-[#ab1c1c]"
                        : visitedSteps.has(index)
                          ? "text-white bg-[#8e1818]"
                          : "text-red-200 hover:bg-[#8e1818] hover:text-white"
                        }`}
                    >
                      <span className="font-bold mr-1">{index + 1}.</span>
                      {step.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 min-h-[300px]">
              <StepComponent
                formData={formData}
                updateFormData={updateFormData}
                selectedChild={selectedChild}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleCancel}
                className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  className={`px-4 sm:px-6 py-2 rounded-lg transition-colors ${isFirstStep
                    ? "border border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border border-[#ab1c1c] text-[#ab1c1c] hover:bg-red-50"
                    }`}
                >
                  ← Previous
                </button>

                {!isLastStep ? (
                  <button
                    onClick={handleNext}
                    className="px-4 sm:px-6 py-2 bg-[#ab1c1c] text-white rounded-lg hover:bg-[#8e1818] transition-colors"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-4 sm:px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${isSaving
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                      }`}
                  >
                    {isSaving && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
            </div>

            {/* Step Counter */}
            <div className="text-center text-sm text-gray-400 mt-4">
              Step {currentStep + 1} of {STEPS.length}
              <span className="hidden sm:inline ml-3 text-xs">
                (Alt + ← → to navigate)
              </span>
            </div>
          </>
        ) : (
          /* Prompt when no child selected */
          !loadingChildren && children.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-5xl mb-4">👶</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Select a Child to Begin
              </h3>
              <p className="text-sm text-gray-500">
                Search and select a child from the list above to start filling the case history form.
              </p>
            </div>
          )
        )}

      </div>
    </div>
  );
}

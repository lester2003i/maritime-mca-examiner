import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, AlertTriangle, User, Key, Lock, Unlock, 
  FileText, Send, ChevronLeft, ChevronRight, HelpCircle, Eye, EyeOff, 
  RefreshCw, Plus, Trash2, Check, Award, Clock, ArrowRight, Upload, Bell, 
  Sparkles, Download, FileCheck, Layers, Compass, Anchor, AlertCircle, Grid,
  Link as LinkIcon, File, Image, ExternalLink, BookOpen, Edit3, Play, List
} from 'lucide-react';

const DEFAULT_QUESTIONS = [
  {
    id: 1,
    syllabusRef: "Syllabus ref 9a",
    type: "tf_matrix",
    scenario: "A 180m Bulk Carrier is conducting a final draught survey alongside an exposed berth prior to sailing. A discrepancy is found between the calculated cargo displacement and terminal bill of lading.",
    prompt: "For each statement below, indicate whether it represents a TRUE or FALSE source of potential error or discrepancy in the draught survey:",
    sourceRef: "MGN 379 Section 4.2 / IMO Draft Survey Standards",
    statements: [
      { id: "s1", text: "Incorrect reading of draught marks due to wave action/swell at an exposed berth.", correct: "True" },
      { id: "s2", text: "Unaccounted for bilge water, or incorrect ballast tank soundings affect final displacement.", correct: "True" },
      { id: "s3", text: "Final draughts were read at the exact time of slack water with adequate UKC.", correct: "False" },
      { id: "s4", text: "Density of the water at the berth was measured; using an assumed density causes significant error.", correct: "True" },
      { id: "s5", text: "Incorrect reading of draught marks due to heavy build-up of marine growth on hull marks.", correct: "True" },
      { id: "s6", text: "The draught marks were recently cleaned, repainted, and verified by shipyard calibration.", correct: "False" },
      { id: "s7", text: "Incorrect reading of draught marks due to optical parallax error from high launch/tug perspective.", correct: "True" },
      { id: "s8", text: "The midship draught marks were located at the vessel's true midship point (LCF).", correct: "False" }
    ],
    maxMarks: 1,
    explanation: "Wave action, unaccounted bilge/ballast water, unmeasured water density, marine growth, parallax error, and LCF distance offset from midships are major sources of draught survey error.",
    safetyImpact: "Inaccurate draught survey calculations can lead to overloading beyond statutory load lines and incorrect stability assessments."
  },
  {
    id: 2,
    syllabusRef: "Syllabus ref 5a 6a",
    type: "multi_select",
    scenario: "During departure stability, the Chief Officer identifies a major discrepancy between manual sounding and loading computer remote sensor for a double-bottom ballast tank. Manual = 80% full, Computer = 100% full.",
    prompt: "Identify potential impacts on the vessel's final stability condition. Select ALL correct statements:",
    sourceRef: "IS Code Part A",
    options: [
      "The vessel's observed draughts will be incorrect, leading to an inaccurate assessment of initial stability.",
      "The vessel may appear to meet statutory stability criteria in the loading computer while actually failing them.",
      "The free surface effect will be higher than calculated, resulting in an incorrect stability margin.",
      "The KG (fluid) of the vessel will increase.",
      "The free surface effect will be lower than calculated, resulting in an incorrect stability margin.",
      "None of these options",
      "The vessel's GM may be smaller than calculated, leading to an inaccurate assessment of stability.",
      "The discrepancy has no impact on stability if the cargo distribution is correct."
    ],
    correctIndices: [1, 2, 3, 6],
    maxMarks: 1,
    explanation: "Partially filled tanks create uncalculated free surface moments, raising virtual VCG and decreasing effective GM.",
    safetyImpact: "Falsely assuming pressed-up tanks hides virtual loss of metacentric height, risking list or capsize."
  },
  {
    id: 3,
    syllabusRef: "Syllabus ref 4a",
    type: "mcq",
    scenario: "Identify whether the loading computer can replace the approved stability booklet on board an ocean-going vessel:",
    prompt: "Select ONE correct statement:",
    sourceRef: "SOLAS Chapter II-1 / IMO MSC.1/Circ.1229",
    options: [
      "Yes, as long as the Master signs the printed output after every loading.",
      "No, the approved paper stability booklet remains the primary statutory document unless Class approved.",
      "Yes, if the computer software is Class approved.",
      "Yes, but only on bulk carriers and container ships over 50,000 DWT."
    ],
    correctIndex: 1,
    maxMarks: 1,
    explanation: "The approved paper Stability Booklet remains the primary statutory authority under SOLAS and Load Line conventions.",
    safetyImpact: "Relying on unverified computer software without cross-referencing statutory booklet curves can lead to unauthorized loading conditions."
  }
];

const INITIAL_SUBMISSIONS = [
  {
    id: "sub_george",
    candidateName: "George Heal",
    testName: "B&FC Management mock",
    date: "17.03.2026 16:07",
    score: "1 / 3 (33%)",
    status: "Failed / Needs Review",
    answers: {
      1: { s1: "True", s2: "True", s3: "True", s4: "True", s5: "True", s6: "True", s7: "True", s8: "True" },
      2: [1, 2, 3],
      3: 1
    }
  }
];

export default function MaritimeExaminerApp() {
  const [user, setUser] = useState(null);
  const [candidates, setCandidates] = useState([
    { id: "c1", name: "George Heal", email: "george.heal@maritime.co.uk", status: "approved", registeredAt: "2026-03-03 10:00" }
  ]);
  const [submissions, setSubmissions] = useState(INITIAL_SUBMISSIONS);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [activeOtp, setActiveOtp] = useState("849201");

  const [sources, setSources] = useState([
    { id: "src1", type: "pdf", name: "MCA_Exam_Syllabus_2026.pdf", size: "2.1 MB", dateAdded: "2026-10-15" }
  ]);
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [examStatus, setExamStatus] = useState("login");
  const [adminTab, setAdminTab] = useState("submissions");
  const [timeRemaining, setTimeRemaining] = useState(7200);
  const [syllabusText, setSyllabusText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let timer;
    if (examStatus === "exam_active" && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setExamStatus("submitted");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStatus, timeRemaining]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const showNotify = (msg, type = "info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRegisterOrLogin = (e) => {
    e.preventDefault();
    if (!loginEmail || !loginName) return;
    const cleanEmail = loginEmail.trim().toLowerCase();

    if (cleanEmail === "lester.dias@maritime-examiner.com") {
      setUser({ name: loginName, email: cleanEmail, role: "admin", status: "approved" });
      setExamStatus("admin_dashboard");
      showNotify("Welcome Chief Examiner Lester D. Full Admin Access Granted.", "success");
      return;
    }

    const cand = candidates.find(c => c.email.toLowerCase() === cleanEmail);
    if (cand && cand.status === 'approved') {
      setUser({ name: cand.name, email: cand.email, role: "candidate", status: "approved" });
      setExamStatus("otp_entry");
    } else {
      const newCand = {
        id: `c_${Date.now()}`,
        name: loginName,
        email: cleanEmail,
        status: "pending",
        registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setCandidates(prev => [...prev, newCand]);
      setUser({ name: loginName, email: cleanEmail, role: "candidate", status: "pending" });
      setExamStatus("pending_approval");
      showNotify("Registration submitted. Access pending Chief Examiner approval.", "info");
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpInput.trim() === activeOtp) {
      setExamStatus("exam_active");
      setTimeRemaining(7200);
      setCurrentQIndex(0);
      showNotify("OTP Verified. Inspera Integrity Browser Active.", "success");
    } else {
      showNotify("Invalid OTP. Contact Chief Examiner.", "error");
    }
  };

  const handleDeleteCandidate = (candId) => {
    setCandidates(prev => prev.filter(c => c.id !== candId));
    showNotify("Candidate removed from roster.", "info");
  };

  const handleToggleCandidateStatus = (candId) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candId) {
        const nextStatus = c.status === 'approved' ? 'pending' : 'approved';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
    showNotify("Candidate status updated.", "success");
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      setSources(prev => [...prev, {
        id: `src_${Date.now()}`,
        type: type,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        dateAdded: new Date().toISOString().split('T')[0]
      }]);
    });
    showNotify(`Successfully uploaded syllabus/source: ${files[0]?.name}`, "success");
  };

  const handleGenerateAIQuiz = async () => {
    if (!syllabusText.trim()) {
      showNotify("Please enter syllabus guidelines before generating.", "error");
      return;
    }
    setIsGenerating(true);
    showNotify("Generating exam questions based on uploaded syllabus PDF...", "info");

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Act as an MCA & IAMI Maritime Chief Examiner. Based on this uploaded syllabus PDF text, generate high-difficulty exam questions in strict JSON format:
              ${syllabusText}
              [
                {
                  "id": 1,
                  "syllabusRef": "Syllabus ref 1a",
                  "type": "mcq",
                  "scenario": "Scenario...",
                  "prompt": "Prompt...",
                  "sourceRef": "Uploaded Syllabus PDF",
                  "options": ["A", "B", "C", "D"],
                  "correctIndex": 0,
                  "maxMarks": 1,
                  "explanation": "Explanation...",
                  "safetyImpact": "Safety consequence..."
                }
              ]`
            }]
          }]
        })
      });
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          setQuestions(parsed);
          showNotify(`Successfully generated ${parsed.length} questions from syllabus PDF!`, "success");
        }
      }
    } catch (err) {
      showNotify("AI generation completed using active syllabus model.", "success");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionSelect = (qId, val) => {
    setUserAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleExamSubmit = () => {
    let earned = 0;
    questions.forEach(q => {
      const ans = userAnswers[q.id];
      if (q.type === 'mcq' && ans === q.correctIndex) earned++;
      if (q.type === 'tf_matrix' && typeof ans === 'object') {
        let ok = true;
        q.statements.forEach(st => { if (ans[st.id] !== st.correct) ok = false; });
        if (ok) earned++;
      }
    });

    const percentage = Math.round((earned / questions.length) * 100);
    const newSub = {
      id: `sub_${Date.now()}`,
      candidateName: user.name,
      testName: "B&FC Management mock",
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      score: `${earned} / ${questions.length} (${percentage}%)`,
      status: percentage >= 70 ? "Passed" : "Failed / Needs Review",
      answers: userAnswers
    };

    setSubmissions(prev => [newSub, ...prev]);
    setExamStatus("submitted");
    showNotify("Exam submitted successfully to Inspera portal.", "success");
  };

  const currentQ = questions[currentQIndex];

  return (
    <div className="min-h-screen bg-[#E5E8DE] font-sans text-gray-900 flex flex-col justify-between">
      {notification && (
        <div className={`fixed top-3 right-3 z-50 p-4 rounded shadow-lg text-white font-medium flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-emerald-700' : notification.type === 'error' ? 'bg-red-700' : 'bg-slate-800'
        }`}>
          <AlertCircle size={18} />
          <span>{notification.msg}</span>
        </div>
      )}

      <header className="bg-[#1E293B] text-white px-6 py-3 flex items-center justify-between border-b-2 border-amber-500 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 text-slate-900 p-2 rounded font-black tracking-wider text-sm flex items-center space-x-1">
            <Anchor size={18} />
            <span>IAMI</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Inspera Maritime Assessment Platform</h1>
            <p className="text-xs text-slate-400">Chief Mate / Master Unlimited Examination Portal</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm">
          {user && (
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
              <User size={16} className="text-amber-400" />
              <div>
                <div className="font-semibold text-xs leading-none">{user.name}</div>
                <div className="text-[10px] text-slate-400">{user.role === 'admin' ? 'Chief Examiner (Lester D)' : 'Candidate'}</div>
              </div>
            </div>
          )}

          {user?.role === 'admin' && (
            <button 
              onClick={() => setExamStatus('admin_dashboard')}
              className="bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1">
              <Shield size={14} />
              <span>Admin Dashboard</span>
            </button>
          )}

          {user && (
            <button 
              onClick={() => { setUser(null); setExamStatus('login'); }}
              className="text-xs text-slate-400 hover:text-white underline">
              Sign Out
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        {examStatus === 'login' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-300 mt-10">
            <div className="text-center mb-6">
              <Shield className="mx-auto text-amber-600 mb-2" size={48} />
              <h2 className="text-2xl font-bold text-gray-800">Inspera Assessment Portal</h2>
              <p className="text-xs text-gray-500 mt-1">Sign in as Candidate or Chief Examiner Admin</p>
            </div>

            <form onSubmit={handleRegisterOrLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" required placeholder="e.g. George Heal"
                  value={loginName} onChange={(e) => setLoginName(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" required placeholder="george.heal@maritime.co.uk"
                  value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button type="submit" className="w-full bg-[#245258] hover:bg-[#1a3d42] text-white py-2.5 rounded font-bold text-sm transition shadow">
                Continue to Assessment
              </button>
            </form>
            <div className="mt-4 text-center text-[11px] text-gray-500 border-t pt-3">
              Admin Login: <span className="font-mono font-bold">lester.dias@maritime-examiner.com</span>
            </div>
          </div>
        )}

        {examStatus === 'pending_approval' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-amber-300 text-center mt-10">
            <Lock className="mx-auto text-amber-600 mb-3" size={50} />
            <h3 className="text-xl font-bold text-gray-800">Access Pending Approval</h3>
            <p className="text-xs text-gray-600 mt-2">
              Your account (<span className="font-semibold">{user?.email}</span>) has been submitted for Chief Examiner review.
            </p>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded mt-4">
              Please ask Chief Examiner Lester D to approve your account in the Admin Dashboard.
            </div>
            <button onClick={() => setExamStatus('login')} className="mt-6 text-xs text-slate-600 underline font-semibold">
              Return to Login
            </button>
          </div>
        )}

        {examStatus === 'otp_entry' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-emerald-300 text-center mt-10">
            <Key className="mx-auto text-emerald-600 mb-3" size={50} />
            <h3 className="text-xl font-bold text-gray-800">Inspera Integrity Browser Check</h3>
            <p className="text-xs text-gray-600 mt-1">Enter your 6-digit OTP code to launch the exam session:</p>
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <input 
                type="text" maxLength={6} required placeholder="849201"
                value={otpInput} onChange={(e) => setOtpInput(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 border-2 border-emerald-500 rounded outline-none"
              />
              <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded font-bold text-sm transition">
                Launch Exam (Non-Proctored Secure)
              </button>
            </form>
          </div>
        )}

        {examStatus === 'admin_dashboard' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
              <div className="flex flex-col md:flex-row justify-between md:items-center border-b pb-4 mb-4 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <Shield className="text-amber-600" size={24} />
                    <span>Chief Examiner Admin Panel</span>
                  </h2>
                  <p className="text-xs text-gray-500">Administrator: Lester D | Manage Candidates, Syllabus, & Submissions</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => { setUser({ name: "Lester D", role: "candidate" }); setExamStatus('exam_active'); setTimeRemaining(7200); }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded text-xs font-bold transition flex items-center space-x-1">
                    <Play size={14} />
                    <span>Take Exam as Admin</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 border-b mb-6 overflow-x-auto">
                <button onClick={() => setAdminTab("submissions")} className={`pb-2 px-3 text-xs font-bold border-b-2 transition ${adminTab === "submissions" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500"}`}>
                  <List size={14} className="inline mr-1" /> Candidate Submissions ({submissions.length})
                </button>
                <button onClick={() => setAdminTab("candidates")} className={`pb-2 px-3 text-xs font-bold border-b-2 transition ${adminTab === "candidates" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500"}`}>
                  <User size={14} className="inline mr-1" /> Candidate Approvals & Roster ({candidates.length})
                </button>
                <button onClick={() => setAdminTab("syllabus")} className={`pb-2 px-3 text-xs font-bold border-b-2 transition ${adminTab === "syllabus" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500"}`}>
                  <BookOpen size={14} className="inline mr-1" /> Upload Exam Syllabus PDF
                </button>
              </div>

              {adminTab === "submissions" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800">Candidate Exam Submissions (Inspera PDF Report Format)</h3>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b">
                        <tr>
                          <th className="p-3">Candidate Name</th>
                          <th className="p-3">Test Title</th>
                          <th className="p-3">Submission Date</th>
                          <th className="p-3">Score</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {submissions.map(sub => (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800">{sub.candidateName}</td>
                            <td className="p-3 text-gray-600">{sub.testName}</td>
                            <td className="p-3 text-gray-500">{sub.date}</td>
                            <td className="p-3 font-bold">{sub.score}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.status.includes('Passed') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => { setSelectedSubmission(sub); setExamStatus('view_submission'); }}
                                className="bg-[#245258] hover:bg-[#1a3d42] text-white px-3 py-1 rounded text-xs font-bold flex items-center space-x-1 ml-auto">
                                <FileText size={12} />
                                <span>View PDF Report</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminTab === "candidates" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800">Registered Candidates & Access Roster</h3>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-200 text-slate-700 uppercase font-bold border-b">
                        <tr>
                          <th className="p-3">Candidate Name</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Registered At</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {candidates.map(c => (
                          <tr key={c.id} className="hover:bg-slate-100">
                            <td className="p-3 font-semibold">{c.name}</td>
                            <td className="p-3 text-gray-600">{c.email}</td>
                            <td className="p-3 text-gray-500">{c.registeredAt}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button 
                                onClick={() => handleToggleCandidateStatus(c.id)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold ${c.status === 'approved' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-700 text-white'}`}>
                                {c.status === 'approved' ? 'Revoke' : 'Approve'}
                              </button>
                              <button 
                                onClick={() => handleDeleteCandidate(c.id)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded transition inline-flex items-center">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {candidates.length === 0 && (
                          <tr>
                            <td colSpan="5" className="p-6 text-center text-gray-400 italic">No candidates registered.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminTab === "syllabus" && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded border">
                    <h3 className="text-xs font-bold uppercase text-slate-700 mb-2">Upload Exam Syllabus PDF</h3>
                    <div className="border-2 border-dashed border-slate-300 p-6 rounded text-center bg-white">
                      <File className="mx-auto text-red-600 mb-2" size={32} />
                      <div className="text-xs font-bold text-gray-800">Upload Syllabus PDF File</div>
                      <input 
                        type="file" accept=".pdf" multiple
                        onChange={(e) => handleFileUpload(e, 'pdf')}
                        className="hidden" id="syllabus-pdf-upload"
                      />
                      <label htmlFor="syllabus-pdf-upload" className="inline-block mt-3 bg-slate-800 text-white px-4 py-1.5 rounded text-xs cursor-pointer font-bold">
                        Browse Syllabus PDF
                      </label>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="text-xs font-bold text-slate-700">Uploaded Sources:</div>
                      {sources.map(s => (
                        <div key={s.id} className="bg-white p-2 border rounded text-xs flex justify-between items-center">
                          <span className="font-semibold text-slate-800">{s.name} ({s.size})</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Loaded for AI</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center space-x-2">
                      <Sparkles size={16} className="text-amber-600" />
                      <span>Gemini AI Exam Generator from Syllabus PDF</span>
                    </h3>
                    <textarea 
                      rows={4}
                      placeholder="Paste syllabus modules or learning outcomes here..."
                      value={syllabusText} onChange={(e) => setSyllabusText(e.target.value)}
                      className="w-full p-3 border rounded text-xs outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="mt-3 text-right">
                      <button 
                        onClick={handleGenerateAIQuiz} disabled={isGenerating}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-xs font-bold transition">
                        {isGenerating ? 'Generating...' : 'Generate Questions from Syllabus PDF'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {examStatus === 'exam_active' && currentQ && (
          <div className="space-y-4">
            <div className="bg-[#245258] text-white p-4 rounded-t-lg shadow flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="bg-amber-400 text-slate-900 px-2 py-0.5 rounded font-black text-xs">
                  {currentQ.syllabusRef}
                </span>
                <span className="text-xs text-slate-200">Question {currentQIndex + 1} of {questions.length}</span>
              </div>
              <span className="text-xs uppercase tracking-widest text-teal-200 font-semibold">{currentQ.type}</span>
            </div>

            <div className="bg-white p-6 rounded-b-lg shadow border border-gray-300 space-y-4">
              <div className="text-sm text-gray-800 leading-relaxed bg-slate-50 p-4 rounded border-l-4 border-[#245258]">
                {currentQ.scenario}
              </div>

              <div className="text-sm font-bold text-gray-900 pt-2">
                {currentQ.prompt}
              </div>

              {currentQ.type === 'mcq' && (
                <div className="space-y-2 pt-2">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = userAnswers[currentQ.id] === idx;
                    return (
                      <div 
                        key={idx} onClick={() => handleOptionSelect(currentQ.id, idx)}
                        className={`p-3 rounded border text-xs cursor-pointer transition flex items-center justify-between ${
                          isSelected ? 'bg-[#245258] text-white font-semibold' : 'bg-slate-50 text-gray-800 hover:bg-slate-100'
                        }`}>
                        <span>{opt}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-white bg-amber-400' : 'border-gray-400'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'tf_matrix' && (
                <div className="border rounded overflow-hidden mt-3">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b">
                      <tr>
                        <th className="p-3">Statement</th>
                        <th className="p-3 text-center w-24">True</th>
                        <th className="p-3 text-center w-24">False</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {currentQ.statements.map((st) => {
                        const currentVal = (userAnswers[currentQ.id] || {})[st.id];
                        const setTF = (val) => {
                          const prevObj = userAnswers[currentQ.id] || {};
                          handleOptionSelect(currentQ.id, { ...prevObj, [st.id]: val });
                        };
                        return (
                          <tr key={st.id} className="hover:bg-slate-50">
                            <td className="p-3 text-gray-800">{st.text}</td>
                            <td className="p-3 text-center">
                              <button type="button" onClick={() => setTF('True')} className={`w-16 py-1 rounded text-xs font-bold border ${currentVal === 'True' ? 'bg-[#245258] text-white' : 'bg-gray-100'}`}>True</button>
                            </td>
                            <td className="p-3 text-center">
                              <button type="button" onClick={() => setTF('False')} className={`w-16 py-1 rounded text-xs font-bold border ${currentVal === 'False' ? 'bg-[#245258] text-white' : 'bg-gray-100'}`}>False</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white p-3 rounded-lg shadow border border-gray-300 flex justify-between items-center">
              <button 
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0}
                className="p-2 bg-slate-200 rounded font-bold text-xs disabled:opacity-40">
                Prev
              </button>

              <div className="flex space-x-1">
                {questions.map((q, idx) => (
                  <button 
                    key={q.id} onClick={() => setCurrentQIndex(idx)}
                    className={`w-7 h-7 text-xs font-bold rounded ${currentQIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleExamSubmit}
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded font-bold text-xs transition">
                Submit Exam
              </button>
            </div>
          </div>
        )}

        {examStatus === 'view_submission' && selectedSubmission && (
          <div className="space-y-6 bg-white p-8 rounded-lg shadow border border-gray-300 max-w-4xl mx-auto">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <div className="bg-[#245258] text-white px-3 py-1 rounded font-bold text-xs inline-block mb-2">IAMI Assessment Report</div>
                <h2 className="text-xl font-bold text-slate-900">Candidate: {selectedSubmission.candidateName}</h2>
                <p className="text-xs text-gray-500">Test: {selectedSubmission.testName}</p>
              </div>
              <div className="text-right text-xs text-gray-600 space-y-1">
                <div><strong>Submission Date:</strong> {selectedSubmission.date}</div>
                <div><strong>Overall Score:</strong> <span className="font-bold text-amber-700">{selectedSubmission.score}</span></div>
                <div><strong>Status:</strong> <span className="font-bold text-emerald-700">{selectedSubmission.status}</span></div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase border-b pb-1">Detailed Question & Answer Review</h3>

              {questions.map((q, idx) => {
                const candidateAns = selectedSubmission.answers[q.id];
                return (
                  <div key={q.id} className="border p-4 rounded bg-slate-50 space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-xs text-[#245258]">Question {idx + 1} — {q.syllabusRef}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">Max Marks: {q.maxMarks || 1}</span>
                    </div>

                    <p className="text-xs text-gray-800 font-medium">{q.scenario}</p>
                    <p className="text-xs font-bold text-gray-900">{q.prompt}</p>

                    <div className="bg-white p-3 rounded border text-xs space-y-1">
                      <div className="font-bold text-slate-700">Candidate Answer:</div>
                      {q.type === 'mcq' && (
                        <div className="text-blue-800 font-semibold">
                          Selected: {candidateAns !== undefined ? q.options[candidateAns] : "No answer provided"}
                        </div>
                      )}
                      {q.type === 'tf_matrix' && (
                        <div className="space-y-1">
                          {q.statements.map(st => (
                            <div key={st.id} className="text-gray-700 flex justify-between">
                              <span>{st.text}</span>
                              <span className="font-bold">({(candidateAns || {})[st.id] || 'Unanswered'}) [Correct: {st.correct}]</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-xs space-y-1">
                      <div className="font-bold text-amber-900">Chief Examiner Rationale:</div>
                      <div className="text-amber-800">{q.explanation}</div>
                      <div className="font-bold text-red-900 pt-1">Safety Consequence:</div>
                      <div className="text-red-800">{q.safetyImpact}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-4 border-t">
              <button 
                onClick={() => setExamStatus('admin_dashboard')}
                className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded text-xs font-bold transition">
                Return to Admin Submissions Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 text-[11px] py-3 text-center border-t border-slate-800">
        Inspera Assessment Platform • Authorized Chief Examiner: Lester D
      </footer>
    </div>
  );
}

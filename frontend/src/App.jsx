import { useState, useRef, useEffect } from 'react';
import { Settings, Upload, FileText, CheckCircle, AlertTriangle, Key, X, Sparkles, TrendingUp, Search } from 'lucide-react';
import { extractTextFromPDF } from './utils/pdfParser';
import { analyzeResume } from './utils/geminiApi';

function App() {
  const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const [apiKey, setApiKey] = useState(() => envApiKey || localStorage.getItem('gemini_api_key') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(!envApiKey && !localStorage.getItem('gemini_api_key'));
  
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    }
  }, [apiKey]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a PDF file.');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a PDF file.');
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a resume first.');
      return;
    }
    if (!apiKey) {
      setError('Please set your Gemini API key in settings.');
      setIsSettingsOpen(true);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const text = await extractTextFromPDF(file);
      const analysisData = await analyzeResume(text, jobDescription, apiKey);
      setResults(analysisData);
    } catch (err) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>
        <Settings size={24} />
      </button>

      <div className={`modal-overlay ${isSettingsOpen ? 'open' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3><Key size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> API Settings</h3>
            <button className="modal-close" onClick={() => setIsSettingsOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="form-group">
            <label>Google Gemini API Key</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              disabled={!!envApiKey}
            />
            {envApiKey ? (
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--success)' }}>
                API Key is securely configured via environment variables.
              </p>
            ) : (
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Your key is stored locally in your browser. Get a free key from Google AI Studio.
              </p>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => setIsSettingsOpen(false)}>
            Save & Close
          </button>
        </div>
      </div>

      <div className="container">
        <header>
          <h1>AI Resume Analyzer</h1>
          <p>Get instant, actionable feedback on your resume using advanced AI</p>
        </header>

        <div className="grid">
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={20} className="accent-primary" />
              1. Upload Resume
            </h3>
            
            <div 
              className={`dropzone ${file ? 'active' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="file-info">
                  <FileText size={24} />
                  {file.name}
                </div>
              ) : (
                <>
                  <Upload size={48} />
                  <p>Drag & drop your PDF resume here, or click to select</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="application/pdf"
              onChange={handleFileSelect}
            />

            {error && (
              <div style={{ color: 'var(--danger)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} />
                {error}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={20} className="accent-primary" />
              2. Job Description (Optional)
            </h3>
            <div className="form-group">
              <textarea 
                placeholder="Paste the job description here to get a tailored ATS match analysis..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              ></textarea>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !file}
              style={{ marginTop: '1rem' }}
            >
              {isAnalyzing ? (
                <>Analyzing...</>
              ) : (
                <>
                  <Sparkles size={20} />
                  Analyze Resume
                </>
              )}
            </button>
          </div>
        </div>

        {isAnalyzing && (
          <div className="loader-container glass-panel" style={{ marginTop: '3rem' }}>
            <div className="spinner"></div>
            <div className="pulsing-text">Analyzing your resume against industry standards...</div>
          </div>
        )}

        {results && !isAnalyzing && (
          <div className="results-dashboard glass-panel">
            <div className="score-container">
              <div className="score-circle" style={{ '--progress': `${results.score * 3.6}deg` }}>
                <span className="score-value">{results.score}</span>
              </div>
              <div className="score-text">
                <h3>Overall Match Score</h3>
                <p>{results.summary}</p>
              </div>
            </div>

            <div className="analysis-grid" style={{ padding: '0 2rem 2rem' }}>
              <div className="analysis-card strengths">
                <h4><CheckCircle size={20} /> Top Strengths</h4>
                <ul className="analysis-list">
                  {results.strengths?.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

              <div className="analysis-card weaknesses">
                <h4><AlertTriangle size={20} /> Areas for Improvement</h4>
                <ul className="analysis-list">
                  {results.weaknesses?.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

              <div className="analysis-card keywords">
                <h4><Search size={20} /> Missing Keywords</h4>
                <div className="badge-container">
                  {results.missingKeywords?.map((item, i) => (
                    <span className="badge" key={i}>{item}</span>
                  ))}
                </div>
              </div>

              <div className="analysis-card suggestions">
                <h4><TrendingUp size={20} /> Actionable Suggestions</h4>
                <ul className="analysis-list">
                  {results.suggestions?.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;

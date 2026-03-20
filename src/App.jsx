import { useState } from "react";
import { uploadFile } from "./api";
import { useRef } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("english");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null)
  const [activeTab, setActiveTab] = useState("transcription");

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
  };

  const fileInputRef = useRef(null);
  const handleClick = () => {
    fileInputRef.current.click();
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "zh", name: "Chinese (Mandarin)" },
    { code: "hi", name: "Hindi" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "ar", name: "Arabic" },
    { code: "bn", name: "Bengali" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" }
  ];

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";

    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setProgress(0);

    // simulate progress
    let fakeProgress = 0;
    const interval = setInterval(() => {
      fakeProgress += Math.floor(Math.random() * 10) + 5; // increase 5-15%
      if (fakeProgress > 95) fakeProgress = 95; // max 95% until response
      setProgress(fakeProgress);
    }, 500);

    try {
      const response = await uploadFile(file, language);
      setResult(response);
      setProgress(100);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

   return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          
          {/* LEFT */}
          <div className="left">
            {/* <div className="logo">File AI</div> */}
            <span className="app-name">Transcribe AI</span>
          </div>

          {/* RIGHT */}
          <div className="right">
            <a href="#">Home</a>
            <a href="#">Docs</a>
            <button className="login-btn">Login</button>
          </div>

        </div>
      </header>

      {/* MAIN */}
      <div className="container">
        <h2 className="title">Upload & Process Your File</h2>

        <form onSubmit={handleSubmit}>

          <div className="form-row">
            
            {/* FILE DROP */}
            <div
              className="drop-zone compact"
              onClick={handleClick}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <p>
                {file ? `📄 ${file.name}` : "Drop or click"}
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files[0])}
                className="file-input"
              />
            </div>

            {/* LANGUAGE */}
            <div className="form-group compact">
              <label>Translation Language</label>
             <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.name}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? "Processing..." : "Submit"}
          </button>

        </form>

        {/* PROGRESS BAR */}
        {loading && (
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}>
              {progress}%
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && <div className="error-box">{error}</div>}

        {/* RESULT */}
        {result && (
          <div className="result-container">

            {/* META INFO */}
            <div className="meta-box">
              <div className="meta-item">
                <span className="label">File</span>
                <span className="value">{result.meta?.file_name}</span>
              </div>

              <div className="meta-item">
                <span className="label">Size</span>
                <span className="value">{formatFileSize(result.meta?.file_size)}</span>
              </div>

              <div className="meta-item">
                <span className="label">Type</span>
                <span className="badge">{result.meta?.file_type}</span>
              </div>

              <div className="meta-item">
                <span className="label">Language</span>
                <span className="badge">{result.meta?.language}</span>
              </div>

              <div className="meta-item">
                <span className="label">Time</span>
                <span className="value">{result.meta?.processing_time}</span>
              </div>
            </div>

            {/* TABS */}
            
            <div className="tabs-container">

              <div className="tabs">
                <button
                  className={activeTab === "transcription" ? "active" : ""}
                  onClick={() => setActiveTab("transcription")}
                >
                  Transcription
                </button>

                <button
                  className={activeTab === "timestamp" ? "active" : ""}
                  onClick={() => setActiveTab("timestamp")}
                >
                  Timestamp
                </button>

                <button
                  className={activeTab === "raw" ? "active" : ""}
                  onClick={() => setActiveTab("raw")}
                >
                  Raw
                </button>
              </div>

              <div className="tab-content">
                {/* existing tab content */}
                {/* 📝 TRANSCRIPTION TAB */}
              {activeTab === "transcription" && (
                <div>
                  <div className="transcription-box">
                    {result.transcripted_text?.full_text}
                  </div>

                  <div className="translation-box">
                    <h4>Translation</h4>
                    <p>{result.translated_text?.translation}</p>
                  </div>
                </div>
              )}

              {/* TIMESTAMP TAB */}
              {activeTab === "timestamp" && (
                <div className="timestamp-box">
                  {result.transcripted_text?.segments?.map((seg, index) => (
                    <p key={index}>
                      <small>[{seg.start} - {seg.end}]</small> {seg.text}
                    </p>
                  ))}
                </div>
              )}

              {/* RAW TAB */}
              {activeTab === "raw" && (
                <pre className="raw-box">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
              </div>

            </div>

            
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
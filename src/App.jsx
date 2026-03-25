import { useState, useRef } from "react";
import { uploadFile, uploadFileV2 } from "./api";
import "./App.css";
import Footer from "./components/Footer";
import StreamOutput, { TranslationPanel } from "./components/StreamOutput";
import config from "./config";
import jsPDF from "jspdf";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese (Mandarin)" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "ar", name: "Arabic" },
  { code: "bn", name: "Bengali" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
];

const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
};

export default function App() {
  const isV2 = window.location.pathname.startsWith("/v2");

  // ── shared ──
  const [file, setFile]         = useState(null);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // ── V1 ──
  const [result, setResult]       = useState(null);
  const [progress, setProgress]   = useState(0);
  const [activeTab, setActiveTab] = useState("transcription");

  // ── V2 streaming ──
  const [streamData, setStreamData]               = useState([]);
  const [streamTranslation, setStreamTranslation] = useState([]);
  const [streamProgress, setStreamProgress]       = useState(0);
  const [jobId, setJobId]                         = useState(null);

  // ── translate panel ──
  const [showTranslate, setShowTranslate] = useState(false);
  const [translateLang, setTranslateLang] = useState("Bengali");
  const [translating, setTranslating]     = useState(false);

  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setFile(e.dataTransfer.files[0]);
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a file"); return; }

    setLoading(true);
    setError("");
    setResult(null);
    setProgress(0);
    setStreamData([]);
    setStreamTranslation([]);
    setStreamProgress(0);
    setShowTranslate(false);
    setJobId(null);

    try {
      if (!isV2) {
        // ── V1 FLOW — unchanged, language passed as before ──
        let fake = 0;
        const iv = setInterval(() => {
          fake = Math.min(fake + Math.floor(Math.random() * 10) + 5, 95);
          setProgress(fake);
        }, 500);
        try {
          const response = await uploadFile(file, language);
          setResult(response);
          setProgress(100);
        } finally {
          clearInterval(iv);
        }

      } else {
        // ── V2 FLOW — transcription only on submit ──
        const res = await uploadFileV2(file, language);
        const id  = res.job_id;
        setJobId(id);

        await new Promise((resolve, reject) => {
          const source = new EventSource(
            `${config.API_BASE_URL}/api/v2/stream/?job_id=${id}`
          );

          source.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.status === "completed") {
              source.close();
              setStreamProgress(100);
              resolve();
              return;
            }
            if (data.error) {
              source.close();
              reject(new Error(data.error));
              return;
            }

            setStreamData((prev) => [
              ...prev,
              { text: data.text || "", start: data.start, end: data.end },
            ]);
            setStreamProgress((prev) => Math.min((prev || 0) + 5, 95));
          };

          source.onerror = () => {
            source.close();
            reject(new Error("Streaming failed"));
          };
        });
      }

    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ── translate (V2 only) ── */
  const handleTranslate = async () => {
    setTranslating(true);
    setStreamTranslation([]);

    const source = new EventSource(
      `${config.API_BASE_URL}/api/v2/stream-translate/?job_id=${jobId}&language=${encodeURIComponent(translateLang)}`
    );

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "completed") {
        source.close();
        setTranslating(false);
        return;
      }

      setStreamTranslation((prev) => [
        ...prev,
        { text: data.text, start: data.start, end: data.end },
      ]);
    };

    source.onerror = () => {
      source.close();
      setTranslating(false);
      setError("Translation streaming failed");
    };
  };

  /* ── download transcript ── */
  const handleDownload = () => {
    const lines = streamData.map((c) => `[${c.start} – ${c.end}]  ${c.text}`).join("\n");
    const blob  = new Blob([lines], { type: "text/plain" });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    a.href = url; a.download = "transcript.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    if (!streamData.length) return;

    const doc = new jsPDF();

    let y = 10;

    // Title
    doc.setFontSize(16);
    doc.text("TranscribeAI", 10, y);
    y += 10;

    doc.setFontSize(11);

    streamData.forEach((chunk) => {
      const line = `[${chunk.start} - ${chunk.end}] ${chunk.text || ""}`;

      const splitText = doc.splitTextToSize(line, 180);

      doc.text(splitText, 10, y);
      y += splitText.length * 7 + 3;

      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });

    doc.save("transcription.pdf");
  };

  const transcriptionDone = !loading && streamData.length > 0;

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <span className="app-name">Transcribe<span>AI</span></span>
          <nav className="nav-links">
            <a href="#">Home</a>
            <a href="#">Docs</a>
            <button className="login-btn">Login</button>
          </nav>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="container">

        {/* Hero */}
        <div className="hero">
          <h1 className="hero-title">
            Audio & Video <span>Transcription</span>
          </h1>
          <p className="hero-sub">
            Upload a file — get accurate, timestamped transcription instantly.
          </p>
        </div>

        {/* ── Upload bar — same layout for both V1 and V2 ── */}
        <form onSubmit={handleSubmit}>
          <div className="upload-bar">

            {/* Drop zone */}
            <div
              className={`drop-zone ${file ? "has-file" : ""}`}
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <span className="drop-icon">{file ? "🎵" : "📂"}</span>
              <span className={`drop-text ${file ? "active" : ""}`}>
                {file ? file.name : "Drop or click to upload audio / video"}
              </span>
              <input
                type="file"
                ref={fileInputRef}
                className="file-input"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>

            {/* Language dropdown — shown for BOTH V1 and V2 beside submit */}
            { !isV2 && (<select
              className="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.name}>{l.name}</option>
              ))}
            </select>
            )}

            {/* Submit */}
            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Processing…" : "Transcribe →"}
            </button>

          </div>
        </form>

        {/* V1 progress bar */}
        {!isV2 && loading && (
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Error */}
        {error && <div className="error-box">⚠ {error}</div>}

        {/* ══ V1 RESULT — fully unchanged logic ══ */}
        {!isV2 && result && (
          <div className="result-container">

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

            <div className="tabs-container">
              <div className="tabs">
                {["transcription", "timestamp", "raw"].map((t) => (
                  <button
                    key={t}
                    className={activeTab === t ? "active" : ""}
                    onClick={() => setActiveTab(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <div className="tab-content">
                {activeTab === "transcription" && (
                  <>
                    <div className="transcription-box">
                      {result.transcripted_text?.full_text}
                    </div>
                    <div className="translation-box">
                      <h4>Translation</h4>
                      <p>{result.translated_text?.translation}</p>
                    </div>
                  </>
                )}
                {activeTab === "timestamp" && (
                  <div className="timestamp-box">
                    {result.transcripted_text?.segments?.map((seg, i) => (
                      <p key={i}>
                        <small>[{seg.start} – {seg.end}]</small> {seg.text}
                      </p>
                    ))}
                  </div>
                )}
                {activeTab === "raw" && (
                  <pre className="raw-box">{JSON.stringify(result, null, 2)}</pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ V2 RESULT ══ */}
        {isV2 && (
          <>
            <StreamOutput
              streamData={streamData}
              isLoading={loading}
              progress={streamProgress}
            />

            {/* Action bar — appears only once transcription is done */}
            {transcriptionDone && (
              <div className="action-bar">
                <button
                  className="action-btn primary"
                  onClick={() => setShowTranslate((v) => !v)}
                >
                  🌍 Translate
                </button>
                <button className="action-btn" onClick={handleDownload}>
                  ⬇ Download .txt
                </button>

                <button className="action-btn" onClick={downloadPDF}>
                  📄 Download PDF
                </button>
              </div>
            )}

            {/* Translate panel — slides in when toggled */}
            {transcriptionDone && showTranslate && (
              <div className="translate-panel">
                <label>Translate to</label>
                <select
                  value={translateLang}
                  onChange={(e) => setTranslateLang(e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.name}>{l.name}</option>
                  ))}
                </select>
                <button
                  className="translate-go-btn"
                  onClick={handleTranslate}
                  disabled={translating}
                >
                  {translating ? "Translating…" : "Go →"}
                </button>
              </div>
            )}

            {/* Translation result — rendered directly below the translate panel */}
            {transcriptionDone && showTranslate && (
              <TranslationPanel streamTranslation={streamTranslation} />
            )}
          </>
        )}

      </main>

      <Footer />
    </div>
  );
}
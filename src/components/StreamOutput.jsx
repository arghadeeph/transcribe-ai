import { useEffect, useRef, useState } from "react";

function useTypewriter(target = "", speed = 35) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    if (target.length < indexRef.current) {
      indexRef.current = 0;
      setDisplayed("");
    }
    if (indexRef.current >= target.length) return;

    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(target.slice(0, indexRef.current));
      if (indexRef.current >= target.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [target, speed]);

  return displayed;
}

export default function StreamOutput({ streamData = [], isLoading, progress }) {
  const transcriptTarget = streamData.map((c) => c.text || "").join(" ");
  const typedTranscript  = useTypewriter(transcriptTarget, 35);

  const hasContent = streamData.length > 0;

  const getVisibleChunks = (chunks, typedText) => {
    let charCount = 0;
    return chunks.map((chunk, i) => {
      const text = chunk.text || "";
      const chunkStart = charCount + (i > 0 ? 1 : 0);
      charCount += (i > 0 ? 1 : 0) + text.length;
      const visible = typedText.length >= chunkStart + 1;
      const partialText = visible
        ? typedText.slice(chunkStart, Math.min(typedText.length, charCount))
        : "";
      return { ...chunk, text, partialText, visible };
    });
  };

  const visibleTranscript = getVisibleChunks(streamData, typedTranscript);

  if (!hasContent && !isLoading) return null;

  return (
    <div style={s.wrapper}>
      {/* Progress bar */}
      {isLoading && (
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
      )}

      {/* Transcription panel */}
      <div style={s.panel}>
        <div style={s.panelHead}>
          <div style={s.indicator} />
          <span style={s.panelLabel}>Transcription</span>
          {isLoading   && <span style={s.liveBadge}>● Live</span>}
          {!isLoading  && hasContent && <span style={s.doneBadge}>✓ Complete</span>}
        </div>

        <div style={s.textBox}>
          {visibleTranscript.filter((c) => c.visible).map((chunk, i, arr) => (
            <div key={i} style={s.row}>
              <span style={s.ts}>[{chunk.start} – {chunk.end}]</span>
              <span style={s.body}>
                {chunk.partialText}
                {isLoading && i === arr.length - 1 && <span style={s.cursor} />}
              </span>
            </div>
          ))}
          
        </div>
      </div>
    </div>
  );
}

/* ── Translation panel — used in App.jsx directly ── */
export function TranslationPanel({ streamTranslation = [] }) {
  const translationTarget = streamTranslation.map((c) => c.text || "").join(" ");

  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    if (translationTarget.length < indexRef.current) {
      indexRef.current = 0;
      setDisplayed("");
    }
    if (indexRef.current >= translationTarget.length) return;

    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(translationTarget.slice(0, indexRef.current));
      if (indexRef.current >= translationTarget.length) clearInterval(interval);
    }, 42);

    return () => clearInterval(interval);
  }, [translationTarget]);


  const getVisibleChunks = (chunks, typedText) => {
    let charCount = 0;
    return chunks.map((chunk, i) => {
      const text = chunk.text || "";
      const chunkStart = charCount + (i > 0 ? 1 : 0);
      charCount += (i > 0 ? 1 : 0) + text.length;
      const visible = typedText.length >= chunkStart + 1;
      const partialText = visible
        ? typedText.slice(chunkStart, Math.min(typedText.length, charCount))
        : "";
      return { ...chunk, text, partialText, visible };
    });
  };

  const visibleChunks = getVisibleChunks(streamTranslation, displayed);
  const isRendering   = displayed.length < translationTarget.length;

  if (streamTranslation.length === 0) return null;

  return (
    <div style={{ ...s.panel, borderColor: "rgba(245,166,35,0.25)" }}>
      <div style={s.panelHead}>
        <div style={{ ...s.indicator, background: "#f5a623", boxShadow: "0 0 8px rgba(245,166,35,0.45)" }} />
        <span style={s.panelLabel}>Translation</span>
        {isRendering && <span style={{ ...s.liveBadge, color: "#f5a623" }}>● Rendering</span>}
        {!isRendering && <span style={s.doneBadge}>✓ Complete</span>}
      </div>

      <div style={s.textBox}>
        {visibleChunks.filter((c) => c.visible).map((chunk, i, arr) => (
          <div key={i} style={s.row}>
            <span style={{ ...s.ts, color: "rgba(245,166,35,0.5)" }}>
              [{chunk.start} – {chunk.end}]
            </span>
            <span style={{ ...s.body, color: "rgba(255,255,255,0.75)" }}>
              {chunk.partialText}
              {isRendering && i === arr.length - 1 && (
                <span style={{ ...s.cursor, background: "#f5a623" }} />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', sans-serif",
  },
  progressTrack: {
    width: "100%",
    height: "3px",
    background: "#e5e7eb",
    borderRadius: "99px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #0071e3, #34c759)",
    borderRadius: "99px",
    transition: "width 0.4s ease",
  },
  panel: {
    background: "#111114",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "20px 24px",
  },
  panelHead: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  indicator: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#0071e3",
    boxShadow: "0 0 8px rgba(0,113,227,0.6)",
    flexShrink: 0,
  },
  panelLabel: {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
  },
  liveBadge: {
    marginLeft: "auto",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "#34c759",
    animation: "so_pulse 1.4s ease-in-out infinite",
  },
  doneBadge: {
    marginLeft: "auto",
    fontSize: "11px",
    fontWeight: 500,
    color: "rgba(52,199,89,0.7)",
  },
  textBox: {
    maxHeight: "280px",
    overflowY: "auto",
    scrollbarWidth: "none",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  row: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
  },
  ts: {
    flexShrink: 0,
    minWidth: "110px",
    fontSize: "11px",
    fontWeight: 500,
    color: "#9ac8f7d6",
    whiteSpace: "nowrap",
    paddingTop: "3px",
    letterSpacing: "0.02em",
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  },
  body: {
    display: "inline",
    fontSize: "14px",
    lineHeight: "1.75",
    color: "rgba(255,255,255,0.85)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  cursor: {
    display: "inline-block",
    width: "2px",
    height: "0.95em",
    background: "#0071e3",
    marginLeft: "2px",
    verticalAlign: "text-bottom",
    animation: "so_blink 1s step-end infinite",
  },
};

if (typeof document !== "undefined" && !document.getElementById("so-kf")) {
  const t = document.createElement("style");
  t.id = "so-kf";
  t.textContent = `
    @keyframes so_blink { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes so_pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `;
  document.head.appendChild(t);
}
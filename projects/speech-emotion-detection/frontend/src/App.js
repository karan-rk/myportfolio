import React, { useState } from "react";
import { motion } from "framer-motion";
import ClipLoader from "react-spinners/ClipLoader";
import { FaAngry, FaFrown, FaLaughSquint, FaMeh, FaSadCry, FaSmile, FaSurprise } from "react-icons/fa";

import { api } from "./api";
import JournalPane from "./components/JournalPane";
import PrivacyNotice from "./components/PrivacyNotice";
import Recorder from "./components/Recorder";
import "./App.css";


const emotionIcons = {
  happy: <FaSmile className="emotion-icon" />,
  sad: <FaFrown className="emotion-icon" />,
  angry: <FaAngry className="emotion-icon" />,
  surprise: <FaSurprise className="emotion-icon" />,
  neutral: <FaMeh className="emotion-icon" />,
  fear: <FaSadCry className="emotion-icon" />,
  disgust: <FaLaughSquint className="emotion-icon" />,
  calm: <FaMeh className="emotion-icon" />,
};

function App() {
  const [audioBlob, setAudioBlob] = useState(null);
  const [emotion, setEmotion] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [refreshJournal, setRefreshJournal] = useState(false);
  const [isJournalVisible, setIsJournalVisible] = useState(true);

  const analyzeAndJournal = async (file) => {
    setIsUploading(true);
    setError("");
    setEmotion("");
    setConfidence(0);

    try {
      const predictionForm = new FormData();
      predictionForm.append("file", file);
      const prediction = await api.post("/predict", predictionForm);
      setEmotion(prediction.data.emotion);
      setConfidence(prediction.data.confidence);

      const journalForm = new FormData();
      journalForm.append("file", file);
      journalForm.append("emotion", prediction.data.emotion);
      journalForm.append("note", `You experienced ${prediction.data.emotion}. What would you like to remember?`);
      await api.post("/journal", journalForm);
      setRefreshJournal((current) => !current);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to process this audio. Please check the file and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) analyzeAndJournal(file);
  };

  return (
    <main className={`app-shell ${isJournalVisible ? "" : "journal-hidden"}`}>
      {isJournalVisible && <JournalPane refresh={refreshJournal} />}
      <section className="analysis-pane">
        <div className="app-header">
          <div>
            <p className="eyebrow">Private reflection tool</p>
            <h1>Speech Emotion Detection</h1>
            <p>Record or upload a short voice clip to explore its predicted emotion.</p>
          </div>
          <button className="secondary-button" onClick={() => setIsJournalVisible((visible) => !visible)}>
            {isJournalVisible ? "Hide journal" : "Show journal"}
          </button>
        </div>

        <PrivacyNotice />

        <div className="analysis-controls">
          <Recorder onRecordingComplete={(blob) => { setAudioBlob(blob); setError(""); }} />
          <div className="action-row">
            <button className="primary-button" onClick={() => audioBlob && analyzeAndJournal(audioBlob)} disabled={isUploading || !audioBlob}>
              {isUploading ? "Analyzing..." : "Analyze recording"}
            </button>
            <label className="secondary-button upload-button" htmlFor="upload-audio">
              Upload audio
              <input id="upload-audio" type="file" accept="audio/wav,audio/mpeg,audio/flac,audio/mp4" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {isUploading && <ClipLoader color="#8cffc1" loading size={42} />}
        {error && <p className="error-message" role="alert">{error}</p>}
        {emotion && (
          <motion.div className="emotion-result-card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <div>{emotionIcons[emotion.toLowerCase()] || <FaMeh className="emotion-icon" />}</div>
            <div><span>Detected emotion</span><h2>{emotion}</h2><p>{(confidence * 100).toFixed(1)}% confidence</p></div>
          </motion.div>
        )}
      </section>
    </main>
  );
}

export default App;

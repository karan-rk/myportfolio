import React, { useEffect, useState } from "react";

import { api, audioUrl } from "../api";


export default function JournalPane({ refresh }) {
  const [journal, setJournal] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/journal")
      .then((response) => setJournal(response.data))
      .catch(() => setError("Journal entries are unavailable."));
  }, [refresh]);

  const saveNote = async (index) => {
    try {
      const note = drafts[index] || "";
      await api.put(`/journal/${index}`, { note });
      setJournal((entries) => entries.map((entry, position) => position === index ? { ...entry, note } : entry));
      setEditing(null);
    } catch {
      setError("Could not save the journal note.");
    }
  };

  return (
    <aside className="journal-pane">
      <div className="journal-heading"><p>Reflection history</p><h2>My Journal</h2></div>
      {error && <p className="journal-error" role="alert">{error}</p>}
      {!journal.length && <p className="empty-journal">No entries yet. Record or upload audio to begin.</p>}
      {journal.map((entry, index) => (
        <article className="journal-entry" key={`${entry.audio_file}-${index}`}>
          <div className="journal-meta"><strong>{entry.emotion}</strong><span>{entry.date}</span></div>
          <audio controls src={audioUrl(entry.audio_file)}>Your browser does not support audio playback.</audio>
          {editing === index ? (
            <textarea value={drafts[index] ?? entry.note} onChange={(event) => setDrafts({ ...drafts, [index]: event.target.value })} maxLength={2000} />
          ) : <p>{entry.note || "No reflection added yet."}</p>}
          <div className="journal-actions">
            {editing === index ? (
              <><button onClick={() => saveNote(index)}>Save</button><button onClick={() => setEditing(null)}>Cancel</button></>
            ) : <button onClick={() => { setDrafts({ ...drafts, [index]: entry.note }); setEditing(index); }}>Edit note</button>}
          </div>
        </article>
      ))}
    </aside>
  );
}

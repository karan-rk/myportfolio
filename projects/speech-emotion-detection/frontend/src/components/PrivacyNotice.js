import React from "react";


export default function PrivacyNotice() {
  return (
    <aside className="privacy-notice">
      <strong>Privacy note</strong>
      <p>Audio is sent to the configured backend for inference and is not saved by the public portfolio demo. Do not submit sensitive recordings.</p>
      <small>This prototype supports reflection and is not a medical or diagnostic tool.</small>
    </aside>
  );
}

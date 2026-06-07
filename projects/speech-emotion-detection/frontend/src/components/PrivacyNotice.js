import React from "react";


export default function PrivacyNotice() {
  return (
    <aside className="privacy-notice">
      <strong>Privacy note</strong>
      <p>Audio and journal entries are stored by the configured backend. Do not submit sensitive recordings unless you trust that deployment.</p>
      <small>This prototype supports reflection and is not a medical or diagnostic tool.</small>
    </aside>
  );
}

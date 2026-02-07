"use client";

import { useState } from "react";

interface ShareLinkProps {
  url: string;
  pinCode?: string | null;
}

export default function ShareLink({ url, pinCode }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-surface rounded-xl p-5 border border-border space-y-4">
      <p className="text-sm text-text-secondary font-medium">
        Share this link with your friend:
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={url}
          className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-text-primary font-mono"
        />
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            copied
              ? "bg-mint/20 text-mint border border-mint/30"
              : "btn-primary"
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {pinCode && (
        <div className="flex items-center gap-3 pt-2 border-t border-border/50">
          <p className="text-sm text-text-secondary">Session PIN:</p>
          <span className="font-mono text-xl font-bold text-saffron tracking-[0.3em] bg-saffron/10 px-4 py-1.5 rounded-lg border border-saffron/20">
            {pinCode}
          </span>
          <p className="text-xs text-text-muted">
            Your friend will need this to join
          </p>
        </div>
      )}
    </div>
  );
}

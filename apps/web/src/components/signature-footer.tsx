export function SignatureFooter() {
  return <footer className="signature-footer"><p>Made by <strong>Yena Kim (Yenarue)</strong> · {new Date().getFullYear()}</p>
    <div className="signature-links">
      <a href="mailto:yenarue@gmail.com" aria-label="이메일" title="이메일"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m3 6 9 7 9-7" /></svg></a>
      <a href="https://www.linkedin.com/in/yena-kim-yenarue" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="4" cy="4" r="2" /><path d="M2 8h4v14H2zM9 8h4v2c3-4 9-2 9 3v9h-4v-8c0-3-5-3-5 0v8H9z" /></svg></a>
      <a href="https://github.com/yenarue" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M9 21v-4c-4-1-6-3-6-6 0-2 1-3 2-4L5 3l5 2h4l5-2v4c1 1 2 2 2 4 0 3-2 5-6 6v4M9 19c-4 1-4-3-6-3" /></svg></a>
      <a href="https://www.instagram.com/yenarue" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r=".7" /></svg></a>
    </div></footer>;
}

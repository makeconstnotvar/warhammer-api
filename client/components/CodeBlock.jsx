function CodeBlock({ label, children }) {
  return (
    <section className="section-card code-panel">
      {label && <div className="section-eyebrow">{label}</div>}
      <pre className="code-block"><code>{children}</code></pre>
    </section>
  );
}

export { CodeBlock };

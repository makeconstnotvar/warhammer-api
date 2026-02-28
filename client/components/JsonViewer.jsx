function JsonViewer({ data, label }) {
  return (
    <section className="section-card code-panel">
      {label && <div className="section-eyebrow">{label}</div>}
      <pre className="json-viewer">{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}

export { JsonViewer };

function PivotActionLinks({ actions = [], className = "graph-card-actions" }) {
  if (!actions.length) {
    return null;
  }

  return (
    <div className={className}>
      {actions.map((action) => (
        <a
          key={`${action.label}-${action.href}`}
          className={action.className || "query-link"}
          href={action.href}
        >
          {action.label}
        </a>
      ))}
    </div>
  );
}

export { PivotActionLinks };

function StateNotice({ type = 'info', children }) {
  return (
    <div className={`state-notice state-notice-${type}`}>
      {children}
    </div>
  );
}

export { StateNotice };

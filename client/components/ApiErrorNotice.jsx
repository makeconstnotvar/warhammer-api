import { StateNotice } from "./StateNotice";

function normalizeDetailValue(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getDetailMetaEntries(detail = {}) {
  return Object.entries(detail).filter(
    ([key, value]) =>
      !["field", "message"].includes(key) &&
      value !== undefined &&
      value !== null &&
      value !== "",
  );
}

function ApiErrorNotice({ details = [], message }) {
  if (!message) {
    return null;
  }

  return (
    <StateNotice type="error">
      <div className="api-error-body">
        <strong>{message}</strong>
        {details.length ? (
          <ul className="api-error-list">
            {details.map((detail, index) => {
              const metaEntries = getDetailMetaEntries(detail);

              return (
                <li
                  key={`${detail.field || "detail"}-${detail.code || index}-${index}`}
                  className="api-error-item"
                >
                  <div className="api-error-item-head">
                    {detail.field ? (
                      <code className="api-error-field">{detail.field}</code>
                    ) : null}
                    <span>{detail.message || detail.code || "Invalid input."}</span>
                  </div>
                  {metaEntries.length ? (
                    <div className="tag-list">
                      {metaEntries.map(([key, value]) => (
                        <span key={key} className="tag">
                          {key}: {normalizeDetailValue(value)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </StateNotice>
  );
}

export { ApiErrorNotice };

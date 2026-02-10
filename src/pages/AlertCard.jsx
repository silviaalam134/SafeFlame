import React from 'react';

const AlertCard = ({ alert, onToggleRead }) => {
  return (
    <div
      className="alert-card"
      style={{
        background: alert.status === "unread" ? "#ffe6e6" : "#f0f0f0",
        borderRadius: "10px",
        padding: "15px",
        marginBottom: "15px",
        border: alert.status === "unread" ? "3px solid #d32f2f" : "2px solid #999"
      }}
    >
      <h3>{alert.type}</h3>
      <p><b>Severity:</b> {alert.severity}</p>
      <p><b>Location:</b> {alert.location}</p>
      <p><b>Status:</b> <span style={{ color: alert.status === "unread" ? "#d32f2f" : "#2e7d32", fontWeight: "bold" }}>{alert.status}</span></p>
      <p><b>Time:</b> {new Date(alert.createdAt).toLocaleString()}</p>

      <button
        onClick={onToggleRead}
        style={{
          padding: "8px 12px",
          background: alert.status === "unread" ? "#d32f2f" : "#2e7d32",
          color: "white",
          border: "none",
          borderRadius: "5px",
          marginTop: "10px",
          cursor: "pointer",
          fontWeight: "600"
        }}
      >
        Mark as {alert.status === "unread" ? "Read" : "Unread"}
      </button>
    </div>
  );
};

export default AlertCard;

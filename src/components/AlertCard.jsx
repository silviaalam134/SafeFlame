import React from 'react';
import './AlertCard.css';

const AlertCard = ({ alert }) => {
  const { type = 'Unknown', timestamp, status = 'unread' } = alert || {};

  // Resolve a stable key-like string for unique rendering (parent should still provide a real key)
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleString()
    : 'Unknown time';

  const baseClass = 'alert-card';
  const statusClass =
    status.toLowerCase() === 'read' ? `${baseClass}--read` : `${baseClass}--unread`;

  return (
    <article className={`${baseClass} ${statusClass}`} aria-live="polite">
      <div className="alert-card__body">
        <div className="alert-card__meta">
          <span className="alert-card__type">{type}</span>
          <span className="alert-card__status">{status}</span>
        </div>

        <div className="alert-card__time">{formattedTime}</div>
      </div>
    </article>
  );
};

export default AlertCard;
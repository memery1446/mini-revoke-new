// TransactionProgressBar.js
import React from 'react';

const TransactionProgressBar = ({ progress, status, variant = 'primary' }) => {
  return (
    <div className="transaction-progress my-3">
      <div className="progress" style={{ height: '20px' }}>
        <div 
          className={`progress-bar progress-bar-striped progress-bar-animated bg-${variant}`}
          role="progressbar" 
          style={{ width: `${progress}%` }} 
          aria-valuenow={progress} 
          aria-valuemin="0" 
          aria-valuemax="100"
        >
          {progress > 10 ? `${Math.round(progress)}%` : ''}
        </div>
      </div>
      {status && <small className="text-muted mt-1 d-block">{status}</small>}
    </div>
  );
};

export default TransactionProgressBar;


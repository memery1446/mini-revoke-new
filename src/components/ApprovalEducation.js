// ApprovalEducation.js
import React from 'react';

const ApprovalEducation = () => {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0">🔥 Essential Crypto Approval Reminders</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <p className="fw-bold text-primary mb-1">Understanding Permissions</p>
            <ul className="small mb-3">
              <li>Approvals remain active until explicitly revoked</li>
              <li>Unlimited approvals grant complete access to specific tokens</li>
            </ul>
            
            <p className="fw-bold text-primary mb-1">Security Actions</p>
            <ul className="small mb-3">
              <li>Regularly audit and revoke unused approvals</li>
              <li>Revoke permissions immediately after use</li>
            </ul>
          </div>
          
          <div className="col-md-6">
            <p className="fw-bold text-primary mb-1">Risk Factors</p>
            <ul className="small mb-3">
              <li>Active approvals can be exploited months/years later</li>
              <li>Most hacks use legitimate approvals, not direct compromise</li>
            </ul>
            
            <p className="fw-bold text-primary mb-1">Protection Tips</p>
            <ul className="small mb-0">
              <li>Review approvals quarterly</li>
              <li>Only approve on official websites</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalEducation;


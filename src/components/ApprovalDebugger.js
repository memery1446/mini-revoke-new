import React from 'react';
import { useSelector } from 'react-redux';

const ApprovalDebugger = () => {
  const approvals = useSelector((state) => state.web3.approvals || []);
  
  // Group approvals by type
  const erc20Approvals = approvals.filter(a => a.type === "ERC-20");
  const erc721Approvals = approvals.filter(a => a.type === "ERC-721");
  const erc1155Approvals = approvals.filter(a => a.type === "ERC-1155");
  
  // Check for duplicate IDs
  const ids = approvals.map(a => a.id);
  const uniqueIds = [...new Set(ids)];
  const hasDuplicateIds = ids.length !== uniqueIds.length;
  
  // Find duplicates if they exist
  let duplicateInfo = [];
  if (hasDuplicateIds) {
    const counts = ids.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});
    
    duplicateInfo = Object.entries(counts)
      .filter(([_, count]) => count > 1)
      .map(([id, count]) => ({ id, count }));
  }
  
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light">
        <h3 className="card-title">Approval Debugger</h3>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <h4>Summary</h4>
          <ul className="list-group">
            <li className="list-group-item d-flex justify-content-between align-items-center">
              Total Approvals
              <span className="badge bg-primary rounded-pill">{approvals.length}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              ERC-20 Approvals
              <span className="badge bg-success rounded-pill">{erc20Approvals.length}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              ERC-721 Approvals
              <span className="badge bg-info rounded-pill">{erc721Approvals.length}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              ERC-1155 Approvals
              <span className="badge bg-warning rounded-pill">{erc1155Approvals.length}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              Unique IDs
              <span className={`badge ${hasDuplicateIds ? 'bg-danger' : 'bg-success'} rounded-pill`}>
                {uniqueIds.length} of {ids.length}
              </span>
            </li>
          </ul>
          
          {hasDuplicateIds && (
            <div className="alert alert-danger mt-3">
              <h5>⚠️ Duplicate IDs Detected!</h5>
              <ul>
                {duplicateInfo.map(dup => (
                  <li key={dup.id}>ID: {dup.id} (appears {dup.count} times)</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <h4>Detailed Approval Data</h4>
          <div className="accordion" id="approvalAccordion">
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseERC20">
                  ERC-20 Approvals ({erc20Approvals.length})
                </button>
              </h2>
              <div id="collapseERC20" className="accordion-collapse collapse" data-bs-parent="#approvalAccordion">
                <div className="accordion-body">
                  <pre>{JSON.stringify(erc20Approvals, null, 2)}</pre>
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseERC721">
                  ERC-721 Approvals ({erc721Approvals.length})
                </button>
              </h2>
              <div id="collapseERC721" className="accordion-collapse collapse" data-bs-parent="#approvalAccordion">
                <div className="accordion-body">
                  <pre>{JSON.stringify(erc721Approvals, null, 2)}</pre>
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseERC1155">
                  ERC-1155 Approvals ({erc1155Approvals.length})
                </button>
              </h2>
              <div id="collapseERC1155" className="accordion-collapse collapse" data-bs-parent="#approvalAccordion">
                <div className="accordion-body">
                  <pre>{JSON.stringify(erc1155Approvals, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDebugger;

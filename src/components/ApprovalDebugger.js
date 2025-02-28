import React from 'react';
import { useSelector } from 'react-redux';

const ApprovalDebugger = () => {
  const approvals = useSelector((state) => state.web3.approvals);
  
  // Group approvals by type
  const erc20Approvals = approvals.filter(a => a.type === "ERC-20");
  const erc721Approvals = approvals.filter(a => a.type === "ERC-721");
  const erc1155Approvals = approvals.filter(a => a.type === "ERC-1155");
  
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light">
        <h3 className="card-title">Approval Debugger</h3>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <h4>Summary</h4>
          <ul>
            <li>Total Approvals: {approvals.length}</li>
            <li>ERC-20 Approvals: {erc20Approvals.length}</li>
            <li>ERC-721 Approvals: {erc721Approvals.length}</li>
            <li>ERC-1155 Approvals: {erc1155Approvals.length}</li>
          </ul>
        </div>
        
        <div className="accordion" id="approvalsAccordion">
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseERC20">
                ERC-20 Approvals ({erc20Approvals.length})
              </button>
            </h2>
            <div id="collapseERC20" className="accordion-collapse collapse">
              <div className="accordion-body">
                <pre className="bg-light p-3 rounded">
                  {JSON.stringify(erc20Approvals, null, 2)}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseERC721">
                ERC-721 Approvals ({erc721Approvals.length})
              </button>
            </h2>
            <div id="collapseERC721" className="accordion-collapse collapse">
              <div className="accordion-body">
                <pre className="bg-light p-3 rounded">
                  {JSON.stringify(erc721Approvals, null, 2)}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseERC1155">
                ERC-1155 Approvals ({erc1155Approvals.length})
              </button>
            </h2>
            <div id="collapseERC1155" className="accordion-collapse collapse">
              <div className="accordion-body">
                <pre className="bg-light p-3 rounded">
                  {JSON.stringify(erc1155Approvals, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDebugger;

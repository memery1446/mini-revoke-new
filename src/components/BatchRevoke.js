// BatchRevoke.js
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { batchRevokeERC20Approvals } from '../utils/batchRevokeUtils';
import { getProvider } from '../utils/provider';

const BatchRevoke = () => {
  const approvals = useSelector((state) => state.web3.approvals);
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [isRevoking, setIsRevoking] = useState(false);
  const [results, setResults] = useState(null);

  const handleSelectApproval = (approval) => {
    console.log("🔍 Toggling selection for:", approval);
    
    setSelectedApprovals((prev) => {
      // Check if the approval is already selected
      const isSelected = prev.some((a) => 
        a.contract === approval.contract && a.spender === approval.spender
      );
      
      if (isSelected) {
        // Remove if already selected
        return prev.filter((a) => 
          !(a.contract === approval.contract && a.spender === approval.spender)
        );
      } else {
        // Add if not selected
        return [...prev, approval];
      }
    });
  };

  const handleBatchRevoke = async () => {
    if (selectedApprovals.length === 0) {
      console.log("⚠️ No approvals selected");
      return;
    }
    
    setIsRevoking(true);
    setResults(null);
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      console.log("🔄 Starting batch revocation with signer:", await signer.getAddress());
      
      // Only ERC-20 tokens for now
      const erc20Approvals = selectedApprovals.filter(a => a.type === 'ERC-20');
      
      if (erc20Approvals.length === 0) {
        console.log("ℹ️ No ERC-20 approvals selected");
        setResults({ success: true, message: "No ERC-20 approvals to revoke." });
        return;
      }
      
      console.log("🚀 Revoking ERC-20 approvals:", erc20Approvals);
      
      const revokeResults = await batchRevokeERC20Approvals(erc20Approvals, signer);
      console.log("✅ Revocation results:", revokeResults);
      
      setResults({
        success: true,
        failed: revokeResults.failed.length,
        successful: revokeResults.successful.length,
        details: revokeResults
      });
      
      // Clear selections on success
      setSelectedApprovals([]);
      
    } catch (error) {
      console.error("❌ Batch revocation error:", error);
      setResults({
        success: false,
        message: error.message || "Failed to revoke approvals"
      });
    } finally {
      setIsRevoking(false);
    }
  };

  // Filter for ERC-20 approvals only for now
  const erc20Approvals = approvals.filter(a => a.type === 'ERC-20');
  
  // Check if any approval is selected
  const isAnySelected = selectedApprovals.length > 0;
  
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <span className="me-2">🔥</span>
          Batch Revoke Approvals
        </h5>
        <span className="badge bg-primary">
          {selectedApprovals.length} selected
        </span>
      </div>
      <div className="card-body">
        {erc20Approvals.length === 0 ? (
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            No ERC-20 approvals found. Connect your wallet and refresh to see approvals.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-sm">
              <thead className="table-light">
                <tr>
                  <th style={{width: "60px"}}>Select</th>
                  <th>Token</th>
                  <th>Spender</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {erc20Approvals.map((approval, index) => (
                  <tr key={index} className={
                    selectedApprovals.some(a => a.contract === approval.contract && a.spender === approval.spender) 
                      ? 'table-primary' 
                      : ''
                  }>
                    <td>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedApprovals.some(
                            (a) =>
                              a.contract === approval.contract && a.spender === approval.spender
                          )}
                          onChange={() => handleSelectApproval(approval)}
                          id={`approval-${index}`}
                        />
                        <label className="form-check-label" htmlFor={`approval-${index}`}></label>
                      </div>
                    </td>
                    <td className="text-truncate" style={{ maxWidth: '150px' }}>
                      <span className="badge bg-success me-1">ERC-20</span>
                      {approval.tokenSymbol || approval.contract.substring(0, 8) + '...'}
                    </td>
                    <td className="text-truncate" style={{ maxWidth: '150px' }}>
                      <code>{approval.spenderName || approval.spender.substring(0, 8) + '...'}</code>
                    </td>
                    <td>Unlimited</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {results && (
          <div className={`alert ${results.success ? 'alert-success' : 'alert-danger'} mt-3 d-flex justify-content-between align-items-center`}>
            <div>
              {results.success ? (
                <div>
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Successfully revoked {results.successful} approval(s)
                  {results.failed > 0 && <div>❌ Failed to revoke {results.failed} approval(s)</div>}
                </div>
              ) : (
                <div>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Error: {results.message}
                </div>
              )}
            </div>
            <button className="btn-close" onClick={() => setResults(null)}></button>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            <small className="text-muted">
              {erc20Approvals.length} ERC-20 approvals found. Select multiple to revoke in a single transaction.
            </small>
          </div>
          <div className="btn-group">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setSelectedApprovals([])}
              disabled={!isAnySelected || isRevoking}
            >
              Clear Selection
            </button>
            <button
              className="btn btn-danger"
              onClick={handleBatchRevoke}
              disabled={!isAnySelected || isRevoking}
            >
              {isRevoking ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Revoking...
                </>
              ) : (
                <>🔥 Revoke Selected ({selectedApprovals.length})</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchRevoke;




// // BatchRevoke.js
// import React, { useState } from 'react';
// import { useSelector } from 'react-redux';
// import { batchRevokeERC20Approvals } from '../utils/batchRevokeUtils';
// import { getProvider } from '../utils/provider';

// const BatchRevoke = () => {
//   const approvals = useSelector((state) => state.web3.approvals);
//   const [selectedApprovals, setSelectedApprovals] = useState([]);
//   const [isRevoking, setIsRevoking] = useState(false);
//   const [results, setResults] = useState(null);

//   const handleSelectApproval = (approval) => {
//     console.log("🔍 Toggling selection for:", approval);
    
//     setSelectedApprovals((prev) => {
//       // Check if the approval is already selected
//       const isSelected = prev.some((a) => 
//         a.contract === approval.contract && a.spender === approval.spender
//       );
      
//       if (isSelected) {
//         // Remove if already selected
//         return prev.filter((a) => 
//           !(a.contract === approval.contract && a.spender === approval.spender)
//         );
//       } else {
//         // Add if not selected
//         return [...prev, approval];
//       }
//     });
//   };

//   const handleBatchRevoke = async () => {
//     if (selectedApprovals.length === 0) {
//       console.log("⚠️ No approvals selected");
//       return;
//     }
    
//     setIsRevoking(true);
//     setResults(null);
    
//     try {
//       const provider = await getProvider();
//       const signer = await provider.getSigner();
//       console.log("🔄 Starting batch revocation with signer:", await signer.getAddress());
      
//       // Only ERC-20 tokens for now
//       const erc20Approvals = selectedApprovals.filter(a => a.type === 'ERC-20');
      
//       if (erc20Approvals.length === 0) {
//         console.log("ℹ️ No ERC-20 approvals selected");
//         setResults({ success: true, message: "No ERC-20 approvals to revoke." });
//         return;
//       }
      
//       console.log("🚀 Revoking ERC-20 approvals:", erc20Approvals);
      
//       const revokeResults = await batchRevokeERC20Approvals(erc20Approvals, signer);
//       console.log("✅ Revocation results:", revokeResults);
      
//       setResults({
//         success: true,
//         failed: revokeResults.failed.length,
//         successful: revokeResults.successful.length,
//         details: revokeResults
//       });
      
//       // Clear selections on success
//       setSelectedApprovals([]);
      
//     } catch (error) {
//       console.error("❌ Batch revocation error:", error);
//       setResults({
//         success: false,
//         message: error.message || "Failed to revoke approvals"
//       });
//     } finally {
//       setIsRevoking(false);
//     }
//   };

//   // Filter for ERC-20 approvals only for now
//   const erc20Approvals = approvals.filter(a => a.type === 'ERC-20');
  
//   // Check if any approval is selected
//   const isAnySelected = selectedApprovals.length > 0;
  
//   return (
//     <div className="card border-0 shadow-sm mb-4">
//       <div className="card-header bg-light">
//         <h3 className="h5 mb-0">Batch Revoke Approvals</h3>
//       </div>
//       <div className="card-body">
//         {erc20Approvals.length === 0 ? (
//           <div className="alert alert-info">No ERC-20 approvals found</div>
//         ) : (
//           <div className="table-responsive">
//             <table className="table table-sm">
//               <thead>
//                 <tr>
//                   <th>Select</th>
//                   <th>Token</th>
//                   <th>Spender</th>
//                   <th>Amount</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {erc20Approvals.map((approval, index) => (
//                   <tr key={index}>
//                     <td>
//                       <input
//                         type="checkbox"
//                         className="form-check-input"
//                         checked={selectedApprovals.some(
//                           (a) =>
//                             a.contract === approval.contract && a.spender === approval.spender
//                         )}
//                         onChange={() => handleSelectApproval(approval)}
//                       />
//                     </td>
//                     <td className="text-truncate" style={{ maxWidth: '150px' }}>
//                       {approval.tokenSymbol || approval.contract}
//                     </td>
//                     <td className="text-truncate" style={{ maxWidth: '150px' }}>
//                       {approval.spenderName || approval.spender}
//                     </td>
//                     <td>{approval.amount}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {results && (
//           <div className={`alert ${results.success ? 'alert-success' : 'alert-danger'} mt-3`}>
//             {results.success ? (
//               <div>
//                 ✅ Successfully revoked {results.successful} approval(s)
//                 {results.failed > 0 && <div>❌ Failed to revoke {results.failed} approval(s)</div>}
//               </div>
//             ) : (
//               <div>❌ Error: {results.message}</div>
//             )}
//           </div>
//         )}

//         <div className="d-flex justify-content-end mt-3">
//           <button
//             className="btn btn-danger"
//             onClick={handleBatchRevoke}
//             disabled={!isAnySelected || isRevoking}
//           >
//             {isRevoking ? (
//               <>
//                 <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
//                 Revoking...
//               </>
//             ) : (
//               <>🔥 Revoke Selected ({selectedApprovals.length})</>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BatchRevoke;

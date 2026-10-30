export const projectDocumentStyles = `
  body{visibility:hidden}.reader.project-reader{max-width:1180px}.top nav{flex-wrap:wrap}
  .document-heading{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:0 0 28px}
  .document-heading h1{font-size:27px;margin:0}.document-heading .private-label{font-size:12px;color:var(--muted);margin:6px 0 0}
  .document-modes{display:flex;flex-wrap:wrap;gap:18px;font-size:13px}.document-modes a{display:inline-flex;align-items:center;min-height:44px;text-decoration:none}
  .document-modes a[aria-current]{text-decoration:underline;text-underline-offset:6px}.document-create{font-size:12px;white-space:nowrap}
  .plans-layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:42px;align-items:start}
  .plans-sidebar{border-right:1px solid var(--line);padding-right:24px;min-width:0}.document-search{display:block;margin-bottom:12px}
  .document-search span{display:block;font-size:12px;margin-bottom:7px}.document-search input{font-size:13px;padding:9px 10px}
  #search-result{font-size:11px;color:var(--muted);min-height:20px;margin:0 0 6px}
  #document-tree>summary{font-size:12px;font-weight:600;min-height:40px;align-content:center;cursor:pointer}
  .folder{margin:4px 0}.folder>summary{font-size:13px;line-height:1.7;padding:8px 0;cursor:pointer;overflow-wrap:anywhere}.folder>summary small{margin-left:8px;font:11px ui-monospace,monospace}
  .folder-children{margin-left:6px;padding-left:10px;border-left:1px solid var(--line)}
  .document-link{display:block;color:var(--muted);text-decoration:none;font-size:13px;line-height:1.6;padding:9px 8px;border-radius:2px;overflow-wrap:anywhere}
  .document-link:hover{color:var(--green);background:#eff2eb}.document-link[aria-current]{background:#e8eee5;color:var(--green);font-weight:600}
  .document-content{min-width:0;scroll-margin-top:25px}.document-title{margin:0 0 18px;padding-bottom:18px;border-bottom:1px solid var(--line)}
  .document-title h2{font-size:25px;line-height:1.6;margin:0 0 7px;word-break:keep-all;overflow-wrap:anywhere}.document-title p{font-size:12px;color:var(--muted);margin:0 0 8px;overflow-wrap:anywhere}
  .document-title time{color:var(--muted);font:11px ui-monospace,monospace}.project-reader .prose{border:0;margin:0;padding:0}
  .empty-plan{color:var(--muted);font-size:14px;padding:25px 0}.plan-actions{display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-top:18px}
  #plan-form label{margin:0 0 18px}#plan-form label small{font-size:12px}#plan-body{min-height:400px;resize:vertical;line-height:1.8}.plan-actions button{padding:10px 22px}#save-status{font-size:13px}
  .resource-layout{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:36px;align-items:start}
  .resource-layout .document-content{min-width:0}.resource-cover{margin:0 0 24px}.resource-cover img{display:block;width:100%;max-height:560px;object-fit:contain;background:#edf0ea;border-radius:2px}
  .resource-cover figcaption{font-size:12px;color:var(--muted);margin-top:9px;line-height:1.8}.resource-original{display:inline-flex;min-height:40px;align-items:center;font-size:12px}
  .resource-thumbnails{display:flex;flex-direction:column;gap:8px;grid-column:2;grid-row:1/span 2}.resource-body{grid-column:1;grid-row:2}.resource-choice{display:grid;grid-template-columns:58px minmax(0,1fr);gap:12px;align-items:center;padding:7px;border:1px solid transparent;border-radius:2px;text-decoration:none;color:var(--ink);font-size:12px;line-height:1.6;overflow-wrap:anywhere}
  .resource-choice[aria-current]{border-color:var(--green);background:#edf1e9}.resource-choice:hover{background:#edf1e9}.resource-choice img{display:block;width:58px;height:50px;object-fit:cover;border-radius:1px}
  .image-placeholder{display:flex;align-items:center;justify-content:center;min-height:130px;padding:24px;color:var(--muted);font-size:13px;background:#edf0ea;text-align:center}
  .resource-choice .image-placeholder{width:58px;min-height:50px;padding:4px;font-size:11px}.resource-thumbnails>p{margin:0 0 8px;font-size:12px;color:var(--muted)}
  .resource-links{display:flex;gap:20px;justify-content:space-between;margin-top:16px;font-size:12px}.resource-links a{min-height:40px;display:inline-flex;align-items:center}
  @media(max-width:760px){
    .document-heading{align-items:flex-start;gap:14px;flex-wrap:wrap}.document-heading h1{font-size:24px}.document-modes{gap:16px}
    .plans-layout,.resource-layout{grid-template-columns:1fr;gap:26px}.plans-sidebar{border:0;border-bottom:1px solid var(--line);padding:0 0 18px}
    .document-search input,#plan-form input,#plan-form textarea{font-size:16px}.document-link,.folder>summary,#document-tree>summary{min-height:44px}
    .resource-thumbnails{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;grid-column:1;grid-row:2}.resource-body{grid-column:1;grid-row:3}.resource-thumbnails>p,.resource-links{grid-column:1/-1}
    .resource-choice{grid-template-columns:44px minmax(0,1fr);gap:8px;padding:5px}.resource-choice img,.resource-choice .image-placeholder{width:44px;height:44px;min-height:44px}
    .document-title h2{font-size:23px}.resource-cover img{max-height:420px}#plan-body{min-height:330px}
  }
`;

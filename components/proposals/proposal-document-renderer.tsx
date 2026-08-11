'use client';

import React from 'react';
import { ProposalDocument, getCurrencySymbol, calculateProposalTotals } from '@/lib/proposal-document';

interface ProposalDocumentRendererProps {
  document: ProposalDocument;
  activePageId?: string;
  className?: string;
}

export const ProposalDocumentRenderer: React.FC<ProposalDocumentRendererProps> = ({
  document: doc,
  activePageId,
  className = ''
}) => {
  const sym = getCurrencySymbol(doc.currency);
  const { subtotal, gstTax, grandTotal } = calculateProposalTotals(doc.line_items);
  const theme = doc.theme_color || '#84cc16';

  return (
    <div className={`space-y-8 flex flex-col items-center bg-slate-900/60 p-6 rounded-2xl overflow-y-auto ${className}`}>
      
      {/* PAGE 1: COVER PAGE (Matching Shrikant Proposal.pdf) */}
      <div 
        id="page_p1_cover"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between border-b-[10px] transition-all ${
          activePageId === 'p1_cover' ? 'ring-4 ring-lime-400' : ''
        }`}
        style={{ borderColor: theme, background: 'linear-gradient(180deg, #ffffff 0%, #f7fee7 100%)' }}
      >
        <div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            Qevn <span style={{ color: theme }}>×</span> {doc.company_name}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: theme }}>
            {doc.date_str || 'AUGUST 2026'}
          </div>

          <div className="mt-32 text-3xl font-black text-slate-900 leading-tight max-w-lg">
            {doc.proposal_title}
          </div>
        </div>

        <div className="border-t-2 border-lime-300 pt-4 text-xs text-slate-600 space-y-1">
          <p><strong>Prepared for:</strong> {doc.company_name} ({doc.client_name})</p>
          <p><strong>Presented by:</strong> QEVN AI Engineering & Solutions Team</p>
          <p><strong>Ref Code:</strong> {doc.document_number} (v{doc.version})</p>
        </div>
      </div>

      {/* PAGE 2: EXECUTIVE SUMMARY */}
      <div 
        id="page_p2_exec"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between transition-all ${
          activePageId === 'p2_exec' ? 'ring-4 ring-lime-400' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="border-b-2 pb-2 flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ borderColor: theme, color: theme }}>
            <span>Qevn × {doc.company_name}</span>
            <span>{doc.date_str || 'AUGUST 2026'}</span>
          </div>

          <h2 className="text-xl font-black text-slate-900 border-l-4 pl-3.5" style={{ borderColor: theme }}>
            Executive Summary
          </h2>

          <p className="text-xs text-slate-700 leading-relaxed">
            <strong>{doc.company_name}</strong> is a forward-thinking enterprise with a clear vision for growth. As market dynamics become increasingly competitive, the ability to consistently identify, reach, and convert high-quality prospects determines which businesses scale.
          </p>

          <p className="text-xs text-slate-700 leading-relaxed">
            {doc.exec_summary || 'QEVN has conducted a thorough architectural review of current outbound lead generation workflows. We recognize that your company requires a modern, scalable outbound engine that moves beyond manual prospecting into fully automated AI-driven multi-agent pipelines.'}
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-3">Why Outbound Matters Now</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            Traditional manual lead generation is broken. Sourcing contacts manually, sending generic emails, and hoping for replies is no longer viable. Modern buyers expect hyper-personalized outreach. AI-powered outbound systems empower businesses to reach thousands of qualified prospects with personalized messaging at a fraction of traditional cost.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-3">Why QEVN</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            QEVN is an AI engineering company that builds production-grade intelligent business operating systems. We don't configure off-the-shelf software; we architect custom AI pipelines built around your specific business requirements, combining multi-agent AI architectures, Twilio softphone voice bridging, and deep automation.
          </p>
        </div>

        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 02</span>
        </div>
      </div>

      {/* PAGE 3: CHALLENGES & SOLUTIONS */}
      <div 
        id="page_p4_challenges"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between transition-all ${
          activePageId === 'p4_challenges' ? 'ring-4 ring-lime-400' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="border-b-2 pb-2 flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ borderColor: theme, color: theme }}>
            <span>QEVN TECHNOLOGIES</span>
            <span>Ref: {doc.document_number}</span>
          </div>

          <h2 className="text-xl font-black text-slate-900 border-l-4 pl-3.5" style={{ borderColor: theme }}>
            Challenges & QEVN Solution Matrix
          </h2>

          <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px]">
                <tr>
                  <th className="p-3 w-[45%]">CLIENT CHALLENGE</th>
                  <th className="p-3 w-[55%]">QEVN ARCHITECTURAL SOLUTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {(doc.comparison_rows || [
                  { challenge: 'High cost & slow manual prospecting', solution: 'AI multi-agent pipeline scales outreach at 1/10th traditional cost' },
                  { challenge: 'Low email reply rates & spam risks', solution: 'Hyper-personalized messaging with domain protection & warmups' },
                  { challenge: 'Unverified lead data & high bounce rates', solution: 'Multi-provider real-time verification before dispatch' },
                ]).map((r, i) => (
                  <tr key={i}>
                    <td className="p-3 font-semibold text-slate-900">{r.challenge}</td>
                    <td className="p-3">{r.solution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 03</span>
        </div>
      </div>

      {/* PAGE 4: COMMERCIAL INVESTMENT */}
      <div 
        id="page_p7_pricing"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between transition-all ${
          activePageId === 'p7_pricing' ? 'ring-4 ring-lime-400' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="border-b-2 pb-2 flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ borderColor: theme, color: theme }}>
            <span>QEVN TECHNOLOGIES</span>
            <span>Ref: {doc.document_number}</span>
          </div>

          <h2 className="text-xl font-black text-slate-900 border-l-4 pl-3.5" style={{ borderColor: theme }}>
            Commercial Investment & Pricing Schedule
          </h2>

          <p className="text-xs text-slate-600">
            Proposal Ref: <strong>{doc.document_number} (v{doc.version})</strong> • Client Entity: <strong>{doc.company_name}</strong>
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-lime-50 text-lime-950 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Service Deliverable</th>
                  <th className="p-3 w-16">Qty</th>
                  <th className="p-3 w-28">Rate ({sym})</th>
                  <th className="p-3 w-32 text-right">Total ({sym})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {doc.line_items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3">
                      <strong className="text-slate-900">{item.serviceName}</strong>
                      <br/>
                      <span className="text-slate-500 text-[11px]">{item.description}</span>
                    </td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3">{sym}{item.rate.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{sym}{(item.quantity * item.rate).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-lime-50 border-2 rounded-xl p-4 max-w-xs ml-auto space-y-1 text-xs" style={{ borderColor: theme }}>
            <div className="flex justify-between text-slate-600"><span>Subtotal:</span><strong>{sym}{subtotal.toLocaleString()}</strong></div>
            <div className="flex justify-between text-slate-600"><span>GST Tax (18%):</span><strong>{sym}{gstTax.toLocaleString()}</strong></div>
            <div className="flex justify-between text-base font-black text-emerald-800 border-t pt-2 mt-1" style={{ borderColor: theme }}>
              <span>Grand Total:</span>
              <span>{sym}{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-[11px] text-slate-700 space-y-1 mt-4">
            <p className="font-bold text-slate-900">BANK NEFT / RTGS TRANSFER DETAILS:</p>
            <p><strong>Bank Name:</strong> HDFC Bank Ltd</p>
            <p><strong>Account Name:</strong> QEVN TECHNOLOGIES PRIVATE LIMITED</p>
            <p><strong>Account Number:</strong> 50200088991122 | <strong>IFSC:</strong> HDFC0001234</p>
            <p><strong>GSTIN:</strong> 27AAAAA0000A1Z5</p>
          </div>
        </div>

        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 04</span>
        </div>
      </div>

    </div>
  );
};

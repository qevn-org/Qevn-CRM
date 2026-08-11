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
      
      {/* PAGE 1: COVER PAGE */}
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
          <h3 className="text-sm font-bold text-slate-900 pt-2">Why Outbound Matters Now</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            Traditional manual lead generation is broken. Sourcing contacts manually, sending generic emails, and hoping for replies is no longer viable. Modern buyers expect hyper-personalized outreach. AI-powered outbound systems empower businesses to reach thousands of qualified prospects with personalized messaging at a fraction of traditional cost.
          </p>
          <h3 className="text-sm font-bold text-slate-900 pt-2">Why QEVN</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            QEVN is an AI engineering company that builds production-grade intelligent business operating systems. We don't configure off-the-shelf software; we architect custom AI pipelines built around your specific business requirements, combining multi-agent AI architectures, Twilio softphone voice bridging, and deep automation.
          </p>
        </div>
        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 02</span>
        </div>
      </div>

      {/* PAGE 3: ABOUT QEVN & SCOPE */}
      <div 
        id="page_p3_scope"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between transition-all ${
          activePageId === 'p3_scope' ? 'ring-4 ring-lime-400' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="border-b-2 pb-2 flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ borderColor: theme, color: theme }}>
            <span>QEVN TECHNOLOGIES</span>
            <span>Ref: {doc.document_number}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 border-l-4 pl-3.5" style={{ borderColor: theme }}>
            About QEVN & Capability Scope
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            QEVN architects production-grade intelligent systems that combine agentic AI, enterprise data pipelines, and sales automation to deliver compounding business outcomes.
          </p>
          <h3 className="text-sm font-bold text-slate-900 pt-1">What We Build</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border rounded-xl"><p className="font-bold text-slate-900">1. Agentic AI Systems</p><p className="text-slate-500 text-[11px]">Multi-layer autonomous AI pipelines for research & verification.</p></div>
            <div className="p-3 bg-slate-50 border rounded-xl"><p className="font-bold text-slate-900">2. AI Calling Agents</p><p className="text-slate-500 text-[11px]">Twilio WebRTC softphone voice agents with objection analysis.</p></div>
            <div className="p-3 bg-slate-50 border rounded-xl"><p className="font-bold text-slate-900">3. AI Employees</p><p className="text-slate-500 text-[11px]">Digital team members performing repetitive workflow operations.</p></div>
            <div className="p-3 bg-slate-50 border rounded-xl"><p className="font-bold text-slate-900">4. CRM Integrations</p><p className="text-slate-500 text-[11px]">Seamless sync with HubSpot, Salesforce, and custom CRM.</p></div>
            <div className="p-3 bg-slate-50 border rounded-xl"><p className="font-bold text-slate-900">5. Custom SaaS Development</p><p className="text-slate-500 text-[11px]">Full-stack Next.js 16 applications with RLS security.</p></div>
            <div className="p-3 bg-slate-50 border rounded-xl"><p className="font-bold text-slate-900">6. Workflow Automation</p><p className="text-slate-500 text-[11px]">Trigger-Condition-Action automation engines.</p></div>
          </div>
        </div>
        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 03</span>
        </div>
      </div>

      {/* PAGE 4: CHALLENGES & SOLUTIONS */}
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
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px]">
                <tr><th className="p-3 w-[45%]">CLIENT CHALLENGE</th><th className="p-3 w-[55%]">QEVN ARCHITECTURAL SOLUTION</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {(doc.comparison_rows || [
                  { challenge: 'Need for qualified leads', solution: 'AI multi-agent pipeline researches & identifies high-fit prospects' },
                  { challenge: 'Need for verified contacts', solution: 'Multi-provider real-time email & phone verification engine' },
                  { challenge: 'Need for personalized outreach', solution: 'AI-generated prospect-specific messaging matching ICP persona' },
                  { challenge: 'Need for scalable outbound', solution: 'Automated AI pipeline operating 24/7 without headcount growth' },
                  { challenge: 'Need for conversion visibility', solution: 'Unified CRM analytics with call intelligence & meeting tracking' },
                  { challenge: 'Need for future product engineering', solution: 'Dedicated product development capability for custom MVP' },
                ]).map((r, i) => (
                  <tr key={i}><td className="p-3 font-semibold text-slate-900">{r.challenge}</td><td className="p-3">{r.solution}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 04</span>
        </div>
      </div>

      {/* PAGE 5: SOLUTION ARCHITECTURE */}
      <div 
        id="page_p5_arch"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between transition-all ${
          activePageId === 'p5_arch' ? 'ring-4 ring-lime-400' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="border-b-2 pb-2 flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ borderColor: theme, color: theme }}>
            <span>QEVN TECHNOLOGIES</span>
            <span>Ref: {doc.document_number}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 border-l-4 pl-3.5" style={{ borderColor: theme }}>
            Core Solution Architecture (Layers 1 & 2)
          </h2>
          <div className="p-4 bg-slate-50 border-l-4 rounded-r-xl" style={{ borderColor: theme }}>
            <p className="font-bold text-slate-900 text-sm">LAYER 1 — AI Research & Prospecting Engine</p>
            <p className="text-xs text-slate-600 mt-1">Defines ICP buyer personas, target industries, and company profiles. Connects to Apollo, Apify, Clay, Firecrawl, LinkedIn, and Web APIs for automated prospect extraction.</p>
          </div>
          <div className="p-4 bg-slate-50 border-l-4 border-sky-500 rounded-r-xl">
            <p className="font-bold text-slate-900 text-sm">LAYER 2 — Multi-Provider Verification Engine</p>
            <p className="text-xs text-slate-600 mt-1">Validates company existence, website health, job titles, location, and removes duplicate or invalid leads before outreach dispatch.</p>
          </div>
        </div>
        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 05</span>
        </div>
      </div>

      {/* PAGE 6: ENRICHMENT & BENEFITS */}
      <div 
        id="page_p6_enrichment"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between transition-all ${
          activePageId === 'p6_enrichment' ? 'ring-4 ring-lime-400' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="border-b-2 pb-2 flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ borderColor: theme, color: theme }}>
            <span>QEVN TECHNOLOGIES</span>
            <span>Ref: {doc.document_number}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 border-l-4 pl-3.5" style={{ borderColor: theme }}>
            Enrichment, Personalization & Benefits
          </h2>
          <div className="p-4 bg-slate-50 border-l-4 border-pink-500 rounded-r-xl">
            <p className="font-bold text-slate-900 text-sm">LAYER 3 — Data Enrichment Engine</p>
            <p className="text-xs text-slate-600 mt-1">Enriches profiles with employee counts, tech stacks, decision-maker org structures, and AI research summaries.</p>
          </div>
          <div className="p-4 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl">
            <p className="font-bold text-slate-900 text-sm">LAYER 4 — Personalized Outreach Engine</p>
            <p className="text-xs text-slate-600 mt-1">Generates unique role-specific AI copy, campaign sequencing, reply detection, and automated sending schedule.</p>
          </div>
        </div>
        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 06</span>
        </div>
      </div>

      {/* PAGE 7: MAILING INFRASTRUCTURE */}
      <div 
        id="page_p7_infra"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between transition-all ${
          activePageId === 'p7_infra' ? 'ring-4 ring-lime-400' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="border-b-2 pb-2 flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ borderColor: theme, color: theme }}>
            <span>QEVN TECHNOLOGIES</span>
            <span>Ref: {doc.document_number}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 border-l-4 pl-3.5" style={{ borderColor: theme }}>
            Intelligent Mailing Infrastructure
          </h2>
          <div className="p-3.5 bg-slate-50 border rounded-xl"><p className="font-bold text-slate-900 text-xs">Infrastructure Setup</p><p className="text-slate-500 text-[11px]">Configures secondary domains, Google Workspace mailboxes, SPF, DKIM, DMARC DNS security, and sending capacity thresholds.</p></div>
          <div className="p-3.5 bg-slate-50 border rounded-xl"><p className="font-bold text-slate-900 text-xs">Warmup Process</p><p className="text-slate-500 text-[11px]">Gradual sending volume ramp, peer-to-peer SMTP warmup, sender reputation monitoring, and spam folder prevention.</p></div>
        </div>
        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 07</span>
        </div>
      </div>

      {/* PAGE 8: DEVELOPMENT APPROACH */}
      <div 
        id="page_p8_dev"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between transition-all ${
          activePageId === 'p8_dev' ? 'ring-4 ring-lime-400' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="border-b-2 pb-2 flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ borderColor: theme, color: theme }}>
            <span>QEVN TECHNOLOGIES</span>
            <span>Ref: {doc.document_number}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 border-l-4 pl-3.5" style={{ borderColor: theme }}>
            Future Product & Development Approach
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border rounded-xl">
              <p className="font-bold text-slate-900">DEVELOPMENT APPROACH</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 mt-2 text-[11px]">
                <li>Agile 1-week rapid development sprints</li>
                <li>Interactive UI/UX prototypes</li>
                <li>Production-grade Next.js 16 & Supabase RLS</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-50 border rounded-xl">
              <p className="font-bold text-slate-900">WHAT YOU GET</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 mt-2 text-[11px]">
                <li>Production-ready clean codebase</li>
                <li>Admin & User Dashboards</li>
                <li>Cloud deployment & API integrations</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 08</span>
        </div>
      </div>

      {/* PAGE 9: CASE STUDIES */}
      <div 
        id="page_p9_cases"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between transition-all ${
          activePageId === 'p9_cases' ? 'ring-4 ring-lime-400' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="border-b-2 pb-2 flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ borderColor: theme, color: theme }}>
            <span>QEVN TECHNOLOGIES</span>
            <span>Ref: {doc.document_number}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 border-l-4 pl-3.5" style={{ borderColor: theme }}>
            Case Studies & Proof of Capability
          </h2>
          <div className="p-3.5 bg-slate-50 border rounded-xl space-y-1"><p className="font-bold text-slate-900 text-xs">1. AI Outbound Lead Generation & Calling Platform</p><p className="text-slate-600 text-[11px]">Deployed multi-agent AI pipeline generating 4,200 verified leads and ₹1.2M pipeline in 30 days.</p></div>
          <div className="p-3.5 bg-slate-50 border rounded-xl space-y-1"><p className="font-bold text-slate-900 text-xs">2. Enterprise CRM Softphone & Call Intelligence</p><p className="text-slate-600 text-[11px]">Integrated Twilio WebRTC softphone with objection analysis, boosting call volume by 300%.</p></div>
        </div>
        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 09</span>
        </div>
      </div>

      {/* PAGE 10: COMMERCIAL INVESTMENT */}
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
          <p className="text-xs text-slate-600">Proposal Ref: <strong>{doc.document_number} (v{doc.version})</strong> • Client Entity: <strong>{doc.company_name}</strong></p>
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-lime-50 text-lime-950 font-bold border-b border-slate-200">
                <tr><th className="p-3">Service Deliverable</th><th className="p-3 w-16">Qty</th><th className="p-3 w-28">Rate ({sym})</th><th className="p-3 w-32 text-right">Total ({sym})</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {doc.line_items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3"><strong className="text-slate-900">{item.serviceName}</strong><br/><span className="text-slate-500 text-[11px]">{item.description}</span></td>
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
        </div>
        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 10</span>
        </div>
      </div>

      {/* PAGE 11: MILESTONE TIMELINE */}
      <div 
        id="page_p11_timeline"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between transition-all ${
          activePageId === 'p11_timeline' ? 'ring-4 ring-lime-400' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="border-b-2 pb-2 flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ borderColor: theme, color: theme }}>
            <span>QEVN TECHNOLOGIES</span>
            <span>Ref: {doc.document_number}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 border-l-4 pl-3.5" style={{ borderColor: theme }}>
            Project Milestone Timeline
          </h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-800">
                <tr><th className="p-3 w-20">Timeline</th><th className="p-3">Milestone Title</th><th className="p-3">Key Deliverables</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {(doc.milestones || [
                  { week: 'Week 1', title: 'Discovery & ICP Research', deliverables: 'ICP definition, buyer personas, target company domain list' },
                  { week: 'Week 2', title: 'Lead Generation Pipeline', deliverables: 'AI multi-agent pipeline deployment & initial lead collection' },
                  { week: 'Week 3', title: 'Verification & Enrichment', deliverables: 'Multi-provider verification, enrichment, and CRM sync' },
                  { week: 'Week 4', title: 'Mailing Infrastructure', deliverables: 'Secondary domains, SPF/DKIM/DMARC, warmup configuration' },
                  { week: 'Week 5', title: 'Campaign Launch & Analytics', deliverables: 'Campaign dispatch, live analytics, and performance optimization' },
                ]).map((m, i) => (
                  <tr key={i}><td><strong>{m.week}</strong></td><td><strong>{m.title}</strong></td><td>{m.deliverables}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 11</span>
        </div>
      </div>

      {/* PAGE 12: DELIVERABLES CHECKLIST */}
      <div 
        id="page_p12_deliverables"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between transition-all ${
          activePageId === 'p12_deliverables' ? 'ring-4 ring-lime-400' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="border-b-2 pb-2 flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ borderColor: theme, color: theme }}>
            <span>QEVN TECHNOLOGIES</span>
            <span>Ref: {doc.document_number}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 border-l-4 pl-3.5" style={{ borderColor: theme }}>
            Comprehensive Deliverables Checklist
          </h2>
          <div className="p-4 bg-slate-50 border rounded-xl"><p className="font-bold text-slate-900 text-xs">AI LEAD GENERATION SYSTEM</p><p className="text-slate-600 text-[11px]">✓ Configured AI Multi-Agent Pipeline • ✓ ICP Research & Personas • ✓ Multi-Provider Lead Verification • ✓ Data Enrichment</p></div>
          <div className="p-4 bg-slate-50 border rounded-xl"><p className="font-bold text-slate-900 text-xs">EMAIL INFRASTRUCTURE</p><p className="text-slate-600 text-[11px]">✓ Mailbox Setup • ✓ DNS Security (SPF/DKIM/DMARC) • ✓ Warmup Protocol • ✓ Deliverability Monitoring</p></div>
          <div className="p-4 bg-slate-50 border rounded-xl"><p className="font-bold text-slate-900 text-xs">PLATFORM & SUPPORT</p><p className="text-slate-600 text-[11px]">✓ Custom CRM Integration • ✓ Admin Dashboard Access • ✓ Technical Documentation • ✓ Ongoing Maintenance</p></div>
        </div>
        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 12</span>
        </div>
      </div>

      {/* PAGE 13: TERMS & FINAL CTA */}
      <div 
        id="page_p13_terms"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] box-border shadow-2xl rounded-sm flex flex-col justify-between transition-all ${
          activePageId === 'p13_terms' ? 'ring-4 ring-lime-400' : ''
        }`}
      >
        <div className="space-y-4">
          <div className="border-b-2 pb-2 flex justify-between text-[11px] font-bold tracking-wider uppercase" style={{ borderColor: theme, color: theme }}>
            <span>QEVN TECHNOLOGIES</span>
            <span>Ref: {doc.document_number}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 border-l-4 pl-3.5" style={{ borderColor: theme }}>
            Terms & Final Sign-Off
          </h2>
          <p className="text-xs text-slate-700">This proposal is valid for 30 days. Work commences upon receipt of initial commercial milestone payment and signed acceptance.</p>
          <div className="pt-20 border-t-2 mt-20 flex justify-between text-xs text-slate-800" style={{ borderColor: theme }}>
            <div><p><strong>Presented By:</strong></p><p className="mt-10">_______________________<br/>QEVN Solutions Architecture Team</p></div>
            <div><p><strong>Accepted By Client:</strong></p><p className="mt-10">_______________________<br/>{doc.client_name} ({doc.company_name})</p></div>
          </div>
        </div>
        <div className="border-t pt-2 flex justify-between text-[10px] text-slate-400 border-slate-200">
          <span>QEVN Technologies</span>
          <span>Page 13</span>
        </div>
      </div>

    </div>
  );
};

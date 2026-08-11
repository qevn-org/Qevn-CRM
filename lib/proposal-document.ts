export interface ProposalLineItem {
  id: string;
  serviceName: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface ProposalComparisonRow {
  challenge: string;
  solution: string;
}

export interface ProposalMilestone {
  week: string;
  title: string;
  deliverables: string;
}

export interface ProposalCaseStudy {
  title: string;
  industry: string;
  problem: string;
  solution: string;
  outcome: string;
}

export interface ProposalDocument {
  id: string;
  document_number: string;
  version: number;
  proposal_title: string;
  proposal_subtitle?: string;
  company_name: string;
  client_name: string;
  recipient_email: string;
  date_str: string;
  theme_color: string;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';
  line_items: ProposalLineItem[];
  exec_summary?: string;
  comparison_rows?: ProposalComparisonRow[];
  case_studies?: ProposalCaseStudy[];
  milestones?: ProposalMilestone[];
  deliverables?: { category: string; items: string[] }[];
  terms?: string[];
  status: 'Draft' | 'Generated' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired' | 'Archived';
  accepted_at?: string;
  accepted_by_name?: string;
  accepted_by_email?: string;
}

export function getCurrencySymbol(curr: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED'): string {
  switch (curr) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'AED': return 'AED ';
    default: return '₹';
  }
}

export function calculateProposalTotals(items: ProposalLineItem[]) {
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const gstTax = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gstTax;
  return { subtotal, gstTax, grandTotal };
}

/**
 * CANONICAL 13-PAGE PROPOSAL HTML RENDERER
 * Generates all 13 Master A4 Pages matching Shrikant Proposal.pdf
 */
export function renderProposalHTML(doc: ProposalDocument): string {
  const sym = getCurrencySymbol(doc.currency);
  const { subtotal, gstTax, grandTotal } = calculateProposalTotals(doc.line_items);
  const theme = doc.theme_color || '#84cc16';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Proposal_${doc.document_number}</title>
        <style>
          @page { size: A4; margin: 0; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; color: #0f172a; background: #ffffff; line-height: 1.6; -webkit-print-color-adjust: exact; }
          
          .a4-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; position: relative; background: #ffffff; margin: 0 auto 20px auto; }
          
          /* Cover Page Styling matching Shrikant Proposal.pdf */
          .cover-page { background: linear-gradient(180deg, #ffffff 0%, #f7fee7 100%); border-bottom: 10px solid ${theme}; display: flex; flex-direction: column; justify-between; }
          .brand-header { font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
          .brand-sub { font-size: 13px; font-weight: bold; color: ${theme}; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
          .cover-title { font-size: 34px; font-weight: 900; color: #0f172a; margin-top: 120px; line-height: 1.25; max-width: 580px; }
          .cover-meta { margin-top: 140px; font-size: 13px; color: #475569; border-top: 2px solid #bef264; padding-top: 18px; }
          
          /* Page Header & Footer */
          .page-header { border-bottom: 2px solid ${theme}; padding-bottom: 8px; margin-bottom: 25px; display: flex; justify-between; font-size: 11px; font-weight: bold; color: ${theme}; text-transform: uppercase; letter-spacing: 1px; }
          .page-footer { position: absolute; bottom: 15mm; left: 20mm; right: 20mm; display: flex; justify-between; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          
          .section-title { font-size: 22px; font-weight: 900; color: #0f172a; margin-top: 10px; margin-bottom: 15px; border-left: 4px solid ${theme}; padding-left: 10px; }
          .subsection-title { font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 20px; margin-bottom: 8px; }
          p { font-size: 13px; color: #334155; margin-bottom: 12px; }
          
          /* Grid Cards */
          .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; }
          .card-title { font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 6px; }
          .card-desc { font-size: 12px; color: #475569; margin: 0; }
          
          /* Tables */
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th { background: #f7fee7; padding: 12px; text-align: left; border: 1px solid #cbd5e1; color: #365314; font-weight: bold; }
          td { padding: 12px; border: 1px solid #cbd5e1; color: #334155; }
          
          .comparison-table th { background: #0f172a; color: #ffffff; }
          .total-box { background: #f7fee7; border: 2px solid ${theme}; padding: 18px; border-radius: 12px; width: 320px; margin-left: auto; margin-top: 20px; }
          .total-row { display: flex; justify-between; font-size: 13px; margin-bottom: 6px; }
          .grand-total { display: flex; justify-between; font-size: 16px; font-weight: 900; color: #15803d; border-top: 2px solid ${theme}; padding-top: 8px; margin-top: 8px; }
          .bank-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; font-size: 11px; margin-top: 25px; }
        </style>
      </head>
      <body>
        
        <!-- PAGE 1 — COVER PAGE -->
        <div class="a4-page cover-page">
          <div>
            <div class="brand-header">Qevn <span style="color:${theme};">×</span> ${doc.company_name}</div>
            <div class="brand-sub">${doc.date_str || 'AUGUST 2026'}</div>
            <div class="cover-title">${doc.proposal_title}</div>
          </div>
          <div class="cover-meta">
            <p><strong>Prepared for:</strong> ${doc.company_name} (${doc.client_name})</p>
            <p><strong>Presented by:</strong> QEVN AI Solutions & Architecture Team</p>
            <p><strong>Proposal Reference:</strong> ${doc.document_number} (v${doc.version})</p>
          </div>
        </div>

        <!-- PAGE 2 — EXECUTIVE SUMMARY -->
        <div class="a4-page">
          <div class="page-header"><span>Qevn × ${doc.company_name}</span><span>${doc.date_str || 'AUGUST 2026'}</span></div>
          <h2 class="section-title">Executive Summary</h2>
          <p><strong>${doc.company_name}</strong> is a forward-thinking enterprise with a clear vision for scalable growth. As market dynamics become increasingly competitive, the ability to consistently identify, reach, and convert high-quality prospects determines which businesses scale.</p>
          <p>${doc.exec_summary || 'QEVN has conducted a thorough architectural review of current outbound lead generation workflows. We recognize that your company requires a modern, scalable outbound engine that moves beyond manual prospecting into fully automated AI-driven multi-agent pipelines.'}</p>
          
          <h3 class="subsection-title">Why Outbound Matters Now</h3>
          <p>Traditional manual lead generation is broken. Sourcing contacts manually, sending generic emails, and hoping for replies is no longer viable. Modern buyers expect hyper-personalized outreach. AI-powered outbound systems empower businesses to reach thousands of qualified prospects with personalized messaging at a fraction of traditional cost.</p>
          
          <h3 class="subsection-title">Why QEVN</h3>
          <p>QEVN is an AI engineering company that builds production-grade intelligent business operating systems. We don't configure off-the-shelf software; we architect custom AI pipelines built around your specific business requirements, combining multi-agent AI architectures, Twilio softphone voice bridging, and deep automation.</p>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 02</span></div>
        </div>

        <!-- PAGE 3 — ABOUT QEVN + SCOPE -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">About QEVN & Capability Scope</h2>
          <p>QEVN architects production-grade intelligent systems that combine agentic AI, enterprise data pipelines, and sales automation to deliver compounding business outcomes.</p>
          
          <h3 class="subsection-title">What We Build</h3>
          <div class="card-grid">
            <div class="card"><div class="card-title">1. Agentic AI Systems</div><p class="card-desc">Multi-layer autonomous AI pipelines for research, verification, and decision making.</p></div>
            <div class="card"><div class="card-title">2. AI Calling Agents</div><p class="card-desc">Twilio WebRTC softphone voice agents with real-time objection analysis.</p></div>
            <div class="card"><div class="card-title">3. AI Employees</div><p class="card-desc">Autonomous digital team members performing repetitive workflow operations.</p></div>
            <div class="card"><div class="card-title">4. CRM Integrations</div><p class="card-desc">Seamless sync with HubSpot, Salesforce, Supabase, and custom CRM architectures.</p></div>
            <div class="card"><div class="card-title">5. Custom SaaS Development</div><p class="card-desc">Full-stack Next.js 16 applications with RLS security and real-time websockets.</p></div>
            <div class="card"><div class="card-title">6. Workflow Automation</div><p class="card-desc">Trigger-Condition-Action automation engines powering end-to-end operations.</p></div>
          </div>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 03</span></div>
        </div>

        <!-- PAGE 4 — CLIENT CHALLENGES & SOLUTIONS -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Client Challenges vs QEVN Architectural Solution</h2>
          <p>Based on our analysis of <strong>${doc.company_name}</strong>'s growth objectives and operational capabilities:</p>
          <table class="comparison-table">
            <thead>
              <tr><th style="width:45%;">CLIENT CHALLENGE</th><th style="width:55%;">QEVN ARCHITECTURAL SOLUTION</th></tr>
            </thead>
            <tbody>
              ${(doc.comparison_rows || [
                { challenge: 'Need for qualified leads', solution: 'AI multi-agent pipeline researches & identifies high-fit prospects' },
                { challenge: 'Need for verified contacts', solution: 'Multi-provider real-time email & phone verification engine' },
                { challenge: 'Need for personalized outreach', solution: 'AI-generated prospect-specific messaging matching ICP persona' },
                { challenge: 'Need for scalable outbound', solution: 'Automated AI pipeline operating 24/7 without headcount growth' },
                { challenge: 'Need for conversion visibility', solution: 'Unified CRM analytics with call intelligence & meeting tracking' },
                { challenge: 'Need for future product engineering', solution: 'Dedicated product development capability for custom MVP' },
              ]).map(r => `<tr><td><strong>${r.challenge}</strong></td><td>${r.solution}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 04</span></div>
        </div>

        <!-- PAGE 5 — CORE SOLUTION ARCHITECTURE (LAYER 1 & 2) -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Core Solution Architecture (Layers 1 & 2)</h2>
          
          <div class="card" style="margin-bottom:15px; border-left:4px solid ${theme};">
            <div class="card-title">LAYER 1 — AI Research & Prospecting Engine</div>
            <p class="card-desc">Defines ICP buyer personas, target industries, and company profiles. Connects to Apollo, Apify, Clay, Firecrawl, LinkedIn, and Web APIs for automated prospect extraction.</p>
          </div>

          <div class="card" style="border-left:4px solid #0ea5e9;">
            <div class="card-title">LAYER 2 — Multi-Provider Verification Engine</div>
            <p class="card-desc">Validates company existence, website health, job titles, location, and removes duplicate or invalid leads before outreach dispatch.</p>
          </div>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 05</span></div>
        </div>

        <!-- PAGE 6 — ENRICHMENT, PERSONALIZATION & BENEFITS -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Data Enrichment, Personalization & Key Benefits</h2>
          
          <div class="card" style="margin-bottom:15px; border-left:4px solid #ec4899;">
            <div class="card-title">LAYER 3 — Data Enrichment Engine</div>
            <p class="card-desc">Enriches profiles with employee counts, tech stacks, decision-maker org structures, social links, and AI research summaries.</p>
          </div>

          <div class="card" style="margin-bottom:20px; border-left:4px solid #f59e0b;">
            <div class="card-title">LAYER 4 — Personalized Outreach Engine</div>
            <p class="card-desc">Generates unique role-specific AI copy, campaign sequencing, reply detection, and automated sending schedule.</p>
          </div>

          <h3 class="subsection-title">Key Business Benefits</h3>
          <div class="card-grid">
            <div class="card"><div class="card-title">✓ Higher Quality Leads</div><p class="card-desc">Verified ICP leads with high buying intent.</p></div>
            <div class="card"><div class="card-title">✓ Better Conversion</div><p class="card-desc">Hyper-personalized outreach yields 3x reply rates.</p></div>
            <div class="card"><div class="card-title">✓ Zero Extra Headcount</div><p class="card-desc">Scales pipeline without hiring manual SDRs.</p></div>
            <div class="card"><div class="card-title">✓ Real-Time Intelligence</div><p class="card-desc">Call intelligence and prospect pain point tracking.</p></div>
          </div>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 06</span></div>
        </div>

        <!-- PAGE 7 — MAILING INFRASTRUCTURE -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Intelligent Mailing Infrastructure</h2>
          <p>Premium email infrastructure engineered for high deliverability and domain reputation protection.</p>
          
          <div class="card" style="margin-bottom:12px;"><div class="card-title">Infrastructure Setup</div><p class="card-desc">Configures secondary domains, Google Workspace mailboxes, SPF, DKIM, DMARC DNS security, and sending capacity thresholds.</p></div>
          <div class="card" style="margin-bottom:12px;"><div class="card-title">Warmup Process</div><p class="card-desc">Gradual sending volume ramp, peer-to-peer SMTP warmup, sender reputation monitoring, and spam folder prevention.</p></div>
          <div class="card"><div class="card-title">AI Campaign Management</div><p class="card-desc">Daily quota management, optimal sending windows, reply detection, bounce cleaning, and live analytics reporting.</p></div>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 07</span></div>
        </div>

        <!-- PAGE 8 — DEVELOPMENT APPROACH -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Future Product & Development Approach</h2>
          <p>Following stabilization of the outbound engine, QEVN executes custom software and MVP product requirements for <strong>${doc.company_name}</strong>.</p>
          
          <div class="card-grid">
            <div class="card">
              <div class="card-title">DEVELOPMENT APPROACH</div>
              <ul style="font-size:11px; padding-left:15px; color:#475569;">
                <li>Agile 1-week rapid development sprints</li>
                <li>Interactive UI/UX prototypes</li>
                <li>Production-grade Next.js 16 & Supabase RLS</li>
                <li>Continuous integration & testing</li>
              </ul>
            </div>
            <div class="card">
              <div class="card-title">WHAT YOU GET</div>
              <ul style="font-size:11px; padding-left:15px; color:#475569;">
                <li>Production-ready clean codebase</li>
                <li>Admin & User Dashboards</li>
                <li>Cloud deployment & API integrations</li>
                <li>Full technical documentation</li>
              </ul>
            </div>
          </div>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 08</span></div>
        </div>

        <!-- PAGE 9 — CASE STUDIES -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Case Studies & Proof of Capability</h2>
          
          <div class="card" style="margin-bottom:12px;">
            <div class="card-title">1. AI Outbound Lead Generation & Calling Platform</div>
            <p class="card-desc">Deployed multi-agent AI pipeline for B2B SaaS client resulting in 4,200 verified leads and ₹1.2M qualified pipeline generated in 30 days.</p>
          </div>
          <div class="card" style="margin-bottom:12px;">
            <div class="card-title">2. Enterprise CRM Softphone & Call Intelligence</div>
            <p class="card-desc">Integrated Twilio WebRTC softphone with automated objection analysis, boosting sales team call volume by 300%.</p>
          </div>
          <div class="card">
            <div class="card-title">3. Custom SaaS Business Operating System</div>
            <p class="card-desc">Architected end-to-end custom SaaS platform with RBAC, subscription billing, and real-time analytics for 50,000 active users.</p>
          </div>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 09</span></div>
        </div>

        <!-- PAGE 10 — COMMERCIAL INVESTMENT -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Commercial Investment & Pricing Schedule</h2>
          <p>Proposal Ref: <strong>${doc.document_number} (v${doc.version})</strong> • Client Entity: <strong>${doc.company_name}</strong></p>
          
          <table>
            <thead>
              <tr><th>Service Deliverable</th><th style="width:60px;">Qty</th><th style="width:100px;">Rate (${sym})</th><th style="width:120px; text-align:right;">Total (${sym})</th></tr>
            </thead>
            <tbody>
              ${doc.line_items.map(item => `
                <tr>
                  <td><strong>${item.serviceName}</strong><br/><span style="color:#64748b; font-size:11px;">${item.description}</span></td>
                  <td>${item.quantity}</td>
                  <td>${sym}${item.rate.toLocaleString()}</td>
                  <td style="text-align:right;"><strong>${sym}${(item.quantity * item.rate).toLocaleString()}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-box">
            <div class="total-row"><span>Subtotal:</span><strong>${sym}${subtotal.toLocaleString()}</strong></div>
            <div class="total-row"><span>GST Tax (18%):</span><strong>${sym}${gstTax.toLocaleString()}</strong></div>
            <div class="grand-total"><span>Grand Total:</span><span>${sym}${grandTotal.toLocaleString()}</span></div>
          </div>

          <div class="bank-box">
            <p style="margin:0 0 5px 0; font-weight:bold; color:#0f172a;">BANK NEFT / RTGS TRANSFER DETAILS:</p>
            <p style="margin:2px 0;"><strong>Bank Name:</strong> HDFC Bank Ltd</p>
            <p style="margin:2px 0;"><strong>Account Name:</strong> QEVN TECHNOLOGIES PRIVATE LIMITED</p>
            <p style="margin:2px 0;"><strong>Account Number:</strong> 50200088991122 | <strong>IFSC:</strong> HDFC0001234</p>
            <p style="margin:2px 0;"><strong>GSTIN:</strong> 27AAAAA0000A1Z5</p>
          </div>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 10</span></div>
        </div>

        <!-- PAGE 11 — MILESTONE TIMELINE -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Project Milestone Timeline</h2>
          
          <table>
            <thead>
              <tr><th style="width:80px;">Timeline</th><th>Milestone Title</th><th>Key Deliverables</th></tr>
            </thead>
            <tbody>
              ${(doc.milestones || [
                { week: 'Week 1', title: 'Discovery & ICP Research', deliverables: 'ICP definition, buyer personas, target company domain list' },
                { week: 'Week 2', title: 'Lead Generation Pipeline', deliverables: 'AI multi-agent pipeline deployment & initial lead collection' },
                { week: 'Week 3', title: 'Verification & Enrichment', deliverables: 'Multi-provider verification, enrichment, and CRM sync' },
                { week: 'Week 4', title: 'Mailing Infrastructure', deliverables: 'Secondary domains, SPF/DKIM/DMARC, warmup configuration' },
                { week: 'Week 5', title: 'Campaign Launch & Analytics', deliverables: 'Campaign dispatch, live analytics, and performance optimization' },
              ]).map(m => `
                <tr>
                  <td><strong>${m.week}</strong></td>
                  <td><strong>${m.title}</strong></td>
                  <td>${m.deliverables}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 11</span></div>
        </div>

        <!-- PAGE 12 — DELIVERABLES CHECKLIST -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Comprehensive Deliverables Checklist</h2>
          
          <div class="card" style="margin-bottom:12px;">
            <div class="card-title">AI LEAD GENERATION SYSTEM</div>
            <p class="card-desc">✓ Configured AI Multi-Agent Pipeline • ✓ ICP Research & Personas • ✓ Multi-Provider Lead Verification • ✓ Data Enrichment</p>
          </div>
          <div class="card" style="margin-bottom:12px;">
            <div class="card-title">EMAIL INFRASTRUCTURE</div>
            <p class="card-desc">✓ Mailbox Setup • ✓ DNS Security (SPF/DKIM/DMARC) • ✓ Warmup Protocol • ✓ Deliverability Monitoring</p>
          </div>
          <div class="card">
            <div class="card-title">PLATFORM & SUPPORT</div>
            <p class="card-desc">✓ Custom CRM Integration • ✓ Admin Dashboard Access • ✓ Technical Documentation • ✓ Ongoing Maintenance</p>
          </div>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 12</span></div>
        </div>

        <!-- PAGE 13 — TERMS & FINAL CTA -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Terms & Final Sign-Off</h2>
          <p>This proposal is valid for 30 days. Work commences upon receipt of initial commercial milestone payment and signed acceptance.</p>
          
          <div style="margin-top:80px; border-top:2px solid ${theme}; padding-top:20px; display:flex; justify-between;">
            <div>
              <p><strong>Presented By:</strong></p>
              <p style="margin-top:40px;">_______________________<br/>QEVN Solutions Architecture Team</p>
            </div>
            <div>
              <p><strong>Accepted By Client:</strong></p>
              <p style="margin-top:40px;">_______________________<br/>${doc.client_name} (${doc.company_name})</p>
            </div>
          </div>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 13</span></div>
        </div>

      </body>
    </html>
  `;
}

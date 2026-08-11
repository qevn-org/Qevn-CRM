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
  milestones?: ProposalMilestone[];
  deliverables?: string[];
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
 * CANONICAL PROPOSAL HTML RENDERER
 * Shared by Live Preview, A4 PDF Generator, Public Link, and Email Attachments.
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
          .page-header { border-bottom: 2px solid ${theme}; padding-bottom: 8px; margin-bottom: 25px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; color: ${theme}; text-transform: uppercase; letter-spacing: 1px; }
          .page-footer { position: absolute; bottom: 15mm; left: 20mm; right: 20mm; display: flex; justify-between; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          
          .section-title { font-size: 22px; font-weight: 900; color: #0f172a; margin-top: 10px; margin-bottom: 15px; border-left: 4px solid ${theme}; padding-left: 10px; }
          .subsection-title { font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 20px; margin-bottom: 8px; }
          p { font-size: 13px; color: #334155; margin-bottom: 12px; }
          
          /* Tables & Cards */
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th { background: #f7fee7; padding: 12px; text-align: left; border: 1px solid #cbd5e1; color: #365314; font-weight: bold; }
          td { padding: 12px; border: 1px solid #cbd5e1; color: #334155; }
          
          .comparison-table th { background: #0f172a; color: #ffffff; }
          .total-box { background: #f7fee7; border: 2px solid ${theme}; padding: 18px; border-radius: 12px; width: 320px; margin-left: auto; margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
          .grand-total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #15803d; border-top: 2px solid ${theme}; padding-top: 8px; margin-top: 8px; }
          
          .bank-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; font-size: 11px; margin-top: 25px; }
        </style>
      </head>
      <body>
        <!-- PAGE 1: COVER -->
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

        <!-- PAGE 2: EXECUTIVE SUMMARY -->
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

        <!-- PAGE 3: CHALLENGES & SOLUTIONS -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Challenges & QEVN Solution Matrix</h2>
          <table class="comparison-table">
            <thead>
              <tr>
                <th style="width: 45%;">CLIENT CHALLENGE</th>
                <th style="width: 55%;">QEVN ARCHITECTURAL SOLUTION</th>
              </tr>
            </thead>
            <tbody>
              ${(doc.comparison_rows || [
                { challenge: 'High cost & slow manual prospecting', solution: 'AI multi-agent pipeline scales outreach at 1/10th traditional cost' },
                { challenge: 'Low email reply rates & spam risks', solution: 'Hyper-personalized messaging with domain protection & warmups' },
                { challenge: 'Unverified lead data & high bounce rates', solution: 'Multi-provider real-time verification before dispatch' },
              ]).map(r => `
                <tr>
                  <td><strong>${r.challenge}</strong></td>
                  <td>${r.solution}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 03</span></div>
        </div>

        <!-- PAGE 4: COMMERCIAL INVESTMENT -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Commercial Investment & Pricing Schedule</h2>
          <p>Proposal Ref: <strong>${doc.document_number} (v${doc.version})</strong> • Client Entity: <strong>${doc.company_name}</strong></p>
          
          <table>
            <thead>
              <tr>
                <th>Service Deliverable</th>
                <th style="width: 60px;">Qty</th>
                <th style="width: 100px;">Rate (${sym})</th>
                <th style="width: 120px; text-align: right;">Total (${sym})</th>
              </tr>
            </thead>
            <tbody>
              ${doc.line_items.map(item => `
                <tr>
                  <td><strong>${item.serviceName}</strong><br/><span style="color:#64748b; font-size:11px;">${item.description}</span></td>
                  <td>${item.quantity}</td>
                  <td>${sym}${item.rate.toLocaleString()}</td>
                  <td style="text-align: right;"><strong>${sym}${(item.quantity * item.rate).toLocaleString()}</strong></td>
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
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 04</span></div>
        </div>

        <!-- PAGE 5: SIGN-OFF -->
        <div class="a4-page">
          <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${doc.document_number}</span></div>
          <h2 class="section-title">Terms & Final CTA Sign-Off</h2>
          <p>This proposal is valid for 30 days. Work commences upon receipt of initial commercial milestone payment and signed acceptance.</p>
          
          <div style="margin-top: 100px; border-top: 2px solid ${theme}; padding-top: 20px; display: flex; justify-content: space-between;">
            <div>
              <p><strong>Presented By:</strong></p>
              <p style="margin-top: 40px;">_______________________<br/>QEVN Solutions Architecture Team</p>
            </div>
            <div>
              <p><strong>Accepted By Client:</strong></p>
              <p style="margin-top: 40px;">_______________________<br/>${doc.client_name} (${doc.company_name})</p>
            </div>
          </div>
          <div class="page-footer"><span>QEVN Technologies</span><span>Page 05</span></div>
        </div>
      </body>
    </html>
  `;
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { TargetType, downloadSampleTemplate } from '@/lib/import/sample-templates';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { showToast } from '@/components/ui/toast';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Save,
  Trash2,
  Building2,
  Users,
  UserCheck,
  Briefcase,
  RefreshCw,
  Layers,
  FileText,
  Loader2,
  Sparkles
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// CRM Target Fields definition
const CRM_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: 'client_name', label: 'Full Name', required: true },
  { key: 'company_name', label: 'Company Name', required: true },
  { key: 'email', label: 'Email Address' },
  { key: 'phone', label: 'Mobile / Phone' },
  { key: 'designation', label: 'Job Title / Designation' },
  { key: 'website', label: 'Website' },
  { key: 'linkedin', label: 'LinkedIn Profile' },
  { key: 'industry', label: 'Industry' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'lead_source', label: 'Lead Source' },
  { key: 'notes', label: 'Notes' }
];

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, importTemplates, saveImportTemplate, deleteImportTemplate } = useStore();

  // Step state (1: File Upload, 2: Column Mapping, 3: Validation & Rules, 4: Preview & Execute, 5: Summary)
  const [step, setStep] = useState<number>(1);
  const [targetLocation, setTargetLocation] = useState<TargetType>('Leads');

  // File state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [parsedRawData, setParsedRawData] = useState<Record<string, any>[]>([]);

  // Mapping state: crm_field_key -> spreadsheet_column_header
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [templateName, setTemplateName] = useState<string>('');

  // Duplicate & Validation state
  const [duplicateCheckFields, setDuplicateCheckFields] = useState<('email' | 'phone' | 'company')[]>(['email', 'phone', 'company']);
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update' | 'create'>('skip');
  const [skipInvalidRows, setSkipInvalidRows] = useState<boolean>(true);

  // Execution & Progress state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [importSummary, setImportSummary] = useState<{
    totalProcessed: number;
    imported: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: Array<{ row: number; reason: string }>;
  } | null>(null);

  // Reset modal state
  const resetModal = () => {
    setStep(1);
    setFile(null);
    setFileHeaders([]);
    setParsedRawData([]);
    setMapping({});
    setTemplateName('');
    setIsProcessing(false);
    setProgress(0);
    setImportSummary(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Auto-map file headers to CRM fields when file is parsed
  const autoMapHeaders = (headers: string[]) => {
    const newMapping: Record<string, string> = {};

    CRM_FIELDS.forEach((crmField) => {
      const match = headers.find((h) => {
        const hNorm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        const labelNorm = crmField.label.toLowerCase().replace(/[^a-z0-9]/g, '');
        const keyNorm = crmField.key.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (labelNorm === 'fullname' && (hNorm === 'name' || hNorm === 'fullname' || hNorm === 'contactperson')) return true;
        if (labelNorm === 'companyname' && (hNorm === 'company' || hNorm === 'companyname' || hNorm === 'organization')) return true;
        if (labelNorm === 'emailaddress' && (hNorm === 'email' || hNorm === 'emailaddress')) return true;
        if (labelNorm === 'mobilephone' && (hNorm === 'phone' || hNorm === 'mobile' || hNorm === 'phonenumber' || hNorm === 'cell')) return true;
        if (labelNorm === 'jobtitledesignation' && (hNorm === 'title' || hNorm === 'jobtitle' || hNorm === 'designation')) return true;
        if (labelNorm === 'leadsource' && (hNorm === 'source' || hNorm === 'leadsource')) return true;

        return hNorm === labelNorm || hNorm === keyNorm;
      });

      if (match) {
        newMapping[crmField.key] = match;
      }
    });

    setMapping(newMapping);
  };

  // Read and parse uploaded CSV/Excel file
  const processFile = (uploadedFile: File) => {
    const ext = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      showToast('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)', 'error');
      return;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) {
      showToast('File size exceeds 10MB limit', 'warning');
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const json: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length === 0) {
          showToast('The uploaded spreadsheet contains no data rows', 'warning');
          setFile(null);
          return;
        }

        const headers = Object.keys(json[0]);
        setFileHeaders(headers);
        setParsedRawData(json);
        autoMapHeaders(headers);
        showToast(`Parsed ${json.length} rows from ${uploadedFile.name}`, 'success');
      } catch (err) {
        console.error('File reading error:', err);
        showToast('Failed to parse file content. Please check file format.', 'error');
        setFile(null);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Saved Template Handlers
  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      showToast('Please enter a template name', 'warning');
      return;
    }
    saveImportTemplate({
      name: templateName.trim(),
      target: targetLocation,
      mapping
    });
    showToast(`Template "${templateName.trim()}" saved successfully`, 'success');
    setTemplateName('');
  };

  const handleApplyTemplate = (tmplId: string) => {
    const tmpl = importTemplates.find((t) => t.id === tmplId);
    if (tmpl) {
      setMapping(tmpl.mapping);
      showToast(`Applied template "${tmpl.name}"`, 'success');
    }
  };

  // Format validation helpers
  const validateEmail = (emailStr: string) => {
    if (!emailStr.trim()) return true; // Optional field
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const validatePhone = (phoneStr: string) => {
    if (!phoneStr.trim()) return true; // Optional field
    return /^[\d\+\-\(\)\s\.]{7,25}$/.test(phoneStr.trim());
  };

  // Convert raw row to mapped record & validate
  const getMappedRecord = (row: Record<string, any>) => {
    const mapped: Record<string, string> = {};
    CRM_FIELDS.forEach((f) => {
      const colHeader = mapping[f.key];
      mapped[f.key] = colHeader ? String(row[colHeader] || '').trim() : '';
    });
    return mapped;
  };

  // Validate all parsed rows
  const evaluatedRows = parsedRawData.map((rawRow, index) => {
    const mapped = getMappedRecord(rawRow);
    const errors: string[] = [];

    // Required fields check
    if (!mapped.client_name && !mapped.company_name) {
      errors.push('Missing Name or Company');
    }
    if (mapped.email && !validateEmail(mapped.email)) {
      errors.push('Invalid Email Format');
    }
    if (mapped.phone && !validatePhone(mapped.phone)) {
      errors.push('Invalid Phone Format');
    }

    const isValid = errors.length === 0;

    return {
      rowIndex: index + 1,
      rawRow,
      mapped,
      isValid,
      errors
    };
  });

  const validRowsCount = evaluatedRows.filter((r) => r.isValid).length;
  const invalidRowsCount = evaluatedRows.filter((r) => !r.isValid).length;

  // Execute import process
  const handleExecuteImport = async () => {
    if (!user) {
      showToast('You must be logged in to import data', 'error');
      return;
    }

    const rowsToImport = skipInvalidRows
      ? evaluatedRows.filter((r) => r.isValid).map((r) => r.mapped)
      : evaluatedRows.map((r) => r.mapped);

    if (rowsToImport.length === 0) {
      showToast('No valid records available to import', 'warning');
      return;
    }

    setIsProcessing(true);
    setProgress(20);

    try {
      // Small simulated delay for progress feedback
      const progressTimer = setInterval(() => {
        setProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 200);

      const summary = await db.bulkImportRecords(
        user.id,
        targetLocation,
        rowsToImport as any,
        duplicateAction,
        duplicateCheckFields
      );

      clearInterval(progressTimer);
      setProgress(100);

      setImportSummary(summary);
      setStep(5);
      showToast(`Import completed! ${summary.imported} created, ${summary.updated} updated.`, 'success');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      showToast('Import execution failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} className="max-w-4xl w-full p-0 overflow-hidden">
      <div className="flex flex-col h-[680px] max-h-[90vh] bg-card text-card-foreground">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/20 bg-secondary/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Import Data into CRM</h2>
              <p className="text-xs text-muted-foreground">
                Step {step} of 5 — {step === 1 && 'Select Target & File Upload'}
                {step === 2 && 'Column Mapping'}
                {step === 3 && 'Duplicate & Validation Rules'}
                {step === 4 && 'Preview Data & Execute'}
                {step === 5 && 'Import Summary Report'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary/60 hover:text-foreground cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step Progress Indicator Bar */}
        <div className="w-full bg-secondary/30 h-1 flex">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 transition-all duration-300 ${
                s <= step ? 'bg-primary' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Target Selection & File Upload */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Target Location Cards */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
                  1. Select Import Destination
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { type: 'Leads', icon: Users, desc: 'New prospects & pipeline entries' },
                    { type: 'Contacts', icon: UserCheck, desc: 'Engaged individuals' },
                    { type: 'Clients', icon: Briefcase, desc: 'Active customers & won deals' },
                    { type: 'Companies', icon: Building2, desc: 'Accounts & Organizations' }
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setTargetLocation(item.type as TargetType)}
                      className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left cursor-pointer ${
                        targetLocation === item.type
                          ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20 ring-1 ring-primary'
                          : 'border-border/40 bg-secondary/20 hover:bg-secondary/40'
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 mb-2 ${
                          targetLocation === item.type ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                      <span className="text-sm font-semibold text-foreground">{item.type}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Zone */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
                  2. Upload Spreadsheet File
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                    dragActive
                      ? 'border-primary bg-primary/10'
                      : file
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-border/60 hover:border-primary/50 bg-secondary/10'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {file ? (
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB — {parsedRawData.length} records ready
                        </p>
                      </div>
                      <span className="text-xs text-primary underline pt-1">Click or drag to change file</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <UploadCloud className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Drag and drop your spreadsheet here, or <span className="text-primary underline">Browse</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supported formats: CSV (.csv), Excel (.xlsx, .xls) up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Template Download Bar */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-secondary/20">
                <div className="flex items-center space-x-3">
                  <Download className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Need a starting format?</p>
                    <p className="text-[11px] text-muted-foreground">
                      Download sample template with standard headers for {targetLocation}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadSampleTemplate(targetLocation, 'csv')}
                    className="text-xs"
                  >
                    CSV Template
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadSampleTemplate(targetLocation, 'xlsx')}
                    className="text-xs"
                  >
                    Excel Template
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Template Load Bar */}
              {importTemplates.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-secondary/30">
                  <span className="text-xs font-medium text-muted-foreground">Saved Mapping Templates:</span>
                  <div className="flex items-center space-x-2">
                    <select
                      onChange={(e) => e.target.value && handleApplyTemplate(e.target.value)}
                      defaultValue=""
                      className="bg-secondary text-foreground text-xs rounded-lg px-2.5 py-1.5 border border-border/40 focus:outline-none"
                    >
                      <option value="" disabled>
                        Select a saved template...
                      </option>
                      {importTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.target})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Map Spreadsheet Columns to CRM Fields</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Match each column from <span className="font-semibold">{file?.name}</span> to the corresponding CRM attribute.
                </p>

                <div className="border border-border/30 rounded-xl overflow-hidden divide-y divide-border/20 bg-secondary/10">
                  <div className="grid grid-cols-12 px-4 py-2.5 bg-secondary/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-5">CRM Field</div>
                    <div className="col-span-1 text-center">Mapped</div>
                    <div className="col-span-6">Spreadsheet Column</div>
                  </div>

                  {CRM_FIELDS.map((field) => {
                    const isMapped = !!mapping[field.key];
                    return (
                      <div key={field.key} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-secondary/20 transition-colors">
                        <div className="col-span-5 flex items-center space-x-2">
                          <span className="text-xs font-semibold text-foreground">{field.label}</span>
                          {field.required && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-1.5 py-0.5 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {isMapped ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-amber-400/50" />
                          )}
                        </div>
                        <div className="col-span-6">
                          <select
                            value={mapping[field.key] || ''}
                            onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                            className="w-full bg-secondary/50 border border-border/40 text-foreground text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">-- Don&apos;t Import --</option>
                            {fileHeaders.map((header) => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Mapping Template Input */}
              <div className="flex items-center space-x-2 p-3 rounded-xl border border-border/30 bg-secondary/20">
                <Save className="h-4 w-4 text-muted-foreground ml-1" />
                <input
                  type="text"
                  placeholder="Save current mapping as template (e.g., Salesforce Export format)"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-foreground placeholder-muted-foreground focus:outline-none px-2"
                />
                <Button size="sm" variant="outline" onClick={handleSaveTemplate} className="text-xs">
                  Save Template
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Duplicate & Validation Rules */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Duplicate Handling Section */}
              <div className="p-4 rounded-xl border border-border/30 bg-secondary/10 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    1. Duplicate Detection Fields
                  </h4>
                  <p className="text-xs text-muted-foreground">Select criteria to identify existing CRM records:</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {[
                    { id: 'email', label: 'Email Address' },
                    { id: 'phone', label: 'Phone Number' },
                    { id: 'company', label: 'Company Name' }
                  ].map((field) => (
                    <label key={field.id} className="flex items-center space-x-2 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={duplicateCheckFields.includes(field.id as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDuplicateCheckFields([...duplicateCheckFields, field.id as any]);
                          } else {
                            setDuplicateCheckFields(duplicateCheckFields.filter((f) => f !== field.id));
                          }
                        }}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-2 border-t border-border/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    2. Action when duplicate is found
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: 'skip', title: 'Skip Duplicates', desc: 'Ignore duplicate records and preserve existing CRM data' },
                      { value: 'update', title: 'Update Existing Records', desc: 'Overwrite empty fields in existing record with imported data' },
                      { value: 'create', title: 'Create Duplicate Records', desc: 'Always insert a new record regardless of existing duplicates' }
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                          duplicateAction === opt.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border/30 bg-secondary/20 hover:bg-secondary/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="duplicateAction"
                          value={opt.value}
                          checked={duplicateAction === opt.value}
                          onChange={() => setDuplicateAction(opt.value as any)}
                          className="mt-0.5 text-primary focus:ring-primary h-4 w-4"
                        />
                        <div className="ml-3">
                          <span className="text-xs font-semibold text-foreground">{opt.title}</span>
                          <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Validation Rules */}
              <div className="p-4 rounded-xl border border-border/30 bg-secondary/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Data Validation Options
                    </h4>
                    <p className="text-xs text-muted-foreground">Row health status and error handling:</p>
                  </div>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipInvalidRows}
                      onChange={(e) => setSkipInvalidRows(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>Automatically skip invalid rows during import</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-emerald-300">{validRowsCount} Valid Rows</span>
                      <p className="text-[10px] text-emerald-400/80">Ready for instant import</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-amber-300">{invalidRowsCount} Invalid Rows</span>
                      <p className="text-[10px] text-amber-400/80">Formatting or required field warnings</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Preview Data & Execute */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Import Preview</h3>
                  <p className="text-xs text-muted-foreground">
                    Showing preview of {evaluatedRows.length} parsed records. Target destination: <span className="font-bold text-primary">{targetLocation}</span>
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {skipInvalidRows ? `${validRowsCount} Rows Will Import` : `${evaluatedRows.length} Total Rows`}
                </Badge>
              </div>

              {/* Data Table Preview */}
              <div className="border border-border/30 rounded-xl overflow-x-auto max-h-80 bg-secondary/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/40 text-[11px] font-bold text-muted-foreground uppercase sticky top-0 border-b border-border/20">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Full Name</th>
                      <th className="p-2.5">Company</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Designation</th>
                      <th className="p-2.5">Validation Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 font-mono text-[11px]">
                    {evaluatedRows.slice(0, 50).map((row) => (
                      <tr key={row.rowIndex} className={!row.isValid ? 'bg-amber-500/5' : 'hover:bg-secondary/20'}>
                        <td className="p-2.5 font-bold text-muted-foreground">{row.rowIndex}</td>
                        <td className="p-2.5">
                          {row.isValid ? (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              Invalid
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-sans font-medium text-foreground">{row.mapped.client_name || '-'}</td>
                        <td className="p-2.5 font-sans text-foreground">{row.mapped.company_name || '-'}</td>
                        <td className="p-2.5 text-muted-foreground">{row.mapped.email || '-'}</td>
                        <td className="p-2.5 text-muted-foreground">{row.mapped.phone || '-'}</td>
                        <td className="p-2.5 font-sans text-muted-foreground">{row.mapped.designation || '-'}</td>
                        <td className="p-2.5 font-sans">
                          {row.isValid ? (
                            <span className="text-emerald-400 text-[10px]">Passes validation</span>
                          ) : (
                            <span className="text-amber-400 text-[10px]">{row.errors.join(', ')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isProcessing && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-primary">
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Importing records into {targetLocation}...
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-secondary/50 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Import Summary Report */}
          {step === 5 && importSummary && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Import Process Completed</h3>
                <p className="text-xs text-muted-foreground max-w-md mt-1">
                  Data has been successfully parsed and processed into the CRM database.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl border border-border/30 bg-secondary/20 text-center">
                  <span className="text-xs text-muted-foreground block">Processed</span>
                  <span className="text-xl font-bold text-foreground">{importSummary.totalProcessed}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center">
                  <span className="text-xs text-emerald-300 block">Imported</span>
                  <span className="text-xl font-bold text-emerald-400">{importSummary.imported}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-center">
                  <span className="text-xs text-blue-300 block">Updated</span>
                  <span className="text-xl font-bold text-blue-400">{importSummary.updated}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center">
                  <span className="text-xs text-amber-300 block">Skipped</span>
                  <span className="text-xl font-bold text-amber-400">{importSummary.skipped}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-center">
                  <span className="text-xs text-red-300 block">Failed</span>
                  <span className="text-xl font-bold text-red-400">{importSummary.failed}</span>
                </div>
              </div>

              {/* Error Details Table (if any) */}
              {importSummary.errors.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Failed Rows & Error Details
                  </h4>
                  <div className="border border-red-500/30 rounded-xl overflow-hidden bg-red-500/5 max-h-40 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-red-500/10 text-red-300 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2">Row</th>
                          <th className="p-2">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-500/20 font-mono">
                        {importSummary.errors.map((err, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-bold text-foreground">Row {err.row}</td>
                            <td className="p-2 text-red-300">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/20 bg-secondary/20">
          <div>
            {step > 1 && step < 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(step - 1)}
                disabled={isProcessing}
                className="text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {step === 1 && (
              <Button
                size="sm"
                onClick={() => setStep(2)}
                disabled={!file || parsedRawData.length === 0}
                className="text-xs"
              >
                Next: Map Columns <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}

            {step === 2 && (
              <Button
                size="sm"
                onClick={() => setStep(3)}
                disabled={!mapping['client_name'] && !mapping['company_name']}
                className="text-xs"
              >
                Next: Validation Rules <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}

            {step === 3 && (
              <Button size="sm" onClick={() => setStep(4)} className="text-xs">
                Next: Data Preview <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}

            {step === 4 && (
              <Button
                size="sm"
                onClick={handleExecuteImport}
                disabled={isProcessing || validRowsCount === 0}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Confirm & Start Import
                  </>
                )}
              </Button>
            )}

            {step === 5 && (
              <Button size="sm" onClick={handleClose} className="text-xs">
                Done & View Records
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
};

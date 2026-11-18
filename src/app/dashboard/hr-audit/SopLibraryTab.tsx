'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import JdLibraryView from './JdLibraryView';
import { ALL_SOPS } from './sopData';


export interface FactorySop {
  id: string;
  code: string; // Document No: e.g. 'EGS/SCP-054'
  edition: string; // Edition: e.g. '02'
  pageInfo: string; // Page count e.g. 'Page 1 of 10'
  initialIssuedDate: string; // Initial Issued Date: e.g. '10-11-2023'
  amendDate: string; // Amend Date: e.g. '10-10-2025'
  effectiveDate: string; // Effective Date: e.g. '11-11-2024'
  category: string;
  categoryKh: string;
  titleKh: string;
  titleEn: string;
  titleCn?: string; // Chinese title e.g. '风险评估政策'
  companyName: string;
  productType: string;
  preparedBy: string;
  preparedRole: string;
  preparedDate: string;
  approvedBy: string;
  approvedRole: string;
  approvedDate: string;
  contentKh: string;
  contentEn: string;
  revisions: {
    rev: string;
    date: string;
    paragraph: string;
    summary: string;
    authorizedBy: string;
  }[];
}

const DEFAULT_SOPS: FactorySop[] = ALL_SOPS;

interface SopLibraryTabProps {
  handlePrintTemplate: (elementId: string) => void;
  handleExportPdf: (elementId: string, filename: string) => void;
}

interface BilingualClause {
  khmerTitle: string;
  khmerBody: string;
  englishTitle: string;
  englishBody: string;
}

function extractTotalPages(pageInfo: string | undefined): number {
  if (!pageInfo) return 1;
  const match = pageInfo.match(/of\s*(\d+)/i) || pageInfo.match(/\/\s*(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }
  return 1;
}

function distributeClausesToFitPages(clauses: BilingualClause[]): BilingualClause[][] {
  if (clauses.length === 0) return [[]];

  // Estimate render height of each clause in pixels (bilingual 1-row table)
  const getClauseHeight = (c: BilingualClause) => {
    const khLines = Math.max(1, Math.ceil((c.khmerBody?.length || 1) / 55));
    const enLines = Math.max(1, Math.ceil((c.englishBody?.length || 1) / 65));
    return 45 + khLines * 19 + enLines * 17;
  };

  const totalClausesHeight = clauses.reduce((sum, c) => sum + getClauseHeight(c), 0);

  // If all clauses + revision table (~150px) fit on 1 single A4 page with full header (~220px)
  // Usable height on Page 1: ~1000px - 220px (header) - 150px (revision) = ~630px
  if (totalClausesHeight <= 630) {
    return [clauses];
  }

  // Otherwise, pack clauses naturally:
  // Page 1 has big header (~220px), usable: ~760px.
  // Page 2, 3... only have a slim running header (~35px), usable: ~880px (or ~750px on last page with revision table).
  const pages: BilingualClause[][] = [];
  let currentPage: BilingualClause[] = [];
  let currentHeight = 0;

  for (let i = 0; i < clauses.length; i++) {
    const clause = clauses[i];
    const cH = getClauseHeight(clause);
    const isFirstPage = pages.length === 0;
    const isLastClause = i === clauses.length - 1;
    const pageCapacity = isFirstPage ? 760 : (isLastClause ? 750 : 880);

    if (currentPage.length > 0 && currentHeight + cH > pageCapacity) {
      pages.push(currentPage);
      currentPage = [clause];
      currentHeight = cH;
    } else {
      currentPage.push(clause);
      currentHeight += cH;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [clauses];
}

function parseBilingualClauses(contentKh: string, contentEn: string): BilingualClause[] {
  const splitSections = (text: string) => {
    const lines = text.trim().split('\n');
    const sections: { title: string; body: string }[] = [];
    let currentTitle = '';
    let currentBody: string[] = [];
    // Match line starting with number (Khmer or Latin digits: ១-៩ or 1-9) followed by . ) : -
    const secRegex = /^[១-៩1-9]\s*[\.\、\)\:\-]\s*(.*)$/;

    for (const raw of lines) {
      const line = raw.trim();
      const match = line.match(secRegex);
      if (match) {
        if (currentTitle || currentBody.length > 0) {
          sections.push({
            title: currentTitle,
            body: currentBody.join('\n').trim(),
          });
          currentBody = [];
        }
        currentTitle = line;
      } else {
        currentBody.push(raw);
      }
    }
    if (currentTitle || currentBody.length > 0) {
      sections.push({
        title: currentTitle,
        body: currentBody.join('\n').trim(),
      });
    }
    return sections;
  };

  const khSections = splitSections(contentKh);
  const enSections = splitSections(contentEn);

  if (khSections.length === 0 && enSections.length === 0) {
    return [{
      khmerTitle: '',
      khmerBody: contentKh,
      englishTitle: '',
      englishBody: contentEn,
    }];
  }

  const maxLen = Math.max(khSections.length, enSections.length);
  const clauses: BilingualClause[] = [];

  for (let i = 0; i < maxLen; i++) {
    const kh = khSections[i] || { title: '', body: '' };
    const en = enSections[i] || { title: '', body: '' };
    clauses.push({
      khmerTitle: kh.title,
      khmerBody: kh.body,
      englishTitle: en.title,
      englishBody: en.body,
    });
  }

  return clauses;
}

async function callTranslateApi(text: string, fromLang: 'km' | 'en'): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    const res = await fetch('/api/contracts/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.trim(),
        sourceLang: fromLang,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const result = fromLang === 'km' ? data.en : data.km;
      if (result) return result;
    }
  } catch (err) {
    console.error('API translate error, trying fallback:', err);
  }

  // Fallback direct endpoint
  try {
    const tl = fromLang === 'km' ? 'en' : 'km';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${tl}&dt=t&q=${encodeURIComponent(text.trim())}`;
    const fRes = await fetch(url);
    const fData = await fRes.json();
    if (Array.isArray(fData) && Array.isArray(fData[0])) {
      return fData[0].map((item: any) => item[0]).join('');
    }
  } catch (fErr) {
    console.error('Fallback translate error:', fErr);
  }

  return '';
}

export default function SopLibraryTab({ handlePrintTemplate, handleExportPdf }: SopLibraryTabProps) {
  const [sops, setSops] = useState<FactorySop[]>(DEFAULT_SOPS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mainSection, setMainSection] = useState<'sops' | 'jds'>('sops');

  // Modals state
  const [editingSop, setEditingSop] = useState<FactorySop | null>(null);
  const [previewSop, setPreviewSop] = useState<FactorySop | null>(null);
  const [editingHeaderSop, setEditingHeaderSop] = useState<FactorySop | null>(null);
  const [applySopHeaderToAll, setApplySopHeaderToAll] = useState<boolean>(false);
  const [previewLayoutMode, setPreviewLayoutMode] = useState<'1row' | 'paragraph'>('1row');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [previewMultiPageMode, setPreviewMultiPageMode] = useState<'all' | 'single'>('all');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Bilingual Interactive 1-Row Editor States
  const [editingClauses, setEditingClauses] = useState<BilingualClause[]>([]);
  const [editEditorMode, setEditEditorMode] = useState<'table' | 'raw'>('table');
  const [translatingRowIndex, setTranslatingRowIndex] = useState<number | null>(null);
  const [isTranslatingAll, setIsTranslatingAll] = useState<boolean>(false);
  const [autoTranslateOnBlur, setAutoTranslateOnBlur] = useState<boolean>(true);

  // Open edit modal and parse clauses
  const handleOpenEditModal = (sop: FactorySop) => {
    setEditingSop({ ...sop });
    const parsed = parseBilingualClauses(sop.contentKh, sop.contentEn);
    setEditingClauses(parsed);
    setEditEditorMode('table');
  };

  // Sync editingClauses back to editingSop
  const syncClausesToEditingSop = (clauses: BilingualClause[]) => {
    if (!editingSop) return;
    const khmerText = clauses
      .map((c) => {
        const title = c.khmerTitle.trim();
        const body = c.khmerBody.trim();
        return title ? (body ? `${title}\n${body}` : title) : body;
      })
      .filter(Boolean)
      .join('\n\n');

    const englishText = clauses
      .map((c) => {
        const title = c.englishTitle.trim();
        const body = c.englishBody.trim();
        return title ? (body ? `${title}\n${body}` : title) : body;
      })
      .filter(Boolean)
      .join('\n\n');

    setEditingSop((prev) => (prev ? { ...prev, contentKh: khmerText, contentEn: englishText } : null));
  };

  // Update a field inside a specific clause
  const handleUpdateClause = (idx: number, field: keyof BilingualClause, value: string) => {
    const updated = [...editingClauses];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditingClauses(updated);
    syncClausesToEditingSop(updated);
  };

  // Add a new clause row
  const handleAddNewClause = () => {
    const nextNum = editingClauses.length + 1;
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    const khNum = String(nextNum).split('').map((d) => khmerDigits[parseInt(d, 10)] || d).join('');
    const newClause: BilingualClause = {
      khmerTitle: `${khNum}. ចំណុចថ្មី New Section`,
      khmerBody: '',
      englishTitle: `${nextNum}. NEW SECTION`,
      englishBody: '',
    };
    const updated = [...editingClauses, newClause];
    setEditingClauses(updated);
    syncClausesToEditingSop(updated);
  };

  // Delete a clause row
  const handleDeleteClause = (idx: number) => {
    if (editingClauses.length <= 1) return;
    const updated = editingClauses.filter((_, i) => i !== idx);
    setEditingClauses(updated);
    syncClausesToEditingSop(updated);
  };

  // Translate a single clause row
  const handleTranslateRow = async (idx: number, fromLang: 'km' | 'en') => {
    const clause = editingClauses[idx];
    if (!clause) return;
    setTranslatingRowIndex(idx);
    try {
      if (fromLang === 'km') {
        const [transTitle, transBody] = await Promise.all([
          callTranslateApi(clause.khmerTitle, 'km'),
          callTranslateApi(clause.khmerBody, 'km'),
        ]);
        const updated = [...editingClauses];
        updated[idx] = {
          ...updated[idx],
          englishTitle: transTitle || updated[idx].englishTitle,
          englishBody: transBody || updated[idx].englishBody,
        };
        setEditingClauses(updated);
        syncClausesToEditingSop(updated);
      } else {
        const [transTitle, transBody] = await Promise.all([
          callTranslateApi(clause.englishTitle, 'en'),
          callTranslateApi(clause.englishBody, 'en'),
        ]);
        const updated = [...editingClauses];
        updated[idx] = {
          ...updated[idx],
          khmerTitle: transTitle || updated[idx].khmerTitle,
          khmerBody: transBody || updated[idx].khmerBody,
        };
        setEditingClauses(updated);
        syncClausesToEditingSop(updated);
      }
    } catch (err) {
      console.error('Row translate error:', err);
    } finally {
      setTranslatingRowIndex(null);
    }
  };

  // Translate all clauses
  const handleTranslateAll = async (fromLang: 'km' | 'en') => {
    if (editingClauses.length === 0) return;
    setIsTranslatingAll(true);
    try {
      const updated = [...editingClauses];
      for (let i = 0; i < updated.length; i++) {
        const c = updated[i];
        if (fromLang === 'km' && (c.khmerTitle || c.khmerBody)) {
          const [transTitle, transBody] = await Promise.all([
            callTranslateApi(c.khmerTitle, 'km'),
            callTranslateApi(c.khmerBody, 'km'),
          ]);
          updated[i] = {
            ...updated[i],
            englishTitle: transTitle || updated[i].englishTitle,
            englishBody: transBody || updated[i].englishBody,
          };
        } else if (fromLang === 'en' && (c.englishTitle || c.englishBody)) {
          const [transTitle, transBody] = await Promise.all([
            callTranslateApi(c.englishTitle, 'en'),
            callTranslateApi(c.englishBody, 'en'),
          ]);
          updated[i] = {
            ...updated[i],
            khmerTitle: transTitle || updated[i].khmerTitle,
            khmerBody: transBody || updated[i].khmerBody,
          };
        }
      }
      setEditingClauses(updated);
      syncClausesToEditingSop(updated);
      Swal.fire({
        icon: 'success',
        title: 'បកប្រែជោគជ័យ!',
        text: `បានបកប្រែគ្រប់ ${updated.length} ផ្នែកដោយជោគជ័យ។`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Error', 'បរាជ័យក្នុងការបកប្រែ: ' + err.message, 'error');
    } finally {
      setIsTranslatingAll(false);
    }
  };

  // Handle onBlur auto-translation
  const handleClauseBlur = async (idx: number, source: 'kh' | 'en') => {
    if (!autoTranslateOnBlur) return;
    const clause = editingClauses[idx];
    if (!clause) return;

    if (source === 'kh' && clause.khmerBody.trim() && !clause.englishBody.trim()) {
      handleTranslateRow(idx, 'km');
    } else if (source === 'en' && clause.englishBody.trim() && !clause.khmerBody.trim()) {
      handleTranslateRow(idx, 'en');
    }
  };

  // Multi-Page PDF Exporter: Captures ALL pages into one cohesive PDF document
  const handleExportAllPagesPdf = async () => {
    if (!previewSop) return;
    try {
      setIsExportingPdf(true);
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const clauses = parseBilingualClauses(previewSop.contentKh, previewSop.contentEn);
      const distributedPages = distributeClausesToFitPages(clauses);
      const totalPages = distributedPages.length;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let pIdx = 0; pIdx < totalPages; pIdx++) {
        const pageWrapper = document.getElementById(`sopSheetPage_${pIdx}`);
        if (!pageWrapper) continue;

        const prevDisplay = pageWrapper.style.display;
        pageWrapper.style.display = 'flex';

        const divider = pageWrapper.querySelector('.sop-sheet-divider') as HTMLElement | null;
        if (divider) divider.style.display = 'none';

        const sheet = (pageWrapper.querySelector('.sop-a4-sheet') as HTMLElement) || pageWrapper;

        const canvas = await html2canvas(sheet, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        pageWrapper.style.display = prevDisplay;
        if (divider && previewMultiPageMode === 'all') {
          divider.style.display = 'flex';
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (pIdx > 0) {
          pdf.addPage('a4', 'p');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      const safeFilename = `${previewSop.code}_${previewSop.titleEn.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      pdf.save(`${safeFilename}.pdf`);

      Swal.fire({
        icon: 'success',
        title: 'ទាញយក PDF ជោគជ័យ!',
        text: `ឯកសារមានចំនួន ${totalPages} ទំព័រ ត្រូវបានទាញយកពេញលេញ។`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', 'បរាជ័យក្នុងការទាញយក PDF: ' + err.message, 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Sync with LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hrm_factory_sops_data');
      if (saved) {
        const parsed: FactorySop[] = JSON.parse(saved);
        // Merge with default values in case cached objects lack newly added header fields
        const merged = parsed.map((item) => {
          const def = DEFAULT_SOPS.find((d) => d.id === item.id);
          // Auto-sync upgraded content for sop-01, sop-02, sop-06 if cached version is older
          const isOlderContent = def && (item.id === 'sop-01' || item.id === 'sop-02' || item.id === 'sop-06') && item.contentKh.length < (def.contentKh.length - 10);
          return {
            ...def,
            ...item,
            contentKh: isOlderContent ? def.contentKh : item.contentKh,
            contentEn: isOlderContent ? def.contentEn : item.contentEn,
            edition: item.edition || def?.edition || '02',
            pageInfo: item.pageInfo || def?.pageInfo || 'Page 1 of 1',
            initialIssuedDate: item.initialIssuedDate || def?.initialIssuedDate || '10-11-2023',
            amendDate: item.amendDate || def?.amendDate || '10-10-2025',
            effectiveDate: item.effectiveDate || def?.effectiveDate || '11-11-2024',
            titleCn: item.titleCn || def?.titleCn || '',
          };
        });
        const existingIds = new Set(parsed.map((p) => p.id));
        const missing = ALL_SOPS.filter((d) => !existingIds.has(d.id));
        setSops([...merged, ...missing]);
      } else {
        setSops(DEFAULT_SOPS);
      }
    } catch (e) {
      console.error(e);
      setSops(DEFAULT_SOPS);
    }
  }, []);

  const saveSops = (data: FactorySop[]) => {
    setSops(data);
    localStorage.setItem('hrm_factory_sops_data', JSON.stringify(data));
  };

  const handleResetToDefault = () => {
    Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: 'ទិន្នន័យ SOP ទាំងអស់នឹងត្រូវកំណត់ឡើងវិញទៅទម្រង់ដើម!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'យល់ព្រម (Reset)',
      cancelButtonText: 'បោះបង់',
      confirmButtonColor: '#dc2626',
    }).then((res) => {
      if (res.isConfirmed) {
        saveSops(DEFAULT_SOPS);
        Swal.fire('ជោគជ័យ!', 'ទិន្នន័យ SOP ត្រូវបានកំណត់ឡើងវិញ។', 'success');
      }
    });
  };

  const handleSaveEditSop = () => {
    if (!editingSop) return;
    const updated = sops.map((s) => (s.id === editingSop.id ? editingSop : s));
    saveSops(updated);
    setEditingSop(null);
    Swal.fire({
      icon: 'success',
      title: 'បានរក្សាទុកជោគជ័យ!',
      text: `នីតិវិធី ${editingSop.code} ត្រូវបានធ្វើបច្ចុប្បន្នភាព។`,
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const handleSaveQuickHeaderSop = () => {
    if (!editingHeaderSop) return;

    let updated: FactorySop[];
    if (applySopHeaderToAll) {
      updated = sops.map((s) => {
        if (s.id === editingHeaderSop.id) {
          return editingHeaderSop;
        }
        return {
          ...s,
          companyName: editingHeaderSop.companyName,
          productType: editingHeaderSop.productType,
          preparedBy: editingHeaderSop.preparedBy,
          preparedRole: editingHeaderSop.preparedRole,
          preparedDate: editingHeaderSop.preparedDate,
          approvedBy: editingHeaderSop.approvedBy,
          approvedRole: editingHeaderSop.approvedRole,
          approvedDate: editingHeaderSop.approvedDate,
          initialIssuedDate: editingHeaderSop.initialIssuedDate,
          effectiveDate: editingHeaderSop.effectiveDate,
          amendDate: editingHeaderSop.amendDate,
        };
      });
    } else {
      updated = sops.map((s) => (s.id === editingHeaderSop.id ? editingHeaderSop : s));
    }

    saveSops(updated);
    if (previewSop && previewSop.id === editingHeaderSop.id) {
      setPreviewSop(editingHeaderSop);
    }
    setEditingHeaderSop(null);
    Swal.fire({
      icon: 'success',
      title: applySopHeaderToAll ? 'បានធ្វើបច្ចុប្បន្នភាពគ្រប់ SOP ទាំងអស់!' : 'បានធ្វើបច្ចុប្បន្នភាព!',
      text: applySopHeaderToAll
        ? 'ឈ្មោះរោងចក្រ ឈ្មោះហត្ថលេខី និងកាលបរិច្ឆេទ ត្រូវបានអនុវត្តចំពោះរាល់ SOP ទាំងអស់។'
        : 'Doc No, ឈ្មោះហត្ថលេខី, ឈ្មោះរោងចក្រ និងកាលបរិច្ឆេទ ត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ។',
      timer: 1800,
      showConfirmButton: false,
    });
  };

  // Replace company name across all text of this SOP
  const handleBatchReplaceCompany = (oldName: string, newName: string) => {
    if (!editingSop || !newName) return;
    const updatedKh = editingSop.contentKh.replaceAll(oldName, newName);
    const updatedEn = editingSop.contentEn.replaceAll(oldName, newName);
    setEditingSop({
      ...editingSop,
      companyName: newName,
      contentKh: updatedKh,
      contentEn: updatedEn,
    });
    Swal.fire({
      icon: 'success',
      title: 'បានផ្លាស់ប្តូរឈ្មោះក្រុមហ៊ុន!',
      text: `ឈ្មោះក្រុមហ៊ុនត្រូវបានជំនួសក្នុងខ្លឹមសារទាំងអស់រួចរាល់។`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const filteredSops = useMemo(() => {
    return sops.filter((sop) => {
      const matchCat = selectedCategory === 'ALL' || sop.category === selectedCategory;
      const matchSearch =
        sop.titleKh.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sop.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sop.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sop.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sop.productType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sop.preparedBy && sop.preparedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sop.approvedBy && sop.approvedBy.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [sops, selectedCategory, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Segmented Switcher between SOPs and JDs */}
      <div
        style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px',
          width: 'fit-content',
          border: '1px solid #e2e8f0',
        }}
      >
        <button
          onClick={() => setMainSection('sops')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            background: mainSection === 'sops' ? '#ffffff' : 'transparent',
            color: mainSection === 'sops' ? '#1e40af' : '#64748b',
            fontWeight: mainSection === 'sops' ? 800 : 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: mainSection === 'sops' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          📑 នីតិវិធី និងគោលការណ៍ SOPs
          <span
            style={{
              background: mainSection === 'sops' ? '#dbeafe' : '#e2e8f0',
              color: mainSection === 'sops' ? '#1e40af' : '#475569',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            {sops.length}
          </span>
        </button>

        <button
          onClick={() => setMainSection('jds')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            background: mainSection === 'jds' ? '#ffffff' : 'transparent',
            color: mainSection === 'jds' ? '#1e40af' : '#64748b',
            fontWeight: mainSection === 'jds' ? 800 : 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: mainSection === 'jds' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          👔 សេចក្តីពិពណ៌នាមុខតំណែង JDs (Standard Roles)
          <span
            style={{
              background: mainSection === 'jds' ? '#dbeafe' : '#e2e8f0',
              color: mainSection === 'jds' ? '#1e40af' : '#475569',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            15
          </span>
        </button>
      </div>

      {mainSection === 'jds' ? (
        <JdLibraryView
          handlePrintTemplate={handlePrintTemplate}
          handleExportPdf={handleExportPdf}
        />
      ) : (
        <>
      {/* Top Controls Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '8px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>ផ្នែក SOP៖</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            <option value="ALL">គ្រប់នីតិវិធីទាំងអស់ ({sops.length} SOPs)</option>
            <option value="SAFETY">សុវត្ថិភាពការងារ & EHS</option>
            <option value="HUMAN_RIGHTS">សិទ្ធិមនុស្ស & BSCI</option>
            <option value="HR">ធនធានមនុស្ស & រដ្ឋបាល</option>
            <option value="AUDIT">សវនកម្ម & អនុលោមភាព</option>
            <option value="SECURITY">សន្តិសុខ & C-TPAT</option>
            <option value="ENVIRONMENT">បរិស្ថាន & ZDHC</option>
            <option value="LEAVE">ច្បាប់ឈប់សម្រាក</option>
            <option value="GRIEVANCE">បណ្តឹងតវ៉ា & វិវាទ</option>
            <option value="TRAINING">បណ្តុះបណ្តាល & ហ្វឹកហ្វឺន</option>
            <option value="INTEGRITY">សុចរិតភាព & ក្រមសីលធម៌</option>
            <option value="MACHINERY">គ្រឿងចក្រ & ផលិតកម្ម</option>
            <option value="OUTSOURCE">អ្នកម៉ៅការបន្ត (Subcontractor)</option>
            <option value="FOREIGN_WORKER">ពលករបរទេស & ចំណាកស្រុក</option>
            <option value="CHILD_PROTECTION">ការពារកុមារ & សន្តិសុខ</option>
            <option value="CHILD_LABOR">ពលកម្មកុមារ & ជួញដូរ</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកតាមកូដ ឈ្មោះ ឬផលិតផល..."
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              minWidth: '220px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={handleResetToDefault}
            title="កំណត់ឡើងវិញទម្រង់ដើម"
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔄 ទម្រង់ដើម (Reset)
          </button>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            ({filteredSops.length} / {sops.length} ឯកសារ)
          </span>
        </div>
      </div>

      {/* SOPs Grid View (Compact & Fit Content) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '10px' }}>
        {filteredSops.map((sop) => (
          <div
            key={sop.id}
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              {/* Header Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span
                    style={{
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                    }}
                  >
                    {sop.code}
                  </span>
                  <span
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                    }}
                  >
                    Rev: {sop.edition || '02'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {(() => {
                    const cl = parseBilingualClauses(sop.contentKh, sop.contentEn);
                    const pCount = distributeClausesToFitPages(cl).length;
                    return (
                      <span style={{ fontSize: '0.68rem', color: '#334155', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        📄 {pCount} ទំព័រ (Page 1 of {pCount})
                      </span>
                    );
                  })()}
                  <span style={{ fontSize: '0.7rem', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    🏭 {sop.productType}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a', marginBottom: '2px', lineHeight: '1.3' }}>
                {sop.titleKh}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '8px', fontStyle: 'italic' }}>
                {sop.titleEn} {sop.titleCn ? `• ${sop.titleCn}` : ''}
              </div>

              {/* Meta Info Box (Detailed Header Attributes) */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '0.72rem',
                  color: '#334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  marginBottom: '10px',
                }}
              >
                <div>🏢 <strong>ក្រុមហ៊ុន៖</strong> {sop.companyName}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', color: '#475569', fontSize: '0.68rem', background: '#ffffff', padding: '4px 6px', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                  <div>📅 <strong>ចេញដំបូង (Issued):</strong> {sop.initialIssuedDate || '10-11-2023'}</div>
                  <div>⚡ <strong>ប្រសិទ្ធភាព (Effective):</strong> {sop.effectiveDate || '11-11-2024'}</div>
                  <div>🔄 <strong>ពិនិត្យឡើងវិញ (Amend):</strong> {sop.amendDate || '10-10-2025'}</div>
                  <div>✍️ <strong>រៀបចំ/អនុម័ត:</strong> {sop.preparedBy} / {sop.approvedBy}</div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setPreviewSop(sop)}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '5px 11px',
                  borderRadius: '5px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                👁️ មើល & បោះពុម្ព
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => {
                    setEditingHeaderSop({ ...sop });
                    setApplySopHeaderToAll(false);
                  }}
                  style={{
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    padding: '5px 8px',
                    borderRadius: '5px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                  title="កែប្រែឈ្មោះរោងចក្រ ឈ្មោះហត្ថលេខី និងកាលបរិច្ឆេទ"
                >
                  ✍️ កែប្រែឈ្មោះ
                </button>
                <button
                  onClick={() => handleOpenEditModal(sop)}
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    padding: '5px 9px',
                    borderRadius: '5px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✏️ កែប្រែ (Edit)
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${sop.titleKh}\n${sop.titleEn}\n\n${sop.contentKh}\n\n${sop.contentEn}`);
                    Swal.fire({
                      icon: 'success',
                      title: 'បានចម្លង!',
                      text: `ខ្លឹមសារ SOP ${sop.code} ត្រូវបានចម្លងទៅ Clipboard។`,
                      timer: 1400,
                      showConfirmButton: false,
                    });
                  }}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '5px 8px',
                    borderRadius: '5px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  📋 ចម្លង
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      </>
      )}

      {/* MODAL 1: EDIT SOP CUSTOMIZER */}
      {editingSop && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
            }}
          >
            {/* Edit Modal Header */}
            <div
              style={{
                padding: '12px 20px',
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.96rem' }}>
                  ✏️ កែប្រែទម្រង់នីតិវិធី៖ {editingSop.code} - {editingSop.titleKh}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  អ្នកអាចប្តូរឈ្មោះក្រុមហ៊ុន ផលិតផល រៀបចំដោយ និងអនុម័តដោយ តាមតម្រូវការជាក់ស្តែង
                </div>
              </div>
              <button
                onClick={() => setEditingSop(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            </div>

            {/* Edit Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Quick Batch Replacer Tool */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>
                  ⚡ ប្តូរឈ្មោះក្រុមហ៊ុនគ្រប់កន្លែងក្នុង SOP នេះ៖
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    id="newCompanyInput"
                    defaultValue={editingSop.companyName}
                    placeholder="វាយបញ្ចូលឈ្មោះក្រុមហ៊ុន/រោងចក្រថ្មី..."
                    style={{
                      padding: '5px 10px',
                      borderRadius: '5px',
                      border: '1px solid #86efac',
                      fontSize: '0.8rem',
                      minWidth: '240px',
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('newCompanyInput') as HTMLInputElement;
                      if (input) handleBatchReplaceCompany(editingSop.companyName, input.value);
                    }}
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '5px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ប្តូរឈ្មោះ (Replace)
                  </button>
                </div>
              </div>

              {/* Form Metadata Fields - Section 1: Official Header Attributes */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1e3a8a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📋 ព័ត៌មានក្បាលទម្រង់ផ្លូវការ (Official Document Header Attributes):</span>
                </div>
                
                {/* Row A: Doc No, Edition, Page Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>លេខកូដឯកសារ (Document No):</label>
                    <input
                      type="text"
                      value={editingSop.code}
                      onChange={(e) => setEditingSop({ ...editingSop, code: e.target.value })}
                      placeholder="e.g. EGS/SCP-054"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>បោះពុម្ពលើកទី (Edition / Rev):</label>
                    <input
                      type="text"
                      value={editingSop.edition || '02'}
                      onChange={(e) => setEditingSop({ ...editingSop, edition: e.target.value })}
                      placeholder="e.g. 02"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>ចំនួនទំព័រ (Page Info):</label>
                    <input
                      type="text"
                      value={editingSop.pageInfo || 'Page 1 of 1'}
                      onChange={(e) => setEditingSop({ ...editingSop, pageInfo: e.target.value })}
                      placeholder="e.g. Page 1 of 1, Page 1 of 2"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                </div>

                {/* Row B: Initial Issued Date, Amend Date, Effective Date */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>កាលបរិច្ឆេទចេញដំបូង (Initial Issued Date):</label>
                    <input
                      type="text"
                      value={editingSop.initialIssuedDate || '10-11-2023'}
                      onChange={(e) => setEditingSop({ ...editingSop, initialIssuedDate: e.target.value })}
                      placeholder="e.g. 10-11-2023"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>កាលបរិច្ឆេទត្រូវពិនិត្យឡើងវិញ (Amend Date):</label>
                    <input
                      type="text"
                      value={editingSop.amendDate || '10-10-2025'}
                      onChange={(e) => setEditingSop({ ...editingSop, amendDate: e.target.value })}
                      placeholder="e.g. 10-10-2025"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>កាលបរិច្ឆេទមានប្រសិទ្ធភាព (Effective Date):</label>
                    <input
                      type="text"
                      value={editingSop.effectiveDate || '11-11-2024'}
                      onChange={(e) => setEditingSop({ ...editingSop, effectiveDate: e.target.value })}
                      placeholder="e.g. 11-11-2024"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Metadata Fields - Section 2: Company & Titles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>ឈ្មោះក្រុមហ៊ុន / រោងចក្រ (Company):</label>
                  <input
                    type="text"
                    value={editingSop.companyName}
                    onChange={(e) => setEditingSop({ ...editingSop, companyName: e.target.value })}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>ប្រភេទផលិតផលផលិត (Product Manufactured):</label>
                  <input
                    type="text"
                    value={editingSop.productType}
                    onChange={(e) => setEditingSop({ ...editingSop, productType: e.target.value })}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#dc2626' }}>ចំណងជើងខ្មែរ (Title Khmer):</label>
                  <input
                    type="text"
                    value={editingSop.titleKh}
                    onChange={(e) => setEditingSop({ ...editingSop, titleKh: e.target.value })}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a' }}>ចំណងជើងអង់គ្លេស (Title English):</label>
                  <input
                    type="text"
                    value={editingSop.titleEn}
                    onChange={(e) => setEditingSop({ ...editingSop, titleEn: e.target.value })}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>ចំណងជើងចិន (Title Chinese - Optional):</label>
                  <input
                    type="text"
                    value={editingSop.titleCn || ''}
                    onChange={(e) => setEditingSop({ ...editingSop, titleCn: e.target.value })}
                    placeholder="e.g. 风险评估政策"
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                  />
                </div>
              </div>

              {/* Form Metadata Fields - Section 3: Approvals (Names, Roles, Dates) */}
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#047857' }}>
                  ✍️ ហត្ថលេខី និងតួនាទី (Signatory Names, Roles & Dates)
                </div>
                {/* 1. PREPARED BY */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>រៀបចំដោយ (Prepared By Name):</label>
                    <input
                      type="text"
                      value={editingSop.preparedBy}
                      onChange={(e) => setEditingSop({ ...editingSop, preparedBy: e.target.value })}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>តួនាទីអ្នករៀបចំ (Prepared Role):</label>
                    <input
                      type="text"
                      value={editingSop.preparedRole}
                      onChange={(e) => setEditingSop({ ...editingSop, preparedRole: e.target.value })}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>កាលបរិច្ឆេទ (Date):</label>
                    <input
                      type="text"
                      value={editingSop.preparedDate}
                      onChange={(e) => setEditingSop({ ...editingSop, preparedDate: e.target.value })}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                </div>

                {/* 2. APPROVED BY */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>អនុម័តដោយ (Approved By Name):</label>
                    <input
                      type="text"
                      value={editingSop.approvedBy}
                      onChange={(e) => setEditingSop({ ...editingSop, approvedBy: e.target.value })}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>តួនាទីអ្នកអនុម័ត (Approved Role):</label>
                    <input
                      type="text"
                      value={editingSop.approvedRole}
                      onChange={(e) => setEditingSop({ ...editingSop, approvedRole: e.target.value })}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>កាលបរិច្ឆេទ (Date):</label>
                    <input
                      type="text"
                      value={editingSop.approvedDate}
                      onChange={(e) => setEditingSop({ ...editingSop, approvedDate: e.target.value })}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}
                    />
                  </div>
                </div>
              </div>

              {/* BILINGUAL 1-ROW INTERACTIVE CLAUSES EDITOR */}
              <div style={{ marginTop: '10px' }}>
                {/* Editor Control Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    flexWrap: 'wrap',
                    gap: '8px',
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                      📑 កែសម្រួលតាមតារាង 1-Row ២ភាសា (Bilingual Rows):
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                      {editingClauses.length} ផ្នែក / ឃ្លា
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#475569', cursor: 'pointer', marginLeft: '6px' }}>
                      <input
                        type="checkbox"
                        checked={autoTranslateOnBlur}
                        onChange={(e) => setAutoTranslateOnBlur(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      ⚡ Auto-Translate
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={isTranslatingAll}
                      onClick={() => handleTranslateAll('km')}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '5px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: isTranslatingAll ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="បកប្រែខ្លឹមសារខ្មែរទាំងអស់ទៅជាភាសាអង់គ្លេសស្វ័យប្រវត្តិ"
                    >
                      {isTranslatingAll ? '⏳ កំពុងបកប្រែ...' : '🌐 ខ្មែរ ➔ EN ទាំងអស់'}
                    </button>

                    <button
                      type="button"
                      disabled={isTranslatingAll}
                      onClick={() => handleTranslateAll('en')}
                      style={{
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '5px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: isTranslatingAll ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="បកប្រែខ្លឹមសារអង់គ្លេសទាំងអស់ទៅជាភាសាខ្មែរស្វ័យប្រវត្តិ"
                    >
                      {isTranslatingAll ? '⏳ កំពុងបកប្រែ...' : '🌐 EN ➔ ខ្មែរ ទាំងអស់'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (editEditorMode === 'table') {
                          setEditEditorMode('raw');
                        } else {
                          const parsed = parseBilingualClauses(editingSop.contentKh, editingSop.contentEn);
                          setEditingClauses(parsed);
                          setEditEditorMode('table');
                        }
                      }}
                      style={{
                        background: '#ffffff',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        padding: '4px 9px',
                        borderRadius: '5px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {editEditorMode === 'table' ? '📝 កែប្រែជា Text ធម្មតា' : '📑 កែប្រែតាម 1-Row ២ភាសា'}
                    </button>
                  </div>
                </div>

                {/* Mode A: 1-Row Bilingual Interactive Editor */}
                {editEditorMode === 'table' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '52vh', overflowY: 'auto', paddingRight: '4px' }}>
                    {editingClauses.map((clause, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          background: '#ffffff',
                          overflow: 'hidden',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                        }}
                      >
                        {/* Clause Header Bar */}
                        <div
                          style={{
                            background: '#f1f5f9',
                            borderBottom: '1px solid #e2e8f0',
                            padding: '6px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a' }}>
                              📌 ផ្នែកទី {idx + 1}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                              (1 Row ២ភាសា: ខ្មែរខាងលើ • English ខាងក្រោម)
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <button
                              type="button"
                              disabled={translatingRowIndex === idx}
                              onClick={() => handleTranslateRow(idx, 'km')}
                              style={{
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title="បកប្រែចំណុចនេះពីខ្មែរទៅជាអង់គ្លេសស្វ័យប្រវត្តិ"
                            >
                              {translatingRowIndex === idx ? '⏳...' : '🌐 KM ➔ EN'}
                            </button>
                            <button
                              type="button"
                              disabled={translatingRowIndex === idx}
                              onClick={() => handleTranslateRow(idx, 'en')}
                              style={{
                                background: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title="បកប្រែចំណុចនេះពីអង់គ្លេសមកខ្មែរស្វ័យប្រវត្តិ"
                            >
                              {translatingRowIndex === idx ? '⏳...' : '🌐 EN ➔ KM'}
                            </button>

                            {editingClauses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteClause(idx)}
                                style={{
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  padding: '3px 7px',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                                title="លុបផ្នែកនេះចេញ"
                              >
                                🗑️ លុប
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Clause Body (Khmer on top, Divider, English below) */}
                        <div style={{ padding: '10px 12px' }}>
                          {/* Khmer Section */}
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e3a8a' }}>
                                🇰🇭 ចំណងជើង និងខ្លឹមសារភាសាខ្មែរ (Khmer Title & Content):
                              </label>
                            </div>
                            <input
                              type="text"
                              value={clause.khmerTitle}
                              onChange={(e) => handleUpdateClause(idx, 'khmerTitle', e.target.value)}
                              placeholder="ឧ. ១. គោលបំណង Purpose"
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                marginBottom: '4px',
                                color: '#0f172a',
                              }}
                            />
                            <textarea
                              value={clause.khmerBody}
                              onChange={(e) => handleUpdateClause(idx, 'khmerBody', e.target.value)}
                              onBlur={() => handleClauseBlur(idx, 'kh')}
                              placeholder="សរសេរខ្លឹមសារគោលការណ៍ជាភាសាខ្មែរ..."
                              rows={3}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.8rem',
                                lineHeight: 1.5,
                                fontFamily: 'inherit',
                                color: '#0f172a',
                              }}
                            />
                          </div>

                          {/* Dashed Divider Line */}
                          <div
                            style={{
                              borderTop: '1px dashed #cbd5e1',
                              margin: '8px 0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span style={{ background: '#ffffff', padding: '0 8px', fontSize: '0.64rem', color: '#94a3b8', fontWeight: 700 }}>
                              ↓ ENGLISH TRANSLATION (ភាសាអង់គ្លេសខាងក្រោម) ↓
                            </span>
                          </div>

                          {/* English Section */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', fontStyle: 'italic' }}>
                                🇬🇧 English Title & Content (ខ្លឹមសារភាសាអង់គ្លេស):
                              </label>
                            </div>
                            <input
                              type="text"
                              value={clause.englishTitle}
                              onChange={(e) => handleUpdateClause(idx, 'englishTitle', e.target.value)}
                              placeholder="e.g. 1. PURPOSE"
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                fontStyle: 'italic',
                                marginBottom: '4px',
                                color: '#334155',
                              }}
                            />
                            <textarea
                              value={clause.englishBody}
                              onChange={(e) => handleUpdateClause(idx, 'englishBody', e.target.value)}
                              onBlur={() => handleClauseBlur(idx, 'en')}
                              placeholder="Write English policy content..."
                              rows={3}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.8rem',
                                lineHeight: 1.5,
                                fontFamily: 'inherit',
                                color: '#334155',
                                fontStyle: 'italic',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Button to add new clause */}
                    <button
                      type="button"
                      onClick={handleAddNewClause}
                      style={{
                        background: '#f8fafc',
                        border: '1.5px dashed #3b82f6',
                        color: '#2563eb',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      ➕ បន្ថែមផ្នែក/ប្រយោគថ្មី (Add New Bilingual Clause)
                    </button>
                  </div>
                ) : (
                  /* Mode B: Raw Plain Textareas */
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af' }}>ខ្លឹមសារភាសាខ្មែរ (Khmer Policy Content):</label>
                      <textarea
                        value={editingSop.contentKh}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingSop({ ...editingSop, contentKh: val });
                        }}
                        style={{ width: '100%', height: '220px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', marginTop: '2px', fontFamily: 'inherit' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#047857' }}>ខ្លឹមសារភាសាអង់គ្លេស (English Policy Content):</label>
                      <textarea
                        value={editingSop.contentEn}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingSop({ ...editingSop, contentEn: val });
                        }}
                        style={{ width: '100%', height: '220px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', marginTop: '2px', fontFamily: 'inherit' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Modal Footer */}
            <div style={{ padding: '10px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setEditingSop(null)}
                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                បោះបង់ (Cancel)
              </button>
              <button
                onClick={handleSaveEditSop}
                style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '7px 18px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                💾 រក្សាទុកការកែប្រែ (Save SOP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: A4 FULL PREVIEW & PRINT (RETAINING EXACT ORIGINAL FORMAT) */}
      {previewSop && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '920px',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
            }}
          >
            {/* Preview Toolbar */}
            <div
              style={{
                padding: '12px 20px',
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                  📄 ទម្រង់ដើមស្តង់ដា៖ {previewSop.code} - {previewSop.titleKh}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  {previewSop.companyName} • ផលិតផល៖ {previewSop.productType}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Multi-Page Navigation Controls (Accurate to Real Content Pages) */}
                {(() => {
                  const clauses = parseBilingualClauses(previewSop.contentKh, previewSop.contentEn);
                  const distributedPages = distributeClausesToFitPages(clauses);
                  const totalP = distributedPages.length;

                  if (totalP <= 1) {
                    return (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          color: '#e2e8f0',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                        }}
                      >
                        <span>📄 ទម្រង់ ១ ទំព័រ A4 (Fit Content)</span>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', padding: '3px 8px' }}>
                      <button
                        onClick={() => setPreviewMultiPageMode(previewMultiPageMode === 'all' ? 'single' : 'all')}
                        style={{
                          background: previewMultiPageMode === 'all' ? '#2563eb' : '#475569',
                          color: '#ffffff',
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="ប្តូររវាងមើលគ្រប់ទំព័រ ឬមើលម្តង ១ទំព័រ"
                      >
                        {previewMultiPageMode === 'all' ? `📜 មើលគ្រប់ ${totalP} ទំព័រ` : '📄 មើលម្តង ១ទំព័រ'}
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <button
                          disabled={currentPageIndex === 0}
                          onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                          style={{
                            background: currentPageIndex === 0 ? 'rgba(255,255,255,0.1)' : '#ffffff',
                            color: currentPageIndex === 0 ? '#94a3b8' : '#0f172a',
                            border: 'none',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: currentPageIndex === 0 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          ◀
                        </button>
                        <select
                          value={currentPageIndex}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setCurrentPageIndex(val);
                            if (previewMultiPageMode === 'all') {
                              const el = document.getElementById(`sopSheetPage_${val}`);
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          style={{
                            background: '#ffffff',
                            color: '#0f172a',
                            border: 'none',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {Array.from({ length: totalP }, (_, i) => (
                            <option key={i} value={i}>
                              ទំព័រ {i + 1} / {totalP}
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={currentPageIndex >= totalP - 1}
                          onClick={() => setCurrentPageIndex((prev) => Math.min(totalP - 1, prev + 1))}
                          style={{
                            background: currentPageIndex >= totalP - 1 ? 'rgba(255,255,255,0.1)' : '#ffffff',
                            color: currentPageIndex >= totalP - 1 ? '#94a3b8' : '#0f172a',
                            border: 'none',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: currentPageIndex >= totalP - 1 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 1-Row Bilingual Toggle Button */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', padding: '2px' }}>
                  <button
                    onClick={() => setPreviewLayoutMode('1row')}
                    style={{
                      background: previewLayoutMode === '1row' ? '#ffffff' : 'transparent',
                      color: previewLayoutMode === '1row' ? '#0f172a' : '#cbd5e1',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="ទម្រង់តារាង 1-Row ២ភាសា (ខ្មែរលើគេ)"
                  >
                    📑 1-Row ២ភាសា
                  </button>
                  <button
                    onClick={() => setPreviewLayoutMode('paragraph')}
                    style={{
                      background: previewLayoutMode === 'paragraph' ? '#ffffff' : 'transparent',
                      color: previewLayoutMode === 'paragraph' ? '#0f172a' : '#cbd5e1',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="ទម្រង់កថាខណ្ឌបន្តបន្ទាប់"
                  >
                    📄 កថាខណ្ឌ
                  </button>
                </div>

                <button
                  onClick={() => {
                    setEditingHeaderSop({ ...previewSop });
                    setApplySopHeaderToAll(false);
                  }}
                  style={{
                    background: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="កែប្រែឈ្មោះរោងចក្រ, ឈ្មោះហត្ថលេខី, Doc No, និងកាលបរិច្ឆេទ"
                >
                  ✍️ កែប្រែឈ្មោះ & ក្រុមហ៊ុន
                </button>

                <button
                  onClick={() => {
                    handleOpenEditModal(previewSop);
                    setPreviewSop(null);
                  }}
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="កែប្រែខ្លឹមសារ និងតារាង ១ជួរ ២ភាសា"
                >
                  📝 កែប្រែខ្លឹមសារ SOP
                </button>

                <button
                  onClick={() => {
                    setPreviewMultiPageMode('all');
                    setTimeout(() => {
                      handlePrintTemplate('sopOriginalPrintArea');
                    }, 150);
                  }}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="បោះពុម្ពគ្រប់ទំព័រទាំងអស់ជាសន្លឹក A4"
                >
                  🖨️ បោះពុម្ព A4
                </button>
                <button
                  disabled={isExportingPdf}
                  onClick={handleExportAllPagesPdf}
                  style={{
                    background: isExportingPdf ? '#6ee7b7' : '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: isExportingPdf ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="ទាញយកជា PDF គ្រប់ទំព័រទាំងអស់"
                >
                  {isExportingPdf ? '⏳ កំពុងទាញយក...' : '📥 ទាញយកជា PDF'}
                </button>
                <button
                  onClick={() => setPreviewSop(null)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                  }}
                >
                  ✕ បិទ
                </button>
              </div>
            </div>

            {/* Document Content (Exact Factory A4 Form - Multi-Page Sheets Engine) */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 32px',
                background: '#e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {(() => {
                const clauses = parseBilingualClauses(previewSop.contentKh, previewSop.contentEn);
                const distributedPages = distributeClausesToFitPages(clauses);
                const totalPages = distributedPages.length;

                return (
                  <div
                    id="sopOriginalPrintArea"
                    style={{
                      width: '100%',
                      maxWidth: '820px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <style>{`
                      @media print {
                        .sop-page-sheet-wrapper {
                          display: flex !important;
                          page-break-after: always !important;
                          break-after: page !important;
                          margin-bottom: 0 !important;
                        }
                        .sop-page-sheet-wrapper:last-child {
                          page-break-after: auto !important;
                          break-after: auto !important;
                        }
                        .sop-sheet-divider {
                          display: none !important;
                        }
                        .sop-a4-sheet {
                          box-shadow: none !important;
                          padding: 12mm 15mm !important;
                          margin: 0 !important;
                          min-height: auto !important;
                          border: none !important;
                        }
                      }
                    `}</style>
                    {distributedPages.map((pageClauses, pIdx) => {
                      const pageNum = pIdx + 1;
                      const isVisible = previewMultiPageMode === 'all' || currentPageIndex === pIdx;

                      return (
                        <div
                          key={pIdx}
                          id={`sopSheetPage_${pIdx}`}
                          className="sop-page-sheet-wrapper"
                          style={{
                            width: '100%',
                            display: isVisible ? 'flex' : 'none',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: pIdx < totalPages - 1 ? '32px' : '0',
                          }}
                        >
                          {/* Visual Sheet Divider Indicator */}
                          {previewMultiPageMode === 'all' && (
                            <div
                              className="sop-sheet-divider"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '10px',
                                color: '#475569',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                              }}
                            >
                              <span>
                                ────── 📄 ទំព័រទី {pageNum} នៃ {totalPages} (Page {pageNum} of {totalPages}) ──────
                              </span>
                            </div>
                          )}

                          {/* Individual A4 Page Container */}
                          <div
                            className="sop-a4-sheet"
                            style={{
                              background: '#ffffff',
                              width: '100%',
                              maxWidth: '820px',
                              minHeight: '1080px',
                              padding: '36px',
                              borderRadius: '3px',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                              color: '#0f172a',
                              fontFamily: "'Kantumruy Pro', 'Inter', sans-serif",
                              lineHeight: 1.6,
                              fontSize: '0.86rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxSizing: 'border-box',
                            }}
                          >
                            <div>
                              {/* 1. Official Header Table: Render full table on Page 1 only; slim running header on Page 2+ */}
                              {pageNum === 1 ? (
                                <table
                                style={{
                                  width: '100%',
                                  borderCollapse: 'collapse',
                                  border: '1.5px solid #1e293b',
                                  fontSize: '0.8rem',
                                  marginBottom: '16px',
                                }}
                              >
                                <tbody>
                                  {/* ROW 1: LOGO | COMPANY | PAGE NUMBER */}
                                  <tr>
                                    <td
                                      style={{
                                        border: '1px solid #1e293b',
                                        padding: '6px 8px',
                                        width: '28%',
                                        verticalAlign: 'middle',
                                        background: '#ffffff',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div
                                          style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '6px',
                                            background: '#e6f4ea',
                                            border: '1px solid #81c784',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                          }}
                                        >
                                          <svg width="24" height="24" viewBox="0 0 24 24" fill="#2e7d32">
                                            <path d="M12 2L6 10h3v4H6l6 8 6-8h-3v-4h3L12 2z" />
                                          </svg>
                                        </div>
                                        <div style={{ fontSize: '0.64rem', lineHeight: '1.25', color: '#1e293b' }}>
                                          <div style={{ fontWeight: 700, color: '#15803d' }}>{previewSop.companyName}</div>
                                          {previewSop.titleCn && (
                                            <div style={{ color: '#64748b', fontSize: '0.6rem' }}>长青户外用品(柬埔寨)有限公司</div>
                                          )}
                                          <div style={{ fontSize: '0.56rem', color: '#475569', fontWeight: 600 }}>
                                            {previewSop.companyName.toUpperCase()}
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    <td
                                      onClick={() => {
                                        setEditingHeaderSop({ ...previewSop });
                                        setApplySopHeaderToAll(false);
                                      }}
                                      title="ចុចទីនេះដើម្បីកែប្រែឈ្មោះរោងចក្រ/ក្រុមហ៊ុន"
                                      style={{
                                        border: '1px solid #1e293b',
                                        padding: '8px 10px',
                                        width: '52%',
                                        textAlign: 'center',
                                        verticalAlign: 'middle',
                                        background: '#ffffff',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.3 }}>
                                        {previewSop.companyName}
                                      </div>
                                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', letterSpacing: '0.5px' }}>
                                        {previewSop.companyName.toUpperCase()}
                                      </div>
                                    </td>

                                    <td
                                      style={{
                                        border: '1px solid #1e293b',
                                        padding: '8px 10px',
                                        width: '20%',
                                        textAlign: 'center',
                                        verticalAlign: 'middle',
                                        fontWeight: 800,
                                        color: '#1e293b',
                                        fontSize: '0.86rem',
                                        background: '#f8fafc',
                                      }}
                                    >
                                      Page {pageNum} of {totalPages}
                                    </td>
                                  </tr>

                                  {/* ROW 2: INITIAL ISSUED DATE | POLICY TITLE | EDITION */}
                                  <tr>
                                    <td
                                      onClick={() => {
                                        setEditingHeaderSop({ ...previewSop });
                                        setApplySopHeaderToAll(false);
                                      }}
                                      title="ចុចទីនេះដើម្បីកែប្រែ Doc No, Edition, និងកាលបរិច្ឆេទ"
                                      style={{
                                        border: '1px solid #1e293b',
                                        padding: '6px 8px',
                                        verticalAlign: 'top',
                                        background: '#ffffff',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.76rem' }}>កាលបរិច្ឆេទចេញដំបូង៖</div>
                                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Initial Issued Date</div>
                                      <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px', fontSize: '0.8rem' }}>
                                        {previewSop.initialIssuedDate || '10-11-2023'}
                                      </div>
                                    </td>

                                    <td
                                      style={{
                                        border: '1px solid #1e293b',
                                        padding: '8px 12px',
                                        textAlign: 'center',
                                        verticalAlign: 'middle',
                                        background: '#ffffff',
                                      }}
                                    >
                                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#dc2626', lineHeight: 1.3 }}>
                                        {previewSop.titleKh}
                                      </div>
                                      <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#0f172a', marginTop: '2px', letterSpacing: '0.4px' }}>
                                        {previewSop.titleEn.toUpperCase()}
                                      </div>
                                      {previewSop.titleCn && (
                                        <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginTop: '2px' }}>
                                          {previewSop.titleCn}
                                        </div>
                                      )}
                                    </td>

                                    <td
                                      onClick={() => {
                                        setEditingHeaderSop({ ...previewSop });
                                        setApplySopHeaderToAll(false);
                                      }}
                                      title="ចុចទីនេះដើម្បីកែប្រែ Doc No, Edition, និងកាលបរិច្ឆេទ"
                                      style={{
                                        border: '1px solid #1e293b',
                                        padding: '6px 8px',
                                        verticalAlign: 'top',
                                        background: '#ffffff',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.76rem' }}>
                                        បោះពុម្ពលើកទី៖ {previewSop.edition || '02'}
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Edition:</div>
                                    </td>
                                  </tr>

                                  {/* ROW 3: AMEND DATE | EFFECTIVE DATE | DOCUMENT NO */}
                                  <tr>
                                    <td
                                      onClick={() => {
                                        setEditingHeaderSop({ ...previewSop });
                                        setApplySopHeaderToAll(false);
                                      }}
                                      title="ចុចទីនេះដើម្បីកែប្រែ Doc No, Edition, និងកាលបរិច្ឆេទ"
                                      style={{
                                        border: '1px solid #1e293b',
                                        padding: '6px 8px',
                                        verticalAlign: 'top',
                                        background: '#ffffff',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.76rem' }}>កាលបរិច្ឆេទត្រូវពិនិត្យឡើងវិញ៖</div>
                                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Amend Date</div>
                                      <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px', fontSize: '0.8rem' }}>
                                        {previewSop.amendDate || '10-10-2025'}
                                      </div>
                                    </td>

                                    <td
                                      onClick={() => {
                                        setEditingHeaderSop({ ...previewSop });
                                        setApplySopHeaderToAll(false);
                                      }}
                                      title="ចុចទីនេះដើម្បីកែប្រែ Doc No, Edition, និងកាលបរិច្ឆេទ"
                                      style={{
                                        border: '1px solid #1e293b',
                                        padding: '6px 10px',
                                        textAlign: 'left',
                                        verticalAlign: 'top',
                                        background: '#ffffff',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.76rem' }}>
                                        កាលបរិច្ឆេទមានប្រសិទ្ធភាព៖
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Effective Date:</div>
                                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', marginTop: '2px' }}>
                                        {previewSop.effectiveDate || '11-11-2024'}
                                      </div>
                                    </td>

                                    <td
                                      onClick={() => {
                                        setEditingHeaderSop({ ...previewSop });
                                        setApplySopHeaderToAll(false);
                                      }}
                                      title="ចុចទីនេះដើម្បីកែប្រែ Doc No, Edition, និងកាលបរិច្ឆេទ"
                                      style={{
                                        border: '1px solid #1e293b',
                                        padding: '6px 8px',
                                        verticalAlign: 'middle',
                                        background: '#ffffff',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.76rem' }}>
                                        Document No: <strong style={{ color: '#0f172a', fontSize: '0.84rem' }}>{previewSop.code}</strong>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* ROW 4: PREPARED BY | STAMP | APPROVED BY (CLICKABLE TO EDIT) */}
                                  <tr
                                    onClick={() => {
                                      setEditingHeaderSop({ ...previewSop });
                                      setApplySopHeaderToAll(false);
                                    }}
                                    title="ចុចទីនេះដើម្បីកែប្រែឈ្មោះ និងតួនាទីអ្នករៀបចំ និងអ្នកអនុម័ត"
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <td
                                      style={{
                                        border: '1px solid #1e293b',
                                        padding: '8px 10px',
                                        verticalAlign: 'top',
                                        background: '#ffffff',
                                      }}
                                    >
                                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                                        រៀបចំដោយ៖ Prepared By
                                      </div>
                                      <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px', lineHeight: 1.3 }}>
                                        {previewSop.preparedRole}
                                      </div>
                                      <div style={{ minHeight: '34px' }}></div>
                                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                                        {previewSop.preparedBy}
                                      </div>
                                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
                                        កាលបរិច្ឆេទ៖ {previewSop.preparedDate} Date:
                                      </div>
                                    </td>

                                    <td
                                      style={{
                                        border: '1px solid #1e293b',
                                        padding: '8px 10px',
                                        verticalAlign: 'middle',
                                        textAlign: 'center',
                                        background: '#ffffff',
                                      }}
                                    >
                                      <div
                                        style={{
                                          border: '1px dashed #cbd5e1',
                                          borderRadius: '6px',
                                          padding: '12px 8px',
                                          color: '#94a3b8',
                                          fontSize: '0.7rem',
                                        }}
                                      >
                                        <div>កន្លែងបោះត្រាក្រុមហ៊ុន</div>
                                        <div style={{ fontSize: '0.62rem', marginTop: '2px' }}>Company Official Stamp</div>
                                      </div>
                                    </td>

                                    <td
                                      style={{
                                        border: '1px solid #1e293b',
                                        padding: '8px 10px',
                                        verticalAlign: 'top',
                                        background: '#ffffff',
                                      }}
                                    >
                                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                                        អនុម័តដោយ៖ Approved By
                                      </div>
                                      <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px', lineHeight: 1.3 }}>
                                        {previewSop.approvedRole}
                                      </div>
                                      <div style={{ minHeight: '34px' }}></div>
                                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                                        {previewSop.approvedBy}
                                      </div>
                                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
                                        កាលបរិច្ឆេទ៖ {previewSop.approvedDate} Date:
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              ) : (
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1.5px solid #1e293b',
                                    paddingBottom: '8px',
                                    marginBottom: '16px',
                                    fontSize: '0.74rem',
                                    color: '#475569',
                                    fontWeight: 700,
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#0f172a', fontWeight: 800 }}>{previewSop.companyName}</span>
                                    <span>•</span>
                                    <span style={{ color: '#2563eb' }}>{previewSop.code}</span>
                                    <span>•</span>
                                    <span>{previewSop.titleKh}</span>
                                  </div>
                                  <div
                                    style={{
                                      background: '#f1f5f9',
                                      border: '1px solid #cbd5e1',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontWeight: 800,
                                      color: '#0f172a',
                                    }}
                                  >
                                    Page {pageNum} of {totalPages}
                                  </div>
                                </div>
                              )}

                              {/* 2. Page Clauses: 1 Row per clause, 2 languages, Khmer on top */}
                              {previewLayoutMode === '1row' ? (
                                <table
                                  style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    border: '1.5px solid #1e293b',
                                    marginBottom: '18px',
                                    fontSize: '0.84rem',
                                  }}
                                >
                                  <tbody>
                                    {pageClauses.map((clause, cIdx) => (
                                      <tr key={cIdx} style={{ pageBreakInside: 'avoid' }}>
                                        <td
                                          style={{
                                            border: '1px solid #1e293b',
                                            padding: '10px 14px',
                                            verticalAlign: 'top',
                                            background: '#ffffff',
                                          }}
                                        >
                                          {/* Khmer on Top */}
                                          {clause.khmerTitle && (
                                            <div
                                              style={{
                                                fontWeight: 800,
                                                color: '#1e3a8a',
                                                fontSize: '0.92rem',
                                                marginBottom: '4px',
                                                lineHeight: 1.4,
                                              }}
                                            >
                                              {clause.khmerTitle}
                                            </div>
                                          )}
                                          <div
                                            style={{
                                              color: '#0f172a',
                                              lineHeight: 1.6,
                                              whiteSpace: 'pre-line',
                                              marginBottom: '8px',
                                              fontSize: '0.85rem',
                                              textAlign: 'justify',
                                            }}
                                          >
                                            {clause.khmerBody}
                                          </div>

                                          {/* English directly underneath */}
                                          <div
                                            style={{
                                              borderTop: '1px dashed #cbd5e1',
                                              paddingTop: '6px',
                                              marginTop: '4px',
                                            }}
                                          >
                                            {clause.englishTitle && (
                                              <div
                                                style={{
                                                  fontWeight: 800,
                                                  color: '#475569',
                                                  fontSize: '0.82rem',
                                                  marginBottom: '2px',
                                                  fontStyle: 'italic',
                                                  lineHeight: 1.3,
                                                }}
                                              >
                                                {clause.englishTitle}
                                              </div>
                                            )}
                                            <div
                                              style={{
                                                color: '#475569',
                                                fontStyle: 'italic',
                                                lineHeight: 1.5,
                                                whiteSpace: 'pre-line',
                                                fontSize: '0.81rem',
                                                textAlign: 'justify',
                                              }}
                                            >
                                              {clause.englishBody}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div>
                                  {pageClauses.map((clause, cIdx) => (
                                    <div key={cIdx} style={{ marginBottom: '16px' }}>
                                      {clause.khmerTitle && (
                                        <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.92rem', marginBottom: '2px' }}>
                                          {clause.khmerTitle}
                                        </div>
                                      )}
                                      <div style={{ color: '#0f172a', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: '6px' }}>
                                        {clause.khmerBody}
                                      </div>
                                      {clause.englishTitle && (
                                        <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.82rem', fontStyle: 'italic', marginBottom: '2px' }}>
                                          {clause.englishTitle}
                                        </div>
                                      )}
                                      <div style={{ color: '#475569', fontStyle: 'italic', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                                        {clause.englishBody}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {pageClauses.length === 0 && (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', border: '1px dashed #cbd5e1', borderRadius: '6px', margin: '20px 0' }}>
                                  ទំព័រនេះសម្រាប់ខ្លឹមសារ ឬឧបសម្ព័ន្ធបន្ថែម (Appendix / Annex Page)
                                </div>
                              )}
                            </div>

                            {/* 3. Official Revision History Table on the LAST PAGE! */}
                            {pageNum === totalPages && (
                              <div style={{ marginTop: '20px' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.84rem', margin: '14px 0 6px', color: '#0f172a' }}>
                                  ប្រវត្តិនៃការត្រួតពិនិត្យឡើងវិញ (Document Revision History):
                                </div>
                                <table
                                  style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '0.78rem',
                                    border: '1.5px solid #1e293b',
                                  }}
                                >
                                  <thead>
                                    <tr style={{ background: '#f8fafc', textAlign: 'center' }}>
                                      <th style={{ border: '1px solid #1e293b', padding: '6px 8px', width: '15%' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>ការពិនិត្យឡើងវិញ</div>
                                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>REVISION</div>
                                      </th>
                                      <th style={{ border: '1px solid #1e293b', padding: '6px 8px', width: '16%' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>កាលបរិច្ឆេទ</div>
                                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>DATE</div>
                                      </th>
                                      <th style={{ border: '1px solid #1e293b', padding: '6px 8px', width: '15%' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>ឃ្លា</div>
                                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>PARAGRAPH</div>
                                      </th>
                                      <th style={{ border: '1px solid #1e293b', padding: '6px 8px', width: '36%' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>សង្ខេបនៃការកែសម្រួល</div>
                                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>SUMMARY OF CHANGE</div>
                                      </th>
                                      <th style={{ border: '1px solid #1e293b', padding: '6px 8px', width: '18%' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>អនុម័តដោយ</div>
                                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>AUTHORIZED BY</div>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {previewSop.revisions.map((rev, idx) => (
                                      <tr key={idx}>
                                        <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center', fontWeight: 800 }}>{rev.rev}</td>
                                        <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center' }}>{rev.date}</td>
                                        <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center' }}>{rev.paragraph}</td>
                                        <td style={{ border: '1px solid #1e293b', padding: '6px 8px' }}>{rev.summary}</td>
                                        <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center' }}>{rev.authorizedBy}</td>
                                      </tr>
                                    ))}
                                    <tr>
                                      <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center', fontWeight: 800 }}>02</td>
                                      <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center' }}>—</td>
                                      <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center' }}>—</td>
                                      <td style={{ border: '1px solid #1e293b', padding: '6px 8px', color: '#64748b' }}>
                                        ការកែសម្រួលតាមតម្រូវការអតិថិជន និងផលិតផលថ្មី
                                      </td>
                                      <td style={{ border: '1px solid #1e293b', padding: '6px', textAlign: 'center' }}>—</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* QUICK HEADER & SIGNATORIES EDIT MODAL FOR SOP */}
      {editingHeaderSop && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '95%',
              maxWidth: '680px',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  ✍️ កែប្រែឈ្មោះរោងចក្រ & ហត្ថលេខី SOP: {editingHeaderSop.code}
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  កំណត់ឈ្មោះក្រុមហ៊ុន និងឈ្មោះអ្នកចុះហត្ថលេខាឱ្យត្រូវតាមរោងចក្រជាក់ស្តែង
                </span>
              </div>
              <button
                onClick={() => setEditingHeaderSop(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* COMPANY NAME & PRODUCT */}
              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e40af', display: 'block', marginBottom: '4px' }}>
                      🏢 ឈ្មោះក្រុមហ៊ុន / រោងចក្រ (Factory / Company Name):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.companyName}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, companyName: e.target.value })}
                      placeholder="e.g. G.S.textileGarment(Cambodia) co.,Ltd"
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #93c5fd', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e40af', display: 'block', marginBottom: '4px' }}>
                      🏭 ប្រភេទផលិតផល (Product Type):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.productType}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, productType: e.target.value })}
                      placeholder="e.g. Garment & Textile Products"
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #93c5fd', borderRadius: '6px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* DOCUMENT DETAILS */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                  📄 លេខកូដឯកសារ និងកាលបរិច្ឆេទ (Doc No & Dates)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      Doc No:
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.code}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, code: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      Edition:
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.edition}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, edition: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      Page Info:
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.pageInfo}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, pageInfo: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      ចេញដំបូង (Issued):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.initialIssuedDate || '10-11-2023'}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, initialIssuedDate: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      ចូលជាធរមាន (Effective):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.effectiveDate || '11-11-2024'}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, effectiveDate: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      កែប្រែ/ពិនិត្យ (Amend):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.amendDate || '10-10-2025'}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, amendDate: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* SIGNATORIES: PREPARED BY & APPROVED BY */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#047857', marginBottom: '8px' }}>
                  ✍️ ឈ្មោះហត្ថលេខី និងតួនាទី (Signatory Names & Roles)
                </div>

                {/* 1. PREPARED BY */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '8px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                      ឈ្មោះអ្នករៀបចំ (Prepared By Name):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.preparedBy}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, preparedBy: e.target.value })}
                      placeholder="e.g. Mr. CHAN PHEARUM"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                      តួនាទីអ្នករៀបចំ (Prepared Role):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.preparedRole}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, preparedRole: e.target.value })}
                      placeholder="e.g. ប្រធានរដ្ឋបាល/ធនធានមនុស្ស HR/Admin Manager"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                      កាលបរិច្ឆេទ (Date):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.preparedDate}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, preparedDate: e.target.value })}
                      placeholder="e.g. 01-11-2024"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* 2. APPROVED BY */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                      ឈ្មោះអ្នកអនុម័ត (Approved By Name):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.approvedBy}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, approvedBy: e.target.value })}
                      placeholder="e.g. Mr. CHEN LANMAO"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                      តួនាទីអ្នកអនុម័ត (Approved Role):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.approvedRole}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, approvedRole: e.target.value })}
                      placeholder="e.g. នាយកក្រុមហ៊ុន General Manager"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                      កាលបរិច្ឆេទ (Date):
                    </label>
                    <input
                      type="text"
                      value={editingHeaderSop.approvedDate}
                      onChange={(e) => setEditingHeaderSop({ ...editingHeaderSop, approvedDate: e.target.value })}
                      placeholder="e.g. 11-11-2024"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* BATCH APPLY CHECKBOX */}
              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <input
                  type="checkbox"
                  id="applySopHeaderAllCheckbox"
                  checked={applySopHeaderToAll}
                  onChange={(e) => setApplySopHeaderToAll(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label
                  htmlFor="applySopHeaderAllCheckbox"
                  style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', cursor: 'pointer' }}
                >
                  ⚡ អនុវត្តឈ្មោះរោងចក្រ ឈ្មោះហត្ថលេខី (រៀបចំ/អនុម័ត) និងកាលបរិច្ឆេទនេះ ទៅកាន់រាល់ SOP ទាំងអស់ (Apply to all 64 SOPs)
                </label>
              </div>
            </div>

            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                background: '#f8fafc',
              }}
            >
              <button
                onClick={() => setEditingHeaderSop(null)}
                style={{
                  padding: '7px 14px',
                  background: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                បោះបង់ (Cancel)
              </button>
              <button
                onClick={handleSaveQuickHeaderSop}
                style={{
                  padding: '7px 18px',
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                💾 រក្សាទុក (Save Changes)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

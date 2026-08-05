/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { ArrowLeft, UploadCloud, FileText, CheckCircle2, XCircle, Download, Loader } from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  parseProductsCsv,
  CSV_TEMPLATE,
  ImportProduct,
} from '../lib/productImport';

interface ProductImportViewProps {
  onBack: () => void;
  onImport: (products: ImportProduct[]) => Promise<{ ok: number; failed: number; errors: string[] }>;
}

export const ProductImportView: React.FC<ProductImportViewProps> = ({ onBack, onImport }) => {
  const [raw, setRaw] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number; errors: string[] } | null>(null);

  const parsed = useMemo(() => (raw.trim() ? parseProductsCsv(raw) : null), [raw]);
  const validRows = parsed?.rows.filter((r) => r.errors.length === 0) ?? [];

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result || ''));
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await onImport(validRows.map((r) => r.product!));
      setResult(res);
      if (res.failed === 0) setRaw('');
    } catch (err) {
      setResult({ ok: 0, failed: validRows.length, errors: [(err as Error).message] });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cosmic-products-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-body-mono select-none text-cream animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-retro-surface border-2 border-retro-border p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cream-muted hover:text-accent-purple transition-colors text-xs font-bold font-retro-mono tracking-wider cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>BACK TO INVENTORY</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-accent-purple/10 border border-accent-purple/30 text-accent-purple">
            <UploadCloud size={18} />
          </div>
          <div>
            <h3 className="text-sm font-retro-heading uppercase tracking-widest text-cream">BULK PRODUCT IMPORT</h3>
            <p className="text-[10px] text-cream-muted uppercase leading-none mt-1">Paste or upload a CSV — one row per product</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-retro-surface border-2 border-retro-border p-4 text-[11px] text-cream-muted space-y-2 leading-relaxed">
        <p className="text-cream uppercase font-bold text-xs">CSV FORMAT</p>
        <p>
          Columns (header row required): <span className="text-accent-purple">name, category, price</span> are mandatory;
          the rest are optional — <span className="text-cream">sale_price, stock, sizes, colors, images, badge, short_desc, description, is_active, is_featured</span>.
        </p>
        <p>
          <span className="text-retro-gold">category</span> ∈ mens · womens · gym · jewelry · accessories.
          Multi-value cells (<span className="text-cream">sizes, colors, images</span>) separate entries with <span className="text-cream">|</span> — e.g. <span className="text-cream">M|L|XL</span>.
          At least one valid image URL is required per product.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={downloadTemplate} className="flex items-center gap-1.5">
            <Download size={12} /> DOWNLOAD TEMPLATE
          </Button>
          <Button size="sm" variant="retro-outline" onClick={() => setRaw(CSV_TEMPLATE)}>
            LOAD EXAMPLE
          </Button>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-retro-border text-cream-muted hover:border-accent-purple hover:text-accent-purple text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors">
            <FileText size={12} /> UPLOAD .CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      {/* Paste area */}
      <div className="bg-retro-surface border-2 border-retro-border p-4 space-y-2">
        <label className="text-xs text-cream-muted uppercase tracking-wider block">CSV DATA</label>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={'name,category,price,...\nNEON JACKET,mens,189.99,...'}
          spellCheck={false}
          className="w-full h-40 bg-space-black text-cream border-2 border-retro-border p-3 text-xs font-mono focus:outline-none focus:border-accent-purple resize-y"
        />
      </div>

      {/* Header warning */}
      {parsed && parsed.headerMissing.length > 0 && (
        <div className="bg-retro-red/10 border-2 border-retro-red/50 p-3 text-xs text-retro-red uppercase">
          Missing required header column(s): {parsed.headerMissing.join(', ')}
        </div>
      )}

      {/* Preview */}
      {parsed && parsed.rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider">
            <span className="text-cream-muted">
              PARSED <span className="text-cream font-bold">{parsed.rows.length}</span> ROWS ·{' '}
              <span className="text-retro-green font-bold">{parsed.totalValid} VALID</span> ·{' '}
              <span className="text-retro-red font-bold">{parsed.rows.length - parsed.totalValid} WITH ERRORS</span>
            </span>
          </div>

          <div className="border-2 border-retro-border bg-retro-surface overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="sticky top-0">
                <tr className="bg-space-black border-b-2 border-retro-border text-[10px] text-cream-muted uppercase tracking-widest">
                  <th className="p-2 w-10 text-center">#</th>
                  <th className="p-2 w-10">OK</th>
                  <th className="p-2">NAME</th>
                  <th className="p-2 w-28">CATEGORY</th>
                  <th className="p-2 w-20 text-right">PRICE</th>
                  <th className="p-2">NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-retro-border text-xs">
                {parsed.rows.map((row) => {
                  const ok = row.errors.length === 0;
                  return (
                    <tr key={row.index} className={ok ? '' : 'bg-retro-red/5'}>
                      <td className="p-2 text-center text-cream-muted font-mono">{row.index}</td>
                      <td className="p-2">
                        {ok ? (
                          <CheckCircle2 size={14} className="text-retro-green" />
                        ) : (
                          <XCircle size={14} className="text-retro-red" />
                        )}
                      </td>
                      <td className="p-2 font-bold truncate max-w-[220px]" title={row.name}>{row.name}</td>
                      <td className="p-2 uppercase text-cream-muted">{row.product?.category || row.category || '—'}</td>
                      <td className="p-2 text-right font-mono">
                        {row.product ? `$${row.product.price.toFixed(2)}` : '—'}
                      </td>
                      <td className="p-2 text-[10px] text-retro-red uppercase leading-tight">
                        {ok ? <span className="text-retro-green">READY</span> : row.errors.join(' · ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-retro-surface border-2 border-retro-border p-4">
            <span className="text-[11px] text-cream-muted uppercase">
              Only the <span className="text-retro-green font-bold">{validRows.length}</span> valid rows will be imported. Fix errors above to include the rest.
            </span>
            <Button
              variant="success"
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3"
            >
              {importing ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>IMPORTING...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={15} />
                  <span>IMPORT {validRows.length} PRODUCTS</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className={`border-2 p-4 text-xs uppercase tracking-wide ${
            result.failed === 0
              ? 'bg-retro-green/10 border-retro-green text-retro-green'
              : 'bg-retro-gold/10 border-retro-gold text-retro-gold'
          }`}
        >
          <div className="font-bold mb-1">
            IMPORT COMPLETE — {result.ok} CREATED{result.failed > 0 ? `, ${result.failed} FAILED` : ''}.
          </div>
          {result.errors.length > 0 && (
            <ul className="list-disc pl-5 space-y-0.5 text-[10px] normal-case">
              {result.errors.slice(0, 10).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImportView;

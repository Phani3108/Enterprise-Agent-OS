/**
 * Workflow Execution Form — Dynamic inputs, file uploads, tool selectors
 * Supports: Basic + Advanced sections, file upload, paste URLs, tool selection
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useCallback } from 'react';
import type { WorkflowDef, InputField, InputFieldType } from '../../lib/marketing-workflows';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

export interface PreCheckResult {
  canExecute: boolean;
  reason?: string;
  missingTools?: string[];
}

interface WorkflowExecutionFormProps {
  workflow: WorkflowDef;
  onExecute: (inputs: Record<string, unknown>, fileIds?: string[], simulate?: boolean) => void;
  onCancel?: () => void;
  preCheck?: PreCheckResult | null;
  onPreCheck?: () => void;
}

function FileUploadField({
  field,
  onFileIdsChange,
}: {
  field: InputField;
  onFileIdsChange: (ids: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadedIds, setUploadedIds] = useState<string[]>([]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;
      setUploading(true);
      const ids: string[] = [];
      for (const file of files) {
        try {
          const buf = await file.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          const res = await fetch(`${GATEWAY_URL}/api/marketing/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              contentBase64: base64,
              mimeType: file.type || 'application/octet-stream',
            }),
          });
          if (res.ok) {
            const { fileId } = await res.json();
            ids.push(fileId);
          }
        } catch {
          // ignore
        }
      }
      setUploadedIds(ids);
      onFileIdsChange(ids);
      setUploading(false);
    },
    [onFileIdsChange]
  );

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label}</label>
      <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50/50">
        <input
          type="file"
          accept={field.accept ?? '.pdf,.ppt,.pptx,.doc,.docx,.csv,image/*'}
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
        />
        {field.helpText && <p className="text-[11px] text-slate-500 mt-1">{field.helpText}</p>}
        {uploading && <p className="text-xs text-amber-600 mt-1">Uploading…</p>}
        {uploadedIds.length > 0 && (
          <p className="text-xs text-emerald-600 mt-1">✓ {uploadedIds.length} file(s) ready for context</p>
        )}
      </div>
    </div>
  );
}

function renderField(
  field: InputField,
  value: unknown,
  onChange: (v: unknown) => void
): React.ReactNode {
  const baseClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent';
  const label = <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label}</label>;

  switch (field.type) {
    case 'text':
    case 'url':
      return (
        <div key={field.id}>
          {label}
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={baseClass}
          />
        </div>
      );
    case 'textarea':
      return (
        <div key={field.id}>
          {label}
          <textarea
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={baseClass}
          />
        </div>
      );
    case 'number':
      return (
        <div key={field.id}>
          {label}
          <input
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={baseClass}
          />
        </div>
      );
    case 'date':
      return (
        <div key={field.id}>
          {label}
          <input
            type="date"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClass}
          />
        </div>
      );
    case 'select':
      return (
        <div key={field.id}>
          {label}
          <select
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClass}
          >
            <option value="">Select…</option>
            {(field.options ?? []).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      );
    case 'multiselect':
      return (
        <div key={field.id}>
          {label}
          <div className="flex flex-wrap gap-2">
            {(field.options ?? []).map((o) => {
              const arr = (value as string[]) ?? [];
              const checked = arr.includes(o);
              return (
                <label key={o} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) onChange([...arr, o]);
                      else onChange(arr.filter((x) => x !== o));
                    }}
                    className="rounded border-slate-300"
                  />
                  {o}
                </label>
              );
            })}
          </div>
        </div>
      );
    case 'tags':
      return (
        <div key={field.id}>
          {label}
          <input
            type="text"
            value={Array.isArray(value) ? value.join(', ') : (value as string) ?? ''}
            onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            placeholder={field.placeholder ?? 'Comma-separated values'}
            className={baseClass}
          />
        </div>
      );
    case 'file':
      return (
        <FileUploadField
          key={field.id}
          field={field}
          onFileIdsChange={(ids) => onChange(ids)}
        />
      );
    default:
      return (
        <div key={field.id}>
          {label}
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClass}
          />
        </div>
      );
  }
}

export function WorkflowExecutionForm({ workflow, onExecute, onCancel, preCheck, onPreCheck }: WorkflowExecutionFormProps) {
  const [inputs, setInputs] = useState<Record<string, unknown>>({});
  const [simulateMode, setSimulateMode] = useState(false);

  const basicFields = workflow.inputs.filter((f) => f.section === 'basic');
  const advancedFields = workflow.inputs.filter((f) => f.section === 'advanced');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateInput = (id: string, value: unknown) => {
    setInputs((prev) => ({ ...prev, [id]: value }));
  };

  const canRun = preCheck?.canExecute ?? simulateMode;
  const blocked = preCheck && !preCheck.canExecute && !simulateMode;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const required = workflow.inputs.filter((f) => f.required);
    const missing = required.filter((f) => {
      const v = inputs[f.id];
      return v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
    });
    if (missing.length > 0) {
      alert(`Please fill required fields: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }
    if (blocked) {
      alert('Connect required tools or enable Simulation mode to run without real execution.');
      return;
    }
    const allFileIds = workflow.inputs
      .filter((f) => f.type === 'file')
      .flatMap((f) => (inputs[f.id] as string[]) ?? []);
    onExecute(inputs, allFileIds.length > 0 ? allFileIds : undefined, simulateMode);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Basic</h3>
        <div className="space-y-4">
          {basicFields.map((f) => (
            <div key={f.id}>
              {renderField(f, inputs[f.id], (v) => updateInput(f.id, v))}
              {f.required && <span className="text-red-500 text-xs ml-1">*</span>}
            </div>
          ))}
        </div>
      </div>

      {advancedFields.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((a) => !a)}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2"
          >
            {showAdvanced ? '▼' : '▶'} Advanced
          </button>
          {showAdvanced && (
            <div className="space-y-4 mt-3 pl-2 border-l-2 border-slate-200">
              {advancedFields.map((f) => (
                <div key={f.id}>
                  {renderField(f, inputs[f.id], (v) => updateInput(f.id, v))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {blocked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">Tools not connected</p>
          <p className="text-xs text-amber-700 mt-1">{preCheck?.reason}</p>
          {preCheck?.missingTools && preCheck.missingTools.length > 0 && (
            <ul className="text-xs text-amber-700 mt-2 list-disc list-inside">
              {preCheck.missingTools.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-amber-700 mt-2">
            Connect tools in Integrations, or enable Simulation mode below to run without real execution.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={simulateMode}
            onChange={(e) => setSimulateMode(e.target.checked)}
            className="rounded border-slate-300"
          />
          Simulation mode (no real tool execution)
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={!!(blocked && !simulateMode)}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {simulateMode ? 'Run (Simulation)' : 'Run Workflow'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-slate-600 text-sm font-semibold hover:text-slate-900">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

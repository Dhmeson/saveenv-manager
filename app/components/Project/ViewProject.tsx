'use client'
import { X, KeyRound, Unlock, Download } from "lucide-react";
import { StoredProject } from '@prisma/client'
import { SimpleCrypto } from "@/app/class/SimpleCrypto";
import { useState } from "react";

// Tipagem para uma variável do projeto
interface ProjectVariable {
  name: string;
  encrypted: string;
}

// Props do componente ViewProject
interface ViewProjectProps {
  viewProject: StoredProject|null;
  setViewProject: (project: StoredProject | null) => void;
}

export function ViewProject({
  viewProject,
  setViewProject,
}: ViewProjectProps) {
    const [decryptError, setDecryptError] = useState('')
    const [decryptedValues, setDecryptedValues] = useState<Record<string, string> | null>(null)
    const [encryptionKey, setEncryptionKey] = useState('')

  const handleDecrypt = (): void => {
    if (onDecrypt) {
      onDecrypt();
    }
  };

  const handleOverlayClick = (): void => {
    setViewProject(null);
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  };

  const handleCloseClick = (): void => {
    setViewProject(null);
  };

  const handleEncryptionKeyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEncryptionKey(e.target.value);
    setDecryptedValues(null);
    setDecryptError('');
  };

  function formatEnvValue(value: string | undefined): string {
    if (value === undefined || value === null) return ''
    const safe = String(value)
    if (/^[A-Za-z0-9_./:-]*$/.test(safe)) return safe
    return '"' + safe.replace(/"/g, '\\"') + '"'
  }

  function generateEnvContent(): string {
    if (!viewProject) return ''
    const variables = (viewProject as StoredProject & { variables: ProjectVariable[] })?.variables || []
    const lines: string[] = []
    for (const v of variables) {
      const value = decryptedValues ? decryptedValues[v.name] : ''
      lines.push(`${v.name}=${formatEnvValue(value)}`)
    }
    return lines.join('\n')
  }

  function handleDownloadEnv(): void {
    if (!viewProject) return
    const content = generateEnvContent()
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const safeName = (viewProject.name || 'env').toLowerCase().replace(/[^a-z0-9-_]+/g, '-')
    anchor.href = url
    anchor.download = `${safeName}.env`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  async function onDecrypt(){
      try {
        if (!viewProject) return
        if (!encryptionKey.trim()) {
          setDecryptError('Please enter the encryption key.')
          return
        }
        
        setDecryptError('')
        
        const projectWithVariables = viewProject as StoredProject & { variables: { name: string; encrypted: string }[] }
        const out = await SimpleCrypto.decryptVariables(projectWithVariables.variables, encryptionKey)
        
        if (Object.keys(out).length === 0) {
          setDecryptError('No variables in supported format for decryption.')
          setDecryptedValues(null)
        } else {
          console.log(out)
          setDecryptedValues(out)
        }
      } catch (err) {
        const msg = (err as Error)?.message
        if (msg === 'unsupported-format') {
          setDecryptError('Invalid encryption format. Please check your encryption key.')
        } else {
          setDecryptError('Decryption failed. Check the encryption key and try again.')
        }
        setDecryptedValues(null)
      }
  }
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" 
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-white/90 shadow-2xl backdrop-blur"
        onClick={handleModalClick}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              View Project
            </h3>
            <button
              className="inline-flex items-center rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 border border-white/15"
              onClick={handleDownloadEnv}
              disabled={!viewProject || ((viewProject as StoredProject & { variables: ProjectVariable[] })?.variables?.length || 0) === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Download .env
            </button>
          </div>
          <button 
            className="text-white/70 hover:text-white" 
            aria-label="Close" 
            onClick={handleCloseClick}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-indigo-300" />
          <input
            type="password"
            value={encryptionKey}
            onChange={handleEncryptionKeyChange}
            className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
            placeholder="Enter encryption key to decrypt variables"
          />
          <button
            className="inline-flex items-center rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-400 disabled:opacity-60"
            onClick={handleDecrypt}
          >
            <Unlock className="mr-2 h-4 w-4" /> Decrypt
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70">Name</p>
              <p className="font-medium text-white">{viewProject?.name}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70">Created on</p>
              <p className="font-medium text-white">{viewProject?.createdAt ? new Intl.DateTimeFormat(navigator.language, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }).format(new Date(viewProject.createdAt)) : 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70">Variables</p>
              <p className="font-medium text-white">{(viewProject as StoredProject & { variables: { name: string; encrypted: string }[] })?.variables?.length || 0}</p>
            </div>
          </div>

          {decryptError && (
            <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {decryptError}
            </div>
          )}
          
          {decryptedValues ? (
            <div className="space-y-2">
              <p className="text-sm text-white/70">Variables (decrypted)</p>
              <div className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-white/5 p-3">
                {(viewProject as StoredProject & { variables: ProjectVariable[] })?.variables?.map((v) => (
                  <div 
                    key={v.name} 
                    className="grid grid-cols-1 gap-2 md:grid-cols-3 md:items-center md:gap-4 border-b border-white/10 py-2 last:border-b-0"
                  >
                    <div className="text-white/80">{v.name}</div>
                    <div className="col-span-2">
                      <code className="block max-w-full overflow-x-auto rounded bg-black/20 p-2 text-xs text-white/90">
                        {decryptedValues[v.name] ?? '(unavailable)'}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-white/70">Variables (encrypted)</p>
              <div className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-white/5 p-3">
                {(viewProject as StoredProject & { variables: ProjectVariable[] })?.variables?.map((v) => (
                  <div 
                    key={v.name} 
                    className="grid grid-cols-1 gap-2 md:grid-cols-3 md:items-center md:gap-4 border-b border-white/10 py-2 last:border-b-0"
                  >
                    <div className="text-white/80">{v.name}</div>
                    <div className="col-span-2">
                      <code className="block max-w-full overflow-x-auto rounded bg-black/20 p-2 text-xs text-white/90">
                        {v.encrypted}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
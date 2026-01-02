'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { SimpleCrypto } from '@/app/class/SimpleCrypto'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { ENVIRONMENTS, iconOptions, ICONS } from '@/app/components/FolderIcon'
import { PasteButton } from '@/app/components/PasteButton'



export default function NewProjectPage() {
  const [projectName, setProjectName] = useState('')
  const [encryptionKey, setEncryptionKey] = useState('')
  const [variables, setVariables] = useState([{ name: '', value: '' }])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [projectDescription, setProjectDescription] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('')
  const [iconName, setIconName] = useState('')
  const [iconOpen, setIconOpen] = useState(false)
  const iconPickerRef = useRef<HTMLDivElement | null>(null)
  const [environment, setEnvironment] = useState('default')
  const [envOpen, setEnvOpen] = useState(false)
  const envPickerRef = useRef<HTMLDivElement | null>(null)

  const queryClient = useQueryClient()
  

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (iconPickerRef.current && !iconPickerRef.current.contains(target)) {
        setIconOpen(false)
      }
      if (envPickerRef.current && !envPickerRef.current.contains(target)) {
        setEnvOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  
  const addVariable = () => {
    setVariables([...variables, { name: '', value: '' }])
  }

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index))
  }

  const updateVariable = (index: number, field: 'name' | 'value', value: string) => {
    const updated = variables.map((variable, i) => (i === index ? { ...variable, [field]: value } : variable))
    setVariables(updated)
  }

  const parseDotEnv = (content: string): Array<{ name: string; value: string }> => {
    const result: Array<{ name: string; value: string }> = []
    const lines = content.split(/\r?\n/)
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eqIndex = line.indexOf('=')
      if (eqIndex === -1) continue
      const key = line.slice(0, eqIndex).trim()
      let val = line.slice(eqIndex + 1)
      // remove surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      // unescape common sequences
      val = val.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
      if (key) result.push({ name: key, value: val })
    }
    return result
  }

  const onImportClick = () => fileInputRef.current?.click()

  const handleImportFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result || '')
        const parsed = parseDotEnv(text)
        if (parsed.length === 0) {
          toast.error('No valid variables found in the .env file')
          return
        }
        // merge: update existing by name, append new ones
        const nameToIndex = new Map<string, number>()
        variables.forEach((v, idx) => {
          if (v.name) nameToIndex.set(v.name, idx)
        })
        const updated = [...variables]
        parsed.forEach(({ name, value }) => {
          if (!name) return
          if (nameToIndex.has(name)) {
            const i = nameToIndex.get(name) as number
            updated[i] = { name, value }
          } else {
            updated.push({ name, value })
          }
        })
        // ensure at least one blank row at end
        if (updated.length === 0 || updated[updated.length - 1].name || updated[updated.length - 1].value) {
          updated.push({ name: '', value: '' })
        }
        setVariables(updated)
        toast.success(`${parsed.length} variable(s) imported from .env`)
      } catch {
        toast.error('Failed to read .env file')
      } finally {
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleCreate = async () => {
    // All users have unlimited access - no limits
    if (!projectName || !encryptionKey) return
    const cleanVars = variables.filter(v => v.name && v.value)
    if (cleanVars.length === 0) return

    if (!encryptionKey.trim()) {
      toast.warning('Please enter an encryption key.')
      return
    }

    const encryptVar = async (_name: string, value: string): Promise<string> => SimpleCrypto.encrypt(value, encryptionKey)

    try {
      const encryptedList = await Promise.all(cleanVars.map(v => encryptVar(v.name, v.value)))

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            name: projectName,
            description: projectDescription || undefined,
            folderIcon: iconName || undefined,
            environment,
            variables: cleanVars.map((v, idx) => ({ name: v.name, encrypted: encryptedList[idx] })),
          }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = (data && data.error) ? data.error : 'Failed to create project on server'
        toast.error(msg)
        return
      }
      const created = await res.json()
      toast.success(`Project "${created.name || projectName}" created with ${cleanVars.length} variable(s).`)
      setProjectName('')
      setEncryptionKey('')
      setVariables([{ name: '', value: '' }])
      setProjectDescription('')
      queryClient.invalidateQueries({ queryKey: ['projects'] })

    
    } catch {
      toast.error('Unexpected error creating project. Please try again.')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="bg-linear-to-br from-white to-white/70 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent md:text-4xl">
        New Project
      </h1>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="grid gap-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Project Name</label>
            <div className="flex items-center gap-2">
              <input
                data-testid="project-name-input"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
                placeholder="e.g., E-commerce API"
                required
              />
              {selectedIcon && ICONS[selectedIcon]?.Icon && (
                <span className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/10 p-2 text-white/90" style={{ color: ICONS[selectedIcon].color }}>
                  {ICONS[selectedIcon]?.Icon && (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (React.createElement(ICONS[selectedIcon].Icon as any, { className: 'w-5 h-5' }))
                  )}
                </span>
              )}
              <div ref={iconPickerRef} className="relative">
                <button
                  type="button"
                  data-testid="project-icon-select"
                  onClick={() => setIconOpen((v) => !v)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/15"
                  aria-haspopup="listbox"
                  aria-expanded={iconOpen}
                >
                  {selectedIcon && ICONS[selectedIcon]?.Icon ? (
                    <>
                      <span style={{ color: ICONS[selectedIcon].color }}>
                        {React.createElement(ICONS[selectedIcon].Icon as unknown as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4' })}
                      </span>
                      <span>{ICONS[selectedIcon].label}</span>
                    </>
                  ) : (
                    <span>Icon</span>
                  )}
                </button>
                {iconOpen && (
                  <div className="absolute right-0 z-50 mt-2 max-h-64 w-44 overflow-auto rounded-lg border border-white/10 bg-slate-900/90 p-1 shadow-2xl backdrop-blur">
                    <ul role="listbox" className="space-y-1">
                      {iconOptions.map((opt) => {
                        const Meta = ICONS[opt.value]
                        return (
                          <li key={opt.value}>
                            <button
                              type="button"
                              onClick={() => { setSelectedIcon(opt.value); setIconName(opt.value); setIconOpen(false) }}
                              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-white/90 hover:bg-white/10 ${selectedIcon === opt.value ? 'bg-white/10' : ''}`}
                              role="option"
                              aria-selected={selectedIcon === opt.value}
                            >
                              <span style={{ color: Meta.color }}>
                                {React.createElement(Meta.Icon as unknown as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4' })}
                              </span>
                              <span>{Meta.label}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-1">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Description (optional)</label>
              <div className="flex items-center gap-2">
                <input
                  data-testid="project-description-input"
                  type="text"
                  name='description'
                  alt='description'
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="flex-1 h-10 rounded-lg border border-white/15 bg-white/10 px-3 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
                  placeholder="e.g., Payment integration project"
                />
                <div className="relative" ref={envPickerRef}>
                  <label className="sr-only">Environment</label>
                  <button
                    type="button"
                    data-testid="project-environment-select"
                    onClick={() => setEnvOpen((v) => !v)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/15"
                    aria-haspopup="listbox"
                    aria-expanded={envOpen}
                  >
                    <span style={{ color: ENVIRONMENTS[environment].color }}>
                      {React.createElement(ENVIRONMENTS[environment].Icon as unknown as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4' })}
                    </span>
                    <span>{ENVIRONMENTS[environment].label}</span>
                  </button>
                  {envOpen && (
                    <div className="absolute right-0 z-50 mt-2 max-h-64 w-48 overflow-auto rounded-lg border border-white/10 bg-slate-900/90 p-1 shadow-2xl backdrop-blur">
                      <ul role="listbox" className="space-y-1">
                        {Object.entries(ENVIRONMENTS).map(([value, meta]) => (
                          <li key={value}>
                            <button
                              type="button"
                              onClick={() => { setEnvironment(value); setEnvOpen(false) }}
                              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-white/90 hover:bg-white/10 ${environment === value ? 'bg-white/10' : ''}`}
                              role="option"
                              aria-selected={environment === value}
                            >
                              <span style={{ color: meta.color }}>
                                {React.createElement(meta.Icon as unknown as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4' })}
                              </span>
                              <span>{meta.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Encryption Key</label>
              <input
               data-testid="encryption-key-input"
               type="password"
               value={encryptionKey}
               onChange={(e) => setEncryptionKey(e.target.value)}
               className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
               placeholder="Enter your encryption key"
               required
             />
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <label className="block text-sm font-medium text-white/80">Environment Variables</label>
              <div className="flex items-center gap-2">
                  <button
                   data-testid="import-env-button"
                   onClick={onImportClick}
                   className="inline-flex items-center rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/15"
                 >
                   Import .env
                 </button>
                <input
                  type="file"
                  accept=".env,text/plain,application/octet-stream"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  className="hidden"
                />
                  <button
                   data-testid="add-variable-button"
                   onClick={addVariable}
                   className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1 text-sm font-medium text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400"
                 >
                   <Plus className="w-4 h-4" />
                   <span className="ml-1">Add</span>
                 </button>
              </div>
            </div>

        <div className="space-y-3">
  {variables.map((variable, index) => (
    <div key={index} className="flex items-center space-x-3">
      <div className="relative flex-1">
        <input
          data-testid={`variable-name-${index}`}
          type="text"
          value={variable.name}
          onChange={(e) => updateVariable(index, 'name', e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 pr-10 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
          placeholder="Variable name (e.g., DATABASE_URL)"
        />
        <PasteButton field='name' index={index} onPaste={updateVariable}/>
   
      </div>
      
      <div className="relative flex-1">
        <input
          data-testid={`variable-value-${index}`}
          type="text"
          value={variable.value}
          onChange={(e) => updateVariable(index, 'value', e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 pr-10 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
          placeholder="Variable value"
        />
        <PasteButton field='value' index={index} onPaste={updateVariable}/>

      </div>
      
      {variables.length > 1 && (
        <button
          data-testid={`remove-variable-${index}`}
          onClick={() => removeVariable(index)}
          className="text-rose-300 hover:text-rose-200"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  ))}
</div>


          </div>

          <div className="flex space-x-3">
                         <button
               data-testid="create-project-button"
               onClick={handleCreate}
               className="inline-flex items-center rounded-lg bg-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-400"
             >
               <Save className="w-4 h-4" />
               <span className="ml-2">Create Project</span>
             </button>
                         <button
               data-testid="cancel-project-button"
               onClick={() => {
                 setProjectName('')
                 setEncryptionKey('')
                 setVariables([{ name: '', value: '' }])
               }}
               className="rounded-lg border border-white/15 bg-white/10 px-6 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/15"
             >
               Cancel
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}



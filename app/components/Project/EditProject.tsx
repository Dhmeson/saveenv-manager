'use client'
import { SimpleCrypto } from "@/app/class/SimpleCrypto";
import { StoredProject } from "@prisma/client";
import { X, KeyRound, Unlock, Save, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useProjects } from "@/app/contexts";
import { useQueryClient } from "@tanstack/react-query";

interface Props{
    setEditProject: (project: StoredProject | null) => void;
    editProject: StoredProject|null;
}

export function EditProject({setEditProject,editProject}:Props){
    const { updateProjectWithVariables, deleteProject } = useProjects();
    const [encryptionKey, setEncryptionKey] = useState('')
    const [editUnlocked, setEditUnlocked] = useState(false)
    const [editVarsPlain, setEditVarsPlain] = useState<Array<{ name: string; value: string }>>([])
    const [editError, setEditError] = useState('')
    const [editName, setEditName] = useState(editProject?.name || '')
    const queryClient = useQueryClient()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    
    async function onSave(){
      try {
        if (!editProject) return
        if (!encryptionKey.trim()) {
          alert('Please enter the encryption key to continue.')
          return
        }
        
        const filtered = editVarsPlain.filter(v => v.name.trim())
        const encryptedList = await SimpleCrypto.encryptVariables(filtered, encryptionKey)

        // Update complete project with variables using context
        const success = await updateProjectWithVariables(editProject.id, {
          name: editName,
          variables: encryptedList.map(v => ({ name: v.name, encrypted: v.encrypted }))
        })
        
        if (success) {
          setEditProject(null)
          queryClient.invalidateQueries({ queryKey: ['projects'] })
        } else {
          alert('Failed to save changes on server.')
        }
      } catch  {
        alert('Failed to save changes.')
      }
    }
  const updateVariable = (index: number, field: 'name' | 'value', value: string) => {
    const updated = editVarsPlain.map((variable, i) => (i === index ? { ...variable, [field]: value } : variable))
    setEditVarsPlain(updated)
  }
    async function onDecrypt(){
         try {
                    if (!editProject) return
                    if (!encryptionKey.trim()) {
                      setEditError('Please enter the encryption key.')
                      return
                    }
                    
                    setEditError('')
                    
                    const projectWithVariables = editProject as StoredProject & { variables: { name: string; encrypted: string }[] }
                    const plainsMap = await SimpleCrypto.decryptVariables(projectWithVariables.variables, encryptionKey)
                    const plains = projectWithVariables.variables?.map((v) => ({ name: v.name, value: plainsMap[v.name] ?? '' })) || []
                    setEditVarsPlain(plains)
                    setEditUnlocked(true)
                     
                    // Update editable fields with current values
                    setEditName(editProject.name || '')
                  } catch (err) {
                    const msg = (err as Error)?.message
                    if (msg === 'unsupported-format') {
                      setEditError('Invalid encryption format. Please check your encryption key.')
                    } else {
                      setEditError('Failed to unlock. Check your encryption key and try again.')
                    }
                    setEditUnlocked(false)
                    setEditVarsPlain([])
                  }
    }
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditProject(null)}>
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-white/90 shadow-2xl backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
                Edit Project
              </h3>
              <button className="text-white/70 hover:text-white" aria-label="Close" onClick={() => setEditProject(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-indigo-300" />
              <input
                data-testid="encryption-key-input"
                type="password"
                value={encryptionKey}
                onChange={(e) => { setEncryptionKey(e.target.value); setEditUnlocked(false); setEditVarsPlain([]); setEditError('') }}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
                placeholder="Enter encryption key to unlock editing"
              />
              <button
                data-testid="unlock-project-button"
                className="inline-flex items-center rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-400 disabled:opacity-60"
                onClick={onDecrypt}>
                <Unlock className="mr-2 h-4 w-4" /> Unlock
              </button>
            </div>
            {editError && (
              <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{editError}</div>
            )}

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-1">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-10 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
                  />
                </div>
              </div>

              {editUnlocked ? (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-white/80">Variables (decrypted)</p>
                    <button
                      className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1 text-sm font-medium text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400"
                      onClick={() => setEditVarsPlain([...editVarsPlain, { name: '', value: '' }])}
                    >
                      Add variable
                    </button>
                  </div>
                  <div className="max-h-72 space-y-3 overflow-auto">
                    {editVarsPlain.map((v, idx) => (
                      <div key={`$${idx}`} className="grid grid-cols-1 gap-2 md:grid-cols-3 md:items-center md:gap-4">
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e)=>updateVariable(idx,'name',e.target.value)}
                       
                          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
                        />
                        <input
                          type="text"
                          value={v.value}
                          onChange={(e)=>updateVariable(idx,'value',e.target.value)}
                          className="col-span-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-2 text-sm font-medium text-white/80">Variables (encrypted) — unlock to edit</p>
                  <div className="max-h-72 space-y-3 overflow-auto">
                    {(editProject as StoredProject & { variables: { name: string; encrypted: string }[] })?.variables?.map((v) => (
                      <div key={v.name} className="grid grid-cols-1 gap-2 md:grid-cols-3 md:items-center md:gap-4">
                        <input
                          type="text"
                          value={v.name}
                          disabled
                          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white/70 outline-none ring-0"
                        />
                        <input
                          type="text"
                          value={v.encrypted}
                          disabled
                          className="col-span-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white/70 outline-none ring-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  className="inline-flex items-center rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/15"
                  onClick={() => setEditProject(null)}
                >
                  Cancel
                </button>
                <button
                  data-testid="delete-project-button"
                  className="inline-flex items-center rounded-lg border border-rose-400/30 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100 shadow-lg shadow-rose-900/20 transition hover:bg-rose-500/30 disabled:opacity-60"
                  disabled={!editUnlocked}
                  onClick={() => {
                    if (!editProject) return
                    if (!editUnlocked) return
                    setShowDeleteConfirm(true)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete project
                </button>
                <button
                  className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-400 disabled:opacity-60"
                  disabled={!editUnlocked}
                  onClick={onSave}
                >
                  <Save className="mr-2 h-4 w-4" /> Save changes
                </button>
              </div>
            </div>
          </div>
          {showDeleteConfirm && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
              onClick={(e) => { e.stopPropagation(); if (!isDeleting) setShowDeleteConfirm(false) }}
            >
              <div
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-white/90 shadow-2xl backdrop-blur"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="rounded-lg bg-rose-500/20 p-2">
                    <AlertTriangle className="h-5 w-5 text-rose-300" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">Delete project?</h4>
                    <p className="mt-1 text-sm text-white/70">This action cannot be undone. All variables in this project will be removed.</p>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    className="inline-flex items-center rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/15 disabled:opacity-60"
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false) }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex items-center rounded-lg border border-rose-400/30 bg-rose-500/30 px-4 py-2 text-sm font-semibold text-rose-100 shadow-lg shadow-rose-900/20 transition hover:bg-rose-500/40 disabled:opacity-60"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (!editProject) return
                      try {
                        setIsDeleting(true)
                        const success = await deleteProject(editProject.id)
                        if (success) {
                          setShowDeleteConfirm(false)
                          setEditProject(null)
                        } else {
                          setIsDeleting(false)
                        }
                      } catch  {
                        setIsDeleting(false)
                      }
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete permanently
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
    )
}
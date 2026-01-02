'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@prisma/client'
import {  Plus, Trash2, Shield, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    email: string
    password: string
    role: UserRole
  }>({
    name: '',
    email: '',
    password: '',
    role: UserRole.USER
  })

  useEffect(() => {
    // Verificar se é admin
    if (session?.user?.role !== UserRole.ADMIN) {
      router.push('/dashboard')
      return
    }
    fetchUsers()
  }, [session, router])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data)
    } catch  {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('All fields are required')
      return
    }

    try {
      setCreating(true)
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create user')
      }

      toast.success('User created successfully!')
      setShowCreateModal(false)
      setFormData({ name: '', email: '', password: '', role: UserRole.USER })
      fetchUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      toast.success('User deleted successfully!')
      fetchUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
    }
  }

  if (session?.user?.role !== UserRole.ADMIN) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-linear-to-br from-white to-white/70 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent md:text-4xl">
            User Management
          </h1>
          <p className="text-white/70 mt-2">Create and manage users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-400"
        >
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-center text-white/70 py-8">No users found</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-2 ${user.role === UserRole.ADMIN ? 'bg-indigo-500/20' : 'bg-white/10'}`}>
                    {user.role === UserRole.ADMIN ? (
                      <Shield className="h-5 w-5 text-indigo-400" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-white/70" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{user.name}</p>
                      {user.role === UserRole.ADMIN && (
                        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-400">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70">{user.email}</p>
                    <p className="text-xs text-white/50">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {user.id !== session?.user?.id && (
                  <button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                    title="Delete user"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-6">Create New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  placeholder="User name"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                  placeholder="Password"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value={UserRole.USER}>User</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ name: '', email: '', password: '', role: UserRole.USER })
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creating || !formData.name || !formData.email || !formData.password}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-4 py-2 rounded-lg transition"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


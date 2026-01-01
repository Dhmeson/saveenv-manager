import React from "react";
import { StoredProject } from "@prisma/client";
import { FolderOpen, Settings, Users, UserPlus, Trash2, Mail, Calendar, X, Loader2 } from "lucide-react"
import { ICONS, ENVIRONMENTS } from "@/app/components/FolderIcon";
import type { ProjectWithDetails } from "@/app/contexts/ProjectsContext";
import { useState } from "react";
import { toast } from "sonner";

interface Props{
    setViewProject:(project: StoredProject | null) => void;
    projects: ProjectWithDetails[];
    setEditProject:(project: StoredProject | null) => void;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  avatar: string;
}

interface PendingInvite {
  id: string;
  email: string;
  invitedAt: string;
  expiresAt: string;
}

export function ProjectsList({projects,setViewProject,setEditProject}:Props){
    const [selectedProject, setSelectedProject] = useState<StoredProject | null>(null);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
    const [loading, setLoading] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [sendingInvite, setSendingInvite] = useState(false);
    const [isProjectOwner, setIsProjectOwner] = useState(false);
    const handleOpenMembersModal = async (project: StoredProject) => {
        setSelectedProject(project);
        setShowMembersModal(true);
        await fetchProjectMembers(project.id);
    };

    const fetchProjectMembers = async (projectId: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/projects/settings/${projectId}/members`);
            if (!response.ok) {
                throw new Error('Failed to fetch project members');
            }
            const data = await response.json();
            setMembers(data.members || []);
            setPendingInvites(data.pendingInvites || []);
            setIsProjectOwner(data.projectOwner || false);
        } catch  {
            toast.error('Error loading project members');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (member: Member) => {
        if (!selectedProject) return;

        if (!confirm(`Are you sure you want to remove ${member.name} from the project?`)) return;

        try {
            const response = await fetch(`/api/projects/settings/${selectedProject.id}/members/${encodeURIComponent(member.email)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to remove member');
            }

            toast.success('Member removed successfully');
            // Remove member from local list
            setMembers(prevMembers => prevMembers.filter(m => m.id !== member.id));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error removing member');
        }
    };

    const handleSendInvite = async () => {
        if (!selectedProject || !inviteEmail.trim()) return;

        try {
            setSendingInvite(true);
            const response = await fetch(`/api/projects/settings/${selectedProject.id}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: inviteEmail.trim() })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send invitation');
            }

            toast.success('Invitation sent successfully');
            setInviteEmail('');
            // Add invitation to local list
            const newInvite: PendingInvite = {
                id: Date.now().toString(), // Temporary ID
                email: inviteEmail.trim(),
                invitedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };
            setPendingInvites(prev => [...prev, newInvite]);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error sending invitation');
        } finally {
            setSendingInvite(false);
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'Administrator';
            case 'LEAD':
                return 'Lead';
            case 'VIEW':
                return 'View';
            default:
                return role;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'LEAD':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'VIEW':
                return 'bg-green-500/20 text-green-300 border-green-500/30';
            default:
                return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    return (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-white/90 shadow-2xl backdrop-blur transition hover:bg-white/10"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {project.folderIcon && ICONS[project.folderIcon]?.Icon ? (
                  <span
                    className="h-8 w-8 transition group-hover:scale-110 inline-flex items-center justify-center"
                    style={{ color: ICONS[project.folderIcon].color }}
                  >
                    {React.createElement(
                      ICONS[project.folderIcon].Icon as React.ComponentType<{ className?: string }>,
                      { className: 'h-8 w-8' }
                    )}
                  </span>
                ) : (
                  <FolderOpen className="h-8 w-8 text-emerald-300 transition group-hover:scale-110" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                  <p className="text-sm text-white/60">Created on {project.createdAt ? new Intl.DateTimeFormat(navigator.language, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }).format(new Date(project.createdAt)) : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
          
              <div className="flex justify-between">
                <span className="text-white/70">Variables:</span>
                <span className="font-medium text-white">{project.variables?.length || 0}</span>
              </div>
              {(() => {
                const env = ((project as unknown) as { environment?: string }).environment ?? 'default'
                if (env === 'default') return null
                const meta = ENVIRONMENTS[env as keyof typeof ENVIRONMENTS]
                if (!meta) return null
                const IconComp = meta.Icon as React.ComponentType<{ className?: string }>
                return (
                  <div className="flex items-center gap-2">
                   
                    <span style={{ color: meta.color }}>
                      <IconComp className="h-4 w-4" />
                    </span>
                    <span className="text-white/90">{meta.label}</span>
                  </div>
                )
              })()}
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                data-testid={`view-project-${project.id}`}
                className="rounded-lg bg-indigo-500 px-3 py-1 text-sm font-medium text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-400"
                onClick={() => {
                  setViewProject(project)
                }}
              >
                View
              </button>
              <button
                data-testid={`edit-project-${project.id}`}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/15"
                onClick={() => {
                  setEditProject(project)
                }}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Gerenciamento de Membros */}
      {showMembersModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">
                  Manage Members - {selectedProject?.name}
                </h2>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Seção de Convite */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-green-400" />
                  Invite New Member
                </h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="New member's email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendInvite}
                    disabled={!inviteEmail.trim() || sendingInvite}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
                  >
                    {sendingInvite ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Lista de Membros */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Project Members ({members.length})
                </h3>
                
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 text-white animate-spin mx-auto mb-4" />
                    <p className="text-white/70">Loading members...</p>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/70">No members found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.avatar}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{member.name}</h4>
                            <p className="text-white/70 text-sm">{member.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3 text-white/50" />
                              <span className="text-white/50 text-xs">
                                Joined on {new Intl.DateTimeFormat(navigator.language, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }).format(new Date(member.joinedAt))}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                            {getRoleLabel(member.role)}
                          </span>
                          
                                                     {/* Botão de remover - apenas para VIEW ou se for owner */}
                           {(isProjectOwner || member.role === 'VIEW') && (
                             <button
                               onClick={() => handleRemoveMember(member)}
                               className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                               title="Remove member"
                             >
                               <Trash2 className="h-4 w-4" />
                             </button>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Convites Pendentes */}
              {pendingInvites.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-amber-400" />
                    Pending Invitations ({pendingInvites.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-4 bg-amber-500/10 rounded-xl border border-amber-500/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{invite.email}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3 text-white/50" />
                              <span className="text-white/50 text-xs">
                                Invitation sent on {new Intl.DateTimeFormat(navigator.language, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }).format(new Date(invite.invitedAt))}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="text-amber-400 text-sm font-medium">
                          Waiting for response
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
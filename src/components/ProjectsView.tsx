import React, { useState } from 'react';
import { Project, Site, Asset } from '../types';
import { 
  Briefcase, 
  Building2, 
  DollarSign, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Boxes,
  FileText,
  Truck
} from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  sites: Site[];
  assets: Asset[];
  onSelectProject?: (project: Project) => void;
  onNavigateToSite?: (siteId: string) => void;
  onNavigateToAssets?: (filter: { projectId?: string }) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects = [],
  sites = [],
  assets = [],
  onNavigateToSite,
  onNavigateToAssets
}) => {
  const safeProjects = projects || [];
  const safeSites = sites || [];
  const safeAssets = assets || [];

  const [selectedProjectId, setSelectedProjectId] = useState<string>(safeProjects[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Project Form State
  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    projectManager: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: 15000000,
    description: ''
  });

  const filteredProjects = safeProjects.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  });

  const activeProject = safeProjects.find(p => p.id === selectedProjectId) || safeProjects[0];

  // Compute stats for the active project
  const projectAssets = safeAssets.filter(a => activeProject && a.projectId === activeProject.id);
  const activeCount = projectAssets.filter(a => a.status === 'Active' || a.status === 'In Zone').length;
  const idleCount = projectAssets.filter(a => a.status === 'Idle').length;
  const maintCount = projectAssets.filter(a => a.status === 'Maintenance' || a.status === 'Under Maintenance').length;
  const inTransitCount = projectAssets.filter(a => a.status === 'In Transit').length;

  const projectSites = safeSites.filter(s => activeProject?.siteIds?.includes(s.id));
  const totalAssetValue = projectAssets.reduce((sum, a) => sum + (a.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <Briefcase className="w-5 h-5 text-amber-400" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Construction Projects</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise project portfolios, multi-site deployments, budget allocations, and machinery distributions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="ALL">All Project Statuses</option>
            <option value="Active">Active</option>
            <option value="Planning">Planning</option>
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid Overview Cards or Empty State */}
      {projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No projects have been created.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Create your first construction project to organize worksites, track allocated equipment, and manage budgets.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs mt-2"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create New Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const isSelected = project.id === activeProject?.id;
            const pAssets = assets.filter(a => a.projectId === project.id);
            const pActive = pAssets.filter(a => a.status === 'Active' || a.status === 'In Zone').length;
            const pIdle = pAssets.filter(a => a.status === 'Idle').length;
            const pMaint = pAssets.filter(a => a.status === 'Maintenance' || a.status === 'Under Maintenance').length;

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-400/40' 
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    isSelected ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {project.code}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    project.status === 'Active'
                      ? isSelected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold leading-tight mb-1 line-clamp-2">
                  {project.name}
                </h3>
                <p className={`text-xs mb-4 line-clamp-1 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                  Client: {project.client}
                </p>

                {/* Asset Allocation Breakdown (Requested in spec) */}
                <div className={`p-3 rounded-xl mb-3 text-xs ${isSelected ? 'bg-slate-800/80 border border-slate-700/60' : 'bg-slate-50 border border-slate-200/80'}`}>
                  <div className="text-[10px] uppercase font-bold tracking-wider mb-1.5 opacity-70">
                    Asset Allocation
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center font-mono">
                    <div>
                      <div className="text-base font-black">{pAssets.length}</div>
                      <div className="text-[9px] opacity-75">Total</div>
                    </div>
                    <div>
                      <div className="text-base font-black text-emerald-400">{pActive}</div>
                      <div className="text-[9px] opacity-75">Active</div>
                    </div>
                    <div>
                      <div className="text-base font-black text-amber-400">{pIdle}</div>
                      <div className="text-[9px] opacity-75">Idle</div>
                    </div>
                    <div>
                      <div className="text-base font-black text-rose-400">{pMaint}</div>
                      <div className="text-[9px] opacity-75">Maint</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/20">
                  <span className={`flex items-center gap-1 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                    <DollarSign className="w-3.5 h-3.5" />
                    ${(project.budget / 1000000).toFixed(1)}M Budget
                  </span>
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-amber-300' : 'text-slate-500'}`}>
                    PM: {((project.projectManager || 'Unassigned').split(' ') || ['Unassigned'])[0] || 'Unassigned'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Project In-Depth Workspace */}
      {activeProject && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {activeProject.code}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {activeProject.status}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900">{activeProject.name}</h2>
              <p className="text-xs text-slate-500 mt-1">{activeProject.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Project Manager</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-600" /> {activeProject.projectManager}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Timeline</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-600" /> {activeProject.startDate} to {activeProject.endDate}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Asset Value On-Site</span>
                <span className="text-xs font-bold text-emerald-700 font-mono">
                  ${(totalAssetValue).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Allocation & Deployed Sites */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sites Linked */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" /> Linked Construction Sites ({projectSites.length})
                </h3>
              </div>

              <div className="space-y-2">
                {projectSites.map((site) => (
                  <div 
                    key={site.id} 
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{site.name}</div>
                      <div className="text-[11px] text-slate-500">{site.address}</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">Manager: {site.manager}</div>
                    </div>
                    {onNavigateToSite && (
                      <button
                        onClick={() => onNavigateToSite(site.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1"
                      >
                        Site View <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Asset Allocation Breakdown */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-amber-600" /> Assigned Machinery & Tools ({projectAssets.length})
                </h3>
                {onNavigateToAssets && (
                  <button
                    onClick={() => onNavigateToAssets({ projectId: activeProject.id })}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                  >
                    Manage Assets <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-3 py-2.5">Asset</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5">Current Site / Zone</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Telematics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {projectAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="font-bold text-slate-900">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{asset.model} • {asset.id}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {asset.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div>{asset.siteName}</div>
                          <div className="text-[10px] text-slate-400">{asset.zoneName}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            asset.status === 'Active' || asset.status === 'In Zone'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : asset.status === 'Idle'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : asset.status === 'In Transit'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px]">
                          {asset.operatingHours ? `${asset.operatingHours.toLocaleString()} hrs` : 'N/A'}
                          {asset.fuelLevel !== undefined && ` • ${asset.fuelLevel}% fuel`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-black text-slate-900">Create New Construction Project</h2>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Project Delta — Airport Terminal Expansion"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Client Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. State Port Authority"
                    value={newProject.client}
                    onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Project Manager</label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Vance"
                    value={newProject.projectManager}
                    onChange={(e) => setNewProject({ ...newProject, projectManager: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Budget ($ USD)</label>
                  <input
                    type="number"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Completion</label>
                  <input
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Project Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Outline major milestones, structural requirements..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newProject.name) {
                    const newId = `PRJ-${Date.now().toString().slice(-4)}`;
                    projects.push({
                      id: newId,
                      code: newId,
                      name: newProject.name,
                      client: newProject.client || 'General Client',
                      projectManager: newProject.projectManager || 'Sarah Jenkins',
                      startDate: newProject.startDate,
                      endDate: newProject.endDate || '2026-12-31',
                      budget: newProject.budget,
                      status: 'Active',
                      siteIds: ['SITE-A'],
                      description: newProject.description
                    });
                    setSelectedProjectId(newId);
                    setShowCreateModal(false);
                  }
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

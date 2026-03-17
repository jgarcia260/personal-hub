'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

type TicketStatus = 'inbox' | 'next' | 'active' | 'done' | 'archived';
type TicketType = 'task' | 'research';

type Ticket = {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: number | null;
  type: TicketType;
  assigneeId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Get filters from URL or defaults
  const selectedUser = (searchParams.get('user') as 'V' | 'J') || 'V';
  const selectedStatuses = searchParams.get('status')?.split(',').filter(Boolean) || [];
  const selectedProjectId = searchParams.get('project') || null;

  // Update URL params
  const updateFilters = (updates: { 
    user?: 'V' | 'J'; 
    status?: string[]; 
    project?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.user !== undefined) {
      params.set('user', updates.user);
    }
    
    if (updates.status !== undefined) {
      if (updates.status.length > 0) {
        params.set('status', updates.status.join(','));
      } else {
        params.delete('status');
      }
    }
    
    if (updates.project !== undefined) {
      if (updates.project) {
        params.set('project', updates.project);
      } else {
        params.delete('project');
      }
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  // Fetch tickets and projects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ticketsRes, projectsRes] = await Promise.all([
          fetch('/api/tickets'),
          fetch('/api/projects')
        ]);
        
        const ticketsData = await ticketsRes.json();
        const projectsData = await projectsRes.json();
        
        setTickets(ticketsData.tickets || []);
        setProjects(projectsData.projects || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter tickets
  const filteredTickets = tickets
    .filter((ticket) => {
      // User filter (V or J) - for now using assigneeId as placeholder
      // TODO: Map actual user IDs once we have user data
      // For demo purposes, we'll show all tickets
      
      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(ticket.status)) {
        return false;
      }
      
      // Project filter
      if (selectedProjectId && ticket.projectId !== selectedProjectId) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Active tickets first
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      // Then by priority (lower number = higher priority)
      const priorityA = a.priority ?? 999;
      const priorityB = b.priority ?? 999;
      return priorityA - priorityB;
    });

  // Toggle status filter
  const toggleStatusFilter = (status: TicketStatus) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    updateFilters({ status: newStatuses });
  };

  // Clear all filters
  const clearFilters = () => {
    updateFilters({ status: [], project: null });
    setShowFilters(false);
  };

  // Stats
  const activeCount = filteredTickets.filter((t) => t.status === 'active').length;
  const nextCount = filteredTickets.filter((t) => t.status === 'next').length;
  const inboxCount = filteredTickets.filter((t) => t.status === 'inbox').length;
  const doneCount = filteredTickets.filter((t) => t.status === 'done').length;

  const activeFiltersCount = selectedStatuses.length + (selectedProjectId ? 1 : 0);

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-gray-950">
      {/* Header with V/J toggle and filters */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            
            {/* User Toggle */}
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <button
                onClick={() => updateFilters({ user: 'V' })}
                className={`
                  px-6 py-2 text-sm font-semibold rounded-md transition-all
                  ${
                    selectedUser === 'V'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                V
              </button>
              <button
                onClick={() => updateFilters({ user: 'J' })}
                className={`
                  px-6 py-2 text-sm font-semibold rounded-md transition-all
                  ${
                    selectedUser === 'J'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                J
              </button>
            </div>
          </div>

          {/* Stats and Filter Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className="text-gray-600 dark:text-gray-400">
                  {inboxCount} inbox
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-gray-600 dark:text-gray-400">
                  {nextCount} next
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-600 dark:text-gray-400">
                  {activeCount} active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full" />
                <span className="text-gray-600 dark:text-gray-400">
                  {doneCount} done
                </span>
              </div>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {/* Status Filters */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['inbox', 'next', 'active', 'done'] as TicketStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`
                        px-3 py-1.5 text-sm font-medium rounded-md transition-all
                        ${
                          selectedStatuses.includes(status)
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500'
                        }
                      `}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project
                </label>
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => updateFilters({ project: e.target.value || null })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ticket List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading tickets...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-600 mb-2">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  {activeFiltersCount > 0 ? 'No tickets match your filters' : `No tickets for ${selectedUser}`}
                </p>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-blue-600 dark:text-blue-400 text-sm hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors active:scale-[0.98] transform"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {/* Status indicator */}
                        <div
                          className={`
                            w-2 h-2 rounded-full flex-shrink-0
                            ${
                              ticket.status === 'inbox' ? 'bg-purple-500' :
                              ticket.status === 'active' ? 'bg-green-500' :
                              ticket.status === 'next' ? 'bg-blue-500' :
                              ticket.status === 'done' ? 'bg-gray-400' :
                              'bg-gray-300'
                            }
                          `}
                        />
                        
                        {/* Type badge */}
                        <span
                          className={`
                            text-xs px-2 py-0.5 rounded-full font-medium
                            ${
                              ticket.type === 'research'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }
                          `}
                        >
                          {ticket.type}
                        </span>

                        {/* Status text */}
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {ticket.status}
                        </span>

                        {/* Project name */}
                        {ticket.projectId && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            {projects.find(p => p.id === ticket.projectId)?.name || 'Unknown Project'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {ticket.title}
                      </h3>
                    </div>

                    {/* Priority indicator */}
                    {ticket.priority !== null && (
                      <div className="flex-shrink-0">
                        <div
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                            ${
                              ticket.priority === 1
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : ticket.priority === 2
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }
                          `}
                        >
                          P{ticket.priority}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chevron indicator */}
                  <div className="flex justify-end mt-2">
                    <svg
                      className="w-5 h-5 text-gray-400 dark:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';

type User = 'V' | 'J';

type Ticket = {
  id: string;
  title: string;
  status: 'active' | 'next';
  priority: number;
  type: 'task' | 'research';
  assignee: User;
};

// Mock data - will be replaced with real API calls
const mockTickets: Ticket[] = [
  {
    id: '1',
    title: 'Build Dashboard screen with ticket list and V/J toggle',
    status: 'active',
    priority: 1,
    type: 'task',
    assignee: 'V',
  },
  {
    id: '2',
    title: 'Setup Neon database connection',
    status: 'next',
    priority: 1,
    type: 'task',
    assignee: 'V',
  },
  {
    id: '3',
    title: 'Research best task management patterns',
    status: 'active',
    priority: 2,
    type: 'research',
    assignee: 'J',
  },
  {
    id: '4',
    title: 'Design ticket detail screen',
    status: 'next',
    priority: 2,
    type: 'task',
    assignee: 'J',
  },
  {
    id: '5',
    title: 'Implement offline support',
    status: 'next',
    priority: 3,
    type: 'task',
    assignee: 'V',
  },
];

export default function DashboardPage() {
  const [selectedUser, setSelectedUser] = useState<User>('V');

  // Filter tickets by selected user and prioritize: active first, then next
  const filteredTickets = mockTickets
    .filter((ticket) => ticket.assignee === selectedUser)
    .sort((a, b) => {
      // Active tickets first
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      // Then by priority (lower number = higher priority)
      return a.priority - b.priority;
    });

  const activeCount = filteredTickets.filter((t) => t.status === 'active').length;
  const nextCount = filteredTickets.filter((t) => t.status === 'next').length;

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-gray-950">
      {/* Header with V/J toggle */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            
            {/* User Toggle */}
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <button
                onClick={() => setSelectedUser('V')}
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
                onClick={() => setSelectedUser('J')}
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

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                {activeCount} active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                {nextCount} next
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
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
                No tickets for {selectedUser}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                All caught up! 🎉
              </p>
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
                    <div className="flex items-center gap-2 mb-2">
                      {/* Status indicator */}
                      <div
                        className={`
                          w-2 h-2 rounded-full flex-shrink-0
                          ${ticket.status === 'active' ? 'bg-green-500' : 'bg-blue-500'}
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
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {ticket.title}
                    </h3>
                  </div>

                  {/* Priority indicator */}
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
      </div>
    </div>
  );
}

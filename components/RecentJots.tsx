"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Jot {
  id: string;
  content: string;
  authorId: string;
  promotedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RecentJotsProps {
  limit?: number;
  onJotPromoted?: () => void;
}

export default function RecentJots({ limit = 5, onJotPromoted }: RecentJotsProps) {
  const router = useRouter();
  const [jots, setJots] = useState<Jot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const fetchJots = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/jots");
      if (!response.ok) throw new Error("Failed to fetch jots");
      
      const data = await response.json();
      // Sort by most recent and limit
      const sortedJots = data.jots
        .sort((a: Jot, b: Jot) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, limit);
      
      setJots(sortedJots);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJots();
  }, [limit]);

  const handlePromote = async (jotId: string) => {
    setPromotingId(jotId);
    setError("");

    try {
      const response = await fetch(`/api/jots/${jotId}/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to promote jot");
      }

      const result = await response.json();
      
      // Refresh jots list
      await fetchJots();
      
      // Notify parent component
      if (onJotPromoted) {
        onJotPromoted();
      }

      // Optionally navigate to the new ticket
      // router.push(`/ticket/${result.ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPromotingId(null);
    }
  };

  const handleViewTicket = (ticketId: string) => {
    router.push(`/ticket/${ticketId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (jots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No jots yet. Create your first quick note above!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 text-sm">
          {error}
        </div>
      )}

      {jots.map((jot) => (
        <div
          key={jot.id}
          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">
            {jot.content}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(jot.createdAt).toLocaleDateString()} at{" "}
              {new Date(jot.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            
            {jot.promotedTo ? (
              <button
                onClick={() => handleViewTicket(jot.promotedTo!)}
                className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                View Ticket →
              </button>
            ) : (
              <button
                onClick={() => handlePromote(jot.id)}
                disabled={promotingId === jot.id}
                className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                {promotingId === jot.id ? "Promoting..." : "Promote to Ticket"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

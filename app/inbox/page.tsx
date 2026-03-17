"use client";

import { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";

type Ticket = {
  id: string;
  title: string;
  description: string | null;
  type: "task" | "research";
  status: "inbox" | "next" | "active" | "done" | "archived";
  priority: number | null;
  projectId: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
};

type InboxItem = {
  id: string;
  ticketId: string;
  targetUser: string;
  position: number;
  triaged: boolean;
  createdAt: string;
  updatedAt: string;
  ticket: Ticket;
};

// Hardcoded for now - will be replaced with auth
const VERNE_USER_ID = "verne-user-id"; // This needs to match the actual user ID in the database
const TARGET_USER = VERNE_USER_ID;

export default function InboxPage() {
  const [currentItem, setCurrentItem] = useState<InboxItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch next inbox item
  const fetchNextItem = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/inbox-items/next?targetUser=${TARGET_USER}`);
      
      if (response.status === 404) {
        setCurrentItem(null);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch inbox item");
      }
      
      const data = await response.json();
      setCurrentItem(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  // Handle swipe right: assign to Verne + set status to 'next'
  const handleSwipeRight = async () => {
    if (!currentItem || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // 1. Update ticket: assign to Verne and set status to 'next'
      const updateTicketResponse = await fetch(`/api/tickets/${currentItem.ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigneeId: VERNE_USER_ID,
          status: "next",
        }),
      });
      
      if (!updateTicketResponse.ok) {
        throw new Error("Failed to update ticket");
      }
      
      // 2. Mark inbox item as triaged
      const triageResponse = await fetch(`/api/inbox-items/${currentItem.id}/triage`, {
        method: "POST",
      });
      
      if (!triageResponse.ok) {
        throw new Error("Failed to triage inbox item");
      }
      
      // 3. Load next inbox item
      await fetchNextItem();
      setSwipeProgress(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process swipe");
    } finally {
      setIsProcessing(false);
    }
  };

  // Swipe handlers
  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (eventData.dir === "Right") {
        // Calculate progress (0-100) based on swipe distance
        const progress = Math.min((eventData.deltaX / 200) * 100, 100);
        setSwipeProgress(progress);
      }
    },
    onSwipedRight: () => {
      if (swipeProgress >= 50) {
        handleSwipeRight();
      } else {
        setSwipeProgress(0);
      }
    },
    onSwiped: () => {
      setSwipeProgress(0);
    },
    trackMouse: true, // Enable mouse tracking for desktop testing
    preventScrollOnSwipe: true,
  });

  // Load initial item
  useEffect(() => {
    fetchNextItem();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Inbox</h1>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Inbox</h1>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-8 text-center">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
            <button
              onClick={fetchNextItem}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Inbox</h1>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              🎉 No items in your inbox! You're all caught up.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Inbox</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Swipe right to assign to Verne and move to "next" status
        </p>
        
        <div className="relative">
          {/* Swipe indicator background */}
          <div
            className="absolute inset-0 bg-green-500/20 rounded-lg transition-opacity"
            style={{ opacity: swipeProgress / 100 }}
          />
          
          {/* Card with swipe handler */}
          <div
            {...handlers}
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 cursor-grab active:cursor-grabbing transition-transform"
            style={{
              transform: `translateX(${swipeProgress * 2}px)`,
            }}
          >
            {/* Type badge */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentItem.ticket.type === "task"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                }`}
              >
                {currentItem.ticket.type}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Position: {currentItem.position}
              </span>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold mb-4">{currentItem.ticket.title}</h2>
            
            {/* Description */}
            {currentItem.ticket.description && (
              <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                {currentItem.ticket.description}
              </p>
            )}
            
            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Status: {currentItem.ticket.status}</span>
              {currentItem.ticket.priority && (
                <span>Priority: {currentItem.ticket.priority}</span>
              )}
            </div>
            
            {/* Processing indicator */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-lg flex items-center justify-center">
                <p className="text-lg font-medium">Processing...</p>
              </div>
            )}
          </div>
          
          {/* Swipe progress indicator */}
          {swipeProgress > 0 && (
            <div className="mt-4 text-center">
              <div className="inline-block bg-green-500 text-white px-4 py-2 rounded-lg font-medium">
                {swipeProgress >= 50 ? "Release to assign →" : "Keep swiping →"}
              </div>
            </div>
          )}
        </div>
        
        {/* Debug button (remove in production) */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSwipeRight}
            disabled={isProcessing}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign to Verne (Debug)
          </button>
          <button
            onClick={fetchNextItem}
            disabled={isProcessing}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

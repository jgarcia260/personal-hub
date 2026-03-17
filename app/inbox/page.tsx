'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type InboxItem = {
  id: string;
  ticketId: string;
  targetUser: string;
  position: number;
  triaged: boolean;
  createdAt: string;
  updatedAt: string;
  ticket: {
    id: string;
    title: string;
    description: string | null;
    type: 'task' | 'research';
    status: 'inbox' | 'next' | 'active' | 'done' | 'archived';
    priority: number | null;
  };
};

export default function InboxPage() {
  const [currentItem, setCurrentItem] = useState<InboxItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 100;
  
  // Fetch next inbox item
  const fetchNextItem = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual user ID from auth
      const targetUser = 'jorge'; // Placeholder
      
      const response = await fetch(`/api/inbox-items/next?targetUser=${targetUser}`);
      
      if (response.status === 404) {
        setCurrentItem(null);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch inbox item');
      }
      
      const data = await response.json();
      setCurrentItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCurrentItem(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Defer (swipe left) - move to back of queue
  const deferItem = async (itemId: string) => {
    try {
      setIsAnimating(true);
      
      const response = await fetch(`/api/inbox-items/${itemId}/defer`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to defer item');
      }
      
      // Wait for animation to complete, then fetch next item
      setTimeout(() => {
        setSwipeOffset(0);
        setIsAnimating(false);
        fetchNextItem();
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to defer item');
      setSwipeOffset(0);
      setIsAnimating(false);
    }
  };
  
  // Triage (swipe right) - mark as done and assign
  const triageItem = async (itemId: string) => {
    try {
      setIsAnimating(true);
      
      const response = await fetch(`/api/inbox-items/${itemId}/triage`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to triage item');
      }
      
      // Wait for animation to complete, then fetch next item
      setTimeout(() => {
        setSwipeOffset(0);
        setIsAnimating(false);
        fetchNextItem();
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to triage item');
      setSwipeOffset(0);
      setIsAnimating(false);
    }
  };
  
  // Touch handlers for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    
    setTouchEnd(currentTouch);
    setSwipeOffset(diff);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !currentItem) {
      setSwipeOffset(0);
      return;
    }
    
    const distance = touchEnd - touchStart;
    const absDistance = Math.abs(distance);
    
    // Check if swipe distance is sufficient
    if (absDistance >= minSwipeDistance) {
      if (distance < 0) {
        // Swipe left - defer
        setSwipeOffset(-500); // Animate off screen
        setTimeout(() => deferItem(currentItem.id), 150);
      } else {
        // Swipe right - triage
        setSwipeOffset(500); // Animate off screen
        setTimeout(() => triageItem(currentItem.id), 150);
      }
    } else {
      // Not enough distance - spring back
      setSwipeOffset(0);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };
  
  // Mouse handlers for desktop testing
  const [mouseDown, setMouseDown] = useState(false);
  
  const onMouseDown = (e: React.MouseEvent) => {
    setMouseDown(true);
    setTouchEnd(null);
    setTouchStart(e.clientX);
  };
  
  const onMouseMove = (e: React.MouseEvent) => {
    if (!mouseDown || !touchStart) return;
    
    const diff = e.clientX - touchStart;
    setTouchEnd(e.clientX);
    setSwipeOffset(diff);
  };
  
  const onMouseUp = () => {
    setMouseDown(false);
    onTouchEnd();
  };
  
  const onMouseLeave = () => {
    if (mouseDown) {
      setMouseDown(false);
      setSwipeOffset(0);
      setTouchStart(null);
      setTouchEnd(null);
    }
  };
  
  // Load first item on mount
  useEffect(() => {
    fetchNextItem();
  }, []);
  
  // Calculate opacity based on swipe distance
  const getSwipeOpacity = () => {
    if (swipeOffset === 0) return 0;
    return Math.min(Math.abs(swipeOffset) / minSwipeDistance, 1);
  };
  
  // Loading state
  if (loading && !currentItem) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading inbox...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchNextItem}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Empty inbox state
  if (!currentItem) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Inbox</h1>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Inbox Zero!
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              All items have been triaged
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Main inbox view with swipeable card
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Inbox</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Swipe left to defer • Swipe right to triage
        </p>
        
        {/* Swipe indicators */}
        <div className="relative mb-6 h-16">
          {/* Left indicator (defer) */}
          <div
            className="absolute left-0 top-0 h-full flex items-center transition-opacity"
            style={{ opacity: swipeOffset < 0 ? getSwipeOpacity() : 0 }}
          >
            <div className="bg-yellow-500 text-white px-6 py-3 rounded-r-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">⏭️</span>
              <span>Defer</span>
            </div>
          </div>
          
          {/* Right indicator (triage) */}
          <div
            className="absolute right-0 top-0 h-full flex items-center transition-opacity"
            style={{ opacity: swipeOffset > 0 ? getSwipeOpacity() : 0 }}
          >
            <div className="bg-green-500 text-white px-6 py-3 rounded-l-lg font-semibold flex items-center gap-2">
              <span>Triage</span>
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
        
        {/* Swipeable card */}
        <div
          ref={cardRef}
          className="relative touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: isAnimating || (swipeOffset === 0 && !mouseDown)
              ? 'transform 0.3s ease-out'
              : 'none',
            cursor: mouseDown ? 'grabbing' : 'grab',
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-800 p-6 shadow-lg select-none">
            {/* Ticket header */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`
                  text-xs px-3 py-1 rounded-full font-medium
                  ${
                    currentItem.ticket.type === 'research'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  }
                `}
              >
                {currentItem.ticket.type}
              </span>
              
              {currentItem.ticket.priority !== null && (
                <span
                  className={`
                    text-xs px-3 py-1 rounded-full font-bold
                    ${
                      currentItem.ticket.priority === 1
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : currentItem.ticket.priority === 2
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  P{currentItem.ticket.priority}
                </span>
              )}
              
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                Position: {currentItem.position}
              </span>
            </div>
            
            {/* Ticket title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {currentItem.ticket.title}
            </h2>
            
            {/* Ticket description */}
            {currentItem.ticket.description && (
              <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-wrap">
                {currentItem.ticket.description}
              </p>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => deferItem(currentItem.id)}
                disabled={isAnimating}
                className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
              >
                ⏭️ Defer
              </button>
              
              <Link
                href={`/ticket/${currentItem.ticketId}`}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors text-center"
              >
                View Details
              </Link>
              
              <button
                onClick={() => triageItem(currentItem.id)}
                disabled={isAnimating}
                className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
              >
                ✅ Triage
              </button>
            </div>
          </div>
        </div>
        
        {/* Swipe hint */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          💡 Tip: Swipe the card or use the buttons below
        </p>
      </div>
    </div>
  );
}

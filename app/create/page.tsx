"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TicketType = "task" | "research";

export default function CreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TicketType>("task");
  const [jotContent, setJotContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Create the ticket
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          type,
          status: "inbox",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create ticket");
      }

      const newTicket = await response.json();

      // Navigate to dashboard after successful creation
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jotContent.trim()) return;

    setError("");
    setIsSubmitting(true);

    try {
      // For now, we'll use a hardcoded user ID
      // TODO: Get actual user ID from auth context
      const response = await fetch("/api/jots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: jotContent,
          authorId: "00000000-0000-0000-0000-000000000000", // Placeholder
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create jot");
      }

      // Clear the jot input after successful creation
      setJotContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create Ticket</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Name Input */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
            >
              Task Name
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter task name..."
            />
          </div>

          {/* Type Selector Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("task")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  type === "task"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Task
              </button>
              <button
                type="button"
                onClick={() => setType("research")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  type === "research"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Research
              </button>
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add details about the task..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? "Creating..." : "Create Ticket"}
          </button>
        </form>

        {/* Jot Section - Quick Capture */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Quick Jot</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Capture quick thoughts or ideas. You can promote them to tickets later.
          </p>
          <form onSubmit={handleJotSubmit} className="space-y-3">
            <textarea
              value={jotContent}
              onChange={(e) => setJotContent(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Quick note or idea..."
            />
            <button
              type="submit"
              disabled={isSubmitting || !jotContent.trim()}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? "Saving..." : "Save Jot"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

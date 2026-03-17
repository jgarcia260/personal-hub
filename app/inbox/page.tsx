export default function InboxPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Inbox</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your tasks and items that need attention
        </p>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No items in your inbox
          </p>
        </div>
      </div>
    </div>
  );
}

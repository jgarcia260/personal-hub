export default function DashboardPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your personal productivity hub
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Today's Tasks</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">0</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Pending Items</h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">0</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Completed This Week</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">0</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add task, note, or entry</p>
          </div>
        </div>
      </div>
    </div>
  );
}

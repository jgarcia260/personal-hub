export default function SettingsPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Manage your preferences and account
        </p>
        
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold mb-2">Appearance</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Theme, colors, and display settings
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold mb-2">Notifications</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage notification preferences
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold mb-2">Account</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Profile and account settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

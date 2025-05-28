// Test component for notification functionality
import React, { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { Bell, Check, Trash2, RefreshCw, Settings } from 'lucide-react';

const NotificationTest = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    updatePreferences,
    clearError
  } = useNotifications();

  const { addNotification } = useApp();

  // Test fetching notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Test functions
  const testMarkAsRead = async (id) => {
    const result = await markAsRead(id);
    if (result.success) {
      console.log('✅ markAsRead successful');
    } else {
      console.error('❌ markAsRead failed:', result.error);
    }
  };

  const testMarkAllAsRead = async () => {
    const result = await markAllAsRead();
    if (result.success) {
      console.log('✅ markAllAsRead successful');
    } else {
      console.error('❌ markAllAsRead failed:', result.error);
    }
  };

  const testDelete = async (id) => {
    const result = await deleteNotification(id);
    if (result.success) {
      console.log('✅ deleteNotification successful');
    } else {
      console.error('❌ deleteNotification failed:', result.error);
    }
  };

  const testUpdatePreferences = async () => {
    const newPrefs = {
      ...preferences,
      email: !preferences.email
    };
    const result = await updatePreferences(newPrefs);
    if (result.success) {
      console.log('✅ updatePreferences successful');
    } else {
      console.error('❌ updatePreferences failed:', result.error);
    }
  };

  const testCreateLocalNotification = () => {
    addNotification({
      type: 'info',
      message: 'This is a test notification',
      duration: 5000
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Notification System Test</h2>
      
      {/* Status Info */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Status</h3>
        <div className="space-y-1 text-sm">
          <p>Loading: {loading ? '✅ Yes' : '❌ No'}</p>
          <p>Error: {error ? `❌ ${error}` : '✅ None'}</p>
          <p>Total Notifications: {notifications.length}</p>
          <p>Unread Count: {unreadCount}</p>
          <p>Email Notifications: {preferences.email ? '✅ Enabled' : '❌ Disabled'}</p>
          <p>Push Notifications: {preferences.push ? '✅ Enabled' : '❌ Disabled'}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchNotifications()}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={testMarkAllAsRead}
            disabled={unreadCount === 0}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
          >
            <Check className="h-4 w-4" />
            Mark All Read
          </button>
          <button
            onClick={() => deleteAllRead()}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Read
          </button>
          <button
            onClick={testUpdatePreferences}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center gap-1"
          >
            <Settings className="h-4 w-4" />
            Toggle Email
          </button>
          <button
            onClick={testCreateLocalNotification}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-1"
          >
            <Bell className="h-4 w-4" />
            Test Toast
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button
            onClick={clearError}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Clear Error
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div>
        <h3 className="font-semibold mb-2">Notifications ({notifications.length})</h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-gray-500">No notifications</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-3 rounded-lg border ${
                  notification.gelesen 
                    ? 'bg-white border-gray-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{notification.titel}</p>
                    <p className="text-sm text-gray-600">{notification.nachricht}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Type: {notification.typ} | Priority: {notification.prioritaet}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!notification.gelesen && (
                      <button
                        onClick={() => testMarkAsRead(notification._id)}
                        className="text-green-600 hover:text-green-800"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => testDelete(notification._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Console Output */}
      <div className="mt-6 p-4 bg-black text-green-400 rounded-lg font-mono text-sm">
        <p>Check browser console for test results</p>
      </div>
    </div>
  );
};

export default NotificationTest;
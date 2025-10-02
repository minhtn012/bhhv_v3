'use client';

import { useState, useEffect } from 'react';

interface SystemLog {
  _id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug' | 'http';
  message: string;
  method?: string;
  path?: string;
  status?: number;
  duration?: string;
  ip?: string;
  error?: string;
  stack?: string;
  userId?: {
    username: string;
    email: string;
  };
}

interface LogsResponse {
  logs: SystemLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: Record<string, number>;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState<Record<string, number>>({});

  // Filters
  const [levelFilter, setLevelFilter] = useState('');
  const [pathFilter, setPathFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (levelFilter) params.append('level', levelFilter);
      if (pathFilter) params.append('path', pathFilter);
      if (searchFilter) params.append('search', searchFilter);

      const response = await fetch(`/api/admin/logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');

      const data: LogsResponse = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching logs:', error);
      alert('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [levelFilter, pathFilter]);

  const handleSearch = () => {
    fetchLogs(1);
  };

  const handleClearOldLogs = async () => {
    if (!confirm('Delete logs older than 30 days?')) return;

    try {
      const response = await fetch('/api/admin/logs?olderThan=30', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete logs');

      const result = await response.json();
      alert(result.message);
      fetchLogs();
    } catch (error) {
      console.error('Error deleting logs:', error);
      alert('Failed to delete logs');
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      error: 'bg-red-100 text-red-800',
      warn: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-100 text-blue-800',
      debug: 'bg-gray-100 text-gray-800',
      http: 'bg-green-100 text-green-800',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status?: number) => {
    if (!status) return '';
    if (status >= 500) return 'text-red-600';
    if (status >= 400) return 'text-yellow-600';
    if (status >= 200) return 'text-green-600';
    return '';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">System Logs</h1>
        <p className="text-gray-600">View and manage application logs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(stats).map(([level, count]) => (
          <div key={level} className="bg-white p-4 rounded-lg shadow">
            <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getLevelColor(level)}`}>
              {level.toUpperCase()}
            </div>
            <div className="mt-2 text-2xl font-bold">{count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Level</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="http">HTTP</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Path</label>
            <input
              type="text"
              value={pathFilter}
              onChange={(e) => setPathFilter(e.target.value)}
              placeholder="/api/contracts"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search message, error..."
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Search
            </button>
            <button
              onClick={handleClearOldLogs}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear Old
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Path</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-md truncate">
                      {log.message}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">
                      {log.method && <span className="font-bold mr-1">{log.method}</span>}
                      {log.path}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${getStatusColor(log.status)}`}>
                      {log.status || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {log.duration || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Log Details</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}
                </div>
                <div>
                  <strong>Level:</strong>{' '}
                  <span className={`px-2 py-1 rounded text-sm ${getLevelColor(selectedLog.level)}`}>
                    {selectedLog.level}
                  </span>
                </div>
                <div>
                  <strong>Message:</strong> {selectedLog.message}
                </div>
                {selectedLog.path && (
                  <div>
                    <strong>Path:</strong> {selectedLog.method} {selectedLog.path}
                  </div>
                )}
                {selectedLog.status && (
                  <div>
                    <strong>Status:</strong>{' '}
                    <span className={getStatusColor(selectedLog.status)}>{selectedLog.status}</span>
                  </div>
                )}
                {selectedLog.duration && (
                  <div>
                    <strong>Duration:</strong> {selectedLog.duration}
                  </div>
                )}
                {selectedLog.ip && (
                  <div>
                    <strong>IP Address:</strong> {selectedLog.ip}
                  </div>
                )}
                {selectedLog.userId && (
                  <div>
                    <strong>User:</strong> {selectedLog.userId.username} ({selectedLog.userId.email})
                  </div>
                )}
                {selectedLog.error && (
                  <div>
                    <strong>Error:</strong>
                    <pre className="mt-2 bg-red-50 p-4 rounded text-sm overflow-x-auto">
                      {selectedLog.error}
                    </pre>
                  </div>
                )}
                {selectedLog.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-2 bg-gray-50 p-4 rounded text-xs overflow-x-auto">
                      {selectedLog.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

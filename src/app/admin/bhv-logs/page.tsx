'use client';

import { useState, useEffect } from 'react';

interface BhvLog {
  _id: string;
  timestamp: string;
  contractId: {
    _id: string;
    contractNumber: string;
  };
  contractNumber: string;
  success: boolean;
  duration: number;
  requestPayload: any;
  responseData: any;
  errorMessage?: string;
  errorDetails?: string;
  requestSize: number;
  responseSize?: number;
  cookieKeys: string[];
  cookieValues: Record<string, string>;
  hasCookies: boolean;
  pdfReceived: boolean;
  pdfSize?: number;
  userIp?: string;
}

interface BhvLogsResponse {
  logs: BhvLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
    successRate: string;
  };
}

export default function BhvLogsPage() {
  const [logs, setLogs] = useState<BhvLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    avgDuration: 0,
    successRate: '0',
  });

  // Filters
  const [successFilter, setSuccessFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<BhvLog | null>(null);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (successFilter) params.append('success', successFilter);
      if (searchFilter) params.append('search', searchFilter);

      const response = await fetch(`/api/admin/bhv-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch BHV logs');

      const data: BhvLogsResponse = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching BHV logs:', error);
      alert('Failed to fetch BHV logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [successFilter]);

  const handleSearch = () => {
    fetchLogs(1);
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getDurationColor = (duration: number) => {
    if (duration < 2000) return 'text-green-600';
    if (duration < 5000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">BHV Online Requests</h1>
        <p className="text-gray-600">Track all requests to BHV insurance system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total (24h)</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Successful</div>
          <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Failed</div>
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Success Rate</div>
          <div className="text-2xl font-bold">{stats.successRate}%</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Avg Duration</div>
          <div className="text-2xl font-bold">{stats.avgDuration}ms</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={successFilter}
              onChange={(e) => setSuccessFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Search Contract</label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Contract number..."
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No BHV logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contract
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    PDF
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Error
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {log.contractNumber}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          log.success
                        )}`}
                      >
                        {log.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${getDurationColor(
                        log.duration
                      )}`}
                    >
                      {log.duration}ms
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.pdfReceived ? (
                        <span className="text-green-600">✓ {(log.pdfSize || 0) / 1024}KB</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate">
                      {log.errorMessage || '-'}
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
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total
              logs)
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

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">BHV Request Details</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(selectedLog, null, 2);
                      const dataUri =
                        'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                      const exportFileDefaultName = `bhv_log_${selectedLog._id}_${new Date(
                        selectedLog.timestamp
                      ).toISOString()}.json`;

                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    💾 Download
                  </button>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}
                  </div>
                  <div>
                    <strong>Contract:</strong> {selectedLog.contractNumber}
                  </div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span
                      className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedLog.success)}`}
                    >
                      {selectedLog.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <div>
                    <strong>Duration:</strong>{' '}
                    <span className={getDurationColor(selectedLog.duration)}>
                      {selectedLog.duration}ms
                    </span>
                  </div>
                  <div>
                    <strong>Request Size:</strong> {(selectedLog.requestSize / 1024).toFixed(2)}KB
                  </div>
                  <div>
                    <strong>Response Size:</strong>{' '}
                    {selectedLog.responseSize
                      ? `${(selectedLog.responseSize / 1024).toFixed(2)}KB`
                      : 'N/A'}
                  </div>
                  <div>
                    <strong>Cookies:</strong> {selectedLog.hasCookies ? '✓ Yes' : '✗ No'}
                  </div>
                  <div>
                    <strong>PDF Received:</strong> {selectedLog.pdfReceived ? '✓ Yes' : '✗ No'}
                  </div>
                </div>

                {selectedLog.errorMessage && (
                  <div>
                    <strong className="text-red-600">Error:</strong>
                    <pre className="mt-2 bg-red-50 p-4 rounded text-sm overflow-x-auto">
                      {selectedLog.errorMessage}
                    </pre>
                  </div>
                )}

                {/* cURL Command */}
                <div className="border-t pt-4">
                  <details open>
                    <summary className="cursor-pointer font-bold mb-2 hover:text-green-600">
                      🔧 cURL Command (Replay Request)
                    </summary>
                    <pre className="mt-2 bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
{(() => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const contractId = selectedLog.contractId?._id || 'UNKNOWN';

  let curlCommand = `curl -X POST '${baseUrl}/api/contracts/${contractId}/submit-to-bhv' \\\n`;
  curlCommand += `  -H 'Content-Type: application/json' \\\n`;
  curlCommand += `  -H 'Accept: application/json' \\\n`;
  curlCommand += `  -H 'Cookie: token=<YOUR_AUTH_TOKEN>' \\\n`;

  // Use real cookie values if available
  const cookiesData = selectedLog.cookieValues || {};
  curlCommand += `  -d '${JSON.stringify({ cookies: cookiesData }, null, 2).replace(/'/g, "\\'")}'`;

  return curlCommand;
})()}
                    </pre>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => {
                          const baseUrl = window.location.origin;
                          const contractId = selectedLog.contractId?._id || 'UNKNOWN';

                          let curlCommand = `curl -X POST '${baseUrl}/api/contracts/${contractId}/submit-to-bhv' \\\n`;
                          curlCommand += `  -H 'Content-Type: application/json' \\\n`;
                          curlCommand += `  -H 'Accept: application/json' \\\n`;
                          curlCommand += `  -H 'Cookie: token=<YOUR_AUTH_TOKEN>' \\\n`;

                          // Use real cookie values if available
                          const cookiesData = selectedLog.cookieValues || {};
                          curlCommand += `  -d '${JSON.stringify({ cookies: cookiesData }, null, 2).replace(/'/g, "\\'")}'`;

                          navigator.clipboard.writeText(curlCommand);
                          alert('cURL command copied! Remember to replace <YOUR_AUTH_TOKEN> with your actual auth token.');
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        📋 Copy cURL
                      </button>
                      <button
                        onClick={() => {
                          // Copy BHV API direct call (to BHV endpoint)
                          const bhvEndpoint = 'https://my.bhv.com.vn/3f2fb62a-662a-4911-afad-d0ec4925f29e';
                          let curlCommand = `curl -X POST '${bhvEndpoint}' \\\n`;
                          curlCommand += `  -H 'Content-Type: application/json' \\\n`;
                          curlCommand += `  -H 'Accept: application/json' \\\n`;

                          // Use real BHV cookies if available
                          const cookiesData = selectedLog.cookieValues || {};
                          if (Object.keys(cookiesData).length > 0) {
                            const cookieHeader = Object.entries(cookiesData)
                              .map(([key, value]) => `${key}=${value}`)
                              .join('; ');
                            curlCommand += `  -H 'Cookie: ${cookieHeader}' \\\n`;
                          } else {
                            curlCommand += `  -H 'Cookie: <YOUR_BHV_COOKIE>' \\\n`;
                          }

                          curlCommand += `  -d '${JSON.stringify(selectedLog.requestPayload, null, 2).replace(/'/g, "\\'")}'`;

                          navigator.clipboard.writeText(curlCommand);
                          alert('Direct BHV API cURL copied with real cookie values! Ready to replay.');
                        }}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                      >
                        🌐 Copy Direct BHV cURL
                      </button>
                    </div>
                  </details>
                </div>

                {/* Request Payload */}
                <div className="border-t pt-4">
                  <details>
                    <summary className="cursor-pointer font-bold mb-2 hover:text-blue-600">
                      📤 Request Payload
                    </summary>
                    <pre className="mt-2 bg-blue-50 p-4 rounded text-xs overflow-x-auto max-h-96">
                      {JSON.stringify(selectedLog.requestPayload, null, 2)}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(selectedLog.requestPayload, null, 2)
                        );
                        alert('Request payload copied!');
                      }}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      📋 Copy Request
                    </button>
                  </details>
                </div>

                {/* Response Data */}
                {selectedLog.responseData && (
                  <div className="border-t pt-4">
                    <details>
                      <summary className="cursor-pointer font-bold mb-2 hover:text-green-600">
                        📥 Response Data
                      </summary>
                      <pre className="mt-2 bg-green-50 p-4 rounded text-xs overflow-x-auto max-h-96">
                        {JSON.stringify(selectedLog.responseData, null, 2)}
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(selectedLog.responseData, null, 2)
                          );
                          alert('Response copied!');
                        }}
                        className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        📋 Copy Response
                      </button>
                    </details>
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

// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';

// Define the type for our metric data
interface PortMetric {
  id: number;
  timestamp: string;
  location: string;
  vessel_count: number;
}

export default function Home() {
  const [metrics, setMetrics] = useState<PortMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const response = await fetch('/api/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const data: PortMetric[] = await response.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 bg-gray-900 text-gray-200">
      <div className="w-full max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-100">
            Orbital Freight Intelligence
          </h1>
          <p className="text-lg text-gray-400">
            Port Congestion Metrics Dashboard
          </p>
        </header>

        <div className="bg-gray-800 shadow-xl rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-200">
            Latest Satellite Telemetry
          </h2>
          
          {loading && <p className="text-center text-gray-400">Loading data...</p>}
          
          {error && <p className="text-center text-red-500">Error: {error}</p>}

          {!loading && !error && metrics.length === 0 && (
            <p className="text-center text-gray-500">No data available yet. Please run the data pipeline.</p>
          )}

          {!loading && !error && metrics.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Vessel Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-600">
                  {metrics.map((metric) => (
                    <tr key={metric.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(metric.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {metric.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                        {metric.vessel_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


import { useState, useEffect } from "react";
import "./App.css";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export default function App() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("");

  // Fetch data from API
const fetchData = async () => {
  try {
    // Fetch events
    const eventsUrl = selectedModel 
      ? `http://localhost:8000/events?limit=20&model=${selectedModel}`
      : `http://localhost:8000/events?limit=20`;
    
    const eventsRes = await fetch(eventsUrl);
    const eventsData = await eventsRes.json();
    
    // Fetch stats
    const statsRes = await fetch("http://localhost:8000/stats");
    const statsData = await statsRes.json();
    
    // FIX: Make sure eventsData is an array
    setEvents(Array.isArray(eventsData) ? eventsData : []);
    setStats(statsData);
    setLoading(false);
  } catch (error) {
    console.error("Failed to fetch data:", error);
    setEvents([]); // Set empty array on error
    setLoading(false);
  }
};

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedModel]);

  // Prepare chart data
  const latencyData = events.slice(0, 10).reverse().map((e, i) => ({
    name: `Event ${i + 1}`,
    latency: e.latency_ms,
  }));

  const tokenData = events.slice(0, 10).reverse().map((e, i) => ({
    name: `Event ${i + 1}`,
    tokens: e.tokens_used,
  }));

  // Get unique models for filter
  const uniqueModels = [...new Set(events.map(e => e.model))];

  if (loading) {
    return (
      <div className="app">
        <div style={{ padding: "40px", textAlign: "center", color: "#e2e8f0" }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <span className="brand-dot" />
            <div>
              <div className="brand-title">LLM Monitor</div>
              <div className="brand-sub">
                Live <span className="sep">•</span> {stats?.total_events || 0} requests tracked
              </div>
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="control-group">
            <label className="control-label">Filter by Model:</label>
            <select 
              className="control-select" 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="">All Models</option>
              {uniqueModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Stats Cards */}
        <section className="kpi-grid">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Total Events</div>
                <div className="card-sub">All time</div>
              </div>
            </div>
            <div className="stat">{stats?.total_events || 0}</div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Unique Models</div>
                <div className="card-sub">Tracked</div>
              </div>
            </div>
            <div className="stat">{stats?.unique_models || 0}</div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Avg Latency</div>
                <div className="card-sub">Milliseconds</div>
              </div>
            </div>
            <div className="stat">
              {stats?.avg_latency_ms ? Math.round(stats.avg_latency_ms) : 0}ms
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Total Cost</div>
                <div className="card-sub">Estimated</div>
              </div>
            </div>
            <div className="stat">
              ${stats?.total_cost ? stats.total_cost.toFixed(6) : "0.00"}
            </div>
          </div>
        </section>

        {/* Charts */}
        <section className="two-col">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Latency Over Time</div>
                <div className="card-sub">Recent 10 events</div>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      background: "#1e293b", 
                      border: "1px solid #334155" 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    name="Latency (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Token Usage</div>
                <div className="card-sub">Recent 10 events</div>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tokenData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      background: "#1e293b", 
                      border: "1px solid #334155" 
                    }}
                  />
                  <Bar dataKey="tokens" fill="#10b981" name="Tokens" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Recent Events Table */}
        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Recent Events ({events.length})</div>
              <div className="card-sub">Last 20 events</div>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Model</th>
                  <th>Latency</th>
                  <th>Tokens</th>
                  <th>Cost</th>
                  <th>Prompt</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.id}</td>
                    <td className="muted">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="pill">{event.model}</span>
                    </td>
                    <td className="num">{event.latency_ms}ms</td>
                    <td className="num">{event.tokens_used}</td>
                    <td className="num">
                      ${event.estimated_cost ? event.estimated_cost.toFixed(6) : "0.00"}
                    </td>
                    <td className="prompt">
                      {event.prompt.substring(0, 60)}
                      {event.prompt.length > 60 ? "..." : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
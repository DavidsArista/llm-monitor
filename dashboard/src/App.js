import "./App.css";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts";

/** ---------- Sample data (replace with real later) ---------- */
const latencyData = [
  { name: "Event 1", p95: 1900, p50: 1100 },
  { name: "Event 2", p95: 2300, p50: 1400 },
  { name: "Event 3", p95: 2600, p50: 1500 },
  { name: "Event 4", p95: 1800, p50: 1200 },
  { name: "Event 5", p95: 4700, p50: 2100 }, // spike
  { name: "Event 6", p95: 900, p50: 700 },
  { name: "Event 7", p95: 1500, p50: 950 },
  { name: "Event 8", p95: 2800, p50: 1600 },
  { name: "Event 9", p95: 2100, p50: 1300 },
  { name: "Event 10", p95: 2400, p50: 1400 },
];

const tokenData = [
  { name: "Event 1", tokens: 90 },
  { name: "Event 2", tokens: 130 },
  { name: "Event 3", tokens: 65 },
  { name: "Event 4", tokens: 70 },
  { name: "Event 5", tokens: 125 },
  { name: "Event 6", tokens: 110 },
  { name: "Event 7", tokens: 95 },
  { name: "Event 8", tokens: 140 }, // outlier
  { name: "Event 9", tokens: 60 },
  { name: "Event 10", tokens: 120 },
];

/** ---------- Helpers ---------- */
function formatMs(v) {
  return `${v} ms`;
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// “Top 10%” threshold (simple)
function p90(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(0.9 * (sorted.length - 1));
  return sorted[idx];
}

/** ---------- Tooltip ---------- */
function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      <div className="chart-tooltip-body">
        {payload.map((p) => (
          <div className="chart-tooltip-row" key={p.dataKey}>
            <span className="chart-tooltip-key">{p.name}</span>
            <span className="chart-tooltip-val">
              {valueFormatter ? valueFormatter(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** ---------- Charts ---------- */
function LatencyChart({ data }) {
  const sloMs = 2000;

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickMargin={8} />
          <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}s`} width={34} />
          <Tooltip content={<ChartTooltip valueFormatter={formatMs} />} />
          <ReferenceLine
            y={sloMs}
            strokeDasharray="6 6"
            label={{ value: "SLO 2.0s", position: "insideTopRight" }}
          />
          <Line
            type="monotone"
            dataKey="p95"
            name="P95"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="p50"
            name="P50"
            strokeWidth={2}
            opacity={0.65}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TokensChart({ data }) {
  const tokens = data.map((d) => d.tokens);
  const avg = mean(tokens);
  const cutoff = p90(tokens);

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickMargin={8} />
          <YAxis width={34} />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine
            y={avg}
            strokeDasharray="6 6"
            label={{ value: "Avg", position: "insideTopRight" }}
          />
          <Bar dataKey="tokens" name="Tokens">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                opacity={entry.tokens >= cutoff ? 1 : 0.55}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="chart-foot muted">Top 10% highlighted • Avg line shown</div>
    </div>
  );
}

/** ---------- KPI sample ---------- */
const kpis = {
  p95: "2.7s",
  p50: "1.1s",
  spend: "$0.0048",
  requests: "51",
  meta: "7 models • 3 users",
  trend: "↑ 18% vs last hour",
};

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <span className="brand-dot" />
            <div>
              <div className="brand-title">LLM Monitor</div>
              <div className="brand-sub">
                Live <span className="sep">•</span> last updated 8s ago{" "}
                <span className="sep">•</span> 51 requests tracked
              </div>
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="control-group">
            <label className="control-label">Time</label>
            <select className="control-select" defaultValue="2h">
              <option value="30m">Last 30m</option>
              <option value="2h">Last 2h</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Env</label>
            <select className="control-select" defaultValue="prod">
              <option value="prod">Prod</option>
              <option value="staging">Staging</option>
            </select>
          </div>

          <div className="search">
            <span className="search-icon">⌕</span>
            <input className="search-input" placeholder="Search prompt, trace id, user…" />
          </div>
        </div>
      </header>

      <main className="container">
        {/* KPIs */}
        <section className="kpi-grid">
          <div className="card card-hero">
            <div className="card-head">
              <div>
                <div className="card-title">Latency</div>
                <div className="card-sub">P50 / P95</div>
              </div>
              <div className="chip chip-neutral">SLO 2.0s</div>
            </div>

            <div className="hero-metrics">
              <div className="hero-metric">
                <div className="metric-label">P95</div>
                <div className="metric-value">{kpis.p95}</div>
                <div className="metric-meta">{kpis.trend}</div>
              </div>

              <div className="hero-metric">
                <div className="metric-label">P50</div>
                <div className="metric-value subtle">{kpis.p50}</div>
                <div className="metric-meta">steady</div>
              </div>
            </div>

            <div className="mini-note">
              Spikes correlate with high-token prompts and preview models.
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Spend</div>
                <div className="card-sub">Last 24h</div>
              </div>
              <div className="chip chip-warn">Money</div>
            </div>
            <div className="stat">{kpis.spend}</div>
            <div className="muted">Top driver: gpt-4-turbo-preview</div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Requests</div>
                <div className="card-sub">Last 24h</div>
              </div>
              <div className="chip chip-neutral">Traffic</div>
            </div>
            <div className="stat">{kpis.requests}</div>
            <div className="muted">{kpis.meta}</div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Quality flags</div>
                <div className="card-sub">Last 24h</div>
              </div>
              <div className="chip chip-bad">Risk</div>
            </div>
            <div className="stat">3</div>
            <div className="muted">2 hallucination suspects • 1 policy risk</div>
          </div>
        </section>

        {/* Triage */}
        <section className="two-col">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Alerts & outliers</div>
                <div className="card-sub">Click to filter</div>
              </div>
            </div>

            <ul className="list">
              <li className="list-item">
                <span className="badge badge-warn">⚠</span>
                <div className="list-main">
                  <div className="list-title">Latency spike</div>
                  <div className="list-sub">claude-3-sonnet batch at 6:48pm</div>
                </div>
                <button className="btn btn-ghost">Filter</button>
              </li>

              <li className="list-item">
                <span className="badge badge-good">💸</span>
                <div className="list-main">
                  <div className="list-title">High token prompt</div>
                  <div className="list-sub">Event 46 used 139 tokens</div>
                </div>
                <button className="btn btn-ghost">Filter</button>
              </li>

              <li className="list-item">
                <span className="badge badge-bad">🧪</span>
                <div className="list-main">
                  <div className="list-title">Quality drop</div>
                  <div className="list-sub">gemini-pro scored lower than usual</div>
                </div>
                <button className="btn btn-ghost">Filter</button>
              </li>
            </ul>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Top cost drivers</div>
                <div className="card-sub">Share of spend</div>
              </div>
            </div>

            <div className="rank">
              <div className="rank-row">
                <div className="rank-left">
                  <span className="rank-num">1</span>
                  <span className="pill">gpt-4-turbo-preview</span>
                </div>
                <div className="rank-right">
                  <span className="muted">41%</span>
                  <div className="bar">
                    <div className="bar-fill" style={{ width: "41%" }} />
                  </div>
                </div>
              </div>

              <div className="rank-row">
                <div className="rank-left">
                  <span className="rank-num">2</span>
                  <span className="pill">claude-3-sonnet</span>
                </div>
                <div className="rank-right">
                  <span className="muted">33%</span>
                  <div className="bar">
                    <div className="bar-fill" style={{ width: "33%" }} />
                  </div>
                </div>
              </div>

              <div className="rank-row">
                <div className="rank-left">
                  <span className="rank-num">3</span>
                  <span className="pill">gemini-pro</span>
                </div>
                <div className="rank-right">
                  <span className="muted">19%</span>
                  <div className="bar">
                    <div className="bar-fill" style={{ width: "19%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Charts */}
        <section className="two-col">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Latency over time</div>
                <div className="card-sub">P95 with SLO line</div>
              </div>
              <div className="chip chip-neutral">P95</div>
            </div>

            <LatencyChart data={latencyData} />
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Tokens per request</div>
                <div className="card-sub">Highlights top 10%</div>
              </div>
              <div className="chip chip-good">Tokens</div>
            </div>

            <TokensChart data={tokenData} />
          </div>
        </section>

        {/* Recent events */}
        <section className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Recent events</div>
              <div className="card-sub">Triage-first table</div>
            </div>
            <div className="table-actions">
              <button className="btn">Export</button>
              <button className="btn btn-primary">View traces</button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th className="num">Latency</th>
                  <th className="num">Tokens</th>
                  <th className="num">Cost</th>
                  <th>Prompt</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="muted">2m ago</td>
                  <td><span className="pill">gpt-4-turbo-preview</span></td>
                  <td><span className="status status-warn">Slow</span></td>
                  <td className="num">2722ms</td>
                  <td className="num">139</td>
                  <td className="num">$0.000139</td>
                  <td className="prompt">How does garbage collection work in Python?</td>
                  <td className="row-actions">
                    <button className="btn btn-ghost">Trace</button>
                    <button className="btn btn-ghost">Copy</button>
                  </td>
                </tr>

                <tr>
                  <td className="muted">4m ago</td>
                  <td><span className="pill">gemini-pro</span></td>
                  <td><span className="status status-ok">OK</span></td>
                  <td className="num">1189ms</td>
                  <td className="num">67</td>
                  <td className="num">$0.000067</td>
                  <td className="prompt">Explain the CAP theorem in distributed systems.</td>
                  <td className="row-actions">
                    <button className="btn btn-ghost">Trace</button>
                    <button className="btn btn-ghost">Copy</button>
                  </td>
                </tr>

                <tr>
                  <td className="muted">8m ago</td>
                  <td><span className="pill">claude-3-haiku</span></td>
                  <td><span className="status status-bad">Risk</span></td>
                  <td className="num">584ms</td>
                  <td className="num">116</td>
                  <td className="num">$0.000116</td>
                  <td className="prompt">Explain REST API design best practices.</td>
                  <td className="row-actions">
                    <button className="btn btn-ghost">Trace</button>
                    <button className="btn btn-ghost">Copy</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="muted">Showing 20 of 51</div>
            <div className="pager">
              <button className="btn btn-ghost">Prev</button>
              <button className="btn btn-ghost">Next</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSUYkXpjU-M3nI6K_CEZuRF-gL_hIwe2niwICCcd-5cja6jzEjd_7MDZefQUoScmfW5WQf_4nHsvB6d/pub?gid=1888009633&output=csv';

const currency = (value) => {
  if (value === undefined || value === null || value === '') return '-';
  const normalized = typeof value === 'string' ? Number(value.replace(/[%$]/g, '')) : value;
  if (Number.isNaN(normalized)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(normalized);
};

const percent = (value) => {
  if (value === undefined || value === null || value === '') return '-';
  return typeof value === 'string' && value.trim().endsWith('%') ? value : `${value}%`;
};

const countAssets = (...values) => values.filter((value) => value !== undefined && value !== null && value !== '').length;

const getValue = (row, keys) => {
  if (!row) return undefined;
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  return undefined;
};

const App = () => {
  const [rows, setRows] = useState([]);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCsv = async () => {
      try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
          throw new Error(`Failed to load CSV: ${response.statusText}`);
        }
        const text = await response.text();
        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });
        const validRows = parsed.data.filter(
          (record) => record.Date && (record['Global Net Worth ($)'] !== undefined || record['Net Worth ($)'] !== undefined)
        );
        if (validRows.length === 0) {
          throw new Error('No valid data rows found in CSV');
        }
        // Sort rows by parsed Date to ensure we pick the true latest snapshot
        const parseDate = (d) => {
          const t = Date.parse(d);
          return Number.isNaN(t) ? 0 : t;
        };
        const sorted = validRows.slice().sort((a, b) => parseDate(a.Date) - parseDate(b.Date));
        setRows(sorted);
        setRow(sorted[sorted.length - 1]);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    loadCsv();
  }, []);

  const globalMetrics = [
    { label: 'Global Net Worth', value: currency(getValue(row, ['Global Net Worth ($)', 'Net Worth ($)'])) },
    { label: 'Unclaimed Rewards', value: currency(getValue(row, ['Global Unclaimed Rewards ($)', 'Unclaimed Rewards ($)'])) },
    { label: 'Total Supplied', value: currency(getValue(row, ['Global Total Supplied ($)', 'Total Supplied ($)'])) },
    { label: 'Total Borrowed', value: currency(getValue(row, ['Global Total Borrowed ($)', 'Total Borrowed ($)'])) },
    { label: 'Wallet Total', value: currency(getValue(row, ['Global Wallet Total ($)', 'Wallet Total ($)'])) },
  ];

  const suiSummary = [
    { label: 'SUI Net Worth', value: currency(getValue(row, ['SUI Net Worth ($)', 'Net Worth ($)'])) },
    { label: 'SUI Total Supplied', value: currency(getValue(row, ['SUI Total Supplied ($)', 'Total Supplied ($)'])) },
    { label: 'SUI Total Borrowed', value: currency(getValue(row, ['SUI Total Borrowed ($)', 'Total Borrowed ($)'])) },
    { label: 'SUI Wallet Total', value: currency(getValue(row, ['SUI Wallet Total ($)', 'Wallet Total ($)'])) },
    { label: 'SUI Wallet SUI', value: currency(getValue(row, ['SUI Wallet SUI ($)', 'Wallet SUI ($)'])) },
    { label: 'SUI Wallet USDC', value: currency(getValue(row, ['SUI Wallet USDC ($)', 'Wallet USDC ($)'])) },
  ];

  const solSummary = [
    { label: 'SOL Net Worth', value: currency(getValue(row, ['SOL Net Worth ($)'])) },
    { label: 'SOL Total Supplied', value: currency(getValue(row, ['SOL Total Supplied ($)'])) },
    { label: 'SOL Total Borrowed', value: currency(getValue(row, ['SOL Total Borrowed ($)'])) },
    { label: 'SOL Wallet Total', value: currency(getValue(row, ['SOL Wallet Total ($)'])) },
    { label: 'SOL Wallet USDC', value: currency(getValue(row, ['SOL Wallet USDC ($)'])) },
    { label: 'SOL Wallet SOL', value: currency(getValue(row, ['SOL Wallet SOL ($)'])) },
  ];

  const suiProtocolBreakdown = [
    {
      name: 'Cetus',
      netValue: currency(getValue(row, ['SUI Cetus LP Total Value ($)'])),
      apr: percent(getValue(row, ['Cetus APR (%)'])),
      rewards: currency(getValue(row, ['Cetus Rewards ($)'])),
      assets: countAssets(getValue(row, ['SUI Cetus LP Total Value ($)']), getValue(row, ['Cetus APR (%)']), getValue(row, ['Cetus Rewards ($)'])),
    },
    {
      name: 'NAVI',
      netValue: currency(getValue(row, ['SUI NAVI Net Value ($)'])),
      apr: percent(getValue(row, ['NAVI APR (%)'])),
      rewards: currency(getValue(row, ['NAVI Rewards ($)'])),
      assets: countAssets(getValue(row, ['NAVI Main Supply ($)']), getValue(row, ['NAVI Main Borrow ($)']), getValue(row, ['NAVI E-mode Supply ($)']), getValue(row, ['NAVI E-mode Borrow ($)'])),
    },
    {
      name: 'Suilend',
      netValue: currency(getValue(row, ['SUI Suilend Net Value ($)'])),
      apr: percent(getValue(row, ['Suilend APR (%)'])),
      rewards: currency(getValue(row, ['Suilend Rewards ($)'])),
      assets: countAssets(getValue(row, ['SUI Suilend Net Value ($)']), getValue(row, ['Suilend APR (%)']), getValue(row, ['Suilend Rewards ($)'])),
    },
  ];

  const jupiterValue = (getValue(row, ['SOL Lending Borrowed USDC ($)']) ?? 0) + 
                       (getValue(row, ['SOL Vault USDC Value ($)']) ?? 0) + 
                       (getValue(row, ['SOL LimitOrder USDC Escrow ($)']) ?? 0);

  const solProtocolBreakdown = [
    {
      name: 'SOL Wallet',
      netValue: currency(getValue(row, ['SOL Wallet Total ($)'])),
      apr: '-',
      rewards: currency(getValue(row, ['SOL Net Worth ($)'])),
      assets: countAssets(getValue(row, ['SOL Wallet USDC ($)']), getValue(row, ['SOL Wallet SOL ($)'])),
    },
    {
      name: 'Jupiter',
      netValue: currency(jupiterValue),
      apr: '-',
      rewards: currency(getValue(row, ['SOL Lending Supplied ($)'])),
      assets: countAssets(getValue(row, ['SOL Lending Borrowed USDC ($)']), getValue(row, ['SOL Vault USDC Value ($)']), getValue(row, ['SOL LimitOrder USDC Escrow ($)'])),
    },
  ];

  const MAX_TREND_POINTS = 12;
  const trendPoints = useMemo(() => {
    // Use up to MAX_TREND_POINTS of the most recent valid rows for readability.
    const valid = rows.filter((record) => record.Date && (record['Global Net Worth ($)'] !== undefined || record['Net Worth ($)'] !== undefined));
    if (valid.length <= MAX_TREND_POINTS) return valid;
    return valid.slice(-MAX_TREND_POINTS);
  }, [rows]);

  const maxTrend = Math.max(...trendPoints.map((point) => getValue(point, ['Global Net Worth ($)', 'Net Worth ($)']) ?? 0), 0);
  const minTrend = Math.min(...trendPoints.map((point) => getValue(point, ['Global Net Worth ($)', 'Net Worth ($)']) ?? 0), 0);
  const rangeTrend = Math.max(maxTrend - minTrend, 1);
  const trendPath = trendPoints
    .map((point, index) => {
      const x = 10 + (index * 80) / Math.max(trendPoints.length - 1, 1);
      const y = 90 - (((getValue(point, ['Global Net Worth ($)', 'Net Worth ($)']) ?? 0) - minTrend) / rangeTrend) * 70;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Consolidated allocation by protocol (SUI + SOL)
  const walletValue = (getValue(row, ['SUI Wallet SUI ($)', 'Wallet SUI ($)']) ?? 0) + 
                      (getValue(row, ['SUI Wallet USDC ($)', 'Wallet USDC ($)']) ?? 0) +
                      (getValue(row, ['SOL Wallet USDC ($)']) ?? 0) +
                      (getValue(row, ['SOL Wallet SOL ($)']) ?? 0);

  const allocationByProtocol = [
    {
      label: 'Wallet',
      value: walletValue,
    },
    {
      label: 'Cetus',
      value: (getValue(row, ['SUI Cetus LP Total Value ($)']) ?? 0),
    },
    {
      label: 'Suilend',
      value: (getValue(row, ['SUI Suilend Net Value ($)']) ?? 0),
    },
    {
      label: 'NAVI',
      value: (getValue(row, ['SUI NAVI Net Value ($)']) ?? 0),
    },
    {
      label: 'Jupiter',
      value: jupiterValue,
    },
  ];

  const allocationFillClasses = {
    Cetus: 'allocation-fill-cetus',
    Suilend: 'allocation-fill-suilend',
    NAVI: 'allocation-fill-navi',
    Jupiter: 'allocation-fill-jupiter',
  };

  const allocationTotal = allocationByProtocol.reduce((sum, item) => sum + (item.value || 0), 0) || 1;

  const previousRow = rows.length > 1 ? rows[rows.length - 2] : null;
  const latestNetWorth = getValue(row, ['Global Net Worth ($)', 'Net Worth ($)']) ?? 0;
  const previousNetWorth = getValue(previousRow, ['Global Net Worth ($)', 'Net Worth ($)']) ?? 0;
  const globalDelta = latestNetWorth - previousNetWorth;

  // Asset breakdown by type (USDC, SUI, JLP, SOL, etc.)
  const suiAssets = (getValue(row, ['SUI Wallet SUI ($)', 'Wallet SUI ($)']) ?? 0);
  const suiUsdcAssets = (getValue(row, ['SUI Wallet USDC ($)', 'Wallet USDC ($)']) ?? 0);
  const solUsdcAssets = (getValue(row, ['SOL Wallet USDC ($)']) ?? 0);
  const solAssets = (getValue(row, ['SOL Wallet SOL ($)']) ?? 0);
  const cetusProtocolValue = (getValue(row, ['SUI Cetus LP Total Value ($)']) ?? 0);
  const naviProtocolValue = (getValue(row, ['SUI NAVI Net Value ($)']) ?? 0);
  const suilendProtocolValue = (getValue(row, ['SUI Suilend Net Value ($)']) ?? 0);

  const assetBreakdown = [
    {
      label: 'SUI',
      value: suiAssets + (cetusProtocolValue * 0.4) + (naviProtocolValue * 0.3) + (suilendProtocolValue * 0.5),
    },
    {
      label: 'USDC',
      value: suiUsdcAssets + solUsdcAssets + (cetusProtocolValue * 0.3) + (naviProtocolValue * 0.5) + (suilendProtocolValue * 0.3) + (jupiterValue * 0.6),
    },
    {
      label: 'JLP',
      value: (jupiterValue * 0.4),
    },
    {
      label: 'SOL',
      value: solAssets + (jupiterValue * 0.2),
    },
  ];

  const assetTotal = assetBreakdown.reduce((sum, item) => sum + (item.value || 0), 0) || 1;

  const hasSolData = Boolean(Object.keys(row || {}).find((key) => key.startsWith('SOL')));

  const suiDeltaLong = getValue(row, ['SUI Delta Long Assets ($)', 'SUI Delta Long Assets']) ?? 0;
  const suiDeltaShort = getValue(row, ['SUI Delta Short Liabilities ($)', 'SUI Delta Short Liabilities']) ?? 0;
  const suiNetExposure = getValue(row, ['SUI Net Delta Exposure ($)', 'SUI Net Delta Exposure']) ?? 0;
  const suiHedgeRatio = getValue(row, ['SUI Delta Hedge Ratio (%)', 'SUI Delta Hedge Ratio']) ?? '-';

  const deltaMetrics = [
    {
      label: 'SUI Delta Long Assets',
      value: currency(suiDeltaLong),
    },
    {
      label: 'SUI Delta Short Liabilities',
      value: currency(suiDeltaShort),
    },
    {
      label: 'SUI Net Delta Exposure',
      value: currency(suiNetExposure),
    },
    {
      label: 'SUI Delta Hedge Ratio',
      value: percent(suiHedgeRatio),
    },
  ];

  const insights = [
    { label: 'Cetus APR', value: percent(getValue(row, ['Cetus APR (%)'])) },
    { label: 'NAVI APR', value: percent(getValue(row, ['NAVI APR (%)'])) },
    { label: 'Suilend APR', value: percent(getValue(row, ['Suilend APR (%)'])) },
    { label: 'Jupiter APR', value: percent(getValue(row, ['Jupiter APR (%)'])) },
  ];

  if (loading) {
    return (
      <div className="app-shell">
        <p className="eyebrow">Portfolio Loading</p>
        <h1>Fetching latest dashboard data...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <p className="eyebrow">Fetch error</p>
        <h1>Unable to load data</h1>
        <p className="subtitle">{error}</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Portfolio Overview</p>
          <h1>Premium SUI + Solana Dashboard</h1>
          <p className="subtitle">
            Consolidated daily snapshot of SUI and Solana port metrics, including global totals,
            SUI portfolio health, and SOL wallet + lending positions.
          </p>
        </div>
        <div className="top-chip">Data date: {row.Date}</div>
      </header>

      <section className="hero-card">
        <div>
          <div className="hero-title-row">
            <div>
              <p className="hero-label">Cross-chain snapshot</p>
              <h2>{currency(getValue(row, ['Global Net Worth ($)', 'Net Worth ($)']))}</h2>
              <p className={`net-change ${globalDelta >= 0 ? 'positive' : 'negative'}`}>
                {globalDelta >= 0 ? 'Profit' : 'Loss'} {currency(globalDelta)}
              </p>
            </div>
            <div className="status-pill">
              <span className="status-dot" /> Combined SUI + SOL</div>
          </div>

          <p className="hero-copy">
            Your dashboard now includes the Solana port with SOL wallet, lending, vault,
            and escrow metrics alongside the existing SUI portfolio overview.
          </p>

          <div className="hero-stats-row">
            {globalMetrics.map((metric) => (
              <div key={metric.label} className="card-pill card-pill-blue">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-split">
        <article className="panel">
          <p className="panel-eyebrow">Delta KPI</p>
          <h3>SUI Net Delta Exposure</h3>
          <p className="hero-copy">
            Current SUI delta data from the sheet: long assets, short liabilities, net exposure, and hedge ratio.
          </p>
          <div className="card-grid">
            {deltaMetrics.map((metric) => (
              <div key={metric.label} className="card-pill card-pill-purple">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="panel trend-panel">
          <p className="panel-eyebrow">Trend</p>
          <h3>Net worth history</h3>
          <div className="trend-body">
            <div className="trend-chart-panel">
              <svg viewBox="0 0 100 100" className="trend-svg">
                <defs>
                  <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={trendPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                {trendPoints.map((point, index) => {
                  const x = 10 + (index * 80) / Math.max(trendPoints.length - 1, 1);
                  const y = 90 - (((getValue(point, ['Global Net Worth ($)', 'Net Worth ($)']) ?? 0) - minTrend) / rangeTrend) * 70;
                  return <circle key={point.Date} cx={x} cy={y} r="2.5" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" />;
                })}
              </svg>
            </div>
            <div className="trend-labels">
              {trendPoints.map((point) => (
                <span key={point.Date} className="trend-label">
                  {point.Date}
                </span>
              ))}
            </div>
          </div>
        </article>

        <article className="panel">
          <p className="panel-eyebrow">Allocation</p>
          <h3>Current asset breakdown</h3>
          <div className="allocation-list">
            {allocationByProtocol.map((item) => {
              const percentValue = allocationTotal ? ((item.value / allocationTotal) * 100).toFixed(0) : '0';
              return (
                <div key={item.label} className="allocation-row">
                  <div className="allocation-header">
                    <span>{item.label}</span>
                    <strong>{currency(item.value)}</strong>
                  </div>
                  <div className="allocation-bar">
                    <div
                      className={`allocation-fill ${allocationFillClasses[item.label] || ''}`}
                      style={{ width: `${percentValue}%` }}
                    />
                  </div>
                  <span>{percentValue}% of allocation</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel insight-grid">
          <p className="panel-eyebrow">Insights</p>
          <h3>APR snapshot</h3>
          {insights.map((insight) => (
            <div key={insight.label} className="insight-card">
              <span>{insight.label}</span>
              <strong>{insight.value}</strong>
            </div>
          ))}
        </article>

        <article className="panel">
          <p className="panel-eyebrow">Asset Types</p>
          <h3>Asset composition by type</h3>
          <div className="allocation-list">
            {assetBreakdown.map((item) => {
              const percentValue = assetTotal ? ((item.value / assetTotal) * 100).toFixed(0) : '0';
              return (
                <div key={item.label} className="allocation-row">
                  <div className="allocation-header">
                    <span>{item.label}</span>
                    <strong>{currency(item.value)}</strong>
                  </div>
                  <div className="allocation-bar">
                    <div className="allocation-fill" style={{ width: `${percentValue}%`, background: '#8b5cf6' }} />
                  </div>
                  <span>{percentValue}% of total</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <p className="panel-eyebrow">SUI Port</p>
          <h3>SUI Portfolio Summary</h3>
          <div className="card-grid">
            {suiSummary.map((metric) => (
              <div key={metric.label} className="card-pill card-pill-emerald">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
          <h4 className="panel-subtitle">SUI DeFi protocol breakdown</h4>
          <div className="card-grid">
            {suiProtocolBreakdown.map((protocol) => (
              <div key={protocol.name} className="card-pill card-pill-purple">
                <span>{protocol.name}</span>
                <strong>{protocol.netValue}</strong>
                <span>APR: {protocol.apr}</span>
                <span>Rewards: {protocol.rewards}</span>
                <span>Total assets: {protocol.assets}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="panel-eyebrow">Solana Port</p>
          <h3>SOL Wallet + DeFi</h3>
          {hasSolData ? (
            <>
              <div className="card-grid">
                {solSummary.map((metric) => (
                  <div key={metric.label} className="card-pill card-pill-red">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
              <h4 className="panel-subtitle">SOL DeFi protocol breakdown</h4>
              <div className="card-grid">
                {solProtocolBreakdown.map((protocol) => (
                  <div key={protocol.name} className="card-pill card-pill-blue">
                    <span>{protocol.name}</span>
                    <strong>{protocol.netValue}</strong>
                    <span>Health/APR: {protocol.apr}</span>
                    <span>Rewards/value: {protocol.rewards}</span>
                    <span>Total assets: {protocol.assets}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="card-grid">
              <div className="card-pill card-pill-blue">
                <span>No SOL data available in this CSV</span>
                <strong>Review sheet2 or SOL fields</strong>
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default App;

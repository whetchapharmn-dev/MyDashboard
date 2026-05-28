import React, { useMemo } from 'react';
import Papa from 'papaparse';

const csv = `Date,Global Net Worth ($),Global Unclaimed Rewards ($),Global Total Supplied ($),Global Total Borrowed ($),Global Wallet Total ($),SUI Net Worth ($),SUI Unclaimed Rewards ($),SUI Total Supplied ($),SUI Total Borrowed ($),SUI Wallet Total ($),SUI Wallet SUI ($),SUI Wallet CETUS ($),Cetus Net Value ($),Cetus APR (%),Cetus Rewards ($),NAVI Net Value ($),NAVI APR (%),NAVI Rewards ($),NAVI Main Health Factor,NAVI E-mode Health Factor,NAVI Main Supply ($),NAVI Main Borrow ($),NAVI E-mode Supply ($),NAVI E-mode Borrow ($),Suilend Net Value ($),Suilend APR (%),Suilend Rewards ($),SOL Net Worth ($),SOL Unclaimed Rewards ($),SOL Total Supplied ($),SOL Total Borrowed ($),SOL Wallet Total ($),SOL Wallet USDC ($),SOL Wallet SOL ($),SOL Lending Net Value ($),SOL Lending Health (%),SOL Lending Supplied ($),SOL Lending Borrowed ($),SOL Vault Value ($),SOL Order Escrow ($)
05/28/2026,13236.13,34.81,20441.8,7349.19,142.04,10310.39,34.76,15396.39,5091.52,4.09,3.48,0.53,3204.18,59.49,28.71,6100.97,6.33,2.83,2.19,1.12,9341.27,3567.37,1851.21,1524.15,1001.15,7.47,0.45,2925.74,0.05,5045.41,2257.67,137.95,129.95,8,1786.98,38%,4044.65,2257.67,700.89,299.87`;

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

const App = () => {
  const [row] = useMemo(() => {
    const parsed = Papa.parse(csv, { header: true, dynamicTyping: true });
    return parsed.data;
  }, []);

  const globalMetrics = [
    { label: 'Global Net Worth', value: currency(row['Global Net Worth ($)']) },
    { label: 'Unclaimed Rewards', value: currency(row['Global Unclaimed Rewards ($)']) },
    { label: 'Total Supplied', value: currency(row['Global Total Supplied ($)']) },
    { label: 'Total Borrowed', value: currency(row['Global Total Borrowed ($)']) },
    { label: 'Wallet Total', value: currency(row['Global Wallet Total ($)']) },
  ];

  const suiSummary = [
    { label: 'SUI Net Worth', value: currency(row['SUI Net Worth ($)']) },
    { label: 'SUI Total Supplied', value: currency(row['SUI Total Supplied ($)']) },
    { label: 'SUI Total Borrowed', value: currency(row['SUI Total Borrowed ($)']) },
    { label: 'SUI Wallet Total', value: currency(row['SUI Wallet Total ($)']) },
    { label: 'SUI Wallet SUI', value: currency(row['SUI Wallet SUI ($)']) },
    { label: 'SUI Wallet CETUS', value: currency(row['SUI Wallet CETUS ($)']) },
  ];

  const solSummary = [
    { label: 'SOL Net Worth', value: currency(row['SOL Net Worth ($)']) },
    { label: 'SOL Total Supplied', value: currency(row['SOL Total Supplied ($)']) },
    { label: 'SOL Total Borrowed', value: currency(row['SOL Total Borrowed ($)']) },
    { label: 'SOL Wallet Total', value: currency(row['SOL Wallet Total ($)']) },
    { label: 'SOL Wallet USDC', value: currency(row['SOL Wallet USDC ($)']) },
    { label: 'SOL Wallet SOL', value: currency(row['SOL Wallet SOL ($)']) },
  ];

  const suiProtocolBreakdown = [
    {
      name: 'Cetus',
      netValue: currency(row['Cetus Net Value ($)']),
      apr: percent(row['Cetus APR (%)']),
      rewards: currency(row['Cetus Rewards ($)']),
      assets: countAssets(row['Cetus Net Value ($)'], row['Cetus APR (%)'], row['Cetus Rewards ($)']),
    },
    {
      name: 'NAVI',
      netValue: currency(row['NAVI Net Value ($)']),
      apr: percent(row['NAVI APR (%)']),
      rewards: currency(row['NAVI Rewards ($)']),
      assets: countAssets(row['NAVI Main Supply ($)'], row['NAVI Main Borrow ($)'], row['NAVI E-mode Supply ($)'], row['NAVI E-mode Borrow ($)']),
    },
    {
      name: 'Suilend',
      netValue: currency(row['Suilend Net Value ($)']),
      apr: percent(row['Suilend APR (%)']),
      rewards: currency(row['Suilend Rewards ($)']),
      assets: countAssets(row['Suilend Net Value ($)'], row['Suilend APR (%)'], row['Suilend Rewards ($)']),
    },
  ];

  const solProtocolBreakdown = [
    {
      name: 'SOL Wallet',
      netValue: currency(row['SOL Wallet Total ($)']),
      apr: '-',
      rewards: currency(row['SOL Net Worth ($)']),
      assets: countAssets(row['SOL Wallet USDC ($)'], row['SOL Wallet SOL ($)']),
    },
    {
      name: 'SOL Lending',
      netValue: currency(row['SOL Lending Net Value ($)']),
      apr: percent(row['SOL Lending Health (%)']),
      rewards: currency(row['SOL Lending Supplied ($)']),
      assets: countAssets(row['SOL Lending Supplied ($)'], row['SOL Lending Borrowed ($)']),
    },
    {
      name: 'SOL Vault',
      netValue: currency(row['SOL Vault Value ($)']),
      apr: '-',
      rewards: currency(row['SOL Order Escrow ($)']),
      assets: countAssets(row['SOL Vault Value ($)'], row['SOL Order Escrow ($)']),
    },
  ];

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
              <h2>{currency(row['Global Net Worth ($)'])}</h2>
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
        </article>
      </section>
    </div>
  );
};

export default App;

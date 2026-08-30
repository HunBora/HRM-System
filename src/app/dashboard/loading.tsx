export default function DashboardLoading() {
  return (
    <div style={{ padding: '20px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ height: '32px', width: '200px', backgroundColor: '#e2e8f0', borderRadius: '8px' }}></div>
        <div style={{ height: '40px', width: '300px', backgroundColor: '#e2e8f0', borderRadius: '12px' }}></div>
      </div>

      {/* Main Grid Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ height: '140px', backgroundColor: '#e2e8f0', borderRadius: '16px' }}></div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div style={{ height: '400px', backgroundColor: '#e2e8f0', borderRadius: '16px', marginBottom: '20px' }}></div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}

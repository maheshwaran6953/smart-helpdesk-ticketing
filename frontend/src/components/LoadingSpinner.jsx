import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        gap: 16,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '4px solid #E5E7EB',
          borderTopColor: '#4F6AF5',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

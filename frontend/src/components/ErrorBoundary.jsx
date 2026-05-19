import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🚨 ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          background: '#050A14',
          color: '#E8F4FF',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Be Vietnam Pro, sans-serif'
        }}>
          <div style={{
            maxWidth: '620px',
            width: '100%',
            background: '#0A1628',
            border: '1px solid #FF4466',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 0 40px rgba(255, 68, 102, 0.15)'
          }}>
            <h2 style={{ color: '#FF4466', marginBottom: '12px', fontFamily: 'Orbitron, sans-serif', fontSize: '20px' }}>
              🚨 PHÁT HIỆN SỰ CỐ GIAO DIỆN
            </h2>
            <p style={{ color: '#7A9BBF', fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>
              Rất tiếc, đã có một sự cố hiển thị xảy ra tại trang này. Lỗi kỹ thuật chi tiết bên dưới sẽ giúp tìm và sửa triệt để ngay lập tức:
            </p>
            
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '16px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
              overflowX: 'auto',
              color: '#FFD700',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              <strong style={{ color: '#FF4466' }}>
                {this.state.error && this.state.error.toString()}
              </strong>
              <pre style={{ 
                marginTop: '12px', 
                whiteSpace: 'pre-wrap', 
                color: '#7A9BBF', 
                maxHeight: '180px', 
                overflowY: 'auto',
                fontSize: '11px' 
              }}>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  color: '#000',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(255, 215, 0, 0.2)'
                }}
              >
                🔄 Tải lại trang
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#E8F4FF',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                🏠 Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

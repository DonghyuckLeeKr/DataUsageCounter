import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'pretendard/dist/web/variable/pretendardvariable.css'
import './index.css'
import App from './App.jsx'

class StartupErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('DolphinData UI render failed', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main style={{
        width: '100vw',
        height: '100vh',
        padding: '32px',
        background: '#0a1124',
        color: '#f1f5f9',
        display: 'grid',
        placeContent: 'center',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>화면을 불러오지 못했습니다</h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          돌핀 데이터를 종료한 뒤 다시 실행해 주세요.<br />문제가 계속되면 최신 버전으로 다시 설치해 주세요.
        </p>
      </main>
    )
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StartupErrorBoundary>
      <App />
    </StartupErrorBoundary>
  </StrictMode>,
)

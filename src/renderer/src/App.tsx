import { useState, useCallback, useEffect } from 'react'
import { FileList } from './components/FileList'
import { MemoryPanel } from './components/MemoryPanel'
import { DragDropTest } from './components/DragDropTest'
import { IPCTest } from './components/IPCTest'
import { PerformanceTest } from './components/PerformanceTest'
import './assets/styles.css'

function App(): React.JSX.Element {
  const [windowId, setWindowId] = useState<string>('...')
  const [windowCount, setWindowCount] = useState<number>(0)
  const [selectedPaths, setSelectedPaths] = useState<string[]>([])
  const [status, setStatus] = useState<string>('就绪')

  // 获取窗口信息
  useEffect(() => {
    setWindowId(window.api.windowId)
    updateWindowCount()
  }, [])

  // 更新窗口数量
  const updateWindowCount = useCallback(async () => {
    try {
      const windows = await window.api.getAllWindows()
      setWindowCount(windows.length)
    } catch (err) {
      console.error('Failed to get window count:', err)
    }
  }, [])

  // 创建新窗口
  const handleCreateWindow = useCallback(async () => {
    setStatus('创建新窗口...')
    await window.api.createWindow()
    setStatus('新窗口已创建')
    setTimeout(updateWindowCount, 500)
  }, [updateWindowCount])

  // 处理选中变化
  const handleSelectionChange = useCallback((paths: string[]) => {
    setSelectedPaths(paths)
  }, [])

  return (
    <div className="app-container">
      {/* 顶部工具栏 */}
      <header className="toolbar">
        <div className="toolbar-left">
          <span className="window-id">
            窗口: <span>{windowId}</span>
          </span>
          <span className="window-count">
            总窗口数: <span>{windowCount}</span>
          </span>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={handleCreateWindow}>
            <span className="btn-icon">+</span> 新建窗口
          </button>
        </div>
      </header>

      {/* 内存监控面板 */}
      <MemoryPanel />

      {/* 主内容区 */}
      <main className="main-content">
        {/* 左侧：文件列表 */}
        <FileList onSelectionChange={handleSelectionChange} />

        {/* 右侧：测试区域 */}
        <section className="test-section">
          <DragDropTest selectedPaths={selectedPaths} />
          <IPCTest />
          <PerformanceTest />
        </section>
      </main>

      {/* 状态栏 */}
      <footer className="status-bar">
        <span>{status}</span>
      </footer>
    </div>
  )
}

export default App

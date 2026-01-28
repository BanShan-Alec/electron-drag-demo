import { useState, useEffect, useCallback } from 'react'

interface MemoryInfo {
    heapUsed: number
    heapTotal: number
    rss: number
    external: number
    windowCount: number
}

interface ProcessInfo {
    pid: number
    type: string
    memory: number
    cpu: number
}

export function MemoryPanel(): React.JSX.Element {
    const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null)
    const [processInfo, setProcessInfo] = useState<ProcessInfo[]>([])

    const refreshMemory = useCallback(async () => {
        try {
            const memInfo = await window.api.getMemoryUsage()
            setMemoryInfo(memInfo)

            const allInfo = await window.api.getAllMemoryInfo()
            setProcessInfo(allInfo)
        } catch (err) {
            console.error('Failed to get memory info:', err)
        }
    }, [])

    useEffect(() => {
        refreshMemory()
        const interval = setInterval(refreshMemory, 5000)
        return () => clearInterval(interval)
    }, [refreshMemory])

    return (
        <section className="memory-panel">
            <h3>📊 内存监控</h3>
            <div className="memory-stats">
                <div className="stat-item">
                    <span className="stat-label">Heap Used</span>
                    <span className="stat-value">{memoryInfo?.heapUsed ?? '-'} MB</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Heap Total</span>
                    <span className="stat-value">{memoryInfo?.heapTotal ?? '-'} MB</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">RSS</span>
                    <span className="stat-value">{memoryInfo?.rss ?? '-'} MB</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">进程数</span>
                    <span className="stat-value">{processInfo.length}</span>
                </div>
            </div>
            <div className="process-details">
                {processInfo
                    .map((p) => `${p.type}: PID ${p.pid}, ${Math.round(p.memory / 1024)} MB, CPU ${p.cpu.toFixed(1)}%`)
                    .join(' | ')}
            </div>
            <button className="btn btn-sm" onClick={refreshMemory} style={{ marginTop: '10px' }}>
                🔄 刷新
            </button>
        </section>
    )
}

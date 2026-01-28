import { useState, useCallback, DragEvent } from 'react'

interface DragDropTestProps {
    selectedPaths: string[]
}

interface LogItem {
    time: string
    message: string
}

export function DragDropTest({ selectedPaths }: DragDropTestProps): React.JSX.Element {
    const [dropLogs, setDropLogs] = useState<LogItem[]>([])
    const [isDragging, setIsDragging] = useState(false)

    // 添加日志
    const addLog = useCallback((message: string) => {
        const time = new Date().toLocaleTimeString()
        setDropLogs((prev) => [{ time, message }, ...prev.slice(0, 9)])
    }, [])

    // 处理拖拽开始（跨应用）
    const handleDragStart = useCallback(
        (e: DragEvent) => {
            if (selectedPaths.length === 0) {
                e.preventDefault()
                addLog('请先选中文件')
                return
            }

            // 调用 Electron 的系统拖拽 API
            window.api.startDrag(selectedPaths)

            // 同时通知其他窗口（跨窗口拖拽）
            window.api.dragStart(selectedPaths)

            addLog(`开始拖拽 ${selectedPaths.length} 个文件`)
        },
        [selectedPaths, addLog]
    )

    // 处理拖拽结束
    const handleDragEnd = useCallback(() => {
        window.api.dragEnd()
        addLog('拖拽结束')
    }, [addLog])

    // 处理拖拽进入目标区域
    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    // 处理拖拽在目标区域上方
    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault()
    }, [])

    // 处理拖拽离开目标区域
    const handleDragLeave = useCallback(() => {
        setIsDragging(false)
    }, [])

    // 处理拖拽放下
    const handleDrop = useCallback(
        (e: DragEvent) => {
            e.preventDefault()
            setIsDragging(false)

            const droppedFiles = e.dataTransfer.files
            if (droppedFiles.length > 0) {
                const fileNames = Array.from(droppedFiles)
                    .map((f) => f.name)
                    .join(', ')
                addLog(`从外部拖入: ${droppedFiles.length} 个文件 - ${fileNames}`)
            } else {
                addLog('收到拖拽放下事件（跨窗口）')
            }
        },
        [addLog]
    )

    return (
        <>
            {/* 跨应用拖拽测试 */}
            <div className="test-card">
                <h4>🎯 跨应用拖拽测试</h4>
                <p className="test-desc">选中左侧文件后，从下方区域拖拽到桌面或文件管理器</p>
                <div
                    className="drag-source"
                    draggable={true}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <span className="drag-icon">📄</span>
                    <span className="drag-text">拖拽选中的文件到桌面</span>
                    <span className="drag-count">{selectedPaths.length} 个文件</span>
                </div>
            </div>

            {/* 拖拽目标区域 */}
            <div className="test-card">
                <h4>📥 跨窗口拖拽目标</h4>
                <p className="test-desc">从其他窗口拖拽文件到这里</p>
                <div
                    className={`drop-target ${isDragging ? 'drag-over' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <span className="drop-icon">📂</span>
                    <span className="drop-text">拖拽文件到此处</span>
                </div>
                <div className="drop-log">
                    {dropLogs.map((log, i) => (
                        <div key={i} className="log-item">
                            <span className="log-time">[{log.time}]</span> {log.message}
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

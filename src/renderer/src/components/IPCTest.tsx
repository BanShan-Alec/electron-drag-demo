import { useState, useCallback, useEffect, useRef } from 'react'

interface LogItem {
    time: string
    from: string
    message: string
    isSelf: boolean
}

export function IPCTest(): React.JSX.Element {
    const [message, setMessage] = useState('')
    const [logs, setLogs] = useState<LogItem[]>([])
    const cleanupRef = useRef<(() => void) | null>(null)

    // 添加日志
    const addLog = useCallback((from: string, msg: string, isSelf = false) => {
        const time = new Date().toLocaleTimeString()
        setLogs((prev) => [{ time, from, message: msg, isSelf }, ...prev.slice(0, 19)])
    }, [])

    // 设置 IPC 监听
    useEffect(() => {
        cleanupRef.current = window.api.on('broadcast-message', (data: unknown) => {
            const { fromWindowId, message } = data as { fromWindowId: string; message: string }
            addLog(fromWindowId, message)
        })

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current()
            }
        }
    }, [addLog])

    // 广播消息
    const broadcastMessage = useCallback(() => {
        if (!message.trim()) return

        window.api.broadcast('broadcast-message', {
            fromWindowId: window.api.windowId,
            message: message.trim(),
            timestamp: Date.now()
        })

        addLog('本窗口', message.trim(), true)
        setMessage('')
    }, [message, addLog])

    // 处理回车键
    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                broadcastMessage()
            }
        },
        [broadcastMessage]
    )

    return (
        <div className="test-card">
            <h4>📡 跨窗口通信测试</h4>
            <p className="test-desc">向其他窗口广播消息</p>
            <div className="ipc-test">
                <input
                    type="text"
                    className="input"
                    placeholder="输入要发送的消息"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button className="btn btn-primary" onClick={broadcastMessage}>
                    广播到其他窗口
                </button>
            </div>
            <div className="message-log">
                {logs.length === 0 ? (
                    <p className="log-placeholder">等待接收消息...</p>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="log-item">
                            <span className="log-time">[{log.time}]</span>
                            <span className="log-from">
                                {log.isSelf ? '→' : '←'} {log.from}
                            </span>
                            <span>{log.message}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

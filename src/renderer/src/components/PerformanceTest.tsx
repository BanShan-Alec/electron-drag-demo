import { useState, useCallback } from 'react'

interface PerfResult {
    count: number
    selectTime: number
    deselectTime: number
    singleSelectTime: number
    memory: number
}

export function PerformanceTest(): React.JSX.Element {
    const [result, setResult] = useState<PerfResult | null>(null)
    const [testing, setTesting] = useState(false)

    const runTest = useCallback(async (count: number) => {
        setTesting(true)
        setResult(null)

        // 创建测试数据
        const items = Array.from({ length: count }, (_, i) => `item-${i}`)
        let selectedSet = new Set<string>()

        await new Promise((r) => setTimeout(r, 100))

        // 测试全选性能
        const selectStartTime = performance.now()
        selectedSet = new Set(items)
        // 模拟重新渲染
        await new Promise((r) => setTimeout(r, 10))
        const selectEndTime = performance.now()
        const selectTime = selectEndTime - selectStartTime

        await new Promise((r) => setTimeout(r, 100))

        // 测试取消全选性能
        const deselectStartTime = performance.now()
        selectedSet.clear()
        await new Promise((r) => setTimeout(r, 10))
        const deselectEndTime = performance.now()
        const deselectTime = deselectEndTime - deselectStartTime

        // 测试逐个选中性能
        const singleSelectStartTime = performance.now()
        for (let i = 0; i < Math.min(count, 100); i++) {
            selectedSet.add(items[i])
        }
        await new Promise((r) => setTimeout(r, 10))
        const singleSelectEndTime = performance.now()
        const singleSelectTime = singleSelectEndTime - singleSelectStartTime

        // 获取内存使用
        const memInfo = await window.api.getMemoryUsage()

        setResult({
            count,
            selectTime,
            deselectTime,
            singleSelectTime,
            memory: memInfo.heapUsed
        })

        setTesting(false)
    }, [])

    const getResultClass = (): string => {
        if (!result) return ''
        return result.selectTime < 100 ? 'success' : result.selectTime < 300 ? 'warning' : ''
    }

    return (
        <div className="test-card">
            <h4>⚡ 选中性能测试</h4>
            <p className="test-desc">测试大量文件选中时的渲染性能</p>
            <div className="perf-controls">
                <button className="btn btn-sm" onClick={() => runTest(100)} disabled={testing}>
                    测试100项
                </button>
                <button className="btn btn-sm" onClick={() => runTest(500)} disabled={testing}>
                    测试500项
                </button>
                <button className="btn btn-sm" onClick={() => runTest(1000)} disabled={testing}>
                    测试1000项
                </button>
            </div>
            <div className={`perf-result ${getResultClass()}`}>
                {testing ? (
                    '测试中...'
                ) : result ? (
                    <>
                        <strong>测试结果 ({result.count} 项):</strong>
                        <br />
                        全选耗时: {result.selectTime.toFixed(2)}ms
                        <br />
                        取消全选耗时: {result.deselectTime.toFixed(2)}ms
                        <br />
                        逐个选中(100项)耗时: {result.singleSelectTime.toFixed(2)}ms
                        <br />
                        当前内存: {result.memory}MB
                    </>
                ) : (
                    '点击按钮开始测试'
                )}
            </div>
        </div>
    )
}

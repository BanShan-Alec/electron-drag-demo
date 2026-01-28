import { useState, useEffect, useCallback } from 'react'

interface FileItem {
    id: string
    name: string
    icon: string
    path: string
}

interface FileListProps {
    onSelectionChange?: (selectedPaths: string[]) => void
}

export function FileList({ onSelectionChange }: FileListProps): React.JSX.Element {
    const [files, setFiles] = useState<FileItem[]>([])
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

    // 更新选中状态回调
    useEffect(() => {
        if (onSelectionChange) {
            const paths = files.filter((f) => selectedFiles.has(f.id)).map((f) => f.path)
            onSelectionChange(paths)
        }
    }, [selectedFiles, files, onSelectionChange])

    // 添加模拟文件
    const addFiles = useCallback((count: number) => {
        const startIndex = files.length
        const newFiles: FileItem[] = []

        const types = ['📄', '📁', '🖼️', '🎵', '🎬', '📊', '📝']
        const extensions = ['.txt', '.doc', '.pdf', '.jpg', '.png', '.mp3', '.mp4', '.xlsx']

        for (let i = 0; i < count; i++) {
            const index = startIndex + i
            const type = types[Math.floor(Math.random() * types.length)]
            const ext = extensions[Math.floor(Math.random() * extensions.length)]

            newFiles.push({
                id: `file-${Date.now()}-${index}`,
                name: `文件_${index.toString().padStart(4, '0')}${ext}`,
                icon: type,
                path: `C:\\Users\\Demo\\Documents\\文件_${index}${ext}`
            })
        }

        setFiles((prev) => [...prev, ...newFiles])
    }, [files.length])

    // 清空文件
    const clearFiles = useCallback(() => {
        setFiles([])
        setSelectedFiles(new Set())
    }, [])

    // 全选
    const selectAll = useCallback(() => {
        setSelectedFiles(new Set(files.map((f) => f.id)))
    }, [files])

    // 取消全选
    const deselectAll = useCallback(() => {
        setSelectedFiles(new Set())
    }, [])

    // 处理文件点击 - 点击切换选中状态
    const handleFileClick = useCallback(
        (file: FileItem) => {
            setSelectedFiles((prev) => {
                const newSet = new Set(prev)
                if (newSet.has(file.id)) {
                    // 已选中，取消选中
                    newSet.delete(file.id)
                } else {
                    // 未选中，添加选中
                    newSet.add(file.id)
                }
                return newSet
            })
        },
        []
    )

    // 处理双击
    const handleFileDoubleClick = useCallback((file: FileItem) => {
        console.log(`[FileList] Open file: ${file.name}`)
    }, [])

    // 初始化添加一些文件
    useEffect(() => {
        if (files.length === 0) {
            addFiles(20)
        }
    }, [])

    return (
        <div className="file-section">
            <h3>
                📁 模拟文件列表 <span className="file-count">({selectedFiles.size} 已选中)</span>
            </h3>
            <div className="file-controls">
                <button className="btn btn-sm" onClick={() => addFiles(100)}>
                    添加100个文件
                </button>
                <button className="btn btn-sm" onClick={clearFiles}>
                    清空
                </button>
                <button className="btn btn-sm" onClick={selectAll}>
                    全选
                </button>
                <button className="btn btn-sm" onClick={deselectAll}>
                    取消全选
                </button>
            </div>
            <div className="file-list">
                {files.map((file) => (
                    <div
                        key={file.id}
                        className={`file-item ${selectedFiles.has(file.id) ? 'selected' : ''}`}
                        onClick={() => handleFileClick(file)}
                        onDoubleClick={() => handleFileDoubleClick(file)}
                    >
                        <span className="file-item-icon">{file.icon}</span>
                        <span className="file-item-name">{file.name}</span>
                        <span className="file-item-check"></span>
                    </div>
                ))}
            </div>
        </div>
    )
}

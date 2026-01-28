import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 从 URL 参数获取 windowId
const urlParams = new URLSearchParams(window.location.search)
const windowId = urlParams.get('windowId') || 'unknown'

// Custom APIs for renderer
const api = {
  // 窗口信息
  windowId: windowId,

  // 创建新窗口
  createWindow: (initialPath?: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('create-window', initialPath),

  // 获取所有窗口ID
  getAllWindows: (): Promise<string[]> => ipcRenderer.invoke('get-all-windows'),

  // 广播消息
  broadcast: (channel: string, data: unknown): void => {
    ipcRenderer.send('broadcast', { channel, data, excludeWindowId: windowId })
  },

  // 发送消息到指定窗口
  sendToWindow: (targetWindowId: string, channel: string, data: unknown): void => {
    ipcRenderer.send('send-to-window', { targetWindowId, channel, data })
  },

  // 监听消息
  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void =>
      callback(...args)
    ipcRenderer.on(channel, subscription)
    return () => ipcRenderer.removeListener(channel, subscription)
  },

  // 一次性监听
  once: (channel: string, callback: (...args: unknown[]) => void): void => {
    ipcRenderer.once(channel, (_event, ...args) => callback(...args))
  },

  // 系统拖拽
  startDrag: (filePaths: string[]): void => {
    ipcRenderer.send('ondragstart', filePaths)
  },

  // 跨窗口拖拽
  dragStart: (files: string[]): void => {
    ipcRenderer.send('drag-start', { windowId, files })
  },

  dragEnd: (): void => {
    ipcRenderer.send('drag-end', { windowId })
  },

  dragDrop: (sourceWindowId: string, files: string[], targetPath: string): void => {
    ipcRenderer.send('drag-drop', {
      sourceWindowId,
      targetWindowId: windowId,
      files,
      targetPath
    })
  },

  // 内存监控
  getMemoryUsage: (): Promise<{
    heapUsed: number
    heapTotal: number
    rss: number
    external: number
    windowCount: number
  }> => ipcRenderer.invoke('get-memory-usage'),

  getAllMemoryInfo: (): Promise<
    Array<{
      pid: number
      type: string
      memory: number
      cpu: number
    }>
  > => ipcRenderer.invoke('get-all-memory-info')
}

// Use `contextBridge` APIs to expose Electron APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

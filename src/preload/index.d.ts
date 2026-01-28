import { ElectronAPI } from '@electron-toolkit/preload'

export interface DemoAPI {
  windowId: string
  createWindow: (initialPath?: string) => Promise<{ success: boolean }>
  getAllWindows: () => Promise<string[]>
  broadcast: (channel: string, data: unknown) => void
  sendToWindow: (targetWindowId: string, channel: string, data: unknown) => void
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
  once: (channel: string, callback: (...args: unknown[]) => void) => void
  startDrag: (filePaths: string[]) => void
  dragStart: (files: string[]) => void
  dragEnd: () => void
  dragDrop: (sourceWindowId: string, files: string[], targetPath: string) => void
  getMemoryUsage: () => Promise<{
    heapUsed: number
    heapTotal: number
    rss: number
    external: number
    windowCount: number
  }>
  getAllMemoryInfo: () => Promise<
    Array<{
      pid: number
      type: string
      memory: number
      cpu: number
    }>
  >
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DemoAPI
  }
}

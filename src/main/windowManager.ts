import { BrowserWindow } from 'electron'

/**
 * 窗口管理器
 * 管理多窗口的生命周期和跨窗口通信
 */
class WindowManager {
    private windows: Map<string, BrowserWindow> = new Map()

    /**
     * 注册窗口
     */
    register(id: string, win: BrowserWindow): void {
        this.windows.set(id, win)
    }

    /**
     * 注销窗口
     */
    unregister(id: string): void {
        this.windows.delete(id)
    }

    /**
     * 获取窗口
     */
    get(id: string): BrowserWindow | undefined {
        return this.windows.get(id)
    }

    /**
     * 获取所有窗口ID
     */
    getAllIds(): string[] {
        return [...this.windows.keys()]
    }

    /**
     * 获取窗口数量
     */
    getCount(): number {
        return this.windows.size
    }

    /**
     * 广播消息到所有窗口（可排除某个窗口）
     */
    broadcast(channel: string, data: unknown, excludeId?: string): void {
        this.windows.forEach((win, id) => {
            if (id !== excludeId && !win.isDestroyed()) {
                try {
                    win.webContents.send(channel, data)
                } catch (err) {
                    console.error(`[WindowManager] Failed to send to window ${id}:`, err)
                }
            }
        })
    }

    /**
     * 发送消息到指定窗口
     */
    sendToWindow(targetId: string, channel: string, data: unknown): boolean {
        const win = this.windows.get(targetId)
        if (win && !win.isDestroyed()) {
            try {
                win.webContents.send(channel, data)
                return true
            } catch (err) {
                console.error(`[WindowManager] Failed to send to window ${targetId}:`, err)
                return false
            }
        }
        return false
    }

    /**
     * 获取所有窗口
     */
    getAll(): BrowserWindow[] {
        return [...this.windows.values()]
    }
}

export const windowManager = new WindowManager()

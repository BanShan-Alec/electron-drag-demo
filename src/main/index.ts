import { app, shell, BrowserWindow, ipcMain, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { windowManager } from './windowManager'
import { existsSync } from 'fs'

// 强制让 is.dev 一直返回 true（打包后也表现为开发模式）
// 这样 optimizer.watchWindowShortcuts 会启用 F12 打开 DevTools 等功能
;(is as { dev: boolean }).dev = true

/**
 * 创建新窗口
 */
function createWindow(initialPath?: string): BrowserWindow {
  const windowId = `win-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const win = new BrowserWindow({
    width: 1000,
    height: 750,
    minWidth: 700,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    title: `文件管理器 - ${windowId}`,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 注册到窗口管理器
  windowManager.register(windowId, win)

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 窗口关闭时注销
  win.on('closed', () => {
    windowManager.unregister(windowId)
    console.log(`[WindowManager] Window ${windowId} closed. Total windows: ${windowManager.getCount()}`)
  })

  // HMR for renderer based on electron-vite cli
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?windowId=${windowId}&initialPath=${initialPath || ''}`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { windowId, initialPath: initialPath || '' }
    })
  }

  console.log(`[WindowManager] Window ${windowId} created. Total windows: ${windowManager.getCount()}`)

  return win
}

/**
 * 设置 IPC 通道
 */
function setupIPC(): void {
  // 创建新窗口
  ipcMain.handle('create-window', (_event, initialPath?: string) => {
    createWindow(initialPath)
    return { success: true }
  })

  // 获取所有窗口ID
  ipcMain.handle('get-all-windows', () => {
    return windowManager.getAllIds()
  })

  // 广播消息到其他窗口
  ipcMain.on('broadcast', (_event, { channel, data, excludeWindowId }) => {
    windowManager.broadcast(channel, data, excludeWindowId)
  })

  // 发送消息到指定窗口
  ipcMain.on('send-to-window', (_event, { targetWindowId, channel, data }) => {
    windowManager.sendToWindow(targetWindowId, channel, data)
  })

  // 系统拖拽 API
  ipcMain.on('ondragstart', (event, filePaths: string | string[]) => {
    console.log('[Drag] Starting drag with files:', filePaths)

    try {
      // 确保 filePaths 是数组
      const files = Array.isArray(filePaths) ? filePaths : [filePaths]

      // // 过滤掉不存在的文件
      // const validFiles = files.filter((f) => {
      //   const exists = existsSync(f)
      //   if (!exists) {
      //     console.warn('[Drag] File does not exist:', f)
      //   }
      //   return exists
      // })

      // if (validFiles.length === 0) {
      //   console.error('[Drag] No valid files to drag')
      //   return
      // }

      // 创建拖拽图标 - 使用 nativeImage 而不是直接传路径
      // 这是解决 Windows 上拖拽崩溃的关键
      let dragIcon: Electron.NativeImage

      // 尝试多个可能的图标路径
      const possibleIconPaths = [
        icon, // 通过 asset import 导入的路径
        join(__dirname, '../../resources/icon.png'),
        join(app.getAppPath(), 'resources/icon.png'),
        join(process.resourcesPath || '', 'icon.png')
      ]

      for (const iconPath of possibleIconPaths) {
        if (iconPath && existsSync(iconPath)) {
          console.log('[Drag] Using icon from:', iconPath)
          dragIcon = nativeImage.createFromPath(iconPath)
          if (!dragIcon.isEmpty()) {
            break
          }
        }
      }

      // 如果没有找到图标，创建一个空的占位图标
      if (!dragIcon! || dragIcon.isEmpty()) {
        console.warn('[Drag] No valid icon found, creating placeholder')
        // 创建一个 32x32 的透明图标
        dragIcon = nativeImage.createEmpty()
      }

      // 缩放图标到合适大小（Windows 推荐 32x32 或更小）
      const resizedIcon = dragIcon.resize({ width: 32, height: 32 })

      console.log('[Drag] Starting native drag with', files.length, 'files')

      event.sender.startDrag({
        file: files[0], // 即使拖拽多个文件，file 属性仍是必需的
        files: files,
        icon: resizedIcon
      })
    } catch (error) {
      console.error('[Drag] Error during startDrag:', error)
      // 不让错误崩溃应用
    }
  })

  // 跨窗口拖拽开始
  ipcMain.on('drag-start', (_event, { windowId, files }) => {
    console.log(`[Drag] Window ${windowId} started dragging files:`, files)
    windowManager.broadcast('drag-enter', { sourceWindowId: windowId, files }, windowId)
  })

  // 跨窗口拖拽结束
  ipcMain.on('drag-end', (_event, { windowId }) => {
    console.log(`[Drag] Window ${windowId} ended dragging`)
    windowManager.broadcast('drag-leave', {}, windowId)
  })

  // 跨窗口拖拽放下
  ipcMain.on('drag-drop', (_event, { sourceWindowId, targetWindowId, files, targetPath }) => {
    console.log(`[Drag] Drop from ${sourceWindowId} to ${targetWindowId}`)
    console.log(`[Drag] Files:`, files)
    console.log(`[Drag] Target path:`, targetPath)

    // 通知源窗口拖拽完成
    windowManager.sendToWindow(sourceWindowId, 'drag-complete', {
      success: true,
      targetPath,
      operation: 'move'
    })

    // 通知目标窗口刷新
    windowManager.sendToWindow(targetWindowId, 'refresh-list', {})
  })

  // 获取内存使用情况
  ipcMain.handle('get-memory-usage', () => {
    const memUsage = process.memoryUsage()
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      windowCount: windowManager.getCount()
    }
  })

  // 获取所有窗口的内存信息
  ipcMain.handle('get-all-memory-info', async () => {
    const processMetrics = app.getAppMetrics()
    return processMetrics.map((metric) => ({
      pid: metric.pid,
      type: metric.type,
      memory: Math.round(metric.memory.workingSetSize / 1024),
      cpu: metric.cpu.percentCPUUsage
    }))
  })
}

// 应用准备就绪
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    // 第二个参数设为 true，让快捷键在生产模式下也生效
    // is.dev = true 后，optimizer 会自动处理 F12 打开 DevTools
    optimizer.watchWindowShortcuts(window)
  })

  // 设置 IPC
  setupIPC()

  // 创建主窗口
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 所有窗口关闭时退出（Windows & Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 定时输出内存使用情况
setInterval(() => {
  const memUsage = process.memoryUsage()
  console.log(
    `[Memory] Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB | RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB | Windows: ${windowManager.getCount()}`
  )
}, 10000)

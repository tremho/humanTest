// Modules to control application life and create native browser window
import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import {startCommandLoop} from './src/CommandIO'

// console.log('Launching Electron App\n')

// console.log(process.argv)


process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'YES'

function createWindow (): void {
    // Create the browser window.
    const mainWindow:BrowserWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
        webPreferences: {
            nodeIntegration: false, // we handle all the node stuff back-side
            contextIsolation: true, // gateway through window.api
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    console.log(process.argv)
    startCommandLoop(mainWindow, process.argv[1])

    // and load the index.html of the app.
    mainWindow.loadFile('../index.html')

    // mainWindow.fullScreen = true;
    // // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})


/*
const isMac = process.platform === 'darwin'
const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
        label: 'HumanTest', //app.name, // TODO: will say 'Electron' until packaging, apparently.
        submenu: [
            // { role: 'about' },
            {
                // label: app.name,
                label: 'About humanTest',
                // Custom about
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        const options = {
                            type: 'info',
                            title: 'About humanTest',
                            buttons: ['Ok'],
                            message: 'humanTest is a work in progress (c) 2020, Tremho Berserker Development, LLC'
                        }
                        dialog.showMessageBox(focusedWindow, options)
                    }
                }
            },

            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideothers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }] : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            { label: 'Attach Project'},
            { label: 'New Project'},
            { type: 'separator'},
            isMac ? { role: 'close' } : { role: 'quit' }
        ]
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac ? [
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                { role: 'selectAll' },
                { type: 'separator' },
                {
                    label: 'Speech',
                    submenu: [
                        { role: 'startspeaking' },
                        { role: 'stopspeaking' }
                    ]
                }
            ] : [
                { role: 'delete' },
                { type: 'separator' },
                { role: 'selectAll' }
            ])
        ]
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { role: 'toggledevtools' },
            { type: 'separator' },
            { role: 'resetzoom' },
            { role: 'zoomin' },
            { role: 'zoomout' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            ...(isMac ? [
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' }
            ] : [
                { role: 'close' }
            ])
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: async () => {
                    const { shell } = require('electron')
                    await shell.openExternal('https://electronjs.org')
                }
            }
        ]
    }
]

// @ts-ignore
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
*/
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
import {AppGateway} from './src/AppGateway'
new AppGateway(ipcMain)
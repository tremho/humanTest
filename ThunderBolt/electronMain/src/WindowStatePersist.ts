import {BrowserWindow} from "electron";

const appConfig = require('electron-settings');

class WindowState {
    public x?: number;
    public y?: number;
    public width: number = 800;
    public height: number = 600;
    public isMaximized? : boolean;
}

export class WindowStatePersist {
    private windowName:string;
    private window:BrowserWindow;
    private windowState;

    constructor(name:string, width?:number, height?:number) {
        this.windowName = name;
        this.windowState = new WindowState()
        if(width) this.windowState.width = width;
        if(height) this.windowState.height = height;
    }

    get x() {
        return this.windowState.x
    }
    get y() {
        return this.windowState.y
    }
    get width() {
        return this.windowState.width
    }
    get height() {
        return this.windowState.height
    }

    saveState() {
        if(!this.windowState.isMaximized) {
            this.windowState = this.window.getBounds()
        }
        this.windowState.isMaximized = this.window.isMaximized()
        appConfig.set(`windowState.${this.windowName}`, this.windowState)
    }

    restore() {
        return new Promise(resolve => {
            // Restore from appConfig
            if (appConfig.has(`windowState.${this.windowName}`)) {
                appConfig.get(`windowState.${this.windowName}`).then(ws => {
                    this.windowState = ws;
                    resolve()
                })
            } else {
                resolve()
            }
        })
    }

    track(window:BrowserWindow) {
        this.window = window;
        const boundSave = this.saveState.bind(this)
        window.on('resize', boundSave);
        window.on('move', boundSave);
        window.on('close', boundSave);
    }
}
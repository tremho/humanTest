/**
 * @module: AppGateway
 *
 * With this module, access to functions that are exported by modules found in the main Electron process are
 * made available to the render-side application via the global 'mainApi'
 *
 * Functions exposed by the 'exportedFunctions' object of this module are callable from the other side as
 * asynchronous functions that return a Promise.
 *
 * The attachment binding is and message handling mechanisms are established by the 'preload.js' and 'renderer.js' modules that
 * comprise the electron harness we employ here.
 *
 * The messageInit function is exported as a stub to allow normal processing of this as a default attachment.
 *
 */

// import functions to be exported here
import {setDataSender, getPassedCommand, getTestTitle,handleResponse, checkSpecialNotice} from "./CommandIO";


const exportedFunctions = {
    messageInit: () => { /*console.log('message init stub hit')*/ },

    // add your exported functions here
    setDataSender,
    getPassedCommand,
    handleResponse,
    getTestTitle,
    checkSpecialNotice
}

/**
 * Inter-Process Communication support for Electron
 * Supports Remote Procedure calls and messaging
 */
export class AppGateway {

    private ipcMain:any;
    private static ipcMessageSender = null;

    constructor(ipcMainIn:any) {
        this.ipcMain = ipcMainIn;
        this.attach();
    }

    public static getFunctionNames() {
        return Object.getOwnPropertyNames(exportedFunctions);
    }

    private attach() {
        Object.getOwnPropertyNames(exportedFunctions).forEach(fname => {
            const fn = exportedFunctions[fname]
            this.ipcMain.on(fname, (event, ...args) => {
                const data = args[0]
                const id = data.id
                const callArgs = data.args || []

                let response, error;
                try {
                    response = fn(...callArgs)
                } catch (e) {
                    error = e;
                }
                if(fname === 'messageInit') {
                    AppGateway.ipcMessageSender = event.sender;
                    // console.log('set ipcMessageSender to ', AppGateway.ipcMessageSender)
                    // console.log(fname, id)
                    setDataSender(event.sender)
                }
                try {
                    // console.log(`sending response ${fname}, ${JSON.stringify(response)}`)
                    event.sender.send(fname, {id, response, error})
                } catch(e) {
                    // this is wierd. getting an exception here, saying failure to serialize, but
                    // it doesn't seem to affect operation any.
                }
            })
        })
    }
    public static sendMessage(name:string, data:any) {
        // console.log('sending ipc message', name, data)
        if(AppGateway.ipcMessageSender) {
            AppGateway.ipcMessageSender.send('message', {name, data})
        }
    }
}
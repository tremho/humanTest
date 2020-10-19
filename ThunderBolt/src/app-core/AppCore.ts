
import {AppModel} from "./AppModel";
import {StringParser} from "../general/StringParser"

import {getInfoMessageRecorder, InfoMessageRecorder} from "./InfoMessageRecorder";

let imrSingleton:InfoMessageRecorder = getInfoMessageRecorder()

function writeMessage(subject:string, message:string) {
    imrSingleton.write(subject, message)
}

const mainApi = (window as any).api;

let destinations, x, y, dpt, ct
let boundLoop


export default
/**
 *  Core object of the application.  Contains the app model and gateway functions for actions, which are
 *  mostly handled by action modules.
 */
class AppCore {
    private appModel:AppModel = new AppModel()
    private passedCommand:object;

    /**
     * get the model used for binding to the UI.
     */
    public get model() {
        return this.appModel
    }

    /**
     * Return an instance of StringParser for the given string
     * @param str
     */
    public makeStringParser(str) {
        return new StringParser(str)
    }

    public requestMessages() {
        mainApi.messageInit().then(() => {
            console.log('messages wired')
        })
    }

    public setupUIElements() {
        console.log('>>> setupUIElements >>>')

        const all = []

        //+++
        // Put any items into the model that are needed for initial UI presentation here
        // N.B. add promise-deferred operations to the 'all' array

        all.push(mainApi.getPassedCommand().then(cmd => {
            if(cmd) {
                this.model.addSection('passedCmd', cmd)
            }
        }))
        all.push(mainApi.getTestTitle().then(title => {
            this.model.addSection('info', {title, secondsLeft: 0})
        }))

        all.push(mainApi.addMessageListener('Timer', data => {
            let {secondsLeft} = data;
            this.model.setAtPath('info.secondsLeft', secondsLeft)
        }))
        //---

        // set the infomessage log handling
        this.model.addSection('infoMessage', {messages: []})
        all.push(mainApi.addMessageListener('IM', data => {
            writeMessage(data.subject, data.message)
        }))
        all.push(imrSingleton.subscribe(msgArray => {
            this.model.setAtPath('infoMessage.messages', msgArray)
        }))

        return Promise.all(all)
    }
    flatten(obj) {
        const flatObj = {}
        Object.getOwnPropertyNames(obj).forEach(prop => {

            let value = obj[prop]
            if( typeof value === 'object') {
                if(!Array.isArray(value)) {
                    value = this.flatten(value)
                }
            }
            flatObj[prop] = value
        })
        return flatObj
    }

    testResults(results) {
        console.log('Test Results: ', results)
        mainApi.handleResponse(results)
    }

    checkSpecialNotice() {
        mainApi.checkSpecialNotice()
    }

}



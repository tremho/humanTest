
import {BrowserWindow, dialog} from "electron";
import * as readline from 'readline'
import fs from "fs";

import {TestResponse, TestOptions, Command} from "./ExchangeCommon"


let mainWindow:BrowserWindow;
let dataSender;
let testTitle:string = '';
let passedCommand: Command;
let timerSetAt = Date.now()
let toid;
let fullTimeout;


/**
 * Called by Gateway to give us the push data sender function
 * @param sender
 */
export function setDataSender(sender) {
    dataSender = sender;
}

/**
 * Returns the test title passed on start
 */
export function getTestTitle() {
    return testTitle || 'Human Test'
}
/**
 * Returns the command that was provided by the harness
 */
export function getPassedCommand():Command {
    // console.log('[App] command sent to GUI: ', passedCommand)
    if(passedCommand) {
        startTimer((passedCommand.cmd === 'verifyHuman') ? unavailable : timeout, passedCommand.options.timeout)
    }
    return passedCommand
}

/**
 * See if the option 'specialNotice' was passed, and if so, present this in a dialog box
 * @returns {Promise} Promise can be ignored
 */
export function checkSpecialNotice() {
    const notice = passedCommand.options.specialNotice
    if(notice) {
        return dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
            type: 'info', buttons: ['Okay'], defaultId:0,
            title: 'Special Notice',message: notice
        })
    }
    return Promise.resolve()
}

function getTimerRemaining() {
    const ms = Date.now() - timerSetAt
    return fullTimeout - Math.floor(ms/1000)
}

function startTimer(which, secondsLeft) {
    timerSetAt = Date.now()
    fullTimeout = secondsLeft;
    toid = setInterval(() => {
        secondsLeft = getTimerRemaining()
        // console.log('[App] timer: ' + secondsLeft)
        try {
            dataSender.send('message', {name: 'Timer', data: {secondsLeft}})
        } catch(e) {
            // highly unlikely, but could happen in chaotic abort attempt situations.
            console.error(e)
            process.exit(-1);
        }
        if (!secondsLeft) {
            clearInterval(toid)
            which()
        }
    }, 250)
}

function timeout() {
    const toResp = new TestResponse()
    toResp.comment = 'timeout'
    toResp.skipped = true;
    handleResponse(toResp)
}

function unavailable() {
    const toResp = new TestResponse()
    toResp.error = 'timeout'
    toResp.skipped = true;
    toResp.passed = false;
    toResp.comment = 'unavailable'
    handleResponse(toResp)
}

/**
 * Sends the response to the harness (as JSON via stdout)
 * @param response
 */
export function handleResponse(response:TestResponse) {
    // if verifyHuman was rejected, fix up the response here
    if(passedCommand.cmd === 'verifyHuman' && !response.skipped && !response.passed) {
        response.error='rejected'
        response.passed = false;
    }
    console.log('[Response]: '+JSON.stringify(response))  // send to harness via stdout
    clearTimeout(toid) // cancel the timeout if we responded.
}
/**
 * Starts the exchange process with the harness
 * Called from main at startup.
 *
 * @param {BrowserWindow} window Our main window.
 * @param {string} title title passed from startManualTest
 */
export function startCommandLoop(window:BrowserWindow, title:string):void {
    mainWindow = window
    testTitle = title;

    // console.log('Starting with title '+ title)

    const rl = readline.createInterface({
        input:process.stdin,
        output:process.stdout,
        prompt: 'HT>'
    })

    // present a prompt
    rl.prompt();
    // read input from stdin
    rl.on('line', (line) => {
        // parse and process HT command
        parseCommand(line)
        mainWindow.webContents.reloadIgnoringCache()
        if(passedCommand.cmd === 'exit') {
            // console.log('[App] exit app')
            BrowserWindow.getAllWindows().forEach(wnd=> {
                wnd.close()
            })
            rl.close()
        }
        else rl.prompt();

    }).on('close', () => {
        process.exit(0);
    });
}

function parseCommand(cmdString = '') {

    // console.log('[App] parsing command', cmdString)
    // New format: command is JSON
    try {
        passedCommand = JSON.parse(cmdString);
    } catch (e) {
        passedCommand = new Command()
        console.error('Bad command passed: ', e, cmdString)
    }
    for (let i = 0; i < passedCommand.cmdargs.length; i++) {
        if (passedCommand.cmdargs[i] && passedCommand.cmdargs[i].file) {
            passedCommand.cmdargs[i].text = readFile(passedCommand.cmdargs[i].file) || passedCommand.cmdargs[i].file // treat as a file if it exists, otherwise, as text
        }
    }
    const options:TestOptions = passedCommand.options || {}
    if(!options.prompt) {
        options.prompt = 'Is this acceptable?'
    }
    if(!options.timeout) {
        // Default timeout is 2 minutes to verify a human, 30 seconds for each test
        options.timeout = (passedCommand.cmd === 'verifyHuman') ? 120 : 30
    }
    if(options.title) {
        testTitle = options.title;
    }
    passedCommand.options = options
}

function readFile(path) {
    let contents = ''
    if(fs.existsSync(path)) {
        contents = fs.readFileSync(path).toString()
    }
    return contents;
}


import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {spawn} from "child_process";

import {TestResponse, TestOptions, Command} from "./ExchangeCommon"

let remoteStdIn;
let promptPromise;
let promptResolver;
let responseResolver;
let gatingPromise = Promise.resolve()
let gateResolver;
let skipAll = false;
let unattendedMessage = 'unattended'


/**
 * Starts manual testing, providing a title.
 *
 * This launches the remote GUI app and supplies the title that will be displayed on the GUI app page.
 * The remote app is then ready to receive commands from the harness.
 *
 * This **must** be called *before* any tests are conducted.
 * When done with *all* tests, call `endManualTest()`
 *
 * @param {string} [title] If not given, a default title will be displayed
 * @return void  This does not return a promise like the other commands
 *
 * @example startManualTest('Verify Content')
 *
 */
export function startManualTest(title?:string) {

    let appDir = `HumanTest-${os.platform()}-${os.arch()}`

    let devPrefix = path.join(__dirname,'..','ThunderBolt','electronMain','release-builds')
    // console.log(devPrefix)
    let releaseDir = (fs.existsSync(devPrefix)) ? devPrefix : 'ht-app'

    let execPath = os.platform() === 'darwin' ? 'HumanTest.app/Contents/MacOS' : ''
    let execFile = os.platform() === 'win32' ? 'HumanTest.exe' : 'HumanTest'

    let appPath = path.join(releaseDir, appDir, execPath, execFile)

    if(!fs.existsSync(appPath)) {
        console.error('HumanTest executable not found at '+appPath)
        skipAll = true
        promptResolver()
        unattendedMessage = 'Remote executable not found'
        return Promise.resolve(-1)
    }

    resetPromptPromise()


    // console.log('[Harness] launching remote app...', appPath)

    return new Promise(resolve => {
        // console.log('[Harness] executing...', appPath)
        const proc = spawn(appPath, [title || '']);
        proc.on('error', (code, signal) => {
            console.error('Launch Remote error')
            console.error(' Error code: '+code);
            console.error(' Signal received: '+signal);
            skipAll = true
            promptResolver()
            unattendedMessage = 'Remote executable failed to run'
            resolve(-1)
        })
        proc.on('message', (...args) => {
            console.warn('remote message recieved', args)
        })
        proc.on('disconnect', () => {
            remoteStdIn = null;
            console.warn('remote disconnect received')
        })
        proc.on('close', () => {
            remoteStdIn = null;
            // console.warn('remote close received')
        })
        proc.on('exit', (code, signal) => {
            // console.log(`remote has exited, code=${code}, signal=${signal}`
            remoteStdIn = null;
            resolve(code)
        })
        proc.stdout.on('data', data => {
            let str = data.toString()
            // console.log('(remote) ' + str)
            // look for prompt
            onPromptOrResponse(str)
        })
        proc.stderr.on('data', data => {
            const errStr = data.toString()
            if(errStr.indexOf('Font') == -1) { // ignore errors about font
                console.error('(remote err) '+ errStr)
            }
        })
        remoteStdIn = proc.stdin;
        resetPromptPromise()
        // console.log('[Harness] remote launched!')
        return Promise.resolve(0)
    })
}

/**
 * Stops manual testing and closes the remote app.
 * This should be called after the last test command is handled.
 *
 * @example endManualTest()
 */
export function endManualTest() {
    skipAll = false;
    const cmd = new Command()
    cmd.cmd = 'exit'
    return manualTest(cmd)
}

/**
 * Verifies that a human is available to conduct the tests.
 * Timeout default for this command is 60 seconds.  If no response is received in that time,
 * this test response will be with 'skipped = true' and 'error = timeout'.
 * Also in that case, all subsequent tests are automatically skipped, with the comment 'unattended'
 * @param {TestOptions} options The 'timeout' option property is honored here (default = 60)
 *
 * @example
 * verifyHumanAvailable({timeout:60}).then(result => {
 *   if(result.skipped) console.log('no human is available!')
 * })
 */
export function verifyHumanAvailable(options?:TestOptions) {
    console.log('verify Human')
    const cmd = new Command()
    cmd.cmd = 'verifyHuman'
    cmd.options = options
    if(cmd.options) cmd.options.prompt = '' // no prompt on verifyHuman
    return manualTest(cmd).then(resp => {
        if(!resp.passed) {
            skipAll = true;
        }
        return resp;
    })
}

/**
 * Displays the contents of a text file and prompts the user for pass/fail/skip or comments
 *
 * @param {string} filename File with text to be displayed
 * @param {TestOptions} options  options for this command (e.g. prompt, timeout)
 *
 *
 * @example
 * viewFile('path/to/myfile.txt').then(result => {
 *   if(result.passed) console.log('looks okay!')
 * })
 */
export function viewFile(filename:string, options?:TestOptions):Promise<TestResponse> {
    const cmd = new Command()
    cmd.cmd = 'viewFile'
    cmd.options = options;
    cmd.cmdargs[0].file = filename
    return manualTest(cmd)
}
/**
 * Displays the given text and prompts the user for pass/fail/skip or comments
 *
 * @param {string} text Text to be displayed
 * @param {TestOptions} options  options for this command (e.g. prompt, timeout)
 *
 * @example
 * showText("literal text to be shown in view box").then(result => {
 *   if(result.passed) console.log('looks okay!')
 *   else if(result.skipped) console.log('test was skipped')
 *   else console.error('test failed!')
 * })
 */
export function showText(text:string, options?:TestOptions):Promise<TestResponse> {
    const cmd = new Command()
    cmd.cmd = 'showText'
    cmd.options = options;
    cmd.cmdargs[0].text = text
    return manualTest(cmd)
}
/**
 * Displays the contents of a two sets of text or two text files as a side-by-side diff
 * and prompts the user for pass/fail/skip or comments
 *
 * arg is treated as a filename if file exists at the path, otherwise as text.
 *
 * @param {string} arg1 Filename or text (left side)
 * @param {string} arg2 Filename or text (right side)
 * @param {TestOptions} options  options for this command (e.g. prompt, timeout)
 *
 *
 * @example
 * diff(filenameOrString1, filenameOrString2).then(result => {
 *   if(result.passed) console.log('looks okay!')
 *   else if(result.skipped) console.log('test was skipped')
 *   else console.error('test failed!')
 * })
 */
export function diff(arg1:string, arg2:string, options?:TestOptions):Promise<TestResponse> {
    const cmd = new Command()
    cmd.cmd = 'diff'
    cmd.options = options;
    cmd.cmdargs[0].file = arg1
    cmd.cmdargs[1].file = arg2
    return manualTest(cmd)
}
/**
 * Displays the image file and prompts the user for pass/fail/skip or comments
 *
 * @param {string} filename Image file to be displayed
 * @param {TestOptions} options  options for this command (e.g. prompt, timeout, width, height)
 *
 * @example
 * viewImage('./images/prettyBird.png').then(result => {
 *   if(result.passed) console.log('looks okay!')
 *   else if(result.skipped) console.log('test was skipped')
 *   else console.error('test failed!')
 * })
 *
 * The `width` and `height` options are recognized by this command:
 *
 * @example
 * viewImage('./images/prettyBird.png', {width:400, height: 400}).then(result => {
 *       ...
 * })
 */
export function viewImage(filename:string, options?:TestOptions) :Promise<TestResponse> {
    const cmd = new Command()
    cmd.cmd = 'viewImage'
    cmd.options = options;
    cmd.cmdargs[0].file = filename
    return manualTest(cmd)
}
/**
 * Displays two images in a manner that they may be compared
 * and prompts the user for pass/fail/skip or comments
 *
 * @param {string} file1 First Image
 * @param {string} file2 Second Image
 * @param {TestOptions} options  options for this command (e.g. prompt, timeout)
 *
 * @example `compareImages('image1.png', 'image2.jpg').then(result => {
 *       if(result.passed) console.log('looks okay!')
 *       else if(result.skipped) console.log('test was skipped')
 *       else console.error('test failed!')
 * })`
 *
 * For any command, the `specialNotice` property can be used to give the user more information on how to conduct
 * the test.  That is useful for `compareImages`, since it provides two view modes the user can employ for analysis.
 * @example `compareImages('image1.png', 'image2.jpg', {specialNotice:'use the blink compare tool!'}).then(result => {
 *          ...
 * })`
 */
export function compareImages(file1:string, file2:string, options?:TestOptions):Promise<TestResponse> {
    const cmd = new Command()
    cmd.cmd = 'compareImages'
    cmd.options = options;
    cmd.cmdargs[0].file = file1
    cmd.cmdargs[1].file = file2
    return manualTest(cmd)
}


/**
Internal function.
Manages the exchange with the remote app
 @private
 */
function manualTest(command:Command):Promise<TestResponse> {
    console.log('manual test')
    if (skipAll) {
        const skipResponse = new TestResponse()
        skipResponse.skipped = true;
        skipResponse.comment = unattendedMessage;
        return Promise.resolve(skipResponse)
    }
    console.log('manual test - gating')
    return gatingPromise.then(() => {
        gatingPromise = new Promise(resolve => {
            gateResolver = resolve
        })
        console.log('manual test - waiting for prompt')
        return promptPromise.then(() => {
            if(skipAll) return Promise.resolve(new TestResponse())
            resetPromptPromise();
            writeCommand(command)
            return watchForResponse()
        })
    })
}

/**
Internal function.
Resets the promise wait that is made at the top
of the exchange process.
 @private
 */
function resetPromptPromise() {
    promptPromise = new Promise(resolve => {
        promptResolver = resolve;
    })
}

/** @private */
function onPromptOrResponse(str) {
    if(str === 'HT>') {
        promptResolver(str)
    } else {
        const prefix = '[Response]: '
        if(str.substring(0, prefix.length) === prefix) {
            if(responseResolver) {
                const trstr = str.substring(prefix.length)
                // console.log('[HARNESS] response received: ', trstr)
                // turn into a TestResponse object
                const trdata = JSON.parse(trstr)
                responseResolver(trdata)
                gateResolver();
            } else {
                console.error('[HARNESS] No responseResolver')
            }
        } else {
            // console.log('(remote): '+str)
        }
    }
}

/** @private */
function watchForResponse(): Promise<TestResponse> {
    return new Promise(resolve => {
        responseResolver = resolve;
    })
}

/** @private */
function writeCommand(command) {
    const cmdString = JSON.stringify(command)
    // console.log('[Harness] writing command '+cmdString)
    if(remoteStdIn) {
        remoteStdIn.write(cmdString+'\n')
    } else {
        console.error('Remote not attached!')
    }
}


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
let pendingTestName
let testingStarted, testingEnded

/**
 * Types of report formats that may be used
 */
enum ReportFormat {
    text = 'text',
    html = 'html',
    markdown = 'markdown'
}

/**
 * Options for report output
 *
 * | property | type | default | purpose
 * | -------- | ---- | ------- | -------
 * | `format` | string | 'text'  | Chooses the format of the report output. Must be one of the `ReportFormat` types
 * | `headingSize` | string | number | 0 | Integer between 0 (largest) to 3 (smallest) determines size of headings used (html and markdown) .
 * | `file` | string | undefined | If defined, specifies the *base name* of a file the report will be output to. The extension is provided by the code  according to prefix ('.txt', '.html', or '.md')
 */
class ReportOptions {
    public format?:string = ReportFormat.text[ReportFormat.text]
    public headingSize?:number = 0
    public file?:string;
}

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
 * @return Promise<number>  Return can be ignored; resolves to 0 if remote app launched successfully.
 *
 * If the remote app does not run, subsequent tests are skipped.
 *
 * @example startManualTest('Verify Content')
 *
 */
export function startManualTest(title?:string) {

    testingStarted = Date.now()

    let appDir = `HumanTest-${os.platform()}-${os.arch()}`

    resetPromptPromise()
    let devPrefix = path.join(__dirname,'..','ThunderBolt','electronMain','release-builds')
    // console.log(devPrefix)
    let releaseDir = (fs.existsSync(devPrefix)) ? devPrefix : path.join(__dirname, 'ht-app')

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
            console.warn('remote message received', args)
        })
        proc.on('disconnect', () => {
            remoteStdIn = null;
            console.warn('remote disconnect received')
        })
        proc.on('close', () => {
            remoteStdIn = null;
            // console.warn('remote close received')
        })
        proc.on('exit', (code, /*signal*/) => {
            // console.log(`remote has exited, code=${code}, signal=${signal}`)
            skipAll = true
            promptResolver()
            unattendedMessage = 'Remote executable exited prematurely.'
            remoteStdIn = null;
            resolve(code)
        })
        proc.stdout.on('data', data => {
            let str = data.toString()
            // console.log('(remote) ' + str)
            // look for prompt
            onPromptOrResponse(str)
        })
        proc.stderr.on('data', (/*data*/) => {
            // const errStr = data.toString()

            // console.error('(remote err) ' + errStr)
            skipAll = true
            promptResolver()
            unattendedMessage = 'Remote executable failed to run'
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
    testingEnded = Date.now()
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
 * @param {TestOptions} options The 'timeout' option property is honored here (default = 120)
 *
 * @example
 * verifyHumanAvailable({timeout:60}).then(result => {
 *   if(result.skipped) console.log('no human is available!')
 * })
 */
export function verifyHumanAvailable(options?:TestOptions) {
    // console.log('verify Human')
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
 * viewFile('path/to/myFile.txt').then(result => {
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
 * Outputs a report to a file
 *
 * Note the `reportOptions.file` property must have a path to a file base name (no extension).
 *
 * The `reportOptions.format` should also be set, although it will default to 'text'.
 *
 * @param {ReportOptions} reportOptions -- The options for report output
 * @returns Promise<void> resolves when file has been written (may generally be ignored)
 *
 * @since v0.3.0
 *
 * @example
 *      produceReport({format:html, file:'testReport'}
 */
export function produceReport(reportOptions:ReportOptions) {
    let p = Promise.resolve()
    if(reportOptions.file) {
        hSize = reportOptions.headingSize
        // send to file if so declared
        p = getReport(ReportFormat[reportOptions.format || 'text'], false).then(rpt => {
            let filename = reportOptions.file + extMap[reportOptions.format || 'text']
            fs.writeFileSync(filename, rpt)
            console.log(`HumanTest report written to ${filename}`)
            return;
        })
    }
    return p; // return the promise
}

/**
 * Retrieves a text format report suitable for output to the console
 *
 * @param {boolean} inColor - if true, the report text will contain ANSII color escape codes.
 *
 * @returns Promise<string> resolves with the text of the report when ready.
 *
 * @since v0.3.0
 *
 * @example
 *      consoleReport(true).then(rpt => {
 *          console.log(rpt)
 *      }
 */
export function consoleReport(inColor:boolean) {
    return getReport('text', inColor)
}

/**
Internal function.
Manages the exchange with the remote app
 @private
 */
function manualTest(command:Command):Promise<TestResponse> {
    // console.log('manual test')
    if (skipAll) {
        const skipResponse = new TestResponse()
        skipResponse.skipped = true;
        skipResponse.comment = unattendedMessage;
        record(pendingTestName, skipResponse)
        return Promise.resolve(skipResponse)
    }
    // console.log('manual test - gating')
    return gatingPromise.then(() => {
        gatingPromise = new Promise(resolve => {
            gateResolver = resolve
        })
        // console.log('manual test - waiting for prompt')
        return promptPromise.then(() => {
            if(skipAll) return Promise.resolve(new TestResponse())
            resetPromptPromise();
            pendingTestName = (command.options && command.options.name) || command.cmd //+commandCount(command.cmd)
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
                const trStr = str.substring(prefix.length)
                // console.log('[HARNESS] response received: ', trStr)
                // turn into a TestResponse object
                const trData = JSON.parse(trStr)
                record(pendingTestName, trData)
                responseResolver(trData)
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

// --------------- Human Test Reporting support ---------------

const htReportMap = {}

function record(name:string, results:any) {
    const ra = htReportMap[name] || []
    ra.push(results)
    htReportMap[name] = ra
}

const extMap = {
    text: '.txt',
    html: '.html',
    markdown: '.md'
}

let headerColor, titleColor, passedColor,failedColor,skippedColor, commentColor, footerColor, resetColor;
let startedLine, elapsedLine

let hSize; // set at prepare from options

function setup(inColor) {
    headerColor = [
        inColor ? '\u001b[33m\u001b[43m' : '',
        inColor ? '\u001b[30m\u001b[43m' : '',
    ]
    titleColor = inColor ? '\u001b[30m' : ''

    passedColor = inColor ? '\u001b[32m' : ''
    failedColor =  inColor ? '\u001b[31m' : ''
    skippedColor = inColor ? '\u001b[36m' : ''

    commentColor = inColor ? '\u001b[34m' : ''
    footerColor = inColor ? '\u001b[30m' : ''
    resetColor = inColor ? '\u001b[m' : ''

    let start = new Date(testingStarted)
    let stLn = ' tested at '+start.toLocaleString()
    startedLine = stLn + ' '.repeat(bannerWidth - stLn.length) + resetColor
    let elapsed = testingEnded - testingStarted;
    let secs:string | number = Math.floor(elapsed / 1000);
    let mins:string | number = Math.floor(secs/60)
    let hrs = Math.floor(mins/60)
    mins = mins - (hrs * 60);
    secs = secs - (hrs * 3600 + mins * 60);
    if(mins < 10) mins = '0'+mins;
    if(secs < 10) secs = '0'+secs;
    let et = hrs ? `${hrs}:${mins}:${secs}`: mins !== '00' ? `${mins}:${secs}` : `${secs} seconds`
    let eLine = ' test time '+et
    elapsedLine = eLine + ' '.repeat(bannerWidth - eLine.length)
}

const banner = "Human Test Report"
const allSkip = "All Tests Skipped: No Human Available"
const bannerWidth = 40
const text = {
    /** @private */
    header : () => {
        let n = Math.floor((bannerWidth - banner.length)/2 )
        let out = headerColor[0]+'='.repeat(bannerWidth) + resetColor +'\n'
        out += headerColor[1]+' '.repeat(n) + banner + ' '.repeat(bannerWidth - (banner.length+n)) + resetColor + '\n'
        out += headerColor[0]+'='.repeat(bannerWidth)+ resetColor + '\n'
        out += headerColor[1]+ startedLine + resetColor + '\n'
        out += headerColor[1]+ elapsedLine + resetColor + '\n'
        out += '\n'+ '='.repeat(bannerWidth) +'\n'
        return out
    },
    /** @private */
    allSkipped: () => {
        return skippedColor+allSkip
    },
    /** @private */
    testTitle : (name) => {
        let hdr = '    ' + titleColor + `test: ${name}`
        let dc = hdr.length;
        return hdr + '\n    '+'-'.repeat(dc)+'\n'
    },
    /** @private */
    result : (r, count)=> {
        let out = '    ' + count + '. '
        let disp = r.skipped ? skippedColor+'Skipped' : r.passed ? passedColor+'Passed' : failedColor+'Failed'
        let comment = commentColor +r.comment
        out += disp + '\n    '
        if(comment) out += comment + '\n'
        return out
    },
    /** @private */
    endTest: () => {
        return '';
    },
    /** @private */
    footer : () => {
        return footerColor + '\n'+'='.repeat(bannerWidth)+ resetColor + '\n'
    }
}
/** @private */
function hv(r) {
    return Math.min(r+(hSize||0), 6)
}
const html = {
    /** @private */
    header: () => {
        let out = '<div class = "ht_header">'
        out += `<h${hv(1)}>${banner}</h${hv(1)}>\n`
        out += '<em>'+startedLine.trim()+'</em><br/>\n'
        out += '<em>'+elapsedLine.trim()+'</em><br/>\n'
        out += '<hr/>\n'
        out += '</div>\n'
        return out
    },
    /** @private */
    footer: () => {
        return `<hr class="ht_footer"/>`
    },
    /** @private */
    allSkipped: () => {
        return `<p class="ht_skipped">${allSkip}</p>`
    },
    /** @private */
    testTitle: (name) => {
        return `<div class="ht_test">\n<h${hv(3)}>test: ${name}</h${hv(3)}>\n<ol>\n`
    },
    /** @private */
    result: (r) => {
        let disp = r.skipped ? 'skipped' : r.passed ? 'passed' : 'failed'
        return `<li class="${disp}">${disp}<br/>\n    <span class="comment">${r.comment}</span></li>\n`
    },
    /** @private */
    endTest: ()=> {
        return '</ol>\n</div>\n\n'
    }
}
const markdown = {
    /** @private */
    header: () => {
        let hash = '#'.repeat(hv(1))
        let out = `${hash} ${banner}\n\n`
        out += '- '+startedLine.trim()+'\n'
        out += '- '+elapsedLine.trim()+'\n\n'
        return out

    },
    /** @private */
    footer: () => {
        return '\n----\n'
    },
    /** @private */
    allSkipped: () => {
        return `###### _${allSkip}_\n`

    },
    /** @private */
    testTitle: (name) => {
        let hash = '#'.repeat(hv(3))
        return `${hash} test: ${name}\n`
    },
    /** @private */
    endTest: () => {
        return '\n';
    },

    /** @private */
    result: (r, count) => {
        let disp = r.skipped ? '_`skipped`_' : r.passed ? '`passed`' : '__`failed`__'
        return `${count}. ${disp}${r.comment ? ' - '+ '_'+r.comment+'_' : ''}`+'\n'
    }
}


const formatRender = {
    text, html, markdown
}

function getReport(format:string = "text", inColor) {
    setup(inColor)
    let render = formatRender[format]
    let rpt = render.header()
    Object.getOwnPropertyNames(htReportMap).forEach(name => {
        if(name !== 'verifyHuman') {
            const ra = htReportMap[name] || []
            rpt += render.testTitle(name)
            let count = 1;
            ra.forEach(r => {
                rpt += render.result(r, count++)
            })
            rpt += render.endTest()
        } else {
            if(htReportMap[name][0].skipped) {
                rpt += render.allSkipped()
            }
        }
    })
    rpt += render.footer()
    return Promise.resolve(rpt)
}

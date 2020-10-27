
import {
    startManualTest,
    endManualTest,
    viewFile,
    showText,
    diff,
    viewImage,
    compareImages,
    verifyHumanAvailable,
    produceReport,
    consoleReport
} from './ExchangeFlow'
import * as path from 'path'

const root = path.resolve(path.join(__dirname, '..'))

console.log("Starting.....")
startManualTest().then(rt => {
    console.log("Start Manual Test returns " + rt)
}).catch(e => {
    console.error(e)
})

// this is a placeholder, since harness is to be used as a library,
// but it can run some tests on the harness functions,
// each of which return a promise with a result code:
// 0== pass, 1== skip, 255== fail

verifyHumanAvailable().then(tr => {

    console.log('verifyHuman Response', tr)

    viewFile(path.join(root, 'README.md'), {prompt: 'Does the Readme make sense?'}).then(tr => {
        console.log('response ', tr)

        // todo: Bug with showText and literal new line.
        showText("This is some text to be shown. It was entered literally",
            {prompt: 'Custom Prompt',
                    specialNotice: 'Listen up! This is a special notice.',
                    title: 'Title set by option',
                    name: 'My Test Name'
            }).then(tr => {
            console.log('response ', tr)

            diff(path.join(root, 'example', 'textFile.txt'), path.join(root, 'example', 'diffText.txt')).then(tr => {
                console.log('response ', tr)

                viewImage(path.join(root, 'example', 'dog.jpg'), {name: 'My Test Name', width: 250, height: 250}).then(tr => {
                    console.log('response ', tr)

                    compareImages(path.join(root, 'example', 'dog.jpg'), path.join(root, 'example', 'cat.jpg')).then(tr => {
                        console.log('response ', tr)

                        console.log("[Harness] Test Completed")
                        endManualTest()
                        produceReport({format: 'html', file:'humanTest', headingSize:3})
                        produceReport({format: 'markdown', file:'humanTest',  headingSize:3})
                        produceReport({format: 'text', file:'humanTest',  headingSize:3})
                        consoleReport(true).then(rpt => {
                            console.log(rpt)
                        })
                    })
                })
            })
        })
    })
})




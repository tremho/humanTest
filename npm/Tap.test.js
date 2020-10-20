
process.env.TAP_TIMEOUT = 0 // Required so tap doesn't timeout (or run tap with --no-timeout)

const humanTest = require('./index')
const tap = require('tap')
const fs  = require('fs')
const path = require('path')

const exampleRoot = path.join(__dirname, 'example')

const fileToView = path.join(exampleRoot, 'textFile.txt')
const fileToDiff = path.join(exampleRoot, 'diffFile.txt')
const picToView = path.join(exampleRoot, 'dog.jpg')
const picToDiff = path.join(exampleRoot, 'cat.jpg')
const smiley = path.join(exampleRoot, 'smiley.png')
const noSmiley = path.join(exampleRoot, 'no-smiley.png')
const stringToView = 'The time is now for all good foxes to jump over the lazy dog\'s back'


// conduct the test

tap.ok(humanTest, 'module loaded')
tap.ok(humanTest.startManualTest, 'function should be exported')
tap.ok(humanTest.endManualTest, 'function should be exported')
tap.ok(humanTest.viewFile, 'function should be exported')

tap.ok(fs.existsSync(exampleRoot), 'Expect example directory to exist')


humanTest.startManualTest('Tap testing')
// verifyHuman has a default timeout of 120 seconds, so we need to wait at least that long
tap.test('Verify Human', t => {
    humanTest.verifyHumanAvailable().then(result => {
        // t.ok(result.passed)
        t.end()
    })
})

// other tests have a timeout of 30 seconds, which matches Tap's default timeout, so no real need to set it for these.
tap.test('viewFile Test', t => {
    humanTest.viewFile(fileToView).then(result => {
        if (result.skipped) tap.skip(result.comment)
        else t.ok(result.passed, result.comment)
        t.end()
    })
})
tap.test('showText Test', t => {
    humanTest.showText(stringToView).then(result => {
        if (result.skipped) t.skip(result.comment)
        else t.ok(result.passed, result.comment)
        t.end()
    })
})

tap.test('viewImage Test', t => {
    humanTest.viewImage(picToView).then(result => {
        if (result.skipped) t.skip(result.comment)
        else t.ok(result.passed, result.comment)
        t.end()
    })
})
tap.test('diff Test', t=> {
    humanTest.diff(fileToView, fileToDiff).then(result => {
        if (result.skipped) t.skip(result.comment)
        else t.ok(result.passed, result.comment)
        t.end()
    })
})
tap.test('compareImages Test', t => {
    humanTest.compareImages(picToView, picToDiff).then(result => {
        if (result.skipped) t.skip(result.comment)
        else t.ok(result.passed, result.comment)

        t.end()
    })
})
tap.test('blink images Test', t=> {
    humanTest.compareImages(noSmiley, smiley, {
        specialNotice: "Use the 'blink' feature to verify smile goes on face properly",
        prompt: "Do images align?"
        }).then(result => {
        if (result.skipped) t.skip(result.comment)
        else t.ok(result.passed, result.comment)

        humanTest.endManualTest()
        t.end()
    })
})

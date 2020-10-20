
const humanTest = require('human-test')
const fs  = require('fs')
const path = require('path')

const exampleRoot = path.join(__dirname, '..', 'example') // jasmine starts life in the spec directory


const fileToView = path.join(exampleRoot, 'textFile.txt')
const fileToDiff = path.join(exampleRoot, 'diffFile.txt')
const picToView = path.join(exampleRoot, 'dog.jpg')
const picToDiff = path.join(exampleRoot, 'cat.jpg')
const smiley = path.join(exampleRoot, 'smiley.png')
const noSmiley = path.join(exampleRoot, 'no-smiley.png')
const stringToView = 'The time is now for all good foxes to jump over the lazy dog\'s back'


// Tests for non-manual aspects of the system under test are conducted as always
describe("Jasmine HumanTest suite", function() {
  it("HumanTest module was loaded", function () {
    expect(humanTest).toBeDefined()
  });
  it("HumanTest module exports expected functions", function () {
    expect(humanTest.startManualTest).toBeDefined()
    expect(humanTest.endManualTest).toBeDefined()
    expect(humanTest.viewFile).toBeDefined()
  });
  it('Expect example directory to exist', function () {
    expect(fs.existsSync(exampleRoot)).toBe(true)
  })
})
// Manual (human) testing is bracketed by the startManualTesting and endManualTesting API calls.
describe('Begin Manual Testing', function() {
  // We must set the jasmine timeout to be greater than the timeout for verifyHumanAvailable
  // or beforeAll will exit early and the tests will run prematurely and fail
  // Note that we could set this to 30 seconds after verifyHuman to match the default for each test from then on, but there's no need.
  var defTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000; // neutralize jasmine async timeout
  beforeAll(function() {
    console.log('beforeAll start')
    humanTest.startManualTest('Jasmine Tests')
    return humanTest.verifyHumanAvailable()
  })
  afterAll(function(done) {
    console.log('DONE -- NOW JUST WANT OUT OF HERE!')
    jasmine.DEFAULT_TIMEOUT_INTERVAL = defTimeout
    humanTest.endManualTest()
    done()
  })
  it('View File', async function() {
    console.log('starting viewFile')
    const result = await humanTest.viewFile(fileToView)
    console.log('return with', result)
    // Jasmine has no provision for marking a test skipped once it has started executing.
    // Other frameworks might.
    // Alternately, you may choose to mark a skipped test as 'failed' but with a specific label so it is
    // recognized as a skipped test in the test report.
    expect(result.skipped).not.toBe(true)
    expect(result.error).not.toBeDefined()
    expect(result.passed).toBe(true)
    // Handle comments in any way that makes sense to your test reporting system.
    if(result.comment) console.log('ViewFile comment ' + result.comment)
  })
  it('Show Text', async function() {
    console.log('starting Show Text')
    const result = await humanTest.showText(stringToView)
    console.log('return with', result)
    expect(result.passed).toBe(true)
  })
  it('View Image (and use options)', async function() {
    console.log('starting viewImage')
    const result = await humanTest.viewImage(picToView, {
      prompt: "Is this a dog?", // give our own prompt text
      specialNotice: 'Study the picture carefully and answer truthfully', // This is a special notice that will pop up over test display.
      timeout: 45, // give a slightly longer timeout (default is 30 seconds)
      width: 500, // viewImage also accepts width and height options
      height: 500
    })
    console.log('return with', result)
    expect(result.passed).toBe(true)
  })
  it('diffText', async function() {
    console.log('starting diffText')
    const result = await humanTest.diff(fileToView, fileToDiff)
    console.log('return with', result)
    expect(result.passed).toBe(true)
  })
  it('compareImages', async function() {
    console.log('starting compareImages')
    const result = await humanTest.compareImages(picToView, picToDiff)
    console.log('return with', result)
    expect(result.passed).toBe(true)
  })
  it('blink compare test', async function() {
    console.log('starting blink compareImages')
    const result = await humanTest.compareImages(noSmiley, smiley, {
      specialNotice: "Use the 'blink' feature to verify smile goes on face properly",
      prompt: "Do images align?"
    })
    console.log('return with', result)
    expect(result.passed).toBe(true)
  })
});

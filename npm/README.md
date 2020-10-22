# HumanTest

###### Let the robots test code, but let people judge content

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![TotalDownloads][total-downloads-image]][npm-url]
[![Twitter Follow][twitter-image]][twitter-url]

[build-status]: https://travis-ci.com/tremho/humanTest.svg?branch=master

[build-url]: https://travis-ci.org/tremho/humanTest

[npm-image]: http://img.shields.io/npm/v/human-test.svg

[npm-url]: https://npmjs.org/package/human-test

[downloads-image]: http://img.shields.io/npm/dm/human-test.svg

[total-downloads-image]: http://img.shields.io/npm/dt/human-test.svg?label=total%20downloads

[twitter-image]: https://img.shields.io/twitter/follow/Tremho1.svg?style=social&label=Follow%20me

[twitter-url]: https://twitter.com/Tremho1

You've committed to creating a bulletproof software development pipeline
and have rigorously implemented unit and integration test frameworks into
your workflow.  _Good for you!_

But some things seem to defy practical means of testing. For example,
you can certainly test if the content field of your Very Important Blog Experience (VIBE)
is populated with text, but can you verify that it is appropriate, or even any good?

Or you have an image to post next to the article.  Is the image even of the right subject?

Or maybe you have added highlight shading to a button image used in your new game.
Do the highlights look right against the buttons?

These are things that are very difficult to write automated tests for.
And so they go untested.  Or at least, officially untested.  Of course, you
check these things when you do them -- visually -- and trust they won't
change for some reason down the road.

Oh, sure, you _theoretically could_ devise an automation solution for these scenarios,
adopting difficult to implement image comparators, or AI-based text analysers, but
that's more work than the rest of your project, so you (sensibly) don't do that.

Besides, do these solutions -- whether overly pedantic about trivial details (like a single pixel being 0.25 chroma different)
, or slippery "fuzzy-logic" interpretations of an AI model -- _really_ qualify to be the 
arbiter of what is right for your project?

Some thing should be tested by humans.  We humans are able to understand
the nuances of context, and are generally more reliable judges of suitability
than your average robot.

With that in mind, `HumanTest` was created to allow test frameworks to 
pull in the otherwise neglected part of the workflow components and simply
ask someone "is this okay?"

#### Humans are flakey, but useful

Humans may not always be around.  If you are doing Continuous Integration
on  your code, especially in the cloud, your chances of finding a handy human
tester is basically zero.

So, `HumanTest` will first ask if there is anyone available to answer test questions.
If there is not, then all the subsequent tests are marked as 'skipped' and
the remainder of the test suite can run and validate the robot parts unabated.

Or, maybe a human doesn't know if something passes or fails, necessarily.
Maybe you forgot to train them.  Maybe they are just stupid. Or lazy. 
But whatever the reason, a human may 'skip' a test, rather than pass or fail it.
This is actually desireable ambiguity, because it allows you to analyse if your
contexts or instructions are too confusing.  Which usually has its root in
the assumptions that went into product design.

### Features

-   Works with any test framework that supports asynchronous actions
-   Examples for Tap and Jasmine provided
-   Safe for use in CI environments
-   Will proceed to skip after timeout if no human is available, or walks away.
-   Allows user to view and judge text contents
-   Allows a user to accept or reject differences in text
-   Allows a user to view and judge an image
-   Allows a user to compare two images -- side-by-side and blink-flip

### Screen Shots

|     |                                                                                     |     |
| --- | :---------------------------------------------------------------------------------: | --- |
|     | ![ss1](https://github.com/tremho/humanTest/blob/master/npm/images/ss1.png?raw=true) |     |
|     | ![ss2](https://github.com/tremho/humanTest/blob/master/npm/images/ss2.png?raw=true) |     |
|     | ![ss3](https://github.com/tremho/humanTest/blob/master/npm/images/ss3.png?raw=true) |     |
|     | ![ss4](https://github.com/tremho/humanTest/blob/master/npm/images/ss4.png?raw=true) |     |
|     | ![ss5](https://github.com/tremho/humanTest/blob/master/npm/images/ss5.png?raw=true) |     |

### Installation

npm install --save-dev human-test

### Usage

Use within the module of your test code.

    var humanTest = require('human-test')

    humanTest.startManualTests('Title to Display')
    humanTest.verifyHumanAvailable().then(result => {
        // process the result if desired
    })
    humanTest.viewFile('path/to/file.txt').then(result => {
        // process the result for passed / skipped, etc.
    })

alternately:

    var {
    startManualTest, 
    endManualTest,
    viewFile,
    showText,
    diff,
    viewImage,
    compareImages
    } = require('humanTest')

    async function testStuff() {
        startManualTests('Title to Display')
        await verifyHumanAvailable().then(result => {
            // process the result if desired
        })
        await viewFile('path/to/file.txt').then(result => {
            // process the result for passed / skipped, etc.
        })
        // ... other commands as desired
        endManualTest()

How you actually use the API in your test framework depends
upon the test framework you prefer and what the syntax
of that framework allows.

### Using with Tap

[`TapJS`](https://node-tap.org) is the preferred testing framework of this author, but
if you don't agree, that's okay.  

TapJS has good support for asynchronous testing, and allows for
tests to be marked as skipped after they have been started, and
unless otherwise directed, will execute the test operations 
in the order written,
and these characteristics are all a plus in this context, at least.    TapJS has many other advantages over
many of the other popular and historically common Javascript test
frameworks available.  If you are not already familiar with it, check it out.

Here is an example test script designed for Tap:

    process.env.TAP_TIMEOUT = 0 // Required so tap doesn't timeout (or run tap with --no-timeout)

    // import the modules we need
    const humanTest = require('human-test')
    const tap = require('tap')
    const fs  = require('fs')
    const path = require('path')

    // define the constants we'll use in testing
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

    // Do the human parts of testing:

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

### Using with Jasmine

Jasmine is a very popular test framework, although it is getting a little
long in the tooth these days.  Jasmine is also representative in basic approach and syntax
to a number of related or dependent frameworks, such as [mocha](https://mochajs.org), [jest](https://jestjs.io), and [many others](https://alternativeto.net/software/jasmine/)

Jasmine tests have the following disadvantages over Tap, in the context of using `humanTest`:

-   Tests will execute in a random order
-   If a `HumanTest` test results in a 'skipped' test, there is no way for Jasmine to mark the test
    it is currently running as skipped.  Using some other reporting mechanism is recommended.

Here is an example test script designed for Jasmine:

    // import required modules
    const humanTest = require('human-test')
    const fs  = require('fs')
    const path = require('path')

    // define the constants we'll use in testing
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
    // which we'll put in our `beforeAll` and `afterAll` handlers.
    describe('Begin Manual Testing', function() {
      // We must set the jasmine timeout to be greater than the timeout for verifyHumanAvailable
      // or beforeAll will exit early and the tests will run prematurely and fail
      // Note that we could set this to 30 seconds after verifyHuman to match the default for each test from then on, but there's no need.
      var defTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000; // neutralize jasmine async timeout
      beforeAll(function() {
        humanTest.startManualTest('Jasmine Tests')
        return humanTest.verifyHumanAvailable()
      })
      afterAll(function(done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = defTimeout
        humanTest.endManualTest()
        done()
      })
      it('View File', async function() {
        const result = await humanTest.viewFile(fileToView)
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
        const result = await humanTest.showText(stringToView)
        expect(result.passed).toBe(true)
      })
      it('View Image (and use options)', async function() {
        const result = await humanTest.viewImage(picToView, {
          prompt: "Is this a dog?", // give our own prompt text
          specialNotice: 'Study the picture carefully and answer truthfully', // This is a special notice that will pop up over test display.
          timeout: 45, // give a slightly longer timeout (default is 30 seconds)
          width: 500, // viewImage also accepts width and height options
          height: 500
        })
        expect(result.passed).toBe(true)
      })
      it('diffText', async function() {
        const result = await humanTest.diff(fileToView, fileToDiff)
        expect(result.passed).toBe(true)
      })
      it('compareImages', async function() {
        const result = await humanTest.compareImages(picToView, picToDiff)
        expect(result.passed).toBe(true)
      })
      it('blink compare test', async function() {
        const result = await humanTest.compareImages(noSmiley, smiley, {
          specialNotice: "Use the 'blink' feature to verify smile goes on face properly",
          prompt: "Do images align?"
        })
        expect(result.passed).toBe(true)
      })
    });

### Handling comments, or unhandled skips

When a `TestResponse` object is returned from a `HumanTest` test command,
any comments the user entered in the GUI app's test area is relayed in the
`comment` property.  What can practically be done with this information 
is up to you (and possibly your choice of test framework).  
You may choose to simply output it to the console, but this ephermeral sort of
handling is rarely sufficient to capture meaningful data.

Consider recording the results of tests yourself, in a Map object
(which could be just a plain object) that records each test result
by test name.  Then output your own reporting of this manual test feedback
to use as an appendix to the test report generated by your test framework.

For frameworks where a test marking itself as skipped is not an option, this may also be an 
appropriate mechanism for reporting this level of feedback as well.

Perhaps the following psuedo-code outlining this idea will be inspirational
to your own implementation:

    const htResultsMap = {}

    // hopefully you'd make a prettier output than this, but
    // even an object dump is informative for this purpose
    function reportHumanTestResults() {
      Object.getOwnPropertyNames(htResultsMap).forEach(name => {
        const results = htResultsMap[name]
        console.log(name, results)
       })
    }

    // conduct the tests

    /*do the test called testname */ => result => {
        htResultsMap[testname] = result;
    })
    ...
    // when all done
    reportHumanTestResults()

### Using with other test frameworks

There should be no reason that _any_ test framework can't be made
to work with `HumanTest`.

If you have examples of using other test frameworks, please share them.
Use the contact information in this readme and/or post as an
issue or pull request to the GitHub repository.

#### Some things to know:

-   The `HumanTest` Display app is an Electron-based app process that reads and writes via stdin/stdout to 
    communicate with the test harness.

-   The `HumanTest` Display app is designed to run on Mac, Windows, and Linux platforms, 
    but has not been extensively tested on all system variants.  If you experience problems
    with this in any way on  your platform, please contact us.

-   If the remote GUI app fails to run after `startManualTest` is called (for example, when running on a headless CI ),
    all the subsequent tests will return 'skipped' (similar to the timeout case of `verifyHumanAvailable`, but without
    the 2-minute wait)        

-   `HumanTest` automatically gates access to each test, so if a test is in progress, a 
    call to run the next test will wait until the prior one finishes.

### Test timeouts

Make sure you have either disabled or suspended the default timeout for
asynchronous operations for whatever test framework you are using, since the
human-enacted tests can easily exceed these limits.

### API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

##### Table of Contents

-   [startManualTest](#startmanualtest)
    -   [Parameters](#parameters)
    -   [Examples](#examples)
-   [endManualTest](#endmanualtest)
    -   [Examples](#examples-1)
-   [verifyHumanAvailable](#verifyhumanavailable)
    -   [Parameters](#parameters-1)
    -   [Examples](#examples-2)
-   [viewFile](#viewfile)
    -   [Parameters](#parameters-2)
    -   [Examples](#examples-3)
-   [showText](#showtext)
    -   [Parameters](#parameters-3)
    -   [Examples](#examples-4)
-   [diff](#diff)
    -   [Parameters](#parameters-4)
    -   [Examples](#examples-5)
-   [viewImage](#viewimage)
    -   [Parameters](#parameters-5)
    -   [Examples](#examples-6)
-   [compareImages](#compareimages)
    -   [Parameters](#parameters-6)
    -   [Examples](#examples-7)
-   [TestResponse](#testresponse)
-   [TestOptions](#testoptions)

#### startManualTest

Starts manual testing, providing a title.

This launches the remote GUI app and supplies the title that will be displayed on the GUI app page.
The remote app is then ready to receive commands from the harness.

This **must** be called _before_ any tests are conducted.
When done with _all_ tests, call `endManualTest()`

##### Parameters

-   `title` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** If not given, a default title will be displayed

##### Examples

```javascript
startManualTest('Verify Content')
```

Returns **any** Promise<number>  Return can be ignored; resolves to 0 if remote app launched successfully.If the remote app does not run, subsequent tests are skipped.

#### endManualTest

Stops manual testing and closes the remote app.
This should be called after the last test command is handled.

##### Examples

```javascript
endManualTest()
```

#### verifyHumanAvailable

Verifies that a human is available to conduct the tests.
Timeout default for this command is 60 seconds.  If no response is received in that time,
this test response will be with 'skipped = true' and 'error = timeout'.
Also in that case, all subsequent tests are automatically skipped, with the comment 'unattended'

##### Parameters

-   `options` **[TestOptions](#testoptions)** The 'timeout' option property is honored here (default = 60)

##### Examples

```javascript
verifyHumanAvailable({timeout:60}).then(result => {
  if(result.skipped) console.log('no human is available!')
})
```

#### viewFile

Displays the contents of a text file and prompts the user for pass/fail/skip or comments

##### Parameters

-   `filename` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** File with text to be displayed
-   `options` **[TestOptions](#testoptions)** options for this command (e.g. prompt, timeout)

##### Examples

```javascript
viewFile('path/to/myfile.txt').then(result => {
  if(result.passed) console.log('looks okay!')
})
```

#### showText

Displays the given text and prompts the user for pass/fail/skip or comments

##### Parameters

-   `text` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Text to be displayed
-   `options` **[TestOptions](#testoptions)** options for this command (e.g. prompt, timeout)

##### Examples

```javascript
showText("literal text to be shown in view box").then(result => {
  if(result.passed) console.log('looks okay!')
  else if(result.skipped) console.log('test was skipped')
  else console.error('test failed!')
})
```

#### diff

Displays the contents of a two sets of text or two text files as a side-by-side diff
and prompts the user for pass/fail/skip or comments

arg is treated as a filename if file exists at the path, otherwise as text.

##### Parameters

-   `arg1` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Filename or text (left side)
-   `arg2` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Filename or text (right side)
-   `options` **[TestOptions](#testoptions)** options for this command (e.g. prompt, timeout)

##### Examples

```javascript
diff(filenameOrString1, filenameOrString2).then(result => {
  if(result.passed) console.log('looks okay!')
  else if(result.skipped) console.log('test was skipped')
  else console.error('test failed!')
})
```

#### viewImage

Displays the image file and prompts the user for pass/fail/skip or comments

##### Parameters

-   `filename` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Image file to be displayed
-   `options` **[TestOptions](#testoptions)** options for this command (e.g. prompt, timeout, width, height)

##### Examples

```javascript
viewImage('./images/prettyBird.png').then(result => {
  if(result.passed) console.log('looks okay!')
  else if(result.skipped) console.log('test was skipped')
  else console.error('test failed!')
})

The `width` and `height` options are recognized by this command:
```

```javascript
viewImage('./images/prettyBird.png', {width:400, height: 400}).then(result => {
      ...
})
```

#### compareImages

Displays two images in a manner that they may be compared
and prompts the user for pass/fail/skip or comments

##### Parameters

-   `file1` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** First Image
-   `file2` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Second Image
-   `options` **[TestOptions](#testoptions)** options for this command (e.g. prompt, timeout)

##### Examples

```javascript
`compareImages('image1.png', 'image2.jpg').then(result => {
      if(result.passed) console.log('looks okay!')
      else if(result.skipped) console.log('test was skipped')
      else console.error('test failed!')
})`

For any command, the `specialNotice` property can be used to give the user more information on how to conduct
the test.  That is useful for `compareImages`, since it provides two view modes the user can employ for analysis.
```

```javascript
`compareImages('image1.png', 'image2.jpg', {specialNotice:'use the blink compare tool!'}).then(result => {
         ...
})`
```

#### TestResponse

Object structure returned by a test.
Tests return a Promise that resolves with an object with the following properties:

| Property | Type    | Purpose                                                                         |
| :------- | :------ | :------------------------------------------------------------------------------ |
| passed   | boolean | True if the test has passed, false if not; will be undefined for skip or error  |
| skipped  | boolean | True if test was skipped, undefined otherwise                                   |
| comment  | string  | If defined, will contain any comment entered by the human tester for this test  |
| error    | string  | If defined, will signify an error has occurred, and will hold the error message |

#### TestOptions

Options that _may_ be passed to each command.
If not given, defaults for each value are used.

| Property      | Type   | Default                  | Purpose                                                                                                                               |
| :------------ | :----- | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| prompt        | string | "Is this acceptable?"    | The prompt to display to the user                                                                                                     |
| specialNotice | string | <none>                   | A message displayed in a modal alert dialog to gove the user special instruction                                                      |
| timeout       | number | 30 (120 for verifyHuman) | The number of seconds before a timeout occurs, and test skipped                                                                       |
| width         | number | <none>                   | **(`imageView` Only)** Defines the width used for the image display, in pixels. If not provided, the full image width is displayed.   |
| height        | number | <none>                   | **(`imageView` Only)** Defines the height used for the image display, in pixels. If not provided, the full image height is displayed. |

### Known issues

There are currently no known issues.
See also the [Github repository issues page](https://github.com/tremho/humanTest/issues)

### Contributing

If you have ideas for making `HumanTest` better, please visit
the [Github repository issues page](https://github.com/tremho/humanTest/issues)
page and record your suggestions there.

If you would like to commit code that addresses an outstanding issue, please
fork the repository and post a pull request with your changes.

If you simply want to comment or if you have other reason to contact me,
feel free to send me email at <mailto:steve@ohmert.com>

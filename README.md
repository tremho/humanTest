# Human Test

A set of tools to be used in test frameworks to support
manual human test verification of visual elements.

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


This readme describes the HumanTest project and the GitHub repository
sources.
You may wish to jump directly to the [NPM readme](npm/README.md) for documentation directed
at how to use this tool.
 

##### Plan:

Two parts.  One is the framework support to call on an external
process and capture the results.  This asynchronous sequence should
transpire as a supportable atomic step within the test framework and
handle the pass/fail and display aspects like any other test.

**Future**:
The technical protocol will support the use of potentially any 
spawnable process with prompt/response handled by readline at the console, 
although the supplied display app will be sufficient handle the 
main needs. This allows others to create custom verification apps to
run instead of the 'built-in' standard.
An early version of this was done, and it works in principle,
but would not fit the current framework design as it was done
at the time.

###### Display and verification app:
This is to be a 'ThunderBolt' (Electron + riot) based tool that
will display file or stdin stream content to the user and prompting
for a response.

The user response will translate into a pass/fail for the test and
may also collect user comments.

Display support for the following is envisioned:
###### Text
Text is displayed for the human to read.  The supplied prompt is given to the user,
probably asking a question about the validity or suitability of the text.
The user can accept or reject, or add comments.

###### Image
An image is displayed for the human to view.  The supplied prompt is given to the user,
probably asking a question about the validity or suitability of the image.
The user can accept or reject, or add comments.
 
###### Text Diff
A split-window text diff view is presented for a before and after submission
of text.  The user cannot change the diff, but is prompted to rate the
appropriateness of the difference, or in the resulting text.
The user can accept or reject, or add comments.

###### Image compare
A split-window view of two images is shown and the user is prompted to
accept the differences between them or accept the final image.
An option is available to use a single-window "blink" test mode that allows the 
user to toggle a single view between each image to test for differnces.
A use case might be to check if blue outlines have been added to an icon.
The user can accept or reject, or add comments.


###### Calling component
This is meant to be used from common test frameworks.
Will test under Tap and Jasmine and document accordingly.

----
### Repository structure

The overall project consists of 4 separate Node subprojects, each
with their own package.json and accoutrement.

###### Harness
The root project hosts the "Harness" portion of the scheme. The
file `ExchangeFlow.ts` provides the mechanism for launching and communicating
with the remote app, and exposes the API to be used by
test clients.  `ExchangeCommon.ts` defines some common types, and
`main.ts` is a development-time test client to exercise the API.

###### Remote App
The remote app is an Electron-based application and is constructed in 
two parts, reflecting the front-end/back-end nature of the Electron
architecture.  The front-end utilizes the [riot](https://www.npmjs.com/package/riot)
component library, implemented in a nascent framework-of-sorts that I have
been calling `ThunderBolt`.  The `ThunderBolt` folder / project
itself represent the front-end (renderer) process of the Electron
implementation.  The Electron 'back-end' (main) process implementations
are found in the `electronMain` folder within.
`ThunderBolt/src` holds the various sources for the front-end,
including the core app and model that make up the gist of the
ThunderBolt binding and handling approach, and the `components`
folder that define the riot-based controls and the commmon binding API.
In `electronMain/src` is the main back-end handling for the commands
and for communicating through the gateway via an API exposed to
the front.  Low-level IPC handling is in `preload.js`, per semi-standard
Electron practice.

###### The NPM project
As published to NPM, HumanTest does not contain all the
source and trappings needed to create the remote app, it
simply uses the prebuilt versions and exposes the test harness
API, along with [documentation](npm/README.md) and some sample test scripts.

The NPM project is contained in a separate folder (`npm`).
Many of the files here are generated.
The gen-npm script of the root project creates symlinks so
that the `npm/index.js` file refers to the `build/ExhangeFlow.js` 
compiled file of the root, and the `ht-app` symlink points to
the release-builds output of the electron-packager in the electronMain
project. Examples from the root are also symlinked to the npm
local scope for use by the test scripts.

----
### Contributing

Issue-posting and contributions are encouraged.
Please familiarize yourself with the repository structure
and basic flow of the processes involved.

Pointing out a bug, or Suggesting an improvement should first be 
posted as an issue on the [Github issues page](https://github.com/tremho/humanTest/issues)
before a pull-request is submitted to address the issue.

If you have other comments, ideas, or insights, please feel free
to send me an email at [steve@ohmert.com](mailto:steve@ohmert.com)
to discuss.
 
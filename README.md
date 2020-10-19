# Human Test

A set of tools to be used in test frameworks to support
manual human test verification of visual elements.

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

cd 
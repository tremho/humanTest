/**
 * Object structure returned by a test.
 * Tests return a Promise that resolves with an object with the following properties:
 *
 * | Property |  Type | Purpose |
 * | :------- | :---  | :------ |
 * | passed | boolean | True if the test has passed, false if not; will be undefined for skip or error
 * | skipped | boolean | True if test was skipped, undefined otherwise
 * | comment | string | If defined, will contain any comment entered by the human tester for this test
 * | error | string | If defined, will signify an error has occurred, and will hold the error message
 *
 */
export class TestResponse {
    public passed?: boolean
    public skipped?: boolean
    public comment?: string
    public error?: string
}

/**
 * Options that *may* be passed to each command.
 * If not given, defaults for each value are used.
 *
 * | Property |  Type | Default | Purpose |
 * | :------- | :---  | :------ | :-----  |
 * | prompt    | string | "Is this acceptable?" | The prompt to display to the user
 * | specialNotice | string | <none> | A message displayed in a modal alert dialog to gove the user special instruction
 * | timeout  | number | 30 (120 for verifyHuman) | The number of seconds before a timeout occurs, and test skipped
 * | width | number | <none> | **(`imageView` Only)** Defines the width used for the image display, in pixels. If not provided, the full image width is displayed. |
 * | height | number | <none> | **(`imageView` Only)** Defines the height used for the image display, in pixels. If not provided, the full image height is displayed. |
 *
 */
export class TestOptions {
    public prompt?: string
    public timeout?: number
    public specialNotice?: string
    public width?:number
    public height?: number
}

/**
 * Structure of a command argument. has both file and text slots.
 * The text of the file gets put into the text field by electronMain before sending to remote.
 * @ignore
 */
class CmdArg {
    public text?:string
    public file?:string
}

/** Contains the command that will be JSON-transmitted to the remote
 * @ignore
 */
export class Command {
    public cmd:string
    public cmdargs:CmdArg[] = [new CmdArg(), new CmdArg()]
    public options?:TestOptions
}

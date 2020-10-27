/**
 * Tests return a structured object (via JSON to the calling harness)
 */
export class TestResponse {
    /** True if the test has passed, false if not; will be undefined for skip or error */
    public passed?: boolean
    /** True if test was skipped, undefined otherwise */
    public skipped?: boolean
    /** Will contain any comment entered by the human tester for this test */
    public comment?: string
    /** If defined, will signify an error has occurred, and will hold the error message */
    public error?: string
}

/**
 * Options that *may* be passed to each command.
 * If not given, defaults for each value are used.
 */
export class TestOptions {
    /** The prompt to display to the user.  If not provided, a default prompt is used.
     * The default prompt is "Is this acceptable?"
     */
    public prompt?: string
    /** The timeout, in seconds.  If not define, the default timeout is used */
    public timeout?: number
    /** If given, will present a pop-up alert message the user must read and dismiss before proceeding.
     * May be useful for pointing out key things to look for in a special test situation.
     * If not defined, no alert is shown.
     */
    public specialNotice?: string
    /**
     * Changes the main title.  The title is initially set with startManualTest, and can be changed with any commaond.
     * The title will persist beyond the life of the command, until changed again.
     */
    public title?: string
    /** Defines the width for the image display, in pixels. Used only for the `imageView` command.
     * If not given, a default is used.
     */
    public width?:number
    /** Defines the width for the image display, in pixels. Used only for the `imageView` command.
     * If not given, a default is used.
     */
    public height?: number
}

class CmdArg {
    public text?:string
    public file?:string
}

/* Contains the command that will be JSON-transmitted to the remote */
export class Command {
    public cmd:string
    public cmdargs:CmdArg[] = [new CmdArg(), new CmdArg()]
    public options?:TestOptions
}

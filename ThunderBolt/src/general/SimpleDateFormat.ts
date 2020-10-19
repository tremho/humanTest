
const months = ['--', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const monthAbbr = ['--', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weekdayAbbrs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const weekdayAbbr2 = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const weekdayAbbr3 = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa']

/**
 * format notation:
 *      YYYY = 4 digit year (e.g. 2020)
 *      YYY =  4 digit year, but only show if not the current year
 *      YY = 2 digit year (e.g. 20)
 *      Y =  2 digit year only shown if not the current year
 *      (if a year is not shown, characters in format beyond are skipped until the next parse token)
 *      
 *      MMMM = full name of month (e.g. 'February')
 *      MMM = abbreviated name of month (3 letters, e.g. 'Feb')
 *      MM = 2 digit month (leading 0) (e.g. 02)
 *      M = 1-2 digit month (no leading 0) (e.g. 2)
 *      
 *      WWWW = Full weekday name (e.g. 'Saturday')
 *      WWW = three letter weekday abbreviation (e.g. 'Sat')
 *      WW = two letter weekday abbreviation (uncommon) (e.g. 'Mo', 'Sa')
 *      W = 1 - 2 letter weekday abbreviation (e.g. 'M', 'Th')
 *      
 *      DD = 2 digit day, with leading 0
 *      D = 1 - 2 digit day, no leading 0
 *      
 *      hhhh = 24 hour time, leading 0
 *      hhh = 24 hour time, no leading 0
 *      hh = 12 hour time, leading 0
 *      h  = 12 hour time, no leading 0
 *      
 *      m = minutes with leading 0
 *      m = minutes without leading 0
 *      
 *      ss = seconds with leading 0
 *      s  = seconds witout leading 0
 *      
 *      .sss = milliseconds (includes the .)
 *      .ss` = 1/100th seconds (includes the .)
 *      .s   = 1/10th seconds (includes the .)
 *
 *      ++ = AM/PM notation (upper case)
 *      -- = am/pm (lower case)
 *      -+ - PM only (upper case)
 *      +- = PM only (lower case)
 *
 *      x = milliseconds (as an integer without a period)
 *      
 *      j = javascript standard millisecond timestamp
 *      u = unix standard second timestamp
 *      
 *      all other characters are kept in place for format display. Do not use format characters elsewhere.
 *      If you need to, do a string replace of a placeholder after formatting.
 *      
 */
export class SimpleDateFormat {
    
    private format:string = 'MMM DD YYY hh:mm:ss.sss ++ (Z)'
    private workingDate:Date;
    private mo:number;
    private wd:number;
    private dy:number;
    private yr:number;
    private hr:number;
    private mn:number;
    private ss:number;
    private ms:number;
    private tz:number;
    private jts:number;
    private uts:number;
    
    constructor(dtIn) {
        let workingDate;
        if(dtIn instanceof Date) {
            workingDate = dtIn;
        } else {
            workingDate = dtIn ? new Date(dtIn) : new Date()
        }
        this.mo = workingDate.getMonth() + 1
        this.wd = workingDate.getDay();
        this.dy = workingDate.getDate()
        this.yr = workingDate.getFullYear()
        this.hr = workingDate.getHours()
        this.mn = workingDate.getMinutes()
        this.ss = workingDate.getSeconds()
        this.ms = workingDate.getMilliseconds()
        this.tz = workingDate.getTimezoneOffset()
        this.jts = workingDate.getTime()
        this.uts = Math.floor(this.jts/1000)
    }

    // set the format template to use
    setFormat(fmt:string) {
        this.format = fmt;
    }
    // read the template and format values
    toString() {
        let out = this.format;
        const thisYear = new Date().getFullYear()
        // set the year
        let yr4 = ''+this.yr;
        let yr3 = thisYear === this.yr ? '' : yr4;
        let yr2 = yr4.substring(2)
        let yr1 = thisYear === this.yr ? '' : yr2;
        let n = 0;
        while ((n = out.indexOf('YYYY', n)) !== -1) {
            out = out.replace('YYYY', yr4)
            n += yr4.length;
        }
        n = 0;
        while ((n = out.indexOf('YYY', n)) !== -1) {
            out = out.replace('YYY', yr3)
            n += yr3.length;
        }
        n = 0;
        while ((n = out.indexOf('YY', n)) !== -1) {
            out = out.replace('YY', yr2)
            n += yr2.length;
        }
        n = 0;
        while ((n = out.indexOf('Y', n)) !== -1) {
            out = out.replace('Y', yr1)
            n += yr1.length;
        }
        // set the date
        let dy2 = this.dy < 10 ? '0'+this.dy : ''+this.dy
        let dy1 = '' + this.dy
        n = 0;
        while ((n = out.indexOf('DD', n)) !== -1) {
            out = out.replace('DD', dy2)
            n += dy2.length;
        }
        n = 0;
        while ((n = out.indexOf('D', n)) !== -1) {
            out = out.replace('D', dy1)
            n += dy1.length;
        }
        // set the hour
        let hr4 = this.hr < 10 ? '0'+this.hr : ''+this.hr;
        let hr3 = ''+this.hr;
        let hr1 = this.hr > 12 ? this.hr - 12 : this.hr; 
        let hr2 = hr1 < 10 ? '0' + hr1 : ''+hr1;
        let hour12 = false;
        n = 0;
        while ((n = out.indexOf('hhhh', n)) !== -1) {
            out = out.replace('hhhh', hr4)
            n += hr4.length;
        }
        n = 0;
        while ((n = out.indexOf('hhh', n)) !== -1) {
            out = out.replace('hhh', hr3)
            n += hr3.length;
        }
        n = 0;
        while ((n = out.indexOf('hh', n)) !== -1) {
            out = out.replace('hh', hr2)
            n += hr2.length;
            hour12 = true;
        }
        n = 0;
        while ((n = out.indexOf('h', n)) !== -1) {
            out = out.replace('h', ''+hr1)
            n += (''+hr1).length;
            hour12 = true;
        }
        // do minutes
        let mn2 = this.mn < 10 ? '0'+this.mn : ''+this.mn;
        let mn1 = ''+this.mn;
        n = 0;
        while ((n = out.indexOf('mm', n)) !== -1) {
            out = out.replace('mm', mn2)
            n += mn2.length;
        }
        n = 0;
        while ((n = out.indexOf('m', n)) !== -1) {
            out = out.replace('m', ''+mn1)
            n += mn1.length;
        }
        
        // do milliseconds first
        let mss;
        if (this.ms < 10) {
            mss = '00'+ this.ms; //009
        } else if(this.ms < 100) {
            mss = '0' + this.ms; //099
        } else {
            mss = ''+this.ms; //999
        }
        while ((n = out.indexOf('x')) !== -1) {
            out = out.replace('x', mss)
            n += mss.length;
        }

        while ((n = out.indexOf('.sss')) !== -1) {
            out = out.replace('.sss', '.'+mss)
            n += mss.length+1;
        }
        
        let hnd = mss.substring(0,2)
        while ((n = out.indexOf('.ss')) !== -1) {
            out = out.replace('.ss', '.'+hnd)
            n += hnd.length+1;
        }
        let tnth = mss.substring(1)
        while ((n = out.indexOf('.s')) !== -1) {
            out = out.replace('.s', '.'+tnth)
            n += tnth.length+1;
        }
        // do seconds
        let ss2 = this.ss < 10 ? '0'+this.ss : ''+this.ss;
        let ss1 = ''+this.ss;
        n = 0;
        while ((n = out.indexOf('ss', n)) !== -1) {
            out = out.replace('ss', ss2)
            n += ss2.length;
        }
        n = 0;
        while ((n = out.indexOf('s', n)) !== -1) {
            out = out.replace('s', ''+ss1)
            n += ss1.length;
        }
        
        // then timestamps
        let jts = ''+this.jts;
        let uts = ''+this.uts;
        n = 0;
        while ((n = out.indexOf('j', n)) !== -1) {
            out = out.replace('j', ''+jts)
            n += jts.length;
        }
        n = 0;
        while ((n = out.indexOf('u', n)) !== -1) {
            out = out.replace('u', ''+uts)
            n += uts.length;
        }


        // set the month
        let mo4 = months[this.mo]
        let mo3 = monthAbbr[this.mo]
        let mo2 = this.mo < 10 ? '0'+this.mo : ''+this.mo
        let mo1 = ''+ this.mo
        n = 0;
        while ((n = out.indexOf('MMMM', n)) !== -1) {
            out = out.replace('MMMM', mo4)
            n += mo4.length;
        }
        n = 0;
        while ((n = out.indexOf('MMM', n)) !== -1) {
            out = out.replace('MMM', mo3)
            n += mo3.length;
        }
        n = 0;
        while ((n = out.indexOf('MM', n)) !== -1) {
            out = out.replace('MM', mo2)
            n += mo2.length;
        }
        n = 0;
        while ((n = out.indexOf('M', n)) !== -1) {
            out = out.replace('M', mo1)
            n += mo1.length;
        }
        // set the weekday
        let wd4 = weekdays[this.wd]
        let wd3 = weekdayAbbrs[this.wd]
        let wd2 = weekdayAbbr2[this.wd]
        let wd1 = weekdayAbbr3[this.wd]
        n = 0;
        while ((n = out.indexOf('WWWW', n)) !== -1) {
            out = out.replace('WWWW', wd4)
            n += wd4.length;
        }
        n = 0;
        while ((n = out.indexOf('WWW', n)) !== -1) {
            out = out.replace('WWW', wd3)
            n += wd3.length;
        }
        n = 0;
        while ((n = out.indexOf('WW', n)) !== -1) {
            out = out.replace('WW', wd2)
            n += wd2.length;
        }
        n = 0;
        while ((n = out.indexOf('W', n)) !== -1) {
            out = out.replace('W', wd1)
            n += wd1.length;
        }

        // timezone TODO: some timezone names... but can't really do DST without a system call of some kind.
        let tz = ''+this.tz
        n = 0;
        while ((n = out.indexOf('Z', n)) !== -1) {
            out = out.replace('Z', ''+tz)
            n += tz.length;
        }

        // do AM/PM
        let ampm = this.hr >= 12 ? 'pm' : 'am';
        let pm = this.hr >= 12 ? 'pm' : '';

        while ((n = out.indexOf('--')) !== -1) {
            out = out.replace('--', ampm)
            n += ampm.length;
        }
        while ((n = out.indexOf('++')) !== -1) {
            out = out.replace('++', ampm.toUpperCase())
            n += ampm.length;
        }
        while ((n = out.indexOf('+-')) !== -1) {
            out = out.replace('+-', pm)
            n += ampm.length;
        }
        while ((n = out.indexOf('-+')) !== -1) {
            out = out.replace('-+', pm.toUpperCase())
            n += ampm.length;
        }

        return out;
        
    }
    
}
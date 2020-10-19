
import {SimpleDateFormat} from '../general/SimpleDateFormat'

/**
 * Returns the AppCore object defined by appMain at startup
 * Use this to gain access to app methods and the app model
 * @returns {*} The AppCore instance object
 */
export function getApp() {
  const rootComp = getComponent(document.body.querySelector('[is="app"]'))
  const app = rootComp.props.app;
  return app;
}

/**
 * Finds the component that contains this element
 * @param {HTMLElement} el
 * @returns {null|*} the riot component, or null if not found.
 */
export function getComponent(el) {
  try {
    let syms;
    do {
      syms = Object.getOwnPropertySymbols(el)
      if (syms.length === 0) {
        el = el.parentElement
      }
    } while (syms.length === 0)

    const comp = el[syms[0]]
    return comp
  } catch(e) {
    console.warn(e)
    return null;
  }
}


class Common {
  constructor(riotRoot)
  {
    this.riot = riotRoot;
    this.fits = []
    this.fitNum = 0;
  }
  /** picks the next parsed fit value, or the last one if list was exhausted */
  nextFit()
  {
    return this.fits[this.fitNum++] || this.fits[this.fits.length - 1]
  }
  /**
   * return the instance of the Presentation class that has been exposed as a property in the app root
   * @returns {Presentation}
   */
  getApp()
  {
    const boundTag = document.body.querySelector('[is="app"]')
    if(!boundTag) {
      throw Error('riot app not bound to page')
    }
    const rootComp = this.getComponent(boundTag)
    const app = rootComp.props.app;
    return app;
  }

  /**
   * gets the Riot Component instance that the given DOM element belongs to
   * @param {HTMLElement} el - the Element in question
   * @returns {riot-component} - Riot component the element belongs to, or NULL if not found
   */
  getComponent(el)
  {
    return getComponent(el)
  }

  /**
   * Returns the component that is the optionally named ancestor of the given component
   * @param {riot-component} comp - component that is child of parent sought
   * @param {string} [tag]  - optional tag to find in ancestry tree, or immediate parent if not given.
   * @returns {riot-component}
   */
  getComponentParent(comp, tag) {
    if(!comp) return null;
    tag = (tag && tag.toUpperCase())
    while(comp) {
      comp = this.getComponent(comp.root.parentElement)
      if(!tag || comp.root.tagName === tag) {
        return comp;
      }
    }
    return null; // not found.
  }

  /**
   * returns the component that is the child of the given component of the given tag,
   * optionally the given ordinal occurrence.
   * @param {riot-component} comp - component that has the child we seek
   * @param {string} tag - tag name of child, or other selector string (e.g. '#child-id')
   * @param ordinal - optional  ordinal (starting with 1) to choose if there are multiple children with this tag
   * @returns {riot-component}
   */
  getComponentChild(comp, tag, ordinal = 1) {
    const results = comp.$$(tag)
    const pick = ordinal - 1
    return this.getComponent(results[pick])
  }

  /**
   * Find the child component that owns the given element
   * @param {riot-component} containingComp - component that we are searching within
   * @param {HTMLElement} element - element we are searching for
   * @returns {number} the index of the child in the parent, or -1 if not found
   */
  findChildIndexWithElement(containingComp, element) {
    let p = containingComp.root
    while(p.firstElementChild.tagName === 'DIV') {
      p = p.firstElementChild;
    }
    let children = p.children
    let index = -1;
    for (let i=0; i<children.length; i++) {
      if(children[i] === element) {
        index = i
        break;
      }
    }
    return index

  }


  /**
   * return the DOM element of the <div> container that all of our Riot components consist of
   * as their container.
   * @param {riot-component} [riot] If not passed, uses the one that created this class
   * @returns {Element}
   */
  getContainer(riot)
  {
    if(!riot) riot = this.riot;
    return riot.root.firstElementChild
  }
  /**
   * parses the *'fit' property* into width/height sizes and applies them
   * (the *'orientation' property* (horizontal/vertical) determines whether the values are applied to children width
   * or height.
   *
   * `fit` is a series of expressions (separated by spaces) describing the sizing to apply to
   * the children, in order.  If there are more children than expressions, the last expression used is used for all
   * subsequent children.
   * Format is <n><unit> where <n> is number and <unit> is the CSS unit to apply.
   * example expressions:  100px  30%  12em
   *
   *
   * #### Special unit values:
   *
   * - "*" == one fractional amount (number of children divided evenly)
   * - "**" == use natural size of child element (equivalent to "100%")
   *
   * example: `"* 2* 3* *"` in a 5 item list
   *
   * would translate to the equivalent of (20% 40% 60% 20% 20%) among the 5 items (although computed px values rather
   * than % notation is applied)
   *
   * @param {string} props
   */
  parseFits(props)
  {
    if(!props || !props.fit) return;
    let keepGoing = true;

    const app = this.getApp()
    const sp = app.makeStringParser(props.fit)

    while (keepGoing) {
      try {
        const exp = sp.readNext()
        let unit, val;
        if (exp.substring(exp.length - 2) === "()") {
          // a function callback named
          this.fits.push(exp)
        } else {
          if (exp === '*' || exp === '**') {
            unit = exp;
            val = 1;
          } else {
            const re = /[\d\.]+/
            const match = re.exec(exp)[0]
            unit = exp.substring(match.length)
            val = Number.parseFloat(match)
          }
          let numKids = this.getContainer().children.length;
          let cdim = this.getContainer().getBoundingClientRect()
          const fullSize = props.orientation === 'horizontal' ? cdim.width : cdim.height;
          let even = fullSize / numKids;
          let size;
          if (unit === '**') {
            size = 100
            unit = "%";
          } else if (unit === '*') {
            size = val * even
            unit = 'px'
          } else {
            size = val;
          }
          this.fits.push(`${size}${unit}`)
        }
        keepGoing = sp.getRemaining().length > 0
      } catch (e) {
        console.error(e);
        keepGoing = false;
      }
    }
    // console.log('fits', this.fits)
    this.applyFits(props.orientation === 'horizontal')
  }
  /**
   * Applies the sizes parsed in 'fits' to the container children
   * @param {boolean} isHorizontal
   */
  applyFits(isHorizontal)
  {
    const children = this.getContainer().children
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      child.style.display = isHorizontal ? 'inline-block' : 'inline'
      child.style.verticalAlign = 'top'
      const innerChild = child.firstElementChild
      const fitSize = this.nextFit()
      if (isHorizontal) {
        innerChild.style.width = fitSize;
      } else innerChild.style.height = fitSize;
    }
  }

  /**
   * sets style attributes from common top-level prop names such as
   * `width`, `height`,`background`, or `background-color`
   * @param {HTMLElement} el
   * @param {object} props
   * @param {object} defaults
   */
  setCommonProps(el, props, defaults) {
    if(!defaults) defaults = {
      width: '100%',
      height: '100%'
    }
    el.style.width = props.width || defaults.width;
    el.style.height = props.height || defaults.height;
    el.style.background = props.background || defaults.background;
    el.style.backgroundColor = props.backgroundColor || defaults.backgroundColor;
  }

  /**
   * Parses styleText and applies to the element (div)
   *
   * @param {HTMLElement} div
   * @param {string} styleText
   */
  applyContainerStyles(div, styleText) {
    if(!div || !div.style || !styleText) return;
    const statements = styleText.split(';')
    statements.forEach(statement => {
      const kv = statement.split(':')
      let key = kv[0].trim().toLowerCase()
      const value = kv[1].trim().toLowerCase()
      const kcp = key.split('-')
      key = kcp[0]+kcp[1].charAt(0).toUpperCase()+kcp[1].substring(1)
      div.style[key] = value
    })
  }

  /**
   * Binds the component so that changes on the named model path will
   * automatically result in an update to the component
   */
  bindComponent() {
    const component = this.riot
    if(!component.bound) component.bound = {}
    function doBind(bindSet) {
      if(bindSet) {
        const bindPaths = bindSet.split(',')
        bindPaths.forEach(bpath => {

          const updateAlways = (bpath.charAt(0) === '!')
          if(updateAlways) {
            bpath = bpath.substring(1); // skip the !
          }
          const ldi = bpath.lastIndexOf('.')
          let section
          if(ldi === -1) ldi = bpath.length;
          section = bpath.substring(0, ldi)
          let name = bpath.substring(ldi+1)
          model.bind(section.trim(), name.trim(), (prop, value, old) => {
            const upd = component.bound
            let doUpdate = updateAlways || upd[prop] !== old || upd[prop] !== value
            upd[prop] = value
            if (doUpdate) {
              try {
                component.bound = upd;
                component.update()
              } catch(e) {}
            }
          })
          component.bound[name] = model.getAtPath(bpath)
        })
      }
    }
    const div = this.getContainer() // component.$('DIV')
    const app = this.getApp()
    const model = app.model
    // doBind(component.getAttribute('bind'))
    doBind(div.getAttribute('bind'))
    for (let i = 0; i < div.children.length; i++) {
      const child = div.children[i]
      doBind(child.getAttribute('bind'))
    }
    component.update()
  }

  /**
   * Formats a date using `SimpleDateFormatter`
   *
   * @param dtIn
   * @param format
   * @returns {string}
   */
  formatDate(dtIn, format) {

    let sdf = new SimpleDateFormat(dtIn)
    if(format) sdf.setFormat(format)
    return sdf.toString()
  }
}

/**
 * Factory to create a Common instance for a given riot component
 *
 * @param riot
 * @returns {Common}
 */
export function newCommon(riot) {
  return new Common(riot)
}

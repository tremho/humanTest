
/*
Todo: look into the SemVer class I did for OpenCar
 */

class SemVer {
    private major:number;
    private minor:number;
    private revision: number;
    private patch: number;
    private release: string;
    private comment: string;

    public static fromString(svString:string): SemVer {
        try {
            const parts = svString.split('.', 4)
            const maj = parseInt(parts[0])
            const min = parseInt(parts[1])
            const rev = parseInt(parts[2])
            let patch = parts[3]
            let release, comment;
            let ci = patch.indexOf('+')
            if (ci !== -1) {
                comment = patch.substring(ci + 1)
                patch = patch.substring(0, ci)
            }
            let ri = patch.indexOf('-')
            if (ri !== -1) {
                release = patch.substring(ri + 1)
                patch = patch.substring(0, ri)
            }
            const patchNum = parseInt(patch)
            return new SemVer(maj, min, rev, patchNum, release, comment)
        } catch(e) {
            console.error(`Error parsing SemVer string ${svString}`,e)
        }
    }
    constructor(stringOrMaj:string | number, min?:number, rev?:number, patch?:number, release?:string, comment?:string) {
        if(typeof stringOrMaj === 'string') {
            return SemVer.fromString(stringOrMaj as string)
        }
        this.major = stringOrMaj as number;
        this.minor = min;
        this.revision = rev;
        this.release = release;
        this.comment = comment;
    }
}

const bindings = {
    up: {

    },
    down: {

    }
}

class Binding {

    private model:object;
    private direction:string;
    private section:string;
    private prop: string;
    public onChange:any

    constructor(model:object, direction:string, section:string, prop:string, changeFn:any) {
        this.model = model;
        this.direction = direction;
        this.section = section;
        this.prop = prop;
        this.onChange = changeFn;
    }

    public update(prop, value) {
        this.model[this.section][prop] = value;
    }

}

// ui layer registers a binding.
// type may be 'readWrite' (default), 'read' or 'write'
// read is model=> ui, write is ui=> model
function bind(model:object, section:string, prop:string, onChange:any, type?:string,) {

    // handle nested section
    const sp = section.split('.')
    while(sp.length > 1) {
        let spn = sp.shift();
        model = model[spn]
    }
    if(type !== 'write') {
        // anything model announces to UI
        // this is one-to-many so we need an array
        if(!bindings.up[section]) bindings.up[section] = []
        bindings.up[section].push(new Binding(model,'up', section, prop, onChange))
    }
    if(type !== 'read') {
        // anything UI announces to Model
        // this is many-to-one so, one will do.
        if(!bindings.down[section]) {
            bindings.down[section] = new Binding(model,'down', section, prop, onChange)
        }
    }
}

// broadcast to UI
function announce(section:string, prop:string, value:any, old?:any) {
    // find bindings for section name, prop
    const bnds = bindings.up[section]
    if(bnds) bnds.forEach(bnd => {
        // communicate value to ui layer
        bnd.onChange(prop, value, old)
    })
}

// to model
function toModel(section:string, prop:string, value:any) {
    // find the downward binding for section name, prop
    const bnd = bindings.down[section]
    bnd.update(prop, value)
}

function proxySection(name:string, props:object) {
    const proxy = new Proxy(props, {
        get: function (obj, prop, receiver) {
            return obj[prop]
        },
        set: function (obj, prop, value, receiver): boolean {
            let old = obj[prop];
            obj[prop] = value;
            announce(name, prop as string, value, old)
            return true;
        }
    })
    return proxy;
}

export class AppModel {

    private model:object = {
    }

    public addSection(name, props) {
        this.model[name] = proxySection(name, props)
    }

    public bind( section:string, prop:string, onChange:any, type?:string) {
        bind(this.model, section, prop, onChange, type)
    }

    public setBind(bindPath:string, value:any) {
        // console.log('update bindPath', bindPath, value)
        const p = bindPath.split('.')
        toModel(p[0], p[1], value)
    }

    // path accessors probably not useful anymore...
    private accessProperty(path) {
        let parts = path.split('.')
        let obj = this.model;
        let i = 0;
        if(parts[0] === 'root') i++;
        while(i < parts.length-1) {
            if(typeof obj[parts[i]]=== 'object') {
                obj = obj[parts[i++]]
            } else {
                console.error(`Invalid model path ${path} at "${parts[i]}"`)
                console.error(`Invalid model path at ${parts.slice(0, i).join('.')}`);
                break;
            }
        }
        return obj
    }

    getAtPath(path:string):any {
        const propObj = this.accessProperty(path)
        const prop = path.substring(path.lastIndexOf('.')+1)
        return propObj[prop]
    }

    setAtPath(path:string, value:any, force?:boolean) {
        const propObj = this.accessProperty(path)
        const prop = path.substring(path.lastIndexOf('.')+1)
        if(!force) {
            if(typeof propObj[prop] !== typeof value) {
                const e = TypeError(`Attempt to set model property ${path} to ${typeof value} ${value} when existing type is ${typeof propObj[prop]}`)
                throw e
            }
        }
        propObj[prop] = value;
    }
}
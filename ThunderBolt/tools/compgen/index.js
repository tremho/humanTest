
const fs = require('fs')
const path = require('path')

let toolName, argList;

async function parseCommandLine() {
  return new Promise(resolve => {
    const args = process.argv.slice(0)
    const toolLaunch = args[1].substring(args[1].lastIndexOf('/tools/') + 7)
    toolName = toolLaunch.split('/')[0]
    if(args[2] === 'interactive') {
      interactive().then(a => {
        argList = a;
        resolve()
      })
    } else {
      argList = args.slice(2)
      resolve()
    }
  })
}
function usage() {
  console.log(toolName + ' usage:\n')
  console.log("Generate a Component stub (in src/components/global/<component-name> by default) ")
  console.log('invoking with single parameter "interactive" will bring up interactive prompts')
  console.log(' <component-name> [options]')
  console.log(' --help           print this help')
  console.log(' --scope <name>   specify scope directory (default is "global")')
  console.log(' --folder <name>  specify folder to place component (default is <compnent-name>)')

  process.exit(1)

}
async function interactive() {
  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let compName = '';
  let scope, folder;

  return new Promise(resolve => {
  const q1 = `component name? [${compName}] `

  rl.question(q1, (answer1) => {
    compName = answer1;
    const q2 = `scope? [global] `
    rl.question(q2, (answer2) => {
      scope = answer2.trim()
      const q3 = `folder? [${compName}] `
      rl.question(q3, (answer3 => {
        folder = answer3.trim()
        rl.close();
        argList = [compName]
        if (scope) {
          argList.push('--scope')
          argList.push(scope)
        }
        if (folder) {
          argList.push('--folder')
          argList.push(folder)
        }
        resolve(argList);
      }))
    })
  });
})

}


/// ---------------------

async function main () {
  await parseCommandLine()
  if (!argList.length || argList.indexOf('--help') !== -1) {
    usage();
  }

  const compName = argList[0]

  const si = argList.indexOf('--scope')
  const fi = argList.indexOf('--folder')

  let scope = 'global'
  let folder = compName;

  if (si !== -1) {
    if (argList[si].indexOf('=') !== -1) {
      scope = argList[si].split('=')[1]
    } else {
      scope = argList[si + 1]
    }
  }
  if (fi !== -1) {
    if (argList[fi].indexOf('=') !== -1) {
      folder = argList[fi].split('=')[1]
    } else {
      folder = argList[fi + 1]
    }
  }

  const root = path.resolve(path.join(__dirname, '..', '..'))
  const genPath = path.join(root, 'src', 'components', scope, folder)
  const genFile = path.join(genPath, compName + ".riot")
  console.log('will generate to ', genFile)

  if(!fs.existsSync(genPath)) fs.mkdirSync(genPath)

  const contents =
`
<${compName}>
    <div>
        ${compName} stub
    </div>
    <style>    
    </style>
    <script>
        import {newCommon} from '../../Common';
        let cm;
        export default {
          state: {},
          bound: {},
          onBeforeMount(props, state) {
            cm = newCommon(this)
          },    
          onMounted(props, state) {
            console.log(this.root.tagName, 'onMounted', props, state)
            cm.bindComponent()
          },
          onBeforeUpdate(props, state) {              
          },
          onUpdated(props, state) {              
          },
          onBeforeUnmount(props, state) {              
          },
          onUnmounted(props, state) {              
          }
        }   
    </script>
</${compName}>    
`
  fs.writeFileSync(genFile, contents)
}
main()

import * as riot from 'riot'
// import App from './scratch-app.riot'
import App from './app.riot'
import AppCore from './app-core/AppCore'
import registerGlobalComponents from './register-global-components'

console.log('Running under Riot', riot.version)
console.log(__dirname)

console.log('registering components...')
// register
registerGlobalComponents()

// console.log('mounting app...')

// mount all the global components found in this page
riot.mount('[data-riot-component]')
const mountApp = riot.component(App)
const coreApp = new AppCore()

let app;
console.log('prepping app...')

coreApp.requestMessages()
coreApp.setupUIElements().then(() => {
  console.log('starting app...')
  app = mountApp( document.getElementById('root'), { app: coreApp } )
})



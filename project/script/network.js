import { wingAPI } from "../../WhiteStudio/src/script/wingAPI/wingAPI.js"

(async () => {


    
const wing = new wingAPI()
await wing.connect('ws://localhost:4000')

const n = Math.floor(Date.now())

wing.signup(`USER:${n}`,'1234')


wing.signupOk(()=>{
    wing.login(`USER:${n}`,'1234')    
})

wing.loginOk(()=>{
    wing.joinGroup('daehogang')
    wing.leftGroup('daehogang')

    wing.send('ping',{})
    
})

wing.recv('pong',(data)=>{
    console.log('asd')  
})





})();
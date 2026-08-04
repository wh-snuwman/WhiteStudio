import { object } from '../object.js';
import {LogSet} from './Log.js'

export class wingAPI {
    constructor() {
        this.log = new LogSet()
        this.url = '';
        // this.recvFn  = () =>{};

        this.recvFn = {}

        this.errorFn = () =>{};
        this.closeFn = () =>{};
        this.startFn = () =>{};

        this.loginFn = () =>{};
        this.signupFn = () =>{};

        this.isManualClose = false;
        this.isOpen = false;
        this.openPromise = null;
        this.useLog = false;
        this.nickname = null;
        this.isLogin = false;
        // this.nickname = ''
    }

    async connect(addr){
        this.url = addr;
        
        if (this.isOpen || this.openPromise !== null){
            this.log.Warn('이미 서버에 연결 되었습니다! '+ this.url)
            return;
        }

        this.openPromise = new Promise((resolve,reject) => {
            this.websc = new WebSocket(this.url);
            this.websc.onopen = (e) => {this.isOpen = true;this._openInit(e);this.startFn();resolve();};
            this.websc.onerror = (e) => {this.isOpen = false;this.errorFn(e);resolve(e);};
            this.websc.onclose = () => {this.isOpen = false;this.closeFn();this._closeSet()};
            this.websc.onmessage = (e) => this.message(e);
                
        })
        await this.openPromise
    }

    disconnect(){
        if (this.websc && this.websc.readyState == WebSocket.OPEN){
            this.log.Info('접속종료 요첨됨..')
            this.isManualClose = true;
            this.websc.close()
            
        }
    }
    
    _openInit(e){
        this.log.Info(`서버에 연결됨: ${this.url}`)
        this.isOpen = true
    }

    start(fn){
        this.startFn = fn
    }
    
    _closeSet(){
        this.isOpen = false
        if (this.isManualClose){
            this.log.Info('연결종료')
        } else {
            this.log.Error('비정상적으로 연결종료')
        }

    }

    close(fn){
        this.closeFn = fn

    }

    loginOk(fn){
        this.loginFn = fn
    }
    
    signupOk(fn){
        this.signupFn = fn
    }

    error(fn){
        this.errorFn = fn
    }

    recv(code,fn){
        this.recvFn[code] = fn;
    }

    _isSysMsg(msg) {
        return msg.length > 5 && msg.startsWith('wing:');
    }
        
    _SysMsgEdit(msg) {
        return msg.slice(5);
    }

    message(recvdata){
        const msgLoads = JSON.parse(recvdata.data)
        const CODE = msgLoads.code
        const DATA = msgLoads.data

        if (this.recvFn){
            if (this._isSysMsg(CODE)){
                const CODE_SYS = this._SysMsgEdit(CODE)
                
                if (CODE_SYS == 'signup'){
                    if (DATA.signup){
                        this.log.Info("가입완료. 로그인 가능")
                        this.signupFn()
                    } else {
                        this.log.Info("가입실패. 비밀번호가 너무 짧거나(4글자 미만) 중복닉네임 입니다.")
                    }
                    
                } else if (CODE_SYS == 'login'){
                    if (DATA.login){
                        this.log.Info("로그인완료:" + DATA.nickname)
                        this.nickname = DATA.nickname
                        this.isLogin = true
                        this.loginFn()
                    } else {
                        this.log.Info("로그인 실패. 계정이 없거나 비밀번호가 틀려렸습니다.")
                    }

                } else if (CODE_SYS == 'Jgroup'){
                    if (DATA.state == 'success'){
                        this.log.Info(`그룹참가 완료 ${DATA.name}`)
                    } else {
                        this.log.Info("그룹참가 실패")
                    }
                } else if (CODE_SYS == 'Lgroup'){
                    // console.log(DATA)
                    // console.log('asd')
                    if (DATA.state == 'success'){
                        this.log.Info(`그룹탈퇴 완료`)
                    } else {
                        this.log.Info("그룹탈퇴 실패")
                    }
                }
                
                return true;
            }
            if (Object.keys(this.recvFn).includes(CODE)){
                this.recvFn[CODE](DATA)
            } else {
                this.log.Warn(`recv function is not found : ${CODE}`)
            }

        }
    }
    
    send(code,data){
        if(!(this.websc && this.websc.readyState === WebSocket.OPEN)){
            return false;
        }
        this.websc.send(JSON.stringify({
            'code' : code,
            'data' : data
        }));

    }

    signup(nick,pw){
        if(!(this.websc && this.websc.readyState === WebSocket.OPEN)) return false;
        this.send('wing:signup',{'nickname':nick,'password':pw})
    }

    login(nick,pw){
        if(!(this.websc && this.websc.readyState === WebSocket.OPEN)) return false;
        this.send('wing:login',{'nickname':nick,'password':pw})
    }

    joinGroup(group){
        if (this.isLogin){  
            this.send("wing:Jgroup",{'name':group})
            
            return true
        } else {
            this.log.Info('로그인후 사용가능')
            return false
        } 
    } 

    leftGroup(group){
        if (this.isLogin){  
            this.send("wing:Lgroup",{})
            return true
        } else {
            this.log.Info('로그인후 사용가능')
            return false
        } 
    } 

    
}
import {log} from '../Log.js'

export class wingAPI {
    constructor() {
        this.url = '';
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
        this.password = null;
        this.isLogin = false;

        this.sessionId = '';
    }

    async connect(addr){
        this.url = addr;
        
        if (this.isOpen || this.openPromise !== null){
            log.Warn('이미 서버에 연결 되었습니다! '+ this.url)
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
            log.Info('접속종료 요첨됨..')
            this.isManualClose = true;
            this.websc.close()
            
        }
    }
    
    _openInit(e){
        log.Info(`서버에 연결됨: ${this.url}`)
        this.isOpen = true
    }

    start(fn){
        this.startFn = fn
    }
    
    _closeSet(){
        this.isOpen = false
        if (this.isManualClose){
            log.Info('연결종료')
        } else {
            log.Error('비정상적으로 연결종료')
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
                        log.Info("가입완료. 로그인 가능")
                        this.signupFn()
                    } else {
                        log.Info("가입실패. 비밀번호가 너무 짧거나(4글자 미만) 중복닉네임 입니다.")
                    }
                    
                } else if (CODE_SYS == 'login'){
                    if (DATA.login){
                        log.Info("로그인완료:" + DATA.nickname)
                        this.nickname = DATA.nickname
                        this.sessionId = DATA.sessionId
                        this.isLogin = true
                        this.loginFn()
                    } else {
                        log.Info("로그인 실패. 계정이 없거나 비밀번호가 틀려렸습니다.")
                    }

                } else if (CODE_SYS == 'Jgroup'){
                    if (DATA.state == 'success'){
                        log.Info(`그룹참가 완료 ${DATA.name}`)
                    } else {
                        log.Info("그룹참가 실패")
                    }
                } else if (CODE_SYS == 'Lgroup'){
                    // console.log(DATA)
                    // console.log('asd')
                    if (DATA.state == 'success'){
                        log.Info(`그룹탈퇴 완료`)
                    } else {
                        log.Info("그룹탈퇴 실패")
                    }
                }
                
                return true;
            }
            if (Object.keys(this.recvFn).includes(CODE)){
                this.recvFn[CODE](DATA)
            } else {
                log.Warn(`recv function is not found : ${CODE}`)
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
            this.send("wing:Jgroup",{'group':group,'nickname':this.nickname,'sessionId':this.sessionId})
            
            return true
        } else {
            log.Info('로그인후 사용가능')
            return false
        } 
    } 

    leftGroup(group){
        if (this.isLogin){  
            this.send("wing:Lgroup",{'nickname':this.nickname,'sessionId':this.sessionId})
            return true
        } else {
            log.Info('로그인후 사용가능')
            return false
        } 
    } 

    
}
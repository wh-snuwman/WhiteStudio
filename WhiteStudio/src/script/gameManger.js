import { random } from "./random.js";
import { core } from "./core.js"
import { eventManger } from './eventManger.js'
import { cameraManager } from './cameraManager.js'
import { imageObject } from './imageObject.js'
import { videoObject } from './object.js'
import { textObject } from './textManager.js'
import { object } from './object.js'



export class gametManager {
    constructor(){
        this.id = 'display-canvas'
        this.path_stylesheet = './WhiteStudio/src/style/style.css'
        this.path_icon = './WhiteStudio/src/icon/default.ico'
        
        document.head.insertAdjacentHTML('afterbegin', `
        <link rel="stylesheet" href="${this.path_stylesheet}">
        <link rel="icon" href="${this.path_icon}">
        `);
        
        document.body.insertAdjacentHTML('afterbegin',`
        <canvas id="${this.id}"></canvas>
        `)

        this.defaultDisplaySize = [1920,1080]
        this.canvas = document.getElementById(this.id)
        this.canvas.width = innerWidth
        this.canvas.height = innerHeight
        this.canvas.style.margin = 0
        this.canvas.style.padding = 0
        this.canvas.style.cssText = `
            display: block;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100vw;
            height: 100vh;
            z-index: -1;
            touch-action: none;
        `;
        this.app = new core(this.canvas);
        this.textCanvas = null;
        this.ctx = null;
        this.autoResize = false;
        this.dpr = 1;
        this.width = 0;
        this.height = 0;
        
        this.updatefunc = function(){};
        this.endLoopfunc = function(){};
            
        this.screenRatio = (this.width / this.defaultDisplaySize[0]);
        this.sceneFunc = {}
        this.nowScene = ''
        this.sceneChangeDetect = false

        this.sysImg = null
        this.groupData = {}
        this.reserveData = {}
        this.flagData = []
        this._textCanvas = null
        this.objectList = []
        this.resizeDisplay()
        window.renderZindex = []

        this.EventManger = new eventManger(this)
        this.camera = new cameraManager(this)
        
        window.addEventListener('resize',()=>{
            this.resizeDisplay()
        })
        this._update()

        this.keyMapping = {
            'KeyA': 'a', 'KeyB': 'b', 'KeyC': 'c', 'KeyD': 'd', 'KeyE': 'e',
            'KeyF': 'f', 'KeyG': 'g', 'KeyH': 'h', 'KeyI': 'i', 'KeyJ': 'j',
            'KeyK': 'k', 'KeyL': 'l', 'KeyM': 'm', 'KeyN': 'n', 'KeyO': 'o',
            'KeyP': 'p', 'KeyQ': 'q', 'KeyR': 'r', 'KeyS': 's', 'KeyT': 't',
            'KeyU': 'u', 'KeyV': 'v', 'KeyW': 'w', 'KeyX': 'x', 'KeyY': 'y','KeyZ': 'z',

            // 'Space': ' ',
            'Digit1': '1',
            'Digit2': '2',
            'Digit3': '3',
            'Digit4': '4',
            'Digit5': '5',
            'Digit6': '6',
            'Digit7': '7',
            'Digit8': '8',
            'Digit9': '9',
            'Digit0': '0',
            "Semicolon" : ';',
            "Equal" : '=',
            "Comma" : ',',
            "Minus" : '-',
            "Period": '.',
            "Slash": "/",
        };
        
        this.shiftkeyMapping = {
            'Digit1': '!',
            'Digit2': '@',
            'Digit3': '#',
            'Digit4': '$',
            'Digit5': '%',
            'Digit6': '^',
            'Digit7': '&',
            'Digit8': '*',
            'Digit9': '(',
            'Digit0': ')',
            "Semicolon" : ':',
            "Equal" : '+',
            "Comma" : '<',
            "Minus" : '_',
            "Period": '>',
            "Slash": "?",
        }

    }



    getDownKey(key){
        return this.EventManger.down_key[key]
    }


    getPressKey(key){
        return this.EventManger.press_key[key]
    }


    keyBoardInput() {
        for (const code in this.keyMapping) {
            if (this.EventManger.down_key[code]) {
                let key = this.keyMapping[code] 
                if (this.EventManger.press_key['ShiftLeft']){
                    
                    if (code in this.shiftkeyMapping){
                        key = this.shiftkeyMapping[code]
                    } else {
                        key = key.toUpperCase()
                    }

                }
                return key;
            }
        }
        return null;
    }


    getMouse(){
        return {
            click_l:this.EventManger.click_l,
            click_r:this.EventManger.click_r,
            press_r:this.EventManger.press_r,
            press_l:this.EventManger.press_l,
            mousepos:this.EventManger.mousepos,
            wheel:this.EventManger.wheel,
        }
    }

    getTouch(){
        return {
            touchpos:this.EventManger.touchpos,
        }
    }

    resizeDisplay(){
        this.app.resizeCanvas()
        this.dpr = this.app.dpr
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.screenRatio = (this.width / this.defaultDisplaySize[0]);

        for (let obj of this.objectList){
            obj.ratioSet(this.screenRatio)
        }
    }



    async init(size){
        this.sysImg = await this.imgLoad('./WhiteStudio/src/img/sysImg.png')
        this.defaultDisplaySize = size
    }

    last(func){
        this.endLoopfunc = func;
    }

    update(func){
        this.updatefunc = func;
    }

    _update() {
        let lastTime = performance.now();

        const loop = (now) => {

            const dt = Math.min((now - lastTime) / 1000, 0.05); // 초 단위, 급격한 스파이크는 클램프
            lastTime = now;

            for (let obj of this.objectList){
                obj._updateInit()
            }

            this.updatefunc(dt)
            for (let key in this.sceneFunc){
                if (this.nowScene === key){
                    this.sceneFunc[key](dt)
                    break
                }
            }
            this.endLoopfunc(dt)


            
            const renderList = []
            for (let obj of this.objectList){
                if (obj.isRender === true){
                    renderList.push(obj)
                }
            }

            renderList.sort((a, b) => (a.zIndex+a.zIndexAdj) - (b.zIndex+b.zIndexAdj))
            for (let obj of renderList){
                if (obj instanceof object){
                    this._renderObject(obj)
                }
                else if (obj instanceof textObject){
                    this._renderTextObj(obj)
    
                }
                else if (obj instanceof videoObject){
                    this._renderVideoObj(obj)
                }
                else {
                    console.error('error')
                }
            }


            this.sceneChangeDetect = false
            this.EventManger.resetState()
            

            const len = this.objectList.length

            for (let i=len;i>=0;i--){
                const obj = this.objectList[i]
                if ((obj instanceof object || obj instanceof textObject)&& obj.remove === 1){
                    this.objectList.splice(i,1)

                }
            }
            
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }


    object(img, pos, size = null, vertex = null, texcoord = null){

        const obj = new object(img,pos,size,vertex,texcoord)
        obj.ratioSet(this.screenRatio)
        this.objectList.push(obj)
        return obj
    }



    removeObject(obj){
        this.objectList.splice(this.objectList.indexOf(obj),1)
    }




    rect(pos,size,color=[0,0,0,255]){
        const obj = this.object(this.sysImg,pos,size)
        obj.fillColor = color
        return obj
    }

    line(pos1,pos2_,thickness=1,color=[0,0,0,255]){
        const pos2 = pos2_
        const distance =  this.distanceGet(pos1,pos2)
        let obj = this.object(this.sysImg,[pos1[0],pos1[1]],[thickness,distance])
        const dx = pos2[0] - pos1[0];
        const dy = pos2[1] - pos1[1];
        const radian = Math.atan2(dy, dx);
        const degree = (radian * (180 / Math.PI))- 90;
        obj.rotate(degree,'default',[pos1[0]+thickness/2,pos1[1]+thickness/2])
        obj.fillColor = color
        return obj
    }

    
    distanceGet(pos1,pos2){
        return Math.sqrt((pos2[0] - pos1[0])**2 + (pos2[1] - pos1[1])**2)
    }


    angleGet(pos1, pos2) {
        const dx = pos2[0] - pos1[0];
        const dy = pos2[1] - pos1[1];
        
        let degree = Math.atan2(dy, dx) * (180 / Math.PI);
        if (degree < 0) degree += 360;
        
        return degree;
    }
 
    getDelta(angleDegree, speed = 1) {
        const radian = angleDegree * (Math.PI / 180); // 도 → 라디안 변환
        
        const dx = Math.cos(radian) * speed;
        const dy = Math.sin(radian) * speed;
        
        return { dx, dy };
    }

    fill(color=Array){
        const r = color[0]
        const g = color[1]
        const b = color[2]
        const a = color[3]
        if (this.ctx != null && this.textCanvas != null) {this.ctx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height)}
        if (r <= 1 && g <= 1 && b <= 1 && a <= 1){
            this.app.clear(
                r,g,b,a
            );
        } else {
            this.app.clear(
                r/255,g/255,b/255,a/255
            );
        }
    }

    async imgLoad(path){
        const imgObj = new imageObject(this.app)
        await imgObj.load(path)
        return imgObj
    }
    

    async videoLoad(path){
        const videoObj = new videoObject(this.app)
        await videoObj.load(path)
        videoObj.ratioSet(this.screenRatio)
        this.objectList.push(videoObj)
        return videoObj
    }

    sceneChange(scene){
        this.nowScene = scene;
        this.sceneChangeDetect = true;
    }


    scene(wantedScene,func){
        // if (this.nowScene === wantedScene){
        this.sceneFunc[wantedScene] = func
        // }
    }


    _renderTextObj(tobj){
        if (!tobj.isRender) return
        
        this.app.text(
            tobj.text,
            [tobj.renderX,tobj.renderY],
            tobj.size,
            tobj.color,
            tobj.font,
            tobj.align
        )
    }

    _renderObject(obj){
        if (!obj.isRender) return

        const img = obj.imgObj ? obj.imgObj.img : null

        this.app.drawImage(
            img,
            obj.renderX,
            obj.renderY,
            obj.renderW,
            obj.renderH,
            obj.scaledVertex,
            obj.texcoord,
            obj.fillColor,
            obj.alpha !== undefined ? obj.alpha : 255,
            obj.flip,
            obj.blur
        )

    }

    _renderVideoObj(vobj){
        if (!vobj.isRender) return
        this.app.drawImage(
            vobj.video,
            vobj.renderX,
            vobj.renderY,
            vobj.renderW,
            vobj.renderH,
            vobj.scaledVertex,
            vobj.texcoord,
            vobj.fillColor,
            vobj.alpha !== undefined ? vobj.alpha : 255,
            vobj.flip
        )
    }


    flag(name,func){
        if (this.flagData.includes(name)) return
        this.flagData.push(name)
        func()
    }


    reserve(name,waitTime,func,endTrigger=false){
        if (name in this.reserveData) {
            this.reserveData[name].end = Boolean(endTrigger)
            const data = this.reserveData[name]
            if (data.time < Date.now()){
                if (data.end){
                    data.f = null
                } else {
                    data.f()
                }
            }
        }
        else {
            this.reserveData[name] = {time:waitTime*1000+Date.now(),f:func,end:Boolean(endTrigger)}
        }
    }

    async font(name,path){
        const font = new FontFace(name, `url(${path})`);
        await font.load();
        document.fonts.add(font);
    }
}


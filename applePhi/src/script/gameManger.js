import { random } from "./random.js";
import { core } from "./core.js"
import { eventManger } from './eventManger.js'
import { cameraManager } from './cameraManager.js'
import { imageObject } from './imageObject.js'

function defualtVertexCalc(img,pos,size){
    const w = size ? size[0] : img.width;
    const h = size ? size[1] : img.height;
    const v = [
        pos[0], pos[1], 
        pos[0] + w, pos[1], 
        pos[0], pos[1] + h, 
        pos[0], pos[1] + h, 
        pos[0] + w, pos[1], 
        pos[0] + w, pos[1] + h
    ];
    return v
}


class object {
    constructor(imgObj, pos, size = null, vertex = null, texcoord = null){
        this.app= null
        this.imgObj = imgObj
        this.img = imgObj.img
        this.x = pos[0]
        this.y = pos[1]
        this.pos = pos
        this.size = size || [imgObj.width,imgObj.height] || null
        this.width = this.size ? this.size[0] : null
        this.height = this.size ? this.size[1] : null
        // this.height = this.size[1]
        this.w = this.width
        this.h = this.height
        this.vertex = vertex || defualtVertexCalc(this.img,this.pos,this.size)
        this.angle = 0
        this.name = null
        this.texcoord = texcoord
        this.fillColor = null
        this.alpha = 255
        this.screenRatio = 1
        this.renderData = null
        this.isRender = true

        this.renderX = null
        this.renderY = null
        this.renderW = null
        this.renderH = null
        this.scaledVertex = null
        this.zIndex = 0

        this.cameraApply = false

    }

    init(app){
        this.app = app
    }

    ratioSet(ratio){
        this.screenRatio = ratio
    }


    _synchronization_pos(){
        this.pos = [this.x,this.y]
    }
    _synchronization_size(){
        this.size = [this.width,this.height]
        this.w=  this.width
        this.h = this.height
    }

    move(offset=Array){
        this.x += offset[0]
        this.y += offset[1]
        for(let i = 0; i < this.vertex.length; i+=2){
            this.vertex[ i ] += offset[0]
            this.vertex[ i + 1 ] += offset[1]
        }
        this._synchronization_pos()
    }

    goto(pos=Array,mark='default'){
        let addX = pos[0] - this.x
        let addY = pos[1] - this.y 
        if (mark == 'center'){
            addX -= this.width/2 
            addY -= this.height/2
        }
        this.x +=  pos[0] - this.x
        this.y += pos[1] - this.y 
        for(let i = 0; i < this.vertex.length; i+=2){
            this.vertex[ i ] += addX
            this.vertex[ i + 1 ] += addY
        }
        this._synchronization_pos()
    }

    goCenter(pos){
        this.goto([(pos[0] - this.width)/2,(pos[1] - this.height)/2])
    }


    moveX(x){
        this.move([x,0])
    }

    moveY(y){
        this.move([0,y])

    }

    rotate(angle,mark="center",point=[0,0]){
        const rad = (angle) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const rotated = [];
        let cx = 0;
        let cy = 0;

        if (mark === 'center') {
            cx = this.x + this.width / 2;
            cy = this.y + this.height / 2;
        } 
        else if (mark === 'point') {
            cx = point[0];
            cy = point[1];
        }
        else if (mark === 'default') {
            cx = this.x;
            cy = this.y;
        }
        else {
            console.error('worng rotate mark')
        }

        for (let i = 0; i < this.vertex.length; i += 2) {
            const x = this.vertex[i] - cx;
            const y = this.vertex[i + 1] - cy;
            const rx = x * cos - y * sin + cx;
            const ry = x * sin + y * cos + cy;
            rotated.push(rx, ry);
        }
        this.vertex = rotated;
        this.angle += angle;
    }

    rotateSet(angle,mark='center',point=[0,0]){
        const targetAngle = angle - this.angle
        this.rotate(targetAngle,mark,point)
    }

    resize(size,mark){
        const temp_angle = this.angle;
        if (mark === 'center'){
            // const obj = {
            //     ...this,
            //     vertex: [...this.vertex]
            // };
            this.x += this.width/2
            this.y += this.height/2

            this.width = size[0]
            this.height = size[1]
            this.x -= this.width/2
            this.y -= this.height/2
            

            const x1 = this.x;
            const y1 = this.y;
            const x2 = this.x + this.width;
            const y2 = this.y + this.height;
            this.vertex = [x1, y1,x2, y1,x1, y2,x1, y2,x2, y1,x2, y2] 
        } 
        else if(mark === 'default'){
            this.width = size[0]
            this.height = size[1]
            const x1 = this.x;
            const y1 = this.y;
            const x2 = this.x + this.width;
            const y2 = this.y + this.height;
            this.vertex = [x1, y1,x2, y1,x1, y2,x1, y2,x2, y1,x2, y2]
        }
        else {
            console.error("worng resize mark");
        }

        this.angle = 0
        this.rotate(temp_angle);
        this._synchronization_pos()
        this._synchronization_size()
    }

    resizeBy(size,ratio,mark){
        this.resize([size[0]*ratio,size[1]*ratio],mark)
    }

    flip(what='hor'){
        if (what == 'hor'){
            for(let i=0; i<this.texcoord.length; i+=2){
                this.texcoord[i] = 1 - this.texcoord[i]
            }
        } else if (what == 'ver'){
            for(let i=0; i<this.texcoord.length; i+=2){
                othisbj.texcoord[i+1] = 1 - this.texcoord[i+1]
            }
        }
        this._synchronization_pos()
        this._synchronization_size()
    }

    getDistanceObj(otherObj,mark="center"){
        if (mark == 'center') {
            return Math.sqrt(((this.x+(this.width/2)) - (otherObj.x+(otherObj.width/2)))**2 + ((this.y+(this.height/2)) - (otherObj.y+(otherObj.height/2)))**2)

        } else {
            return Math.sqrt((this.x - otherObj.x)**2 + (this.y - otherObj.y)**2)
        }
    }

    isEncounterObj(otherObj) {
        return (
            otherObj.x < this.x + this.width &&
            otherObj.x + otherObj.width > this.x &&
            otherObj.y < this.y + this.height &&
            otherObj.y + otherObj.height > this.y
        );
    }

    isEncounterPos(pos){
        if (((this.renderX <= pos[0])  && (pos[0] <= this.renderX + this.renderW)) && ((this.renderY <= pos[1]) && (pos[1] <= this.renderY + this.renderH))) {          
            return true  
        }
        return false
    }

    isEncounterPos2(pos){
        if (((this.renderX <= pos[0])  && (pos[0] <= this.renderX + this.renderW)) && ((this.renderY <= pos[1]) && (pos[1] <= this.renderY + this.renderH))) {          
            return true  
        }
        return false
    }

    isSelect(){
        if (this.isEncounterPos2(this.EventManger.mousepos) && this.EventManger.click_l){
            return true
        }
        return false
    }

    _updateInit(){
        this.isRender = false
        this.renderX = this.x * this.screenRatio;
        this.renderY = this.y * this.screenRatio;
        this.renderW = this.width * this.screenRatio;
        this.renderH = this.height * this.screenRatio;
        this.scaledVertex = this.vertex ? this.vertex.map(v => v * this.screenRatio) : null;
    }


    render() {  
        if (!this.img) return;
        this.isRender = true
        this._synchronization_pos()
        this._synchronization_size()
    }
    
}

export class gametManager {
    constructor(){
        this.id = 'display-canvas'
        this.path_stylesheet = './applePhi/src/style/style.css'
        this.path_icon = './applePhi/src/icon/default.ico'
        
        document.head.insertAdjacentHTML('afterbegin', `
        <link rel="stylesheet" href="${this.path_stylesheet}">
        <link rel="icon" href="${this.path_icon}">
        `);
        document.body.insertAdjacentHTML('afterbegin',`
        <canvas id="${this.id}"></canvas>
        `)
        
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
            
        this.screenRatio = (this.width / 1920);
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
    }



    getDownKey(key){
        return this.EventManger.down_key[key]
    }


    getPressKey(key){
        return this.EventManger.press_key[key]
    }




    resizeDisplay(){
        this.app.resizeCanvas()
        this.dpr = this.app.dpr
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.screenRatio = (this.width / 1920);

        for (let obj of this.objectList){
            obj.ratioSet(this.screenRatio)
        }
    }



    async init(size){
        this.sysImg = await this.imgLoad('applePhi/src/img/sysImg.png')
    }

    last(func){
        this.endLoopfunc = func;
    }

    update(func){
        this.updatefunc = func;
    }

    _update() {
        const loop = () => {
            for (let obj of this.objectList){
                obj._updateInit()
            }

            this.updatefunc()
            for (let key in this.sceneFunc){
                if (this.nowScene === key){
                    this.sceneFunc[key]()
                    break
                }
            }
            this.endLoopfunc()

            this.objectList.sort((a, b) => a.zIndex - b.zIndex)

            for (let obj of this.objectList){
                if (obj.isRender){
                    this._render(obj)
                }
            }

            this.sceneChangeDetect = false
            this.EventManger.resetState()
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }


    object(img, pos, size = null, vertex = null, texcoord = null){
        const obj = new object(img,pos,size,vertex,texcoord)
        obj.init(this.app)
        obj.ratioSet(this.screenRatio)
        this.objectList.push(obj)
        return obj
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

    sceneChange(scene){
        this.nowScene = scene;
        this.sceneChangeDetect = true;
    }


    scene(wantedScene,func){
        if (this.nowScene === wantedScene){
            this.sceneFunc[wantedScene] = func
        }
    }


    _render(obj){
        if (!obj.isRender) return

        this.app.drawImage(
            obj.img,
            obj.renderX,
            obj.renderY,
            obj.renderW,
            obj.renderH,
            obj.scaledVertex,
            obj.texcoord,
            obj.fillColor,
            obj.alpha !== undefined ? obj.alpha : 255
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


    text(text, pos = [0, 0], size = '20px', color = 'black', font = null, align = 'left') {
        this.app.text(text,pos,size,color,font,align)
    }
}

export class movementExtend{
    constructor(studio){
        this.studio = studio


        this.left = 0
        this.right = 0
        this.up = 0
        this.down = 0

        this.speed = 15
        this.smooth = 0.8

        this.mx = 0
        this.mY = 0
    }

    setState(speed,smooth){
        if (speed === null){
            speed=this.speed
        }
        if (smooth === null){
            smooth=this.smooth
        }
        this.speed = speed
        this.smooth = smooth
    }


    move(reverse=false){ 
        if (this.studio.getPressKey('KeyA')){
            this.left =  this.speed
        } else {
            this.left = this.left * this.smooth
        }

        if (this.studio.getPressKey('KeyD')){
            this.right =  this.speed
        } else {
            this.right = this.right * this.smooth
        }

        if (this.studio.getPressKey('KeyW')){
            this.up =  this.speed
        } else {
            this.up = this.up * this.smooth
        }

        if (this.studio.getPressKey('KeyS')){
            this.down =  this.speed
        } else {
            this.down = this.down * this.smooth
        }



        this.mx  = -this.left + this.right
        this.my  = this.down - this.up

        if (reverse){
            return [-this.mx,-this.my]

        }
        return [this.mx,this.my]
    }

    get(reverse=false){
        if (reverse){
            return [-this.mx,-this.my]

        }
        return [this.mx,this.my]
    }
}
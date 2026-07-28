import { core } from "./core.js"

export class applePhi {
    constructor(id){

        document.head.insertAdjacentHTML('afterbegin', `
        <link rel="stylesheet" href="./applePhi/src/style/style.css">
        <link rel="icon" href="./applePhi/src/icon/default.ico">
        `);

        document.body.insertAdjacentHTML('afterbegin',`
        <canvas id="display-canvas"></canvas>
        `)

        const canvas_ = document.getElementById(id)
        canvas_.width = innerWidth
        canvas_.height = innerHeight
        canvas_.style.margin = 0
        canvas_.style.padding = 0
        canvas_.style.cssText = `
            display: block;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100vw;
            height: 100vh;
        `;
        this.canvas = canvas_;
        this.app = new core(this.canvas);
        this.textCanvas = null;
        this.ctx = null;
        this.autoResize = false;
        this.dpr = 1;
        this.width = 0;
        this.height = 0;
        this.settingList = {}
        this.screenRatio = (1920 / this.width);
        this.sceneFunc = {}
        this.docsImg = {}
        this.docsObj = {}
        this.mainLoopFunc = function(){};
        this.nowScene = ''
        this.sceneChangeDetect = false
        this.update()
        this.mousepos = [0,0]
        this.click_l = false
        this.click_r = false
        this.press_l = false
        this.press_r = false
        this.sysImg = null
        this.groupData = {}
        this.reserveData = {}
        this.flagData = []

        //
        this._textCanvas = null
        
        document.addEventListener('mousedown',(event) => {
            console.log(event)
            if (event.button == 0){
                this.click_l = true
                this.press_l = true
            }
            else if (event.button == 2){
                this.click_r = true
                this.press_r = true
            }
        })
        document.addEventListener('mouseup',(event) => {
            if (event.button == 0){
                this.press_l = false
            }
            else if (event.button == 2){
                this.press_r = false
            }
        })
        document.addEventListener('mousemove',(event) => {
            this.mousepos = [event.offsetX/this.screenRatio*this.dpr,event.offsetY/this.screenRatio*this.dpr]
        })
    }
    

    
    

    
    

    async quickObj(path=null,pos,size,color=[0,0,0,255]){
        let img;
        let obj;
        if(path == null){
            let img = this.sysImg;
            obj = this.object(img,pos,size)
            obj.fillColor = color
            
        } else {
            img = await this.imgLoad(path)
            obj = this.object(img,pos,size)
        }
        return obj
    }


    group(name,objList) {
        this.groupData[name] = objList
    }   

    groupMove(name,addPos){
        const g = this.groupGet(name)
        for(let key in g){
            const obj = g[key]
            this.move(obj,addPos)
        }
    }

    groupRotate(name,rotate,pos){
        const g = this.groupGet(name)
        for(let key in g){
            const obj = g[key]
            this.rotate(obj,rotate,'custom',pos)
        }
    }
    
    groupFunc(name,func){
        const g = this.groupGet(name)
        for(let key in g){
            const obj = g[key]
            func(obj,key)
        }
    }

    groupGet(name){
        return this.groupData[name]
    }

    // mainLoop(func){
    //     this.mainLoopFunc = func;
    // }

    // update() {
    //     const loop = () => {
    //         this.mainLoopFunc()
    //         for (let key in this.sceneFunc){
    //             this.sceneFunc[key]()
    //         }
            
    //         requestAnimationFrame(loop);
    //     };
    //     requestAnimationFrame(loop);
    // }

    // setting(name=String,value=Boolean){
    //     if (Object.hasOwn(this.settingList,name)){
    //         this.settingList[name] = value
    //     }
    // }


    

    textDisplay(id){
        this.textCanvas = document.getElementById(id);
        this.textCanvas.width = this.canvas.width;
        this.textCanvas.height = this.canvas.height;
        this.ctx = this.textCanvas.getContext('2d');
        this.resizeDisplay()
    }

    




    


    //#region 




    resizeDisplay(){
        this.app.resizeCanvas()
        this.dpr = this.app.dpr
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.screenRatio = (this.width / 1920);
        this.resizeTextCanvas(this.width,this.height)
    }

    
    // object(img, pos, size = null, vertex = null, texcoord = null){
    //     const w = size ? size[0] : img.width;
    //     const h = size ? size[1] : img.height;
        
    //     const v = vertex || [
    //         pos[0], pos[1], 
    //         pos[0] + w, pos[1], 
    //         pos[0], pos[1] + h, 
    //         pos[0], pos[1] + h, 
    //         pos[0] + w, pos[1], 
    //         pos[0] + w, pos[1] + h
    //     ];
    //     return { 
    //         img, x: pos[0], y: pos[1], width: w, height: h,
    //         vertex: v,
    //         angle: 0,
    //         name: '',
    //         texcoord: texcoord || [0,0, 1,0, 0,1, 0,1, 1,0, 1,1],
    //         fillColor: null,
    //         alpha: 255,
    //     };
    // }

    

    


    // fill(r,g,b,a=255){
    //     if (this.ctx != null && this.textCanvas != null) {this.ctx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height)}
    //     if (r <= 1 && g <= 1 && b <= 1 && a <= 1){
    //         this.app.clear(
    //             r,g,b,a
    //         );
    //     } else {
    //         this.app.clear(
    //             r/255,g/255,b/255,a/255
    //         );
    //     }
    // }


    distanceGet(pos1,pos2){
        return Math.sqrt((pos2[0] - pos1[0])**2 + (pos2[1] - pos1[1])**2)
    }



    

    


    rotate(obj,deg,mark="center",pos=[0,0]){
        const rad = (deg) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const rotated = [];
        let cx = 0;
        let cy = 0;
        if (mark === 'center') {
            cx = obj.x + obj.width / 2;
            cy = obj.y + obj.height / 2;
        } else if (mark === 'custom') {
            cx = pos[0];
            cy = pos[1];
        }
        for (let i = 0; i < obj.vertex.length; i += 2) {
            const x = obj.vertex[i] - cx;
            const y = obj.vertex[i + 1] - cy;
            const rx = x * cos - y * sin + cx;
            const ry = x * sin + y * cos + cy;
            rotated.push(rx, ry);
        }
        obj.vertex = rotated;
        obj.angle += deg;
        return obj;
    }

    // reSizeBy(obj_,ratio,mark='center'){
    //     const an = obj_.angle;
    //     if (mark == 'center'){
    //         const obj = {
    //             ...obj_,
    //             vertex: [...obj_.vertex]
    //         };
    //         obj_.width = obj_.width * ratio
    //         obj_.height = obj_.height * ratio
    //         obj_.x -= obj_.width/2
    //         obj_.y -= obj_.height/2
    //         obj_.x += obj.width/2
    //         obj_.y += obj.height/2
    //         const x1 = obj_.x;
    //         const y1 = obj_.y;
    //         const x2 = obj_.x + obj_.width;
    //         const y2 = obj_.y + obj_.height;
    //         obj_.vertex = [x1, y1,x2, y1,x1, y2,x1, y2,x2, y1,x2, y2]
            
    //     } else {
    //         const obj = {
    //             ...obj_,
    //             vertex: [...obj_.vertex]
    //         };
    //         obj_.width = obj_.width * ratio;
    //         obj_.height = obj_.height * ratio;
    //         const x1 = obj_.x;
    //         const y1 = obj_.y;
    //         const x2 = obj_.x + obj_.width;
    //         const y2 = obj_.y + obj_.height;
    //         obj_.vertex = [x1, y1,x2, y1,x1, y2,x1, y2,x2, y1,x2, y2]
    //     }
    //     obj_.angle = 0
    //     this.rotate(obj_,an);
    //     return obj_
    // }

    // reSize(obj_,size,mark){
    //     const an = obj_.angle;
    //     if (mark == 'center'){
    //         const obj = {
    //             ...obj_,
    //             vertex: [...obj_.vertex]
    //         };
    //         obj_.width = size[0]
    //         obj_.height = size[1]
    //         obj_.x -= obj_.width/2
    //         obj_.y -= obj_.height/2
    //         obj_.x += obj.width/2
    //         obj_.y += obj.height/2
    //         const x1 = obj_.x;
    //         const y1 = obj_.y;
    //         const x2 = obj_.x + obj_.width;
    //         const y2 = obj_.y + obj_.height;
    //         obj_.vertex = [x1, y1,x2, y1,x1, y2,x1, y2,x2, y1,x2, y2] 
    //     } else {
    //         obj_.width = size[0]
    //         obj_.height = size[1]
    //         const x1 = obj_.x;
    //         const y1 = obj_.y;
    //         const x2 = obj_.x + obj_.width;
    //         const y2 = obj_.y + obj_.height;
    //         obj_.vertex = [x1, y1,x2, y1,x1, y2,x1, y2,x2, y1,x2, y2]
    //     }

    //     obj_.angle = 0
    //     this.rotate(obj_,an);
    //     return obj_
    // }

    // rotateTo(obj_,deg,mark="center",pos=[0,0]){
    //     const targetDeg = deg - obj_.angle
    //     this.rotate(obj_,targetDeg)
    //     return obj_;
    // }


    
    // move(obj,pos=Array){
    //     obj.x += pos[0]
    //     obj.y += pos[1]
    //     for(let i = 0; i < obj.vertex.length; i+=2){
    //         obj.vertex[ i ] += pos[0]
    //         obj.vertex[ i + 1 ] += pos[1]
    //     }
    //     return obj;
    // }
 
    // moveX(obj,addX){
    //     obj.x += addX
    //     for(let i = 0; i < obj.vertex.length; i+=2){
    //         obj.vertex[ i ] += addX
    //     }
    //     return obj;
    // }

    // moveY(obj,addY){
    //     obj.y += addY
    //     for(let i = 0; i < obj.vertex.length; i+=2){
    //         obj.vertex[ i + 1 ] += addY
    //     }
    //     return obj;
    // }

    // goto(obj,pos=Array,mark='zero'){
    //     let addX = pos[0] - obj.x
    //     let addY = pos[1] - obj.y 
    //     if (mark == 'center'){
    //         addX -= obj.width/2 
    //         addY -= obj.height/2
    //     }
    //     obj.x +=  pos[0] - obj.x
    //     obj.y += pos[1] - obj.y 

    //     for(let i = 0; i < obj.vertex.length; i+=2){
    //         obj.vertex[ i ] += addX
    //         obj.vertex[ i + 1 ] += addY
    //     }
    //     return obj;
    // }

    
    // flip(obj,what='hor'){
    //     if (what == 'hor'){
    //         for(let i=0; i<obj.texcoord.length; i+=2){
    //             obj.texcoord[i] = 1 - obj.texcoord[i]
    //         }
    //     } else if (what == 'ver'){
    //         for(let i=0; i<obj.texcoord.length; i+=2){
    //             obj.texcoord[i+1] = 1 - obj.texcoord[i+1]
    //         }
    //     }
    // }

    //#endregion

    blitGroup(name) {
        const g = this.groupGet(name)
        for(let key in g){
            const obj = g[key]
            this.blit(obj)
        }
    }



    // blit(obj) {  
    //     if (!obj.img) return;
    //     const { img, x, y, width, height, vertex, texcoord, fillColor, alpha } = obj;
    //     const ratioMulp = this.screenRatio;
        
    //     const renderX = x * ratioMulp;
    //     const renderY = y * ratioMulp;
    //     const renderW = width * ratioMulp;
    //     const renderH = height * ratioMulp;
    //     const scaledVertex = vertex ? vertex.map(v => v * ratioMulp) : null;
    //     this.app.drawImage(
    //         img, 
    //         renderX, 
    //         renderY, 
    //         renderW, 
    //         renderH, 
    //         scaledVertex,
    //         texcoord, 
    //         fillColor,
    //         alpha !== undefined ? alpha : 255
    //     );
    }
        



    
}

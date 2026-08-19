import { random } from "./random.js";


class overlayObj{
    constructor(obj=null,adj=[0,0]){
        this.object = obj
        this.adj = adj
        
        // console.log(this.object)
    }
}




class tileObject {
    constructor(robj,hitbox,hor,ver,studio){
        this.studio = studio
        this.renderObj = robj
        this.renderObj.zIndex = -100000
        this.hitbox = hitbox
        this.horNum = hor
        this.verNum = ver
        this.chunkInnerId = []
        this.chunkId = []
        this.id = null
        this.tile = 0
        this.overlayObj = new overlayObj(
            this.studio.object(this.studio.sysImg,[0,0],[0,0]),[0,0]
        )
        this.isRenderOverlay = false
        this.isBlock = false
        
    }


    setImg(imgObj){
        if (!imgObj) return
        this.renderObj.imgObj = imgObj
    }



    move(offset=[0,0]){
        this.renderObj.move(offset)
        this.hitbox.move(offset)
    }

    setOverlay(obj,adj){
        this.overlayObj.object = obj
        this.overlayObj.adj = adj
    }

    getOverlayObject(){
        return this.overlayObj.object
    }


    render(){
        this.renderObj.render()
        if (this.isRenderOverlay){
            this.overlayObj.object.goto(this.renderObj.pos)
            this.overlayObj.object.zIndex = this.overlayObj.object.y
            this.overlayObj.object.move(this.overlayObj.adj)
            this.overlayObj.object.render()
        }
        
    }

}



export class tileManager{
    constructor(studio,size){
        this.studio = studio
        this.tile = []
        
        this.tileSize_Default = 160
        this.tileSize = size
        this.tileRatio = this.tileSize / this.tileSize_Default

        this.adjX = -this.tileSize * 1;
        this.adjY = -this.tileSize * 1;

        this.upKey=false
        this.leftKey=false
        this.downKey=false
        this.rightKey=false
        this.isMove=false

        this.moveR=0
        this.moveL=0
        this.moveU=0
        this.moveD=0
        this.moveX=0
        this.moveY=0
        this.moveRc=0
        this.moveLc=0
        this.moveUc=0
        this.moveDc=0


        this.updateFunc = ()=>{}
        this.switchFunc = ()=>{}
        this.mapReloadFunc = ()=>{}
        this.reloadFunc = ()=>{}

    }

    init(){
        this.tile = [];
        this.horTileCount = Math.floor(this.studio.defaultDisplaySize[0] / this.tileSize / this.studio.screenRatio) + 2
        this.verTileCount = Math.floor(this.studio.defaultDisplaySize[1] / this.tileSize) + 2

        for (let h=0; h<this.horTileCount; h++){
            for (let v=0; v<this.verTileCount; v++){
                const obj = this.studio.object(this.studio.sysImg,
                    [(h*this.tileSize),(v*this.tileSize)],
                    [this.tileSize,this.tileSize]
                )
                
                const _tileObj = new tileObject(obj,
                    this.studio.object(null,obj.pos,obj.size),
                    h,v,this.studio
                )
                this.tile.push(_tileObj);
            }
        }

        for (let tileObj of this.tile){
            this.reloadFunc(tileObj)
            this.mapReloadFunc(tileObj)
        }
        
    } 


    render(){
        for (let tileObj of this.tile){
            tileObj.render()
        }
    }
    

    move(offset){
        for (let tileObj of this.tile){
            const hitbox = tileObj.hitbox
            tileObj.move(offset)
            this.mapReloadFunc(tileObj)
            this.switchOpposition(tileObj)
        }
    }

    cameraMove(camera){
        this.move(camera.offset)
    }


    tiles(func){
        this.updateFunc = func
    }


    update(){
        for (let tileObj of this.tile){
            this.updateFunc(tileObj)
        }
        
    }


    allSwitch(){
        for (let tileObj of this.tile){
            this.switchFunc(tileObj)
        }
    }

    allReload(){
        for (let tileObj of this.tile){
            this.reloadFunc(tileObj)
        }
    }

    _mapReload(func){
        this.mapReloadFunc = func
    }

    switch(func){
        this.switchFunc = func
    }

    reload(func){
        this.reloadFunc = func
    }

    switchOpposition(tileObj){
        const hitbox = tileObj.hitbox
        if (hitbox.x > (this.horTileCount*this.tileSize) + this.adjX){
            tileObj.move([-this.horTileCount*this.tileSize,0])
            tileObj.horNum -= this.horTileCount
            this.mapReloadFunc(tileObj)
            this.switchFunc(tileObj)
            
        } else if (hitbox.x < this.adjX){
            tileObj.move([this.horTileCount*this.tileSize,0])
            tileObj.horNum += this.horTileCount
            this.mapReloadFunc(tileObj)
            this.switchFunc(tileObj)


        } else if (hitbox.y > this.verTileCount*this.tileSize  + this.adjY){
            tileObj.move([0,-this.verTileCount*this.tileSize])
            tileObj.verNum -= this.verTileCount
            this.mapReloadFunc(tileObj)
            this.switchFunc(tileObj)

        } else if (hitbox.y < this.adjY){ 
            tileObj.move([0,this.verTileCount*this.tileSize])
            tileObj.verNum += this.verTileCount
            this.mapReloadFunc(tileObj)
            this.switchFunc(tileObj)
        }  

        
    }

}
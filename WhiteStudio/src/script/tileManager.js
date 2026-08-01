import { random } from "./random.js";


class tileObject {
    constructor(robj,hitbox,hor,ver){
        this.renderObj = robj
        this.renderObj.zIndex = -1
        this.hitbox = hitbox
        this.horNum = hor
        this.verNum = ver
    }

    move(offset=[0,0]){
        this.renderObj.move(offset)
        this.hitbox.move(offset)
    }
}



export class tileManager{
    constructor(studio,size){
        this.studio = studio
        this.tile = []
        
        this.tileSize_Default = 160
        this.tileSize = 80
        this.tileRatio = this.tileSize / this.tileSize_Default
        // this.chunkSize = 6;

        this.adjX = -this.tileSize * 1;
        this.adjY = -this.tileSize * 1;
        // this.speed = 10

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

        // this.horTileCount = Math.floor(this.studio.width / this.tileSize) + 2
        // this.verTileCount = Math.floor(this.studio.height / this.tileSize) + 2

    }

    init(){
        this.tile = [] 
        this.horTileCount = Math.floor(this.studio.width / this.tileSize / this.studio.screenRatio) + 2
        this.verTileCount = Math.floor(this.studio.height / this.tileSize) + 3
        // this.cameraAdjX = ((this.studio.width-this.tileSize+(1920*(1-this.studio.screenRatio))) / 2)
        // this.cameraAdjY = ((this.studio.height-(this.tileSize*2)+(1080*(1-this.studio.screenRatio))) / 2)
        this.cameraAdjX = 0;
        this.cameraAdjY = 0;

        this.cameraX = 0
        this.cameraY = 0

        for (let i=0; i<this.horTileCount; i++){
            for (let j=0; j<this.verTileCount; j++){
                const obj = this.studio.object(this.studio.sysImg,
                    [(i*this.tileSize)+ this.cameraAdjX + this.cameraX,(j*this.tileSize) + this.cameraAdjY + this.cameraY],
                    [this.tileSize,this.tileSize]
                )
                obj.fillColor = [random.random(0,100),random.random(0,10),200,255]
                const _tileObj = new tileObject(obj,
                    this.studio.object(this.studio.sysImg,obj.pos,obj.size),
                    i,j
                )
                this.tile.push(_tileObj);
            }
        }
    } 


    render(){
        for (let tileObj of this.tile){
            const renderObj = tileObj.renderObj
            renderObj.render()
        }
    }
    

    move(offset){
        for (let tileObj of this.tile){
            const hitbox = tileObj.hitbox
            tileObj.move(offset)
            this.switchOpposition(tileObj)
        }
    }

    cameraMove(camera){
        this.move(camera.offset)
    }

    switchOpposition(tileObj){
        const hitbox = tileObj.hitbox
        if (hitbox.x > (this.horTileCount*this.tileSize) + this.adjX){
            tileObj.move([-this.horTileCount*this.tileSize,0])
            tileObj.horNum -= this.horTileCount
            
        } else if (hitbox.x < this.adjX){
            tileObj.move([this.horTileCount*this.tileSize,0])
            tileObj.horNum += this.horTileCount

        } else if (hitbox.y > this.verTileCount*this.tileSize  + this.adjY){
            tileObj.move([0,-this.verTileCount*this.tileSize])
            tileObj.verNum -= this.verTileCount

        } else if (hitbox.y < this.adjY){ 
            tileObj.move([0,this.verTileCount*this.tileSize])
            tileObj.verNum += this.verTileCount
        }  
    }

}
export class movementExtension{
    constructor(studio){
        this.studio = studio
        this.tile = null
        this.entity = null // entityManager 아님.그냥 엔티티 객체 하나 
        this.left = 0
        this.right = 0
        this.up = 0
        this.down = 0
        this.mx = 0
        this.my = 0
        this.speed = 15
        this.smooth = 0.8
        this.wallCheckDistance = 20
        this.tileBlockingActivate = false
        this.direction = null

        this.pos = [0,0]
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


    connectTile(tile,entity){
        this.tile = tile
        this.entity = entity
        this.tileBlockingActivate = true
    }


    move(reverse=false){ 
        if (this.studio.getPressKey('KeyA')){
            this.left =  this.speed
            this.direction = 'left'
        } else {
            this.left = this.left * this.smooth
        }

        if (this.studio.getPressKey('KeyD')){
            this.right =  this.speed
            this.direction = 'right'
        } else {
            this.right = this.right * this.smooth
        }

        if (this.studio.getPressKey('KeyW')){
            this.up =  this.speed
            this.direction = 'up'

        } else {
            this.up = this.up * this.smooth
            
        }
        if (this.studio.getPressKey('KeyS')){
            this.down =  this.speed
            this.direction = 'down'

        } else {
            this.down = this.down * this.smooth
        }
        
        if (this.tileBlockingActivate){
            for (let tileObj of this.tile.tile){
                if (tileObj.isBlock){
                    const hitbox = this.entity.hitbox
                    const visualHitbox = this.entity.visualHitbox
                    hitbox.moveY(this.wallCheckDistance)
                    if (hitbox.isEncounterObj(tileObj.hitbox)){
                        this.down = 0
                    }
                    hitbox.moveY(-this.wallCheckDistance)
    
                    hitbox.moveY(-this.wallCheckDistance)
                    if (hitbox.isEncounterObj(tileObj.hitbox)){
                        this.up = 0
                    }
                    hitbox.moveY(this.wallCheckDistance)
    
                    hitbox.moveX(-this.wallCheckDistance)
                    if (hitbox.isEncounterObj(tileObj.hitbox)){
                        this.left = 0
                    }
                    hitbox.moveX(this.wallCheckDistance)
    
                    hitbox.moveX(this.wallCheckDistance)
                    if (hitbox.isEncounterObj(tileObj.hitbox)){
                        this.right = 0
                        
                    }
                    hitbox.moveX(-this.wallCheckDistance)
                }
            }

        }

        this.mx  = -this.left + this.right
        this.my  = this.down - this.up

        this.pos[0] += this.mx
        this.pos[1] += this.my

        if (reverse){
            return [-this.mx,-this.my]

        }
        return [this.mx,this.my]
    }

    getAbsolute(reverse=false){
        if (reverse){
            return [-this.pos[0],-this.pos[1]]

        }
        return this.pos
    }


    get(reverse=false){
        if (reverse){
            return [-this.mx,-this.my]

        }
        return [this.mx,this.my]
    }
    Direction(){
        const centerX = obj.x + state.moveX + (obj.width / 2) - state.cameraAdjX ;
        const centerY = obj.y + state.moveY + (obj.height / 2) - state.cameraAdjY;
        const mouseWorldX = (phi.mousepos[0]) + state.moveX - state.cameraAdjX;
        const mouseWorldY = (phi.mousepos[1]) + state.moveY - state.cameraAdjY;
        const dx =  centerX - mouseWorldX;
        const dy = centerY - mouseWorldY;
        const rad = (-1* Math.atan2(dy, dx))
    }
}
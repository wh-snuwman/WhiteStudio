export class movementExtension{
    constructor(studio){
        this.studio = studio

        this.left = 0
        this.right = 0
        this.up = 0
        this.down = 0

        this.speed = 15
        this.smooth = 0.8

        this.mx = 0
        this.my = 0
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
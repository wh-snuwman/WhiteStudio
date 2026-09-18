export class cameraManager{
    constructor(studio){
        this.studio = studio
        this.speed = 0
        this.offsetX = 0
        this.offsetY = 0
        this.offset = [0,0]
        this.x = 0
        this.y = 0
        this.pos = [0,0]
        this.shakeX = 0
        this.shakeY = 0
        this.shakeRestorationPower = 0.7
        this.zoom = 0
        this.tracking_x = 0
        this.tracking_y = 0
        this.tracking_smooth = 10
        this.tracking_adj = [10,10]
    }

    shake(x,y){
        this.shakeX += x
        this.shakeY += y        
    }


    move(offset){
        this.offsetX = offset[0]
        this.offsetY = offset[1]
        this.offset = [this.offsetX,this.offsetY]
        this.x += this.offsetX
        this.y += this.offsetY
        this.pos = [this.x,this.y]
    }

    goto(pos){
        this.move([pos[0]-this.x,pos[1]-this.y])
    }

    trackingSet(smooth,adj){
        this.tracking_smooth = smooth
        this.tracking_adj = adj
    }

    tracking(obj,dt=1/60){
        const pos = obj.pos
        const size = obj.size
        const target_x = this.x - pos[0] + (this.studio.defaultDisplaySize[0] - size[0])/2 + this.tracking_adj[0]
        const target_y = this.y - pos[1] + (this.studio.defaultDisplaySize[1] - size[1])/2 + this.tracking_adj[1]
        const factor = 1 - Math.pow(0.001, dt * (this.tracking_smooth / 10))
        this.move([
            (target_x - this.x + this.shakeX) * factor,
            (target_y - this.y + this.shakeY) * factor
        ])
        this.shakeX = this.shakeX * this.shakeRestorationPower
        this.shakeY = this.shakeY * this.shakeRestorationPower

    }

    zooming(){
        this.zoom = 100
    }


}


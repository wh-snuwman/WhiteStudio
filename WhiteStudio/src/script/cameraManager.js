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

        this.tracking_x = 0
        this.tracking_y = 0
        this.tracking_smooth = 10
        this.tracking_adj = [10,10]
    }

    // smoothMove(offset){
    //     this.smooth_x = offset[0]
    //     this.smooth_y = offset[1]
    //     this.move([
    //         (this.smooth_x - this.x)/ this.smooth,
    //         (this.smooth_y - this.y)/ this.smooth
    //     ])
    // }


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

    tracking(obj){
        const pos = obj.pos
        const size = obj.size
        const target_x = this.x - pos[0] + (this.studio.defaultDisplaySize[0] - size[0])/2 + this.tracking_adj[0]
        const target_y = this.y - pos[1] + (this.studio.defaultDisplaySize[1] - size[1])/2 + this.tracking_adj[1]


        this.move([
            (target_x - this.x) / this.tracking_smooth,
            (target_y - this.y) / this.tracking_smooth
        ])
    }   

}


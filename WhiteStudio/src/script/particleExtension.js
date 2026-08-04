import { random } from "./random.js";

export class particleExtension{
    constructor(studio){
        this.studio = studio
        this.particles = {}
        this.type = null

        this.removeReserve = []
        
    }
    
    set(type,obj){
        this.type = type
        this.imgObj = obj.imgObj
    }

    run(camera){
        if (this.type === 'test'){
            // console.log(this.img)
            
            let obj = this.studio.object(this.imgObj,[0,0],[20,20])
            obj.fillColor = [random.random(0,255),random.random(0,255),random.random(0,255),255]

            if (camera){
                obj.move(camera.pos)
            }
            
            const pobj = new particleObject(this.type,obj)
            const id = random.simpleId()
            this.particles[id] = (pobj)
        }
    }

    update(){


        for (let id in this.particles){
            const pobj = this.particles[id]
            
            pobj.update()
            if (pobj.removeRequest){
                this.removeReserve.push(id)
            }
        }
        for (let id of this.removeReserve){
            delete this.particles[id]
        }
        // console.log(Object.keys(this.particles).length)

    }

    render(){
        for (let id in this.particles){
            const pobj = this.particles[id]
            if (!pobj) continue
            pobj.render()

        }
    }    
    
    cameraMove(camera){
        for (let id in this.particles){
            const pobj = this.particles[id]
            if (!pobj) continue

            pobj.cameraMove(camera)

        }
    }
}


class particleObject{
    constructor(type,obj){
        this.moveAngle = 0
        // console.log(obj)
        this.obj = obj
        this.obj.zIndex = 0
        this.obj.zIndexAdj = this.obj.height
        this.type = type
        this.random_1 = random.randomFloat(-3,3)
        this.random_2 = random.randomFloat(-3,3)
        
        this.random_delay = random.random(800,2200)
        this.moveAngle = random.random(0,360)
        this.spwanTime = Date.now()
        this.removeRequest = false

    }

    update(){
        if (this.type === 'test'){
            this.obj.move([this.random_1,this.random_2])
            this.obj.zIndex = this.obj.y



            if (this.spwanTime + this.random_delay < Date.now()){
                this.removeRequest = true
            }
        }
    }

    cameraMove(camera){
        this.obj.cameraMove(camera)
        
    }
    render(){
        this.obj.render()
    }

    
}
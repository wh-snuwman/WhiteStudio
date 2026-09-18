
import {random} from "./random.js"
import {log} from './Log.js'

export class entityExtension{
    constructor(studio){
        this.studio = studio
        this.entities = {}
    }

    new(obj=null,hitbox=null,type='null',id=null){
        if (!obj) return
        const _id = id || random.simpleId()

        if (this.entities[_id]) {
            this.removeById(_id)   // 기존 엔티티의 renderObj/hitbox를 remove 처리 후 덮어쓰기
        }

        const _obj = obj
        let _hitbox = hitbox
        if (hitbox === null){
            _hitbox = this.studio.object(null,obj.pos,obj.size)   
        }
        const ntt = new entity(_obj,_hitbox,type,_id)
        this.entities[_id] = ntt
        return ntt
    }

    newPlayer(pos,hitboxSize,name,id=null){
        if (!pos || !name) return
        let renderObj = this.studio.object(this.studio.sysImg,pos,null)
        let hitbox = this.studio.object(this.studio.sysImg,pos,hitboxSize)
        const player = this.new(renderObj,hitbox,'player',id)
        player.name = name
        return player
    }

    remove(ntt){
    if (!ntt || !this.entities[ntt.id]) return
    ntt.remove()
    delete this.entities[ntt.id]
}

    removeById(id){
        const ntt = this.entities[id]
        if (!ntt) return
        ntt.remove()
        delete this.entities[id]
    }

    removeAll(){
        for (let id in this.entities){
            this.removeById(id)
        }
    }

    renderAll(){
        for (let id in this.entities){
            const ntt = this.entities[id]
            ntt.render()
        }
    }


    get(id){
        return this.entities[id]
    }

    getAll(){
        return this.entities
    }

}

class entity{
    constructor(renderObj,hitbox,type,id){
        this.id = id
        this.type = type
        this.inventory = [null,null,null,null,null,null,null,null,null,null]
        this.hitbox = hitbox
        this.visualHitbox = null
        this.visualHitboxAdj = [0,0]
        this.hitbox.fillColor= [255,0,0,255]
        this.hitbox.zIndex = 1000
        this.renderObj = renderObj
        this.name = 'null'
        this.special = {} // 특수속성
        this.summonTime = Date.now()
        this.motion = null
        this.hp = 100

    }



    inventoryAdd(data){
        for (let i in this.inventory){
            if (this.inventory[i] == null){
                this.inventory[i] = data
                break
            }
        }
    }

    inventoryRemove(index){
        const d = this.inventory[index]
        this.inventory[index] = null
        return d
    }
    
    inventorySet(inventory){
        this.inventory = inventory
    }


    remove(){
        this.hitbox.remove = 1
        this.renderObj.remove = 1
        if (this.visualHitbox !== null){
            this.visualHitbox.remove = 1
        }
        if (this.motion){
            this.motion.remove()
        }
    }

    cameraMove(camera){
        this.renderObj.move(camera.offset)
        this.hitbox.move(camera.offset)
        if (this.visualHitbox) this.visualHitbox.move(camera.offset)
    }

    render(isRenderHitbox=false){
        this.renderObj.render()
        if (isRenderHitbox) {
            this.hitbox.render();
            if (this.visualHitbox) this.visualHitbox.render()
        }
    }

    move(offset){
        this.renderObj.move(offset)
        this.hitbox.move(offset)
        if (this.visualHitbox) this.visualHitbox.move(offset)



    }

    goto(pos){
        this.renderObj.goto(pos)
        this.hitbox.goto(pos)
        if (this.visualHitbox) {this.visualHitbox.goto([pos[0]+this.visualHitboxAdj[0],pos[1]+this.visualHitboxAdj[1]])}
        
        if (this.net){
            this.net.send('entity_goto',{
                pos:pos
            })
        }
    }

    rotate(angle,mark,point){
        this.renderObj.rotate(angle,mark,point)
    }


    setNetwork(net){
        this.net = net
    }



}



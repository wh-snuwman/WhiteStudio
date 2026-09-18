

export class motionManager{
    constructor(studio){
        this.studio = studio
        this.allMotion = []
    }

    new(){
        const obj = new motionObj(this.studio)
        this.allMotion.push(obj)
        return obj
    }

    updateAll(){
        for (let obj of this.allMotion){
            obj.run()
        }
    }

    remove(motionObj){
        this.allMotion[this.allMotion.indexOf(motionObj)].remove()
        this.allMotion = this.allMotion.filter(m => m !== motionObj)
    }

    removeAll(){
        for (let obj of this.allMotion){
            obj.remove()
            this.remove(obj)
        }
    }


}
class motionObj{
    constructor(studio){
        this.studio = studio
        this.eventList = {}
        this.animations = {}
        this.frameDelay = 300
        this.flip = true
        this.offset = [0,0]
        this.state = null
        this.x = 0

        this.forceState = ''

    }
    
    addEevent(name,eventFunc){
        this.eventList[name] = eventFunc
    }
    
    getEevent(name){
        return this.eventList[name]()
    }


    registerAnimation(name,eventName,specialMovement,animation){ // 애니매이션 이름, 애니매이션 이미지(imgObj list) 
        const frameOffset = []
        const frameObjs = []
        for (let imgObj of animation){
            frameObjs.push(this.studio.object(imgObj,[0,0],null))
            frameOffset.push([0,0])
        }
        
        this.animations[name] = {
            specialMovement:specialMovement,
            animation:animation,
            frameObjs:frameObjs,
            eventName:eventName,
            frame:0,
            frameOffset:frameOffset,
            frameOffsetFlip:structuredClone(frameOffset),
            maxFrame:animation.length,
            delayTime:0,
            initFlag:true,
            isRender:false,
            renderObj:this.studio.object(null,[0,0],[0,0]),
            pos: [0,0],
            mark: 0,
        }
    }

    remove(){
        for (let name in this.animations){
            for(let obj in this.animations[name].frameObjs){
                this.animations[name].frameObjs[obj].remove = 1
            }
            for(let obj in this.animations[name].animation){
                this.animations[name].animation[obj].remove = 1
            }
        }
    }



    run(){
        this.x ++;
        this.state = null
        if (this.forceState) {
            this.state = this.forceState
            for (let animationName in this.animations) {
                const animationData = this.animations[animationName]
                
                if (animationData.initFlag) {
                    for (let obj of animationData.frameObjs) {
                        obj.goto(animationData.pos)
                    }
                    animationData.initFlag = false
                }

                if (this.forceState === animationName) {
                    animationData.isRender = true
                    animationData.renderObj = animationData.frameObjs[animationData.frame]
                } else {
                    animationData.isRender = false
                }
            }
            return
        }

        for (let eventName in this.eventList) {
            const evnetFunc = this.eventList[eventName]   
            for (let animationName in this.animations) {
                const animationData = this.animations[animationName]
                
                if (animationData.eventName === eventName) {
                    if (animationData.initFlag) {
                        for (let obj of animationData.frameObjs) {
                            obj.goto(animationData.pos)
                        }
                        animationData.initFlag = false
                    }

                    if (!evnetFunc()) {
                        animationData.isRender = false
                        animationData.frame = 0;
                        animationData.delayTime = 0;
                        animationData.initFlag = true
                        animationData.renderObj = animationData.frameObjs[animationData.frame]
                        continue
                    }
                    
                    if (animationData.delayTime < Date.now()) {
                        animationData.frame += 1
                        if (animationData.maxFrame <= animationData.frame) {
                            animationData.frame = 0
                        }
                        animationData.delayTime = Date.now() + this.frameDelay
                        animationData.renderObj = animationData.frameObjs[animationData.frame]
                        animationData.renderObj.goto(animationData.pos)
                    }
                    animationData.isRender = true
                    this.state = animationName
                }
            }
        }
    }

    setOffset(name,frame,offset,flip1){
        const animationData = this.animations[name]
        if (!animationData || !offset) return

        if (flip1){
            animationData.frameOffsetFlip[frame] = offset

        } else {
            animationData.frameOffset[frame] = offset

        }
    }

    goto(pos){
        if (!pos) return
        for (let animationName in this.animations){
            const animationData = this.animations[animationName]
            animationData.pos = pos

            
            for (let num in animationData.frameObjs){
                const obj = animationData.frameObjs[num]
                obj.goto(pos)
                obj.move(this.offset)
                if (animationData.specialMovement === 'sinWalk'){
                    obj.rotateSet(Math.sin(this.x/7)*5)
                    obj.moveY(Math.cos(this.x/3.5)*5)
                }
                if (this.flip[0]){
                    obj.move(animationData.frameOffsetFlip[num])

                } else {
                    obj.move(animationData.frameOffset[num])

                }
            }
        }    
    }


    get(name){
        const animationData = this.animations[name]
        if (!animationData.isRender) return null
        return animationData.renderObj
    }

    getMotion(){
        for (let animationName in this.animations){
            const obj = this.get(animationName)
            if (obj) {
                const animationData = this.animations[animationName]
                if (this.flip){obj.flip = this.flip;}
                if (animationData.specialMovement === 'sinWalk'){
                    obj.rotateSet(Math.sin(this.x/7)*5)
                    obj.moveY(Math.cos(this.x/3.5)*5)
                }
                return obj
            }
        }  
        if (!this._emptyObj){
            this._emptyObj = this.studio.object(null,[0,0],[0,0])
        }
        return this._emptyObj
    }
}
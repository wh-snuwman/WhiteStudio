
function defualtVertexCalc(img,pos,size){
    const w = size ? size[0] : img.width;
    const h = size ? size[1] : img.height;
    const v = [
        pos[0], pos[1], 
        pos[0] + w, pos[1], 
        pos[0], pos[1] + h, 
        pos[0], pos[1] + h, 
        pos[0] + w, pos[1], 
        pos[0] + w, pos[1] + h
    ];
    return v
}




export class object {
    constructor(imgObj, pos, size = null, vertex = null, texcoord = null){
        if (imgObj){
            this.imgObj = imgObj
            this.img = imgObj.img
        }
        this.x = pos[0]
        this.y = pos[1]
        this.pos = pos
        this.size = size || [imgObj.width,imgObj.height] || null
        this.width = this.size ? this.size[0] : null
        this.height = this.size ? this.size[1] : null
        // this.height = this.size[1]
        this.w = this.width
        this.h = this.height
        this.vertex = vertex || defualtVertexCalc(this.img,this.pos,this.size)
        this.angle = 0
        this.name = null
        this.texcoord = texcoord
        this.fillColor = null
        this.alpha = 255
        this.screenRatio = 1
        this.renderData = null
        this.isRender = true

        this.renderX = null
        this.renderY = null
        this.renderW = null
        this.renderH = null
        this.scaledVertex = null
        this.zIndex = 0
        this.zIndexAdj = 0

        this.cameraApply = false

    }

    ratioSet(ratio){
        this.screenRatio = ratio
    }


    _synchronization_pos(){
        this.pos = [this.x,this.y]
    }
    _synchronization_size(){
        this.size = [this.width,this.height]
        this.w=  this.width
        this.h = this.height
    }

    move(offset=Array){
        this.x += offset[0]
        this.y += offset[1]
        for(let i = 0; i < this.vertex.length; i+=2){
            this.vertex[ i ] += offset[0]
            this.vertex[ i + 1 ] += offset[1]
        }
        this._synchronization_pos()
    }


    cameraMove(camera){
        this.move(camera.offset)
    }


    goto(pos=Array,mark='default'){
        let addX = pos[0] - this.x
        let addY = pos[1] - this.y 
        if (mark == 'center'){
            addX -= this.width/2 
            addY -= this.height/2
        }
        this.x +=  pos[0] - this.x
        this.y += pos[1] - this.y 
        for(let i = 0; i < this.vertex.length; i+=2){
            this.vertex[ i ] += addX
            this.vertex[ i + 1 ] += addY
        }
        this._synchronization_pos()
    }

    goCenter(pos){
        this.goto([(pos[0] - this.width)/2,(pos[1] - this.height)/2])
    }


    moveX(x){
        this.move([x,0])
    }

    moveY(y){
        this.move([0,y])

    }

    rotate(angle,mark="center",point=[0,0]){
        const rad = (angle) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const rotated = [];
        let cx = 0;
        let cy = 0;

        if (mark === 'center') {
            cx = this.x + this.width / 2;
            cy = this.y + this.height / 2;
        } 
        else if (mark === 'point') {
            cx = point[0];
            cy = point[1];
        }
        else if (mark === 'default') {
            cx = this.x;
            cy = this.y;
        }
        else {
            console.error('worng rotate mark')
        }

        for (let i = 0; i < this.vertex.length; i += 2) {
            const x = this.vertex[i] - cx;
            const y = this.vertex[i + 1] - cy;
            const rx = x * cos - y * sin + cx;
            const ry = x * sin + y * cos + cy;
            rotated.push(rx, ry);
        }
        this.vertex = rotated;
        this.angle += angle;
    }

    rotateSet(angle,mark='center',point=[0,0]){
        const targetAngle = angle - this.angle
        this.rotate(targetAngle,mark,point)
    }

    resize(size,mark){
        const temp_angle = this.angle;
        if (mark === 'center'){
            // const obj = {
            //     ...this,
            //     vertex: [...this.vertex]
            // };
            this.x += this.width/2
            this.y += this.height/2

            this.width = size[0]
            this.height = size[1]
            this.x -= this.width/2
            this.y -= this.height/2
            

            const x1 = this.x;
            const y1 = this.y;
            const x2 = this.x + this.width;
            const y2 = this.y + this.height;
            this.vertex = [x1, y1,x2, y1,x1, y2,x1, y2,x2, y1,x2, y2] 
        } 
        else if(mark === 'default'){
            this.width = size[0]
            this.height = size[1]
            const x1 = this.x;
            const y1 = this.y;
            const x2 = this.x + this.width;
            const y2 = this.y + this.height;
            this.vertex = [x1, y1,x2, y1,x1, y2,x1, y2,x2, y1,x2, y2]
        }
        else {
            console.error("worng resize mark");
        }

        this.angle = 0
        this.rotate(temp_angle);
        this._synchronization_pos()
        this._synchronization_size()
    }

    resizeBy(size,ratio,mark){
        this.resize([size[0]*ratio,size[1]*ratio],mark)
    }

    flip(what='hor'){
        if (what == 'hor'){
            for(let i=0; i<this.texcoord.length; i+=2){
                this.texcoord[i] = 1 - this.texcoord[i]
            }
        } else if (what == 'ver'){
            for(let i=0; i<this.texcoord.length; i+=2){
                othisbj.texcoord[i+1] = 1 - this.texcoord[i+1]
            }
        }
        this._synchronization_pos()
        this._synchronization_size()
    }

    getDistanceObj(otherObj,mark="center"){
        if (mark == 'center') {
            return Math.sqrt(((this.x+(this.width/2)) - (otherObj.x+(otherObj.width/2)))**2 + ((this.y+(this.height/2)) - (otherObj.y+(otherObj.height/2)))**2)

        } else {
            return Math.sqrt((this.x - otherObj.x)**2 + (this.y - otherObj.y)**2)
        }
    }

    isEncounterObj(otherObj) {
        return (
            otherObj.x < this.x + this.width &&
            otherObj.x + otherObj.width > this.x &&
            otherObj.y < this.y + this.height &&
            otherObj.y + otherObj.height > this.y
        );
    }

    isEncounterPos(pos){
        if (((this.renderX <= pos[0])  && (pos[0] <= this.renderX + this.renderW)) && ((this.renderY <= pos[1]) && (pos[1] <= this.renderY + this.renderH))) {          
            return true  
        }
        return false
    }

    isEncounterPos2(pos){
        if (((this.renderX <= pos[0])  && (pos[0] <= this.renderX + this.renderW)) && ((this.renderY <= pos[1]) && (pos[1] <= this.renderY + this.renderH))) {          
            return true  
        }
        return false
    }

    isSelect(){
        if (this.isEncounterPos2(this.EventManger.mousepos) && this.EventManger.click_l){
            return true
        }
        return false
    }

    _updateInit(){
        this.isRender = false
        this.renderX = this.x * this.screenRatio;
        this.renderY = this.y * this.screenRatio;
        this.renderW = this.width * this.screenRatio;
        this.renderH = this.height * this.screenRatio;
        this.scaledVertex = this.vertex ? this.vertex.map(v => v * this.screenRatio) : null;
    }


    render() {  
        if (!this.img) return;
        this.isRender = true
        this._synchronization_pos()
        this._synchronization_size()
    }
    
}
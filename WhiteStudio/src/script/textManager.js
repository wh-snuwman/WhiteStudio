export class textObject{
    constructor(text, pos , size, color, font, align){
        this.text = text
        this.pos = pos
        this.x = pos[0]
        this.y = pos[1]
        this.size = size
        this.color = color
        this.font = font
        this.align = align
        this.isRender = false
        this.zIndex = 1
        this.zIndexAdj = [0,0]
        this.screenRatio = 1
        this.renderX = 1
        this.renderY = 1
        this.remove = 0
    }

    init(app,ratio){
        this.app = app
        this.screenRatio = ratio
    }

    getMetrics() {
        const core = this.app?.core || this.app;
        if (core && typeof core.measureText === 'function') {
            return core.measureText(this.text, this.size, this.font);
        }
        return { width: 0, height: 0 };
    }

    get width() {
        return this.getMetrics().width;
    }

    get height() {
        return this.getMetrics().height;
    }

    get renderWidth() {
        return this.width * this.screenRatio;
    }

    get renderHeight() {
        return this.height * this.screenRatio;
    }

    goto(pos){
        this.x = pos[0]
        this.y = pos[1]
        this.pos = pos
    }

    move(offset){
        this.x += offset[0]
        this.y += offset[1]
        this.pos = [this.x,this.y]
    }

    cameraMove(camera){
        this.move(camera.offset)
    }

    _updateInit(){
        this.isRender = false
    } 

    ratioSet(ratio){
        this.screenRatio = ratio 
    }

    render(){
        this.isRender = true
        this.renderX = this.x * this.screenRatio;
        this.renderY = this.y * this.screenRatio;
    }
}

export class textManager{
    constructor(studio){
        this.studio = studio
        this.app = studio.app
    }

    object(text, pos = [0, 0], size = '20px', color = 'black', font = null, align = 'left'){
        const tobj = new textObject(text, pos , size, color, font, align)
        this.studio.objectList.push(tobj)
        tobj.init(this.app,this.studio.screenRatio)
        return tobj
    }
}
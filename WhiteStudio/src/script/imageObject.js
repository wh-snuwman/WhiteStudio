export class imageObject {
    constructor(app){
        this.app = app
        this.img = null
        this.width = null
        this.height = null
        this.size = [this.width,this.height]
    }
    _synchronization_size(){
        this.width = this.img.width
        this.height = this.img.height
    }
    async load(path){
        this.img = await this.app.loadImage(path);
        this._synchronization_size()
    }

    resize(size){
        // console.log(this.img.width)
        this.img.width = size[0]
        this.img.height = size[1]
        this._synchronization_size()
    }

    resizeBy(ratio){
        // console.log(this.img.width)
        this.img.width *= ratio
        this.img.height *= ratio
        this._synchronization_size()
    }
}

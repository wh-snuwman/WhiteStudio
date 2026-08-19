import { random } from "./random.js"
import {log} from './Log.js'



class mapObject{
    constructor(name){
        this.name = name
        this.chunk = {}
        this.chunkSize = 0
        this.startMapSize = 10
        this.isInfinite = true
        this.mapSize = [10,10]
        this.initLoadComplete = false
        this.terrainBuildFunc = ()  => {}
    }

    build(){
        log.Info('map build start...')
        this.initLoadComplete = true
        log.Info('map first build complete :',this.name)
    }


    terrainBuild(func){
        this.terrainBuildFunc = func
    }


    requestNewChunk(chunkId){
        this.newChunk(chunkId)
    }

    isExistChunk(chunkId){
        return chunkId in this.chunk 
    }


    newChunk(chunkId){
        if (!chunkId) return
        if (this.isExistChunk(chunkId)) return

        const data = []
        for (let i=0; i<this.chunkSize*this.chunkSize; i++){
            data.push(this.terrainBuildFunc())
        }
        this.chunk[chunkId] = data 

    }

    editTile(){

    }
    getTileDate(){

    }
}



export class mapExtension{
    constructor(studio,tile){
        this.tile = tile
        this.studio = studio
        this.maps = {}
        this.Map
        this.chunkSize = 16
        this.nowMap = ''

        this.tile._mapReload((tileObj)=>{
            tileObj.chunkInnerId = this._mod(tileObj.verNum,this.chunkSize) * this.chunkSize + this._mod(tileObj.horNum, this.chunkSize)
            tileObj.chunkId = [Math.floor(tileObj.horNum / this.chunkSize),Math.floor(tileObj.verNum / this.chunkSize)]
            
            if (Object.keys(this.maps).includes(this.nowMap)){
                
                const mapObj = this.maps[this.nowMap]

                if (mapObj.initLoadComplete){
                    if (mapObj.isExistChunk(tileObj.chunkId)){ //청크있음
                        tileObj.tile = mapObj.chunk[tileObj.chunkId][tileObj.chunkInnerId]
                    } else{ // 청크없음
                        mapObj.requestNewChunk(tileObj.chunkId)
                        tileObj.tile = null
                    }
                }
            }
        
        })

        for (let tileObj of this.tile.tile){
            this.tile.mapReloadFunc(tileObj)
        }
    }



    _mod(n, m){
        return ((n % m) + m) % m;
    }

    new(name){
        if (!name) return
        const mobj = new mapObject(name)
        mobj.chunkSize = this.chunkSize
        this.maps[name] = mobj
        return mobj
    }

    remove(name){
        delete this.maps[name]
        return name
    }

    get(){

    }

}
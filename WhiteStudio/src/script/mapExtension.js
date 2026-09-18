import { random } from "./random.js"
import {log} from './Log.js'
import { wing } from "./networkManager.js"


class mapObject{
    constructor(name,studio){
        this.studio = studio
        this.name = name
        this.chunk = {}
        this.chunkSize = 0
        // this.startMapSize = 10
        this.isInfinite = true
        this.mapSize = [10,10]
        this.terrainBuildFunc = ()  => {}   
        this.requestChunkList = []
        this.requestChunkFunc = () => {}
    }


    terrainBuild(func){
        this.terrainBuildFunc = func
    }


    requestNewChunk(chunkId){
        if (this.requestChunkList.includes(chunkId)) return
        log.Dev(`청크요청 수락함 ${chunkId}`)
        this.requestChunkList.push(chunkId)
        this.newChunk(chunkId)
        this.requestChunkFunc(chunkId)
    }


    requestChunk(func){
        this.requestChunkFunc = func
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


    setChunk(chunkId,data){
        if (!this.isExistChunk(chunkId)) return
        this.chunk[chunkId] = data
    }


    setTile(chunkId,innerId,tile){
        if (!this.isExistChunk(chunkId)) {log.Error('청크가 존재하지 않음! 수정 거부됨');return;}
        this.chunk[chunkId][innerId] = tile
    }
}



export class mapExtension{
    constructor(studio,tile){
        this.tile = tile
        this.studio = studio
        this.maps = {}
        this.chunkSize = 8
        this.nowMap = ''
        this.tile._mapReload((tileObj)=>{
            tileObj.chunkInnerId = this._mod(tileObj.verNum,this.chunkSize) * this.chunkSize + this._mod(tileObj.horNum, this.chunkSize)
            tileObj.chunkId = [Math.floor(tileObj.horNum / this.chunkSize),Math.floor(tileObj.verNum / this.chunkSize)]
            
            if (Object.keys(this.maps).includes(this.nowMap)){
                const mapObj = this.maps[this.nowMap]

                if (!mapObj.isExistChunk(tileObj.chunkId)){
                    mapObj.requestNewChunk(tileObj.chunkId)
                }

                if (mapObj.isExistChunk(tileObj.chunkId)){
                    tileObj.tile = mapObj.chunk[tileObj.chunkId][tileObj.chunkInnerId]
                } else {
                    tileObj.tile = null
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
        const mobj = new mapObject(name,this.studio)
        mobj.chunkSize = this.chunkSize
        this.maps[name] = mobj
        return mobj
    }

    remove(name){
        delete this.maps[name]
        return name
    }


}
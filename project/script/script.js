import { gametManager } from "../../WhiteStudio/src/script/gameManger.js"
import { entityExtension } from "../../WhiteStudio/src/script/entityExtension.js";
import { tileManager} from "../../WhiteStudio/src/script/tileManager.js"
import { textManager} from "../../WhiteStudio/src/script/textManager.js"
import { particleExtension } from "../../WhiteStudio/src/script/particleExtension.js";
import { movementExtension } from "../../WhiteStudio/src/script/movementExtension.js";
import { mapExtension } from "../../WhiteStudio/src/script/mapExtension.js";
import { motionManager } from "../../WhiteStudio/src/script/motionManager.js";
import {wing,initNetwork} from "../../WhiteStudio/src/script/networkManager.js"
import {log} from '../../WhiteStudio/src/script/Log.js'
import { random } from "../../WhiteStudio/src/script/random.js";

(async () => {

const studio = new gametManager();
const tile = new tileManager(studio,120);
const text = new textManager(studio)    
const entity = new entityExtension(studio)
await studio.init([1920,1080]);
tile.init()



studio.update(() => {
    studio.fill([90, 90, 100]);
    
    // main loop code here!

});

studio.last(()=>{
    tile.update()
    
})


tile.tiles((tileObj)=>{

    // tileObj update code here!

})

tile.reload((tileObj)=>{
})

window.addEventListener('resize',()=>{
})


})();

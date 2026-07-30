import { gametManager } from "../../applePhi/src/script/gameManger.js"
import { movementExtend } from "../../applePhi/src/script/gameManger.js"
import { tileManager } from "../../applePhi/src/script/tileManager.js"
import { random } from "../../applePhi/src/script/random.js"


(async () => {

const studio = new gametManager();
const tile = new tileManager(studio,120);
    
await studio.init([innerWidth, innerHeight]);


tile.init()

const cameraMovement = new movementExtend(studio)
const playerMovement = new movementExtend(studio)


const test = studio.object(studio.sysImg,[0,0],[tile.tileSize,tile.tileSize*2])
test.goCenter([1920,1080])

studio.update(() => {
    studio.fill([90, 90, 100]);

    
    
    test.move(playerMovement.move())
    
    studio.camera.move(cameraMovement.move(true))
    
    
    test.move(studio.camera.offset)
    tile.move(studio.camera.offset)    
    tile.render()
    test.render()



    
});

window.addEventListener('resize',()=>{
    tile.init()
})
})();

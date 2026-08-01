import { gametManager } from "../../WhiteStudio/src/script/gameManger.js"
import { movementExtension } from "../../WhiteStudio/src/script/movementExtension.js"
import { tileManager } from "../../WhiteStudio/src/script/tileManager.js"
import { random } from "../../WhiteStudio/src/script/random.js"


(async () => {

const studio = new gametManager();
const tile = new tileManager(studio,120);
    
await studio.init([1920,1080]);


tile.init()

const cameraMovement = new movementExtension(studio)
const playerMovement = new movementExtension(studio)


const test = studio.object(studio.sysImg,[0,0],[tile.tileSize,tile.tileSize*2])


studio.update(() => {
    studio.fill([90, 90, 100]);

    
    
    test.move(playerMovement.move())
    
    
    studio.camera.tracking(test)
    studio.camera.trackingSet(10,[
        -(studio.EventManger.mousepos[0] - 1920/2)/5,
        -(studio.EventManger.mousepos[1] - 1080/2)/5
    ])

    
    test.cameraMove(studio.camera)
    tile.cameraMove(studio.camera)    



    // test.zIndex = test.y
    
    tile.render()
    test.render()



    
});

window.addEventListener('resize',()=>{
    tile.init()
    test.zIndex = test.y
})
})();

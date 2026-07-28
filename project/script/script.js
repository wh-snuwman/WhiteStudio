import { gametManager,tileManager } from "../../applePhi/src/script/gameManger.js"
import { random } from "../../applePhi/src/script/random.js"


(async () => {
    
const studio = new gametManager();
await studio.init([innerWidth, innerHeight]);
const tile = new tileManager(studio);



tile.init()


studio.update(() => {
    studio.fill([90, 90, 100]);
    tile.moveFree()
    tile.render()
    // tile.init()

    
});

})();

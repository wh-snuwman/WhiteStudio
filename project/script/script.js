import { gametManager } from "../../WhiteStudio/src/script/gameManger.js"
import { entityExtension } from "../../WhiteStudio/src/script/gameManger.js"
import { particleExtension } from "../../WhiteStudio/src/script/particleExtension.js"
import { textManager } from "../../WhiteStudio/src/script/textManager.js"
import { movementExtension } from "../../WhiteStudio/src/script/movementExtension.js"
import { tileManager } from "../../WhiteStudio/src/script/tileManager.js"
import { random } from "../../WhiteStudio/src/script/random.js"


(async () => {

const studio = new gametManager();
const tile = new tileManager(studio,120);
const text = new textManager(studio)    
const entity = new entityExtension(studio)
await studio.init([1920,1080]);
tile.init()
const test_particle = new particleExtension(studio)
const cameraMovement = new movementExtension(studio)
const playerMovement = new movementExtension(studio)
const textObj = text.object('안녕하세용',[0,0],'2VW','white',null,'center')
const test = studio.object(studio.sysImg,[0,0],[tile.tileSize,tile.tileSize*2])
const test2 = studio.object(studio.sysImg,[0,0],[tile.tileSize,tile.tileSize])




const appleImg = await studio.imgLoad('./project/img/1.png')



const apple = studio.object(appleImg,[0,0],[500,500])

let entity_test = entity.new(apple,apple,[0,0])





test_particle.set('test',test2)
test.zIndexAdj = test.height


studio.update(() => {
    studio.fill([90, 90, 100]);
    test.move(playerMovement.move())
    test_particle.run(studio.camera)
    test.zIndex = test.y
    studio.camera.tracking(test)
    test.cameraMove(studio.camera)
    tile.cameraMove(studio.camera)    
    textObj.cameraMove(studio.camera)
    test_particle.cameraMove(studio.camera)
    tile.render()
    test.render()
    textObj.render()
    apple.render()

    textObj.zIndex = 1
    test_particle.render()
    entity_test.cameraMove(studio.camera)
    
    
    entity_test.render()
    entity_test.rotate(1)
    
});

studio.last(()=>{
    tile.update()
    test_particle.update()
})



tile.tiles((tileObj)=>{

})

tile.reload((tileObj)=>{
    tileObj.renderObj.rotateSet(0)
    tileObj.renderObj.fillColor = [random.random(0,100),random.random(0,10),200,255]
})

window.addEventListener('resize',()=>{
    tile.init()
    tile.move(studio.camera.pos)
})


})();

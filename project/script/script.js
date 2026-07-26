import { gametManager } from "../../applePhi/src/script/gameManger.js"
import { random } from "../../applePhi/src/script/random.js"


(async () => {
    
const phi = new gametManager();
await phi.init([innerWidth, innerHeight]);

const testImgObj = await phi.imgLoad('./project/img/0.png')


const testObj = phi.object(testImgObj,[300,300],null)
const testObj2 = phi.object(testImgObj,[0,100],null)
const testObj3 = phi.object(testImgObj,[100,100],null)

phi.sceneChange('hello')

testObj.zIndex = 1

phi.scene('hello',()=>{
    // testObj.fillColor = [random.random(0,255),random.random(0,255),random.random(0,255),random.random(0,255)]
    

    testObj.render()
    testObj2.render()
    testObj3.render()
    // testObj.moveX(10)
    

})

phi.scene('world',()=>{
    testObj2.render()
    testObj.render()
})


phi.update(() => {
    phi.fill([90, 90, 100]);
    
    // console.log(phi.renderZindex)
});

})();

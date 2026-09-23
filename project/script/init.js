import { gametManager } from "../../WhiteStudio/src/script/gameManger.js";
import { textManager } from "../../WhiteStudio/src/script/textManager.js";
import { tileManager } from "../../WhiteStudio/src/script/tileManager.js";

const studio = new gametManager();
const tile = new tileManager(studio, 160);
const text = new textManager(studio);


export { studio, tile, text };
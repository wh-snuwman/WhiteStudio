export class eventManger {
    constructor(studio){
        this.studio = studio
        this.mousepos = [0, 0];
        this.click_l = false;
        this.click_r = false;
        this.press_l = false;
        this.press_r = false
        this.down_key = {}
        this.press_key = {}

        this.key_code = [
        // Modifier / System
        "Backspace", "Tab", "Enter", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight",
        "AltLeft", "AltRight", "Pause", "CapsLock", "Escape", "Space", "PageUp", "PageDown",
        "End", "Home", "ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "PrintScreen",
        "Insert", "Delete", "MetaLeft", "MetaRight", "ContextMenu",

        // Digits
        "Digit0", "Digit1", "Digit2", "Digit3", "Digit4",
        "Digit5", "Digit6", "Digit7", "Digit8", "Digit9",

        // Alphabet
        "KeyA", "KeyB", "KeyC", "KeyD", "KeyE", "KeyF", "KeyG", "KeyH", "KeyI", "KeyJ",
        "KeyK", "KeyL", "KeyM", "KeyN", "KeyO", "KeyP", "KeyQ", "KeyR", "KeyS", "KeyT",
        "KeyU", "KeyV", "KeyW", "KeyX", "KeyY", "KeyZ",

        // Numpad
        "Numpad0", "Numpad1", "Numpad2", "Numpad3", "Numpad4",
        "Numpad5", "Numpad6", "Numpad7", "Numpad8", "Numpad9",
        "NumpadMultiply", "NumpadAdd", "NumpadSubtract", "NumpadDecimal", "NumpadDivide", "NumpadEnter",

        // Function Keys
        "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",

        // Punctuation / Symbols
        "Semicolon", "Equal", "Comma", "Minus", "Period", "Slash", "Backquote",
        "BracketLeft", "Backslash", "BracketRight", "Quote"
        ];

        for (let code of this.key_code){
            this.down_key[code] = false
            this.press_key[code] = false
        }

        

        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) {
                this.click_l = true;
                this.press_l = true;
            } else if (event.button === 2) {
                this.click_r = true;
                this.press_r = true;
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                this.press_l = false;
            } else if (event.button === 2) {
                this.press_r = false;
            }
        });

        document.addEventListener('mousemove', (event) => {
            this.mousepos = [
                (event.offsetX / this.studio.screenRatio) * this.studio.dpr,
                (event.offsetY / this.studio.screenRatio) * this.studio.dpr
            ];
        });

        document.addEventListener('keydown', (event) => {
            this.down_key[event.code] = true
            this.press_key[event.code] = true
        });

        document.addEventListener('keyup', (event) => {
            this.press_key[event.code] = false
        });

        
            
    
    }
    
    resetState() {
        this.click_l = false;
        this.click_r = false;
        for (let i in this.down_key){
            this.down_key[i] = false
        }
    }
}
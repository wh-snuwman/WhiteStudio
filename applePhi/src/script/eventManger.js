export class eventManger {
    static mousepos = [0, 0];
    static click_l = false;
    static click_r = false;
    static press_l = false;
    static press_r = false;

    static screenRatio = 1;
    static dpr = window.devicePixelRatio || 1;

    // 정적 초기화 블록 (ES2022 이상 지원)
    static {
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) {
                eventManger.click_l = true;
                eventManger.press_l = true;
            } else if (event.button === 2) {
                eventManger.click_r = true;
                eventManger.press_r = true;
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                eventManger.press_l = false;
            } else if (event.button === 2) {
                eventManger.press_r = false;
            }
        });

        document.addEventListener('mousemove', (event) => {
            eventManger.mousepos = [
                (event.offsetX / eventManger.screenRatio) * eventManger.dpr,
                (event.offsetY / eventManger.screenRatio) * eventManger.dpr
            ];
        });

        // document.addEventListener('keydown', (event) => {
        //     eventManger.mousepos = [
        //         (event.offsetX / eventManger.screenRatio) * eventManger.dpr,
        //         (event.offsetY / eventManger.screenRatio) * eventManger.dpr
        //     ];
        // });
        

    }

    static resetState() {
        eventManger.click_l = false;
        eventManger.click_r = false;
    }
}
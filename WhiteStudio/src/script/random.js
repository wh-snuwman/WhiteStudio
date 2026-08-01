export class random {

    static random(num1,num2){
        if (num1 > num2) {
            console.error('랜덤오류. 최솟값이 최댓값보다 클수 없습니다')
            return;
        }
        return Math.floor(Math.random() * (num2 - num1 + 1)) + num1
    }

    static  randomFloat(num1,num2){
        if (num1 > num2) {
            console.error('랜덤오류. 최솟값이 최댓값보다 클수 없습니다')
            return;
        }
        return (Math.random() * (num2 - num1)) + num1
    }

    static choice(arr=Array){
        return arr[this.random(0,arr.length-1)]
    }

    static choicePop(arr=Array){
        const i = this.random(0,arr.length-1)
        const r = arr[i]
        delete arr[i] 
        return r
    }
}
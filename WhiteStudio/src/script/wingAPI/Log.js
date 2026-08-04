export class LogSet{
    logTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    }
    

    Info(msg){
        this.text = `[INFO][${this.logTime()}] ${msg}`;
        console.log(this.text);
        return this.text;
    }
    Warn(msg){
        this.text = `[WARN][${this.logTime()}] ${msg}`;
        console.warn(this.text);
        return this.text;
    }
    Error(msg){
        this.text = `[ERROR][${this.logTime()}] ${msg}`;
        console.error(this.text);
        return this.text;
    }

}
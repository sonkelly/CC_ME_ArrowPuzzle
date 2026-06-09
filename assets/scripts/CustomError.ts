export class CustomError {
    public msg: string | undefined;

    constructor(msg: string) {
        this.msg = msg;
    }
}
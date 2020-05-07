export class Deferred {
    promise: Promise<any>
    reject: any = undefined
    resolve: any = undefined


    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.reject = reject
            this.resolve = resolve
        })
    }
}
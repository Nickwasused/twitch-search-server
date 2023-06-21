interface Dictionary<T> {
    [Key: string]: T;
}

interface cached_object {
    invalid: Date;
    data: any;
} 

export class Cache {
    private cache: Dictionary<cached_object>;
    private _timer: number;

    constructor() {
        this.cache = {};
        this._timer = setInterval(() => this.cleanup(), 180000)
    }

    private cleanup() {
        const date = new Date();
        for (const [key, value] of Object.entries(this.cache)) {
            this.check_item(key, date);
        }
    }

    public check_item(hash: string, date: Date = new Date()) {
        if (this.cache[hash]) {
            if (date > this.cache[hash].invalid) {
                delete this.cache[hash]
                return null
            } else {
                return this.cache[hash].data;
            }
        }
    }

    public add_item(hash: string, invalid: Date, data: any) {
        this.cache[hash] = {
            "invalid": invalid,
            "data": data
        }
    }
}
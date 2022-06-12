export const MISSING_KEY = '__MISSING_KEY__'
export const MISSING_TABLE_SERVICE = '__MISSING_TABLE_SERVICE__'
export const EXPECTED_FAILURE = '__EXPECTED_FAILURE__'


export type Table<T> = Readonly<Record<string, Readonly<T>>>
export type TableService<T> = {
    get(key: string): Promise<T>;
    set(key: string, val: T): Promise<void>;
    delete(key: string): Promise<void>;
}

// Q 2.1 (a)
export function makeTableService<T>(sync: (table?: Table<T>) => Promise<Table<T>>): TableService<T> {
    // optional initialization code
    return {
        get(key: string): Promise<T> {
            return new Promise((res,rej) => { 
                sync()
                .then((tbl : Table<T>) => {const temp = tbl[key]
                    if (temp === undefined || temp === null)
                        rej(MISSING_KEY);
                    else
                        res(temp);
                    })
                .catch((err) => Promise.reject("error in get"))})
        },

        set(key: string, val: T): Promise<void> {
            return new Promise((res, rej) => {
                    sync()
                    .then((tbl : Table<T>) => {
                        let dict : {[kaka : string] : Readonly<T>} = {};
                        for (const k in tbl.keys){
                            dict[k] = tbl[k];        
                        };
                        dict[key] = val;
                        let newTable : Table<T> = dict as Table<T>;
                        sync(newTable);
                        res();
                    })
                .catch((err) => rej(MISSING_KEY))
            })

        },
        delete(key: string): Promise<void> {
            return new Promise((res, rej) => {
                sync()
                .then((tbl : Table<T>) => {
                    let dict : {[kaka : string] : Readonly<T>} = {};
                    for (const k in tbl.keys){
                        if (k != key){
                            dict[k] = tbl[k];        
                        }
                    };
                    let newTable : Table<T> = dict as Table<T>;
                    sync(newTable);
                    res();
                })
                .catch((err) => rej(MISSING_KEY))      
             })  
        }
    }
}

// Q 2.1 (b)
export function getAll<T>(store: TableService<T>, keys: string[]): Promise<T[]> {
    const promises = keys.map((key) => store.get(key));
    return Promise.all(promises)
}


// Q 2.2
export type Reference = { table: string, key: string }

export type TableServiceTable = Table<TableService<object>>

export function isReference<T>(obj: T | Reference): obj is Reference {
    return typeof obj === 'object' && 'table' in obj
}

export async function constructObjectFromTables(tables: TableServiceTable, ref: Reference) {

    async function deref(ref: Reference) {

        const tbl = tables[ref.table];
            if (!(tbl === undefined || tbl === null)){
                try{
                    let record : any = await tbl.get(ref.key) 
                        const list : [string, any][] = Object.entries(record);
                        for (const [key, value] of list)
                            if(isReference(value)){
                                record[key] = await deref(value);
                            }
                            return Promise.resolve(record);
                    }
                catch{
                    return Promise.reject(MISSING_KEY);
                }
            }
            else{
                    return Promise.reject(MISSING_TABLE_SERVICE)
                }
      }
    return deref(ref)
}

// Q 2.3

export function lazyProduct<T1, T2>(g1: () => Generator<T1>, g2: () => Generator<T2>): () => Generator<[T1, T2]> {
    return function* () {
        let g1Iterator = g1();
        for(let x of g1Iterator){
            let g2Iterator = g2();
            for(let y of g2Iterator){
                yield[x,y];
            }
        }
    }
}

export function lazyZip<T1, T2>(g1: () => Generator<T1>, g2: () => Generator<T2>): () => Generator<[T1, T2]> {
    return function* () {
        let g1Iterator = g1();
        let g2Iterator = g2();
        while(1){
            let x = g1Iterator.next();
            let y = g2Iterator.next();
            if(!x.done){
                yield[x.value,y.value];  
            }
            else
                break;
        }  
    }
}

// Q 2.4
export type ReactiveTableService<T> = {
    get(key: string): T;
    set(key: string, val: T): Promise<void>;
    delete(key: string): Promise<void>;
    subscribe(observer: (table: Table<T>) => void): void
}


export async function makeReactiveTableService<T>(sync: (table?: Table<T>) => Promise<Table<T>>, optimistic: boolean)
:Promise<ReactiveTableService<T>> {
    // optional initialization code
    let _table: Table<T> = await sync();
    let observerArr : ((table: Table<T>) => void)[]= new Array();

    const handleMutation = async (newTable: Table<T>) => {
        if(optimistic){
            for(let func of observerArr)
                func(newTable);
            try{ // optimistic try - sync new table
                await sync(newTable);
                _table = newTable;
            }
            catch{ // sync fails - revert old version of the table
                for(let func of observerArr)
                    func(_table);
                throw (EXPECTED_FAILURE);
            }
        }
        else{
            try{ // try to sync
                await sync(newTable);
                for(let func of observerArr)
                    func(newTable);
                _table = newTable;
            }
            catch{
                throw (EXPECTED_FAILURE);
            }
        }
    }

    return {
        get(key: string): T {
            if (key in _table) {
                return _table[key]
            } else {
                throw MISSING_KEY;
            }
        },
        set(key: string, val: T): Promise<void> {
            let arr = Object.entries(_table);
            let flag = false;
            let arrFinal = new Array(); 
            for(let rec of arr){
                if(rec[0] === key){
                    arrFinal.push([key, val]);
                    flag = true;
                }
                else
                    arrFinal.push(rec);
            }
            if (!flag){
                arrFinal.push([key, val]);
            }
            let updatedTable = Object.fromEntries(arrFinal);
            return handleMutation(updatedTable);
        },

        delete(key: string): Promise<void> { 
            let arr = Object.entries(_table);
            let len = arr.length;
            let val = arr.filter((rec) => rec[0] !== key);
            let updatedTable = Object.fromEntries(val);
            return handleMutation(updatedTable);
        },
        subscribe(observer: (table: Table<T>) => void): void {
            observerArr.push(observer);
        }
    }
}
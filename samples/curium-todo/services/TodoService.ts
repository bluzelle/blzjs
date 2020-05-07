import {bluzelle} from "../../../client/lib/bluzelle-node";
import {extend, memoize} from 'lodash'
import {StoredTodo, Todo} from "../model/Todo";
import {API} from "../../../client/lib/swarmClient/api";
import {BluzelleConfig} from "../../../client/src/BluzelleConfig";


export const params: BluzelleConfig = {
    address: "bluzelle1htcd86l00dmkptdja75za0akg8mrt2w3qhd65v",
    mnemonic: "apology antique such ancient spend narrow twin banner coral book iron summer west extend toddler walnut left genius exchange globe satisfy shield case rose",
    endpoint: "http://testnet.public.bluzelle.com:1317",
    chain_id: 'bluzelle',
    uuid: 'uuid'
}

const todosListeners = [];
const todos: Record<string, Todo> = {};

const getBz = memoize<Promise<API>>(() => bluzelle(params))


export const initialLoadTodos = () => getBz().then(loadTodos);

export const onTodoListUpdated = (fn: (todos: Todo[]) => void) => {
    todosListeners.push(fn);
}


export const storeTodo = (todo: Pick<Todo, 'body'>): Promise<any> => {
    const time = new Date().toISOString();
    todos[time] = {...todo, time, synced: false, done: false};
    notifyListeners();
    const storedTodo: StoredTodo = {...todo, time, done: false};
    return getBz()
        .then(bz => bz.create(time, JSON.stringify(storedTodo), {gas_price: '10.0'}))
        .then(() => todos[time].synced = true)
        .then(notifyListeners)
}


const notifyListeners = () =>
 todosListeners.forEach(listener => listener(Object.values(todos)));

const loadTodos = (): Promise<void> =>
    getBz()
        .then(bz => bz.keyValues())
        .then(result => result.map(it => ({...JSON.parse(it.value), synced: true})))
        .then(list => list.map(it => todos[it.time] = extend(todos[it.time] || {},  it)))
        .then(notifyListeners)

export const deleteTodo = (todo: Todo):Promise<any> => {
    todo.synced = false;
    notifyListeners();
    return getBz()
        .then(bz => bz.delete(todo.time, {gas_price: '10.0'}))
        .then(() => delete todos[todo.time])
        .then(notifyListeners);
}

export const toggleTodoDone = (todo: Todo): Promise<any> => {
    todo.done = !todo.done;
    todo.synced = false;
    notifyListeners();
    const storedTodo: StoredTodo = {
        done: todo.done,
        body: todo.body,
        time: todo.time
    }
    return getBz()
        .then(bz => bz.update(todo.time, JSON.stringify(storedTodo), {gas_price: '10.0'}))
        .then(() => todo.synced = true)
        .then(notifyListeners)
}



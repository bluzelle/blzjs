import {bluzelle, API, BluzelleConfig} from "bluzelle";
import {extend, memoize} from 'lodash'
import {StoredTodo, Todo} from "../model/Todo";
import {bluzelleConfig} from "../../example-config";

export const params: BluzelleConfig = bluzelleConfig;

const todosListeners = [];
const todos: Record<string, Todo> = {};

const getBz: () => Promise<API> = memoize(() => bluzelle(params))

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
        .then(bz => bz.create(time, JSON.stringify(storedTodo), {gas_price: 10}))
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
        .then(bz => bz.delete(todo.time, {gas_price: 10}))
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
        .then(bz => bz.update(todo.time, JSON.stringify(storedTodo), {gas_price: 10}))
        .then(() => todo.synced = true)
        .then(notifyListeners)
}



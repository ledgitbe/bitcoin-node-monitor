import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSocketIoMiddleware from 'redux-socket.io';
import io from 'socket.io-client';
import thunk from 'redux-thunk';
import dataReducer from './reducers/data.js';
import uiReducer from './reducers/ui.js';

let socket = io();
let socketIoMiddleware = createSocketIoMiddleware(socket, "server/");

const reducer = combineReducers({
  data: dataReducer,
  ui: uiReducer,
});

let store = applyMiddleware(socketIoMiddleware, thunk)(createStore)(reducer);

store.dispatch({type:'server/hello', data:'Hello!'});

export default store;

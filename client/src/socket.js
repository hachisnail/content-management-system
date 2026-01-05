// client/src/socket.js
import { io } from 'socket.io-client';
import { SOCKET_SERVER_URL } from './config';

const socket = io(SOCKET_SERVER_URL, {
  autoConnect: false, // Don't auto-connect
  withCredentials: true, // Send cookies with the connection request
  transports: ['websocket'],
});

export default socket;

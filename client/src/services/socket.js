import { io } from "socket.io-client";
export const socket = io(import.meta.env.VITE_SOCKET_URL);

export const initSocketEvents = (store) => {
  socket.on("room:users", (users) => store.setUsers(users));
  socket.on("chat:public", (msg) => store.addPublic(msg));
};

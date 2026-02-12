import { io } from "socket.io-client";
export const socket = io("http://localhost:8000");

export const initSocketEvents = (store) => {
  socket.on("room:users", (users) => store.setUsers(users));
  socket.on("chat:public", (msg) => store.addPublic(msg));
};

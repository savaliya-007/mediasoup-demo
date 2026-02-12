import * as mediasoup from "mediasoup";

type User = {
  socketId: string;
  name: string;
  role: "speaker" | "listener";
};

type Room = {
  id: string;
  users: User[];
  producer?: mediasoup.types.Producer;
};

const rooms: Record<string, Room> = {};

export const createRoom = (id: string) => {
  if (!rooms[id]) rooms[id] = { id, users: [] };
};

export const getRoom = (id: string) => rooms[id];

export const addUser = (roomId: string, user: User) => {
  const room = rooms[roomId];
  if (!room) return;

  if (!room.users.find((u) => u.socketId === user.socketId)) {
    room.users.push(user);
  }
};

export const removeUser = (roomId: string, socketId: string) => {
  const room = rooms[roomId];
  if (!room) return;

  room.users = room.users.filter((u) => u.socketId !== socketId);

  if (room.users.length === 0) delete rooms[roomId];
};

export const getUsers = (roomId: string) => rooms[roomId]?.users || [];

export const getListenerCount = (roomId: string) =>
  rooms[roomId]?.users.filter((u) => u.role === "listener").length || 0;

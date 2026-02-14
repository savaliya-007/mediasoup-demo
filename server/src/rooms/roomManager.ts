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

// ---------- CREATE ----------
export const createRoom = (id: string) => {
  if (!id) return;
  if (!rooms[id]) {
    rooms[id] = { id, users: [] };
  }
};

// ---------- GET ----------
export const getRoom = (id: string) => {
  if (!id) return undefined;
  return rooms[id];
};

// ---------- ADD USER ----------
export const addUser = (roomId: string, user: User) => {
  if (!roomId || !user) return;

  const room = rooms[roomId];
  if (!room) return;

  // prevent duplicates
  const exists = room.users.some((u) => u.socketId === user.socketId);
  if (!exists) {
    room.users.push(user);
  }
};

// ---------- REMOVE USER ----------
export const removeUser = (roomId: string, socketId: string) => {
  const room = rooms[roomId];
  if (!room) return;

  room.users = room.users.filter((u) => u.socketId !== socketId);

  // if room empty → cleanup producer + delete room
  if (room.users.length === 0) {
    try {
      room.producer?.close();
    } catch {
      // ignore close errors
    }

    delete rooms[roomId];
  }
};

// ---------- USERS ----------
export const getUsers = (roomId: string): User[] => {
  return rooms[roomId]?.users ?? [];
};

// ---------- LISTENER COUNT ----------
export const getListenerCount = (roomId: string): number => {
  const room = rooms[roomId];
  if (!room) return 0;

  return room.users.filter((u) => u.role === "listener").length;
};

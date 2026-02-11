export const rooms = new Map();

export const getRoom = (id: string) => {
  if (!rooms.has(id)) rooms.set(id, {});
  return rooms.get(id);
};

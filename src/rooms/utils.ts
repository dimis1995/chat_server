import WebSocket from "ws";

const ROOM_CAPACITY = 2;

interface Room {
  id: string;
  clients: Set<WebSocket>;
}

export const rooms: { [key: string]: Room } = {};

export const roomExists = (id: string): boolean => !!rooms[id];

export const roomsAvailable = (): boolean =>
  Object.keys(rooms).length < ROOM_CAPACITY;

export const createRoom = (): string => {
  const newId = crypto.randomUUID();
  rooms[newId] = { id: newId, clients: new Set() };
  return newId;
};

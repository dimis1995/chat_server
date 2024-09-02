import express, { Request, Response } from "express";
import { createRoom, roomExists, rooms, roomsAvailable } from "./rooms/utils";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

const app = express();
const port = 8080;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.get("/", (req: Request, res: Response) => {
  console.log("Hello, TypeScript with Express!");
  res.send("Hello, TypeScript with Express!");
});

app.get("/rooms", (req: Request, res: Response) => {
  res.status(200).json({ rooms: Object.keys(rooms) });
});

app.get("/join-chat-room", (req: Request, res: Response) => {
  const id = req.query.id;

  if (!id) {
    console.warn("No id provided, need to create a room");
    if (roomsAvailable()) {
      const newId = createRoom();
      res.status(200).json({ id: newId, message: "Room created" });
    } else {
      res.status(400).json({ message: "No rooms available" });
    }
  } else if (roomExists(id as string)) {
    res.status(200).json({ id, message: "Room exists" });
  } else {
    if (roomsAvailable()) {
      const newId = createRoom();
      res.status(200).json({ id: newId, message: "Room created" });
      return;
    }
    res.status(400).json({ message: "Room does not exist" });
  }
});

wss.on("connection", (ws: WebSocket, req) => {
  const urlParams = new URLSearchParams(req.url?.split("?")[1]);
  const roomId = urlParams.get("id");

  if (!roomId || !roomExists(roomId)) {
    console.debug(`Connection rejected: Invalid room ID (${roomId})`);
    ws.send("Invalid room ID");
    ws.close(); // Close the connection
    return;
  }

  console.debug(`New client connected to room ${roomId}`);

  rooms[roomId].clients.add(ws);

  ws.send(`Welcome to room ${roomId}`);

  ws.on("message", (message: string) => {
    console.debug(`Received in room ${roomId}: ${message}`);
    // Broadcast the message to all clients in the room
    rooms[roomId].clients.forEach((client: WebSocket) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(`Room ${roomId}: ${message}`);
      }
    });
  });

  ws.on("close", () => {
    console.debug(`Client disconnected from room ${roomId}`);
    // Remove the client from the room
    const arr = [...rooms[roomId].clients].filter((client) => client !== ws);
    rooms[roomId].clients = new Set(arr);
  });
});

server.listen(port, () => {
  console.info(`Server is running on port ${port}`);
});

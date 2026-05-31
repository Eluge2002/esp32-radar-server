const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let latestData = {
  distance: 0,
  timestamp: Date.now()
};

function broadcast(data) {
  const message = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

app.post("/api/radar", (req, res) => {
  console.log("Body primit:", req.body);

  const distance = Number(req.body.distance);

  if (Number.isNaN(distance)) {
    return res.status(400).json({
      error: "Distance must be a valid number",
      received: req.body
    });
  }

  latestData = {
    distance,
    timestamp: Date.now()
  };

  console.log(`Distance received: ${distance} cm`);

  broadcast(latestData);

  res.json({
    status: "ok",
    data: latestData
  });
});

app.get("/api/latest", (req, res) => {
  res.json(latestData);
});

wss.on("connection", (ws) => {
  console.log("Web client connected");
  ws.send(JSON.stringify(latestData));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
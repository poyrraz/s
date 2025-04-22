// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const app = express();

app.use(express.static("public"));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let broadcaster = null;

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    try {
      const msgStr = message.toString();
      console.log("Gelen mesaj:", msgStr);
      const data = JSON.parse(msgStr);

      switch (data.type) {
        case "broadcaster":
          broadcaster = ws;
          console.log("Yayıncı bağlandı");
          break;

        case "watcher":
          if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
            broadcaster.send(JSON.stringify({ type: "watcher", id: data.id }));
            console.log("Yeni dinleyici bağlandı: ID =", data.id);
          }
          break;

        case "offer":
        case "answer":
        case "candidate":
          console.log("Mesaj iletiliyor:", data.type);
          [...wss.clients]
            .filter(
              (client) => client !== ws && client.readyState === WebSocket.OPEN,
            )
            .forEach((client) => {
              client.send(JSON.stringify(data));
            });
          break;
      }
    } catch (err) {
      console.error("⚠️ JSON parse hatası:", err.message);
    }
  });

  ws.on("close", () => {
    if (ws === broadcaster) {
      console.log("Yayıncı bağlantısı kapandı");
      broadcaster = null;
    }
  });
});

server.listen(3000, () =>
  console.log("🚀 Server started at http://localhost:3000"),
);

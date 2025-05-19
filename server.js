const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

const clients = new Map();
const bees = ['bee1', 'bee2'];
const availableBees = new Set(bees);

wss.on('connection', (ws) => {
  console.log('New client connected');
  if (availableBees.size > 0) {
    const bee = availableBees.values().next().value;
    availableBees.delete(bee);
    clients.set(ws, bee);
    ws.send(JSON.stringify({ type: 'assign', bee }));
    console.log(`Assigned ${bee} to client`);
  } else {
    ws.send(JSON.stringify({ type: 'assign', bee: null }));
    console.log('No bees available for client');
  }

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'move' && clients.get(ws) === data.bee) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'update',
            bee: data.bee,
            targetX: data.targetX,
            targetY: data.targetY,
            size: data.size,
            isIdle: data.isIdle,
            lastMouseMove: data.lastMouseMove
          }));
        }
      });
    }
  });

  ws.on('close', () => {
    const bee = clients.get(ws);
    if (bee) {
      availableBees.add(bee);
      clients.delete(ws);
      console.log(`Client disconnected, freed ${bee}`);
    }
  });
});

console.log('WebSocket server running');

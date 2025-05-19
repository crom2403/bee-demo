const bee1 = document.querySelector(".bee1");
const bee2 = document.querySelector(".bee2");
const number1 = document.querySelector(".number1");
const number2 = document.querySelector(".number2");
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

let targetX1 = windowWidth / 2;
let targetY1 = windowHeight / 2;
let targetX2 = windowWidth / 2 + 100;
let targetY2 = windowHeight / 2 + 100;
let beeX1 = targetX1, beeY1 = targetY1;
let beeX2 = targetX2, beeY2 = targetY2;
let beeSize1 = 20, beeSize2 = 20;
let minSize = 10;
let maxSize = 150;
let manualMaxSize = 500;
let rotation1 = 0, rotation2 = 0;

const speed = 0.05;
let waypoints1 = [], waypoints2 = [];
const waypointCount = 5;
let currentWaypoint1 = 0, currentWaypoint2 = 0;

const trailLength = 15;
const trailInterval = 40;
let lastTrailTime1 = 0, lastTrailTime2 = 0;
const trailElements1 = [], trailElements2 = [];

let isBee1Stunned = false, isBee2Stunned = false;
const stunDuration = 1000;
const collisionDistance = 80;
const bounceStrength = 200;
const spinSpeed = 360;

let lastMouseMove1 = Date.now();
let lastMouseMove2 = Date.now();
const idleTimeout = 2000;
let isIdle1 = true, isIdle2 = true;

let velocityX1 = 0, velocityY1 = 0;
let velocityX2 = 0, velocityY2 = 0;
const friction = 0.95;

let myBee = null; // Tracks which bee this client controls (bee1 or bee2)
let socket;

// Initialize WebSocket connection
function initWebSocket() {
  // Replace with your actual WebSocket URL
  socket = new WebSocket('wss://bee-demo-snowy.vercel.app/api/ws'); // Update this!

  socket.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'assign') {
      if (data.bee) {
        myBee = data.bee;
        document.querySelector(`.number${data.bee.slice(-1)}`).textContent = data.bee.slice(-1);
        console.log(`Assigned to ${myBee}`);
      } else {
        alert('No bees available. Please try again later.');
        socket.close();
      }
    } else if (data.type === 'update') {
      if (data.bee === 'bee1') {
        targetX1 = data.targetX;
        targetY1 = data.targetY;
        beeSize1 = data.size;
        isIdle1 = data.isIdle;
        lastMouseMove1 = data.lastMouseMove;
      } else if (data.bee === 'bee2') {
        targetX2 = data.targetX;
        targetY2 = data.targetY;
        beeSize2 = data.size;
        isIdle2 = data.isIdle;
        lastMouseMove2 = data.lastMouseMove;
      }
    }
  };

  socket.onclose = () => {
    console.log('Disconnected from WebSocket server');
    alert('Connection to server lost. Please refresh the page.');
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    alert('Failed to connect to the server. Please check the WebSocket URL or server status.');
  };
}

const generateWaypoints = () => {
  const waypoints = [];
  for (let i = 0; i < waypointCount; i++) {
    waypoints.push({
      x: Math.random() * (windowWidth - 200) + 100,
      y: Math.random() * (windowHeight - 200) + 100,
    });
  }
  return waypoints;
};

waypoints1 = generateWaypoints();
waypoints2 = generateWaypoints();

const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

const updateSize = (dist) => {
  const maxDistance = Math.sqrt(windowWidth * windowWidth + windowHeight * windowHeight) / 2;
  const size = maxSize - (dist / maxDistance) * (maxSize - minSize);
  return Math.max(minSize, size);
};

document.addEventListener("mousemove", (event) => {
  if (myBee) {
    const targetX = event.clientX;
    const targetY = event.clientY;
    if (myBee === 'bee1') {
      targetX1 = targetX;
      targetY1 = targetY;
      lastMouseMove1 = Date.now();
      isIdle1 = false;
    } else if (myBee === 'bee2') {
      targetX2 = targetX;
      targetY2 = targetY;
      lastMouseMove2 = Date.now();
      isIdle2 = false;
    }
    socket.send(JSON.stringify({
      type: 'move',
      bee: myBee,
      targetX,
      targetY,
      size: myBee === 'bee1' ? beeSize1 : beeSize2,
      isIdle: myBee === 'bee1' ? isIdle1 : isIdle2,
      lastMouseMove: myBee === 'bee1' ? lastMouseMove1 : lastMouseMove2
    }));
  }
});

document.addEventListener("touchmove", (event) => {
  event.preventDefault();
  if (myBee && event.touches.length > 0) {
    const targetX = event.touches[0].clientX;
    const targetY = event.touches[0].clientY;
    if (myBee === 'bee1') {
      targetX1 = targetX;
      targetY1 = targetY;
      lastMouseMove1 = Date.now();
      isIdle1 = false;
    } else if (myBee === 'bee2') {
      targetX2 = targetX;
      targetY2 = targetY;
      lastMouseMove2 = Date.now();
      isIdle2 = false;
    }
    socket.send(JSON.stringify({
      type: 'move',
      bee: myBee,
      targetX,
      targetY,
      size: myBee === 'bee1' ? beeSize1 : beeSize2,
      isIdle: myBee === 'bee1' ? isIdle1 : isIdle2,
      lastMouseMove: myBee === 'bee1' ? lastMouseMove1 : lastMouseMove2
    }));
  }
}, { passive: false });

document.addEventListener("wheel", (event) => {
  if (myBee) {
    const sizeChange = event.deltaY < 0 ? 10 : -10;
    if (myBee === 'bee1') {
      beeSize1 = Math.min(manualMaxSize, Math.max(minSize, beeSize1 + sizeChange));
    } else if (myBee === 'bee2') {
      beeSize2 = Math.min(manualMaxSize, Math.max(minSize, beeSize2 + sizeChange));
    }
    socket.send(JSON.stringify({
      type: 'move',
      bee: myBee,
      targetX: myBee === 'bee1' ? targetX1 : targetX2,
      targetY: myBee === 'bee1' ? targetY1 : targetY2,
      size: myBee === 'bee1' ? beeSize1 : beeSize2,
      isIdle: myBee === 'bee1' ? isIdle1 : isIdle2,
      lastMouseMove: myBee === 'bee1' ? lastMouseMove1 : lastMouseMove2
    }));
  }
});

const createTrail = (x, y, elements, beeSize) => {
  const trail = document.createElement("div");
  trail.className = "trail";
  const trailSize = beeSize * 0.3;
  trail.style.left = `${x}px`;
  trail.style.top = `${y}px`;
  trail.style.width = `${trailSize}px`;
  trail.style.height = `${trailSize}px`;
  document.body.appendChild(trail);
  elements.push(trail);

  setTimeout(() => {
    trail.remove();
    elements.splice(elements.indexOf(trail), 1);
  }, 800);

  if (elements.length > trailLength) {
    const oldTrail = elements.shift();
    oldTrail.remove();
  }
};

function checkCollision() {
  const dist = distance(beeX1, beeY1, beeX2, beeY2);
  if (dist < collisionDistance && !isBee1Stunned && !isBee2Stunned && Math.abs(beeSize1 - beeSize2) < 0.1) {
    const angle = Math.atan2(beeY2 - beeY1, beeX2 - beeX1);
    velocityX1 = -Math.cos(angle) * bounceStrength * 0.05;
    velocityY1 = -Math.sin(angle) * bounceStrength * 0.05;
    velocityX2 = Math.cos(angle) * bounceStrength * 0.05;
    velocityY2 = Math.sin(angle) * bounceStrength * 0.05;

    isBee1Stunned = true;
    isBee2Stunned = true;

    setTimeout(() => {
      isBee1Stunned = false;
      isBee2Stunned = false;
      rotation1 = 0;
      rotation2 = 0;
      velocityX1 = 0;
      velocityY1 = 0;
      velocityX2 = 0;
      velocityY2 = 0;
    }, stunDuration);
  }
}

function animate() {
  const currentTime = Date.now();

  if (currentTime - lastMouseMove1 > idleTimeout) {
    isIdle1 = true;
  }
  if (currentTime - lastMouseMove2 > idleTimeout) {
    isIdle2 = true;
  }

  if (isIdle1) {
    targetX1 = waypoints1[currentWaypoint1].x;
    targetY1 = waypoints1[currentWaypoint1].y;
    if (distance(beeX1, beeY1, targetX1, targetY1) < 20) {
      currentWaypoint1 = (currentWaypoint1 + 1) % waypoints1.length;
      if (currentWaypoint1 === 0) waypoints1 = generateWaypoints();
    }
  }

  if (isIdle2) {
    targetX2 = waypoints2[currentWaypoint2].x;
    targetY2 = waypoints2[currentWaypoint2].y;
    if (distance(beeX2, beeY2, targetX2, targetY2) < 20) {
      currentWaypoint2 = (currentWaypoint2 + 1) % waypoints2.length;
      if (currentWaypoint2 === 0) waypoints2 = generateWaypoints();
    }
  }

  const prevBeeX1 = beeX1, prevBeeY1 = beeY1;
  const prevBeeX2 = beeX2, prevBeeY2 = beeY2;

  if (!isBee1Stunned) {
    beeX1 += (targetX1 - beeX1) * speed;
    beeY1 += (targetY1 - beeY1) * speed;
  } else {
    beeX1 += velocityX1;
    beeY1 += velocityY1;
    velocityX1 *= friction;
    velocityY1 *= friction;
    rotation1 += spinSpeed * (1 / 60);
  }
  if (!isBee2Stunned) {
    beeX2 += (targetX2 - beeX2) * speed;
    beeY2 += (targetY2 - beeY2) * speed;
  } else {
    beeX2 += velocityX2;
    beeY2 += velocityY2;
    velocityX2 *= friction;
    velocityY2 *= friction;
    rotation2 += spinSpeed * (1 / 60);
  }

  let scaleX1 = 1, scaleX2 = 1;
  if (beeX1 > prevBeeX1 + 1) scaleX1 = -1;
  else if (beeX1 < prevBeeX1 - 1) scaleX1 = 1;
  if (beeX2 > prevBeeX2 + 1) scaleX2 = -1;
  else if (beeX2 < prevBeeX2 - 1) scaleX2 = 1;

  if (
    (Math.abs(beeX1 - prevBeeX1) > 1 || Math.abs(beeY1 - prevBeeY1) > 1) &&
    currentTime - lastTrailTime1 > trailInterval
  ) {
    createTrail(beeX1 - beeSize1 / 4, beeY1 - beeSize1 / 4, trailElements1, beeSize1);
    lastTrailTime1 = currentTime;
  }
  if (
    (Math.abs(beeX2 - prevBeeX2) > 1 || Math.abs(beeY2 - prevBeeY2) > 1) &&
    currentTime - lastTrailTime2 > trailInterval
  ) {
    createTrail(beeX2 - beeSize2 / 4, beeY2 - beeSize2 / 4, trailElements2, beeSize2);
    lastTrailTime2 = currentTime;
  }

  const dist1 = distance(beeX1, beeY1, windowWidth / 2, windowHeight / 2);
  const dist2 = distance(beeX2, beeY2, windowWidth / 2, windowHeight / 2);
  if (isIdle1) {
    beeSize1 = updateSize(dist1);
  }
  if (isIdle2) {
    beeSize2 = updateSize(dist2);
  }

  if (beeSize1 > beeSize2) {
    bee1.style.zIndex = 10;
    bee2.style.zIndex = 5;
  } else {
    bee1.style.zIndex = 5;
    bee2.style.zIndex = 10;
  }

  bee1.style.transform = `translate(${beeX1 - beeSize1 / 2}px, ${
    beeY1 - beeSize1 / 2
  }px) scaleX(${scaleX1}) rotate(${rotation1}deg)`;
  bee1.style.width = `${beeSize1}px`;
  bee1.style.height = `${beeSize1}px`;
  number1.style.left = `${beeX1 - 10}px`;
  number1.style.top = `${beeY1 - beeSize1 / 2 - 15}px`;

  bee2.style.transform = `translate(${beeX2 - beeSize2 / 2}px, ${
    beeY2 - beeSize2 / 2
  }px) scaleX(${scaleX2}) rotate(${rotation2}deg)`;
  bee2.style.width = `${beeSize2}px`;
  bee2.style.height = `${beeSize2}px`;
  number2.style.left = `${beeX2 - 10}px`;
  number2.style.top = `${beeY2 - beeSize2 / 2 - 15}px`;

  checkCollision();
  requestAnimationFrame(animate);
}

initWebSocket();
animate();

let bee1 = document.querySelector(".bee1");
let bee2 = document.querySelector(".bee2");
let darkModeToggle = document.querySelector("#darkModeToggle");
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

// Bee management
let bees = [
  {
    element: bee1,
    x: windowWidth / 2,
    y: windowHeight / 2,
    targetX: windowWidth / 2,
    targetY: windowHeight / 2,
    size: 80,
    rotation: 0,
    velocityX: 0,
    velocityY: 0,
    isStunned: false,
    waypoints: [],
    currentWaypoint: 0,
    trailElements: [],
    lastTrailTime: 0,
    isOriginal: true
  },
  {
    element: bee2,
    x: windowWidth / 2 + 100,
    y: windowHeight / 2 + 100,
    targetX: windowWidth / 2 + 100,
    targetY: windowHeight / 2 + 100,
    size: 80,
    rotation: 0,
    velocityX: 0,
    velocityY: 0,
    isStunned: false,
    waypoints: [],
    currentWaypoint: 0,
    trailElements: [],
    lastTrailTime: 0,
    isOriginal: true
  }
];

// Parameters
const beeSpeed = 0.08;
const waypointCount = 5;
let trailLength = 15;
let trailInterval = 40;
const stunDuration = 1000;
const collisionDistance = 120;
const avoidanceDistance = 100;
const bounceStrength = 300;
const avoidanceStrength = 50;
const spinSpeed = 720; // 720 deg/s, 2 rotations in 1000ms
const friction = 0.95;
const minSize = 10;
const maxSize = 150;
const manualMaxSize = 500;
let lastMouseMove = Date.now();
const idleTimeout = 2000;
let isIdle = true;
let isHeartFlight = false;
let heartT = 0;
const heartSpeed = 0.15;
const heartDuration = 2000;
let heartStartTime = 0;
let forceCollision = false;
let splitCount = 0; // Track 'C' presses

// Generate waypoints
const generateWaypoints = (isSecondary = false, baseX = null, baseY = null) => {
  const waypoints = [];
  for (let i = 0; i < waypointCount; i++) {
    let x, y;
    if (isSecondary && baseX !== null && baseY !== null && Math.random() < 0.7) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * 300;
      x = baseX + Math.cos(angle) * radius;
      y = baseY + Math.sin(angle) * radius;
    } else {
      x = Math.random() * (windowWidth - 200) + 100;
      y = Math.random() * (windowHeight - 200) + 100;
    }
    waypoints.push({ x, y });
  }
  return waypoints;
};

// Initialize waypoints
bees[0].waypoints = generateWaypoints();
bees[1].waypoints = generateWaypoints(true, bees[0].targetX, bees[0].targetY);

// Calculate distance
const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Update size based on distance from center
const updateSize = (dist) => {
  const maxDistance = Math.sqrt(windowWidth * windowWidth + windowHeight * windowHeight) / 2;
  const size = maxSize - (dist / maxDistance) * (maxSize - minSize);
  return Math.max(minSize, size);
};

// Create new bee
const createBee = (parentBee) => {
  const element = document.createElement("div");
  element.className = "bee";
  element.style.backgroundImage = 'url("https://i.pinimg.com/originals/b2/1d/bd/b21dbd909e730c8dd7eea0421929eb68.gif")';
  document.body.appendChild(element);
  const totalBees = bees.length + 1;
  const size = 80 / (1 + Math.log2(totalBees)); // Shrink with more bees
  return {
    element,
    x: parentBee.x + (Math.random() - 0.5) * 20, // ±10px offset
    y: parentBee.y + (Math.random() - 0.5) * 20,
    targetX: parentBee.targetX,
    targetY: parentBee.targetY,
    size,
    rotation: 0,
    velocityX: 0,
    velocityY: 0,
    isStunned: false,
    waypoints: generateWaypoints(true, parentBee.x, parentBee.y),
    currentWaypoint: 0,
    trailElements: [],
    lastTrailTime: 0,
    isOriginal: false
  };
};

// Event listeners
document.addEventListener("mousemove", (event) => {
  if (!isHeartFlight) {
    bees[0].targetX = event.clientX;
    bees[0].targetY = event.clientY;
    lastMouseMove = Date.now();
    isIdle = false;
  }
});

document.addEventListener("touchmove", (event) => {
  if (!isHeartFlight) {
    event.preventDefault();
    if (event.touches.length > 0) {
      bees[0].targetX = event.touches[0].clientX;
      bees[0].targetY = event.touches[0].clientY;
      lastMouseMove = Date.now();
      isIdle = false;
    }
  }
}, { passive: false });

document.addEventListener("wheel", (event) => {
  if (!isHeartFlight) {
    const sizeChange = event.deltaY < 0 ? 10 : -10;
    bees[0].size = Math.min(manualMaxSize, Math.max(minSize, bees[0].size + sizeChange));
  }
});

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "a" && !isHeartFlight) {
    isHeartFlight = true;
    heartStartTime = Date.now();
    heartT = 0;
    bees.forEach(bee => {
      bee.size = 50;
      bee.rotation = 0;
      bee.velocityX = 0;
      bee.velocityY = 0;
      bee.isStunned = false;
    });
    trailLength = 20; // Reduced for visibility
    trailInterval = 10;
  } else if (key === "b" && !isHeartFlight && !bees.some(bee => bee.isStunned)) {
    bees.forEach((bee, index) => {
      bee.x = windowWidth / 2 + (index % 2 === 0 ? -5 : 5);
      bee.y = windowHeight / 2;
      bee.size = 80;
      bee.targetX = bee.x;
      bee.targetY = bee.y;
    });
    forceCollision = true;
  } else if (key === "c" && !isHeartFlight && splitCount < 3) {
    const newBees = [];
    bees.forEach(bee => {
      const newBee = createBee(bee);
      newBees.push(newBee);
    });
    bees = bees.concat(newBees);
    splitCount++; // Increment split counter
  } else if (key === "z" && !isHeartFlight) {
    bees.forEach(bee => {
      if (!bee.isOriginal) bee.element.remove();
    });
    bees = [
      {
        element: bee1,
        x: windowWidth / 2,
        y: windowHeight / 2,
        targetX: windowWidth / 2,
        targetY: windowHeight / 2,
        size: 80,
        rotation: 0,
        velocityX: 0,
        velocityY: 0,
        isStunned: false,
        waypoints: generateWaypoints(),
        currentWaypoint: 0,
        trailElements: [],
        lastTrailTime: 0,
        isOriginal: true
      },
      {
        element: bee2,
        x: windowWidth / 2 + 100,
        y: windowHeight / 2 + 100,
        targetX: windowWidth / 2 + 100,
        targetY: windowHeight / 2 + 100,
        size: 80,
        rotation: 0,
        velocityX: 0,
        velocityY: 0,
        isStunned: false,
        waypoints: generateWaypoints(true, windowWidth / 2, windowHeight / 2),
        currentWaypoint: 0,
        trailElements: [],
        lastTrailTime: 0,
        isOriginal: true
      }
    ];
    splitCount = 0; // Reset split counter
  }
});

darkModeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode", darkModeToggle.checked);
});

// Create trail elements
const createTrail = (x, y, elements, size) => {
  const trail = document.createElement("div");
  trail.className = "trail";
  const trailSize = isHeartFlight ? size * 0.6 : size * 0.3;
  trail.style.left = `${x}px`;
  trail.style.top = `${y}px`;
  trail.style.width = `${trailSize}px`;
  trail.style.height = `${trailSize}px`;
  if (isHeartFlight) {
    trail.style.filter = "blur(6px)";
    trail.style.opacity = "0.9";
    trail.style.background = "rgba(255, 215, 0, 0.8)";
  }
  document.body.appendChild(trail);
  elements.push(trail);
  const trailDuration = isHeartFlight ? 150 : 800;
  setTimeout(() => {
    trail.style.opacity = "0";
    trail.style.transition = "opacity 0.7s ease-out";
    setTimeout(() => {
      trail.remove();
      const index = elements.indexOf(trail);
      if (index !== -1) elements.splice(index, 1);
    }, 700);
  }, trailDuration - 700);
  if (elements.length > trailLength) {
    const oldTrail = elements.shift();
    oldTrail.remove();
  }
};

// Check collisions and avoidance
const checkCollision = () => {
  if (isHeartFlight) return;
  for (let i = 0; i < bees.length; i++) {
    for (let j = i + 1; j < bees.length; j++) {
      const beeA = bees[i];
      const beeB = bees[j];
      const dist = distance(beeA.x, beeA.y, beeB.x, beeB.y);
      // Intentional collision (B key or close with same size)
      if ((dist < collisionDistance && !beeA.isStunned && !beeB.isStunned && Math.abs(beeA.size - beeB.size) < 0.1) || forceCollision) {
        const angle = Math.atan2(beeB.y - beeA.y, beeB.x - beeA.x);
        beeA.velocityX = -Math.cos(angle) * bounceStrength * 0.05;
        beeA.velocityY = -Math.sin(angle) * bounceStrength * 0.05;
        beeB.velocityX = Math.cos(angle) * bounceStrength * 0.05;
        beeB.velocityY = Math.sin(angle) * bounceStrength * 0.05;
        beeA.isStunned = true;
        beeB.isStunned = true;
        setTimeout(() => {
          beeA.isStunned = false;
          beeB.isStunned = false;
          beeA.rotation = 0;
          beeB.rotation = 0;
          beeA.velocityX = 0;
          beeA.velocityY = 0;
          beeB.velocityX = 0;
          beeB.velocityY = 0;
        }, stunDuration);
      }
      // Avoidance for non-stunned bees
      if (dist < avoidanceDistance && !beeA.isStunned && !beeB.isStunned && !forceCollision) {
        const angle = Math.atan2(beeB.y - beeA.y, beeB.x - beeA.x);
        beeA.velocityX -= Math.cos(angle) * avoidanceStrength * 0.05;
        beeA.velocityY -= Math.sin(angle) * avoidanceStrength * 0.05;
        beeB.velocityX += Math.cos(angle) * avoidanceStrength * 0.05;
        beeB.velocityY += Math.sin(angle) * avoidanceStrength * 0.05;
      }
    }
  }
  forceCollision = false; // Reset after checking
};

// Heart-shaped path
const getHeartPosition = (t, offsetX = 0, offsetY = 0) => {
  const scale = 20;
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  let posX = windowWidth / 2 + x * scale + offsetX;
  let posY = windowHeight / 2 + y * scale + offsetY;
  // Ensure on-screen
  posX = Math.max(50, Math.min(windowWidth - 50, posX));
  posY = Math.max(50, Math.min(windowHeight - 50, posY));
  return { x: posX, y: posY };
};

// Animation loop
const animate = () => {
  const currentTime = Date.now();
  // Update window dimensions
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;

  if (isHeartFlight) {
    const elapsed = currentTime - heartStartTime;
    if (elapsed > heartDuration) {
      isHeartFlight = false;
      trailLength = 15;
      trailInterval = 40;
      isIdle = true;
      bees.forEach(bee => {
        bee.waypoints = generateWaypoints(!bee.isOriginal, bee.x, bee.y);
      });
    } else {
      heartT += heartSpeed;
      bees.forEach((bee, index) => {
        const pos = getHeartPosition(heartT + index * 2 * Math.PI / bees.length);
        bee.x = pos.x;
        bee.y = pos.y;
        // Apply transform immediately
        const scaleX = 1; // Fixed orientation for heart flight
        bee.element.style.transform = `translate(${bee.x - bee.size / 2}px, ${bee.y - bee.size / 2}px) scaleX(${scaleX}) rotate(${bee.rotation}deg)`;
        bee.element.style.width = `${bee.size}px`;
        bee.element.style.height = `${bee.size}px`;
        bee.element.style.zIndex = 100; // High zIndex
        if (currentTime - bee.lastTrailTime > trailInterval) {
          createTrail(bee.x - bee.size / 4, bee.y - bee.size / 4, bee.trailElements, bee.size);
          bee.lastTrailTime = currentTime;
        }
      });
      // Skip normal movement
      checkCollision();
      requestAnimationFrame(animate);
      return;
    }
  }

  // Normal movement
  if (currentTime - lastMouseMove > idleTimeout) {
    isIdle = true;
  }
  bees.forEach((bee, index) => {
    if (index === 0 && isIdle) {
      bee.targetX = bee.waypoints[bee.currentWaypoint].x;
      bee.targetY = bee.waypoints[bee.currentWaypoint].y;
      if (distance(bee.x, bee.y, bee.targetX, bee.targetY) < 20) {
        bee.currentWaypoint = (bee.currentWaypoint + 1) % bee.waypoints.length;
        if (bee.currentWaypoint === 0) bee.waypoints = generateWaypoints();
        if (index === 0) {
          bees.forEach((otherBee, otherIndex) => {
            if (otherIndex !== 0) {
              otherBee.waypoints = generateWaypoints(true, bee.targetX, bee.targetY);
            }
          });
        }
      }
    } else if (index !== 0) {
      bee.targetX = bee.waypoints[bee.currentWaypoint].x;
      bee.targetY = bee.waypoints[bee.currentWaypoint].y;
      if (distance(bee.x, bee.y, bee.targetX, bee.targetY) < 20) {
        bee.currentWaypoint = (bee.currentWaypoint + 1) % bee.waypoints.length;
        if (bee.currentWaypoint === 0) bee.waypoints = generateWaypoints(true, bees[0].x, bees[0].y);
      }
    }

    const prevX = bee.x, prevY = bee.y;
    if (!bee.isStunned && !isHeartFlight) {
      bee.x += (bee.targetX - bee.x) * beeSpeed;
      bee.y += (bee.targetY - bee.y) * beeSpeed;
    } else if (bee.isStunned) {
      bee.x += bee.velocityX;
      bee.y += bee.velocityY;
      bee.velocityX *= friction;
      bee.velocityY *= friction;
      bee.rotation += spinSpeed * (1 / 60);
    }

    // Clamp positions
    if (!isHeartFlight) {
      bee.x = Math.max(bee.size / 2, Math.min(windowWidth - bee.size / 2, bee.x));
      bee.y = Math.max(bee.size / 2, Math.min(windowHeight - bee.size / 2, bee.y));
    }

    let scaleX = 1;
    if (bee.x > prevX + 1) scaleX = -1;
    else if (bee.x < prevX - 1) scaleX = 1;

    if (!isHeartFlight) {
      if (
        (Math.abs(bee.x - prevX) > 1 || Math.abs(bee.y - prevY) > 1) &&
        currentTime - bee.lastTrailTime > trailInterval
      ) {
        createTrail(bee.x - bee.size / 4, bee.y - bee.size / 4, bee.trailElements, bee.size);
        bee.lastTrailTime = currentTime;
      }
    }

    const dist = distance(bee.x, bee.y, windowWidth / 2, windowHeight / 2);
    if ((index === 0 && isIdle && !isHeartFlight) || (index !== 0 && !isHeartFlight)) {
      if (!bee.isOriginal || index !== 0) {
        bee.size = updateSize(dist);
      }
    }

    bee.element.style.zIndex = Math.round(bee.size);
    bee.element.style.transform = `translate(${bee.x - bee.size / 2}px, ${bee.y - bee.size / 2}px) scaleX(${scaleX}) rotate(${bee.rotation}deg)`;
    bee.element.style.width = `${bee.size}px`;
    bee.element.style.height = `${bee.size}px`;
  });

  checkCollision();

  requestAnimationFrame(animate);
};

animate();
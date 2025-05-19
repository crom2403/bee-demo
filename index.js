const bee1 = document.querySelector(".bee1");
const bee2 = document.querySelector(".bee2");
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

// Initial positions
let targetX1 = windowWidth / 2;
let targetY1 = windowHeight / 2;
let targetX2 = windowWidth / 2 + 100;
let targetY2 = windowHeight / 2 + 100;
let beeX1 = targetX1, beeY1 = targetY1;
let beeX2 = targetX2, beeY2 = targetY2;
let beeSize1 = 20, beeSize2 = 20;
let minSize = 10;
let maxSize = 150; // Distance-based max size
let manualMaxSize = 500; // Manual max size for wheel adjustment
let rotation1 = 0, rotation2 = 0;

// Movement and trail parameters
const speed = 0.08; // Base speed for normal movement
let waypoints1 = [], waypoints2 = [];
const waypointCount = 5;
let currentWaypoint1 = 0, currentWaypoint2 = 0;
let trailLength = 15;
let trailInterval = 40;
let lastTrailTime1 = 0, lastTrailTime2 = 0;
const trailElements1 = [], trailElements2 = [];

// Collision and stun parameters
let isBee1Stunned = false, isBee2Stunned = false;
const stunDuration = 1500; // 1.5 seconds for stun
const collisionDistance = 120; // Increased for higher collision chance
const bounceStrength = 200;
const spinSpeed = 4800; // 7200 degrees / 1.5 seconds = 4800 deg/s for 20 rotations

// Idle and velocity parameters
let lastMouseMove = Date.now();
const idleTimeout = 2000; // 2 seconds of inactivity triggers idle mode
let isIdle1 = true; // Start in idle mode for bee1
let velocityX1 = 0, velocityY1 = 0;
let velocityX2 = 0, velocityY2 = 0;
const friction = 0.95; // Damping factor for bounce velocity

// Heart-shaped flight variables
let isHeartFlight = false;
let heartT = 0;
const heartSpeed = 0.1; // Reduced from 0.3 to 0.1 for slower heart animation
const heartDuration = 6000; // Increased from 2000 to 6000 (6 seconds) to complete heart
let heartStartTime = 0;

// Generate waypoints, with bee2 waypoints often near bee1
const generateWaypoints = (isBee2 = false, baseX = null, baseY = null) => {
  const waypoints = [];
  for (let i = 0; i < waypointCount; i++) {
    let x, y;
    if (isBee2 && baseX !== null && baseY !== null && Math.random() < 0.7) {
      // 70% chance bee2 waypoints are within 300px of bee1
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
waypoints1 = generateWaypoints();
waypoints2 = generateWaypoints(true, targetX1, targetY1);

// Calculate distance between two points
const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Update bee size based on distance from screen center
const updateSize = (dist) => {
  const maxDistance = Math.sqrt(windowWidth * windowWidth + windowHeight * windowHeight) / 2;
  const size = maxSize - (dist / maxDistance) * (maxSize - minSize);
  return Math.max(minSize, size);
};

// Event listeners for mouse, touch, and wheel
document.addEventListener("mousemove", (event) => {
  if (!isHeartFlight) {
    targetX1 = event.clientX;
    targetY1 = event.clientY;
    lastMouseMove = Date.now();
    isIdle1 = false;
  }
});

document.addEventListener("touchmove", (event) => {
  if (!isHeartFlight) {
    event.preventDefault();
    if (event.touches.length > 0) {
      targetX1 = event.touches[0].clientX;
      targetY1 = event.touches[0].clientY;
      lastMouseMove = Date.now();
      isIdle1 = false;
    }
  }
}, { passive: false });

document.addEventListener("wheel", (event) => {
  if (!isHeartFlight) {
    const sizeChange = event.deltaY < 0 ? 10 : -10;
    beeSize1 = Math.min(manualMaxSize, Math.max(minSize, beeSize1 + sizeChange));
  }
});

// Trigger heart-shaped flight on 'A' press
document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "a" && !isHeartFlight) {
    isHeartFlight = true;
    heartStartTime = Date.now();
    heartT = 0;
    waypoints1 = [...waypoints1];
    waypoints2 = [...waypoints2];
    trailLength = 100; // Increased from 50 to 100 for longer motion blur
    trailInterval = 5; // Decreased from 10 to 5 for denser trails
  }
});

// Create trail elements with enhanced blur effect
const createTrail = (x, y, elements, beeSize) => {
  const trail = document.createElement("div");
  trail.className = "trail";
  
  // Adjust trail size for heart flight mode
  const trailSize = isHeartFlight ? beeSize * 0.4 : beeSize * 0.3;
  
  trail.style.left = `${x}px`;
  trail.style.top = `${y}px`;
  trail.style.width = `${trailSize}px`;
  trail.style.height = `${trailSize}px`;
  
  // Add blur effect for heart flight mode
  if (isHeartFlight) {
    trail.style.filter = "blur(3px)";
    trail.style.opacity = "0.7"; // Slightly more visible trails
  }
  
  document.body.appendChild(trail);
  elements.push(trail);

  // Fade out effect with longer duration for heart flight
  const trailDuration = isHeartFlight ? 1500 : 800;
  
  setTimeout(() => {
    trail.style.opacity = "0";
    trail.style.transition = "opacity 0.5s ease-out";
    
    setTimeout(() => {
      trail.remove();
      const index = elements.indexOf(trail);
      if (index !== -1) elements.splice(index, 1);
    }, 500);
  }, trailDuration - 500);

  if (elements.length > trailLength) {
    const oldTrail = elements.shift();
    oldTrail.remove();
  }
};

// Check for collisions
function checkCollision() {
  if (isHeartFlight) return;
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

// Parametric heart curve, improved for smoother appearance
const getHeartPosition = (t, offsetX = 0, offsetY = 0) => {
  const scale = 40; // Increased from 30 for slightly larger heart
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return {
    x: windowWidth / 2 + x * scale + offsetX,
    y: windowHeight / 2 + y * scale + offsetY
  };
};

// Main animation loop
function animate() {
  const currentTime = Date.now();

  if (isHeartFlight) {
    const elapsed = currentTime - heartStartTime;
    if (elapsed > heartDuration) {
      isHeartFlight = false;
      trailLength = 15;
      trailInterval = 40;
      isIdle1 = true;
      waypoints1 = generateWaypoints();
      waypoints2 = generateWaypoints(true, beeX1, beeY1);
    } else {
      // Slower progression for heart path
      heartT += heartSpeed;
      const pos1 = getHeartPosition(heartT, 0, 0);
      beeX1 = pos1.x;
      beeY1 = pos1.y;
      const pos2 = getHeartPosition(heartT + Math.PI, 0, 0);
      beeX2 = pos2.x;
      beeY2 = pos2.y;
      
      // Always generate trails during heart flight, regardless of interval
      // This ensures a continuous trail effect
      if (currentTime - lastTrailTime1 > trailInterval) {
        createTrail(beeX1 - beeSize1 / 4, beeY1 - beeSize1 / 4, trailElements1, beeSize1);
        lastTrailTime1 = currentTime;
      }
      
      if (currentTime - lastTrailTime2 > trailInterval) {
        createTrail(beeX2 - beeSize2 / 4, beeY2 - beeSize2 / 4, trailElements2, beeSize2);
        lastTrailTime2 = currentTime;
      }
    }
  } else {
    if (currentTime - lastMouseMove > idleTimeout) {
      isIdle1 = true;
    }

    if (isIdle1) {
      targetX1 = waypoints1[currentWaypoint1].x;
      targetY1 = waypoints1[currentWaypoint1].y;
      if (distance(beeX1, beeY1, targetX1, targetY1) < 20) {
        currentWaypoint1 = (currentWaypoint1 + 1) % waypoints1.length;
        if (currentWaypoint1 === 0) waypoints1 = generateWaypoints();
        waypoints2 = generateWaypoints(true, targetX1, targetY1);
      }
    }

    targetX2 = waypoints2[currentWaypoint2].x;
    targetY2 = waypoints2[currentWaypoint2].y;
    if (distance(beeX2, beeY2, targetX2, targetY2) < 20) {
      currentWaypoint2 = (currentWaypoint2 + 1) % waypoints2.length;
      if (currentWaypoint2 === 0) waypoints2 = generateWaypoints(true, beeX1, beeY1);
    }
  }

  const prevBeeX1 = beeX1, prevBeeY1 = beeY1;
  const prevBeeX2 = beeX2, prevBeeY2 = beeY2;

  if (!isHeartFlight) {
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
  }

  let scaleX1 = 1, scaleX2 = 1;
  if (beeX1 > prevBeeX1 + 1) scaleX1 = -1;
  else if (beeX1 < prevBeeX1 - 1) scaleX1 = 1;
  if (beeX2 > prevBeeX2 + 1) scaleX2 = -1;
  else if (beeX2 < prevBeeX2 - 1) scaleX2 = 1;

  // Create trails during normal movement
  if (!isHeartFlight) {
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
  }

  const dist1 = distance(beeX1, beeY1, windowWidth / 2, windowHeight / 2);
  const dist2 = distance(beeX2, beeY2, windowWidth / 2, windowHeight / 2);
  if (isIdle1 && !isHeartFlight) {
    beeSize1 = updateSize(dist1);
  }
  beeSize2 = updateSize(dist2);

  if (beeSize1 > beeSize2) {
    bee1.style.zIndex = 10;
    bee2.style.zIndex = 5;
  } else {
    bee1.style.zIndex = 5;
    bee2.style.zIndex = 10;
  }

  bee1.style.transform = `translate(${beeX1 - beeSize1 / 2}px, ${beeY1 - beeSize1 / 2}px) scaleX(${scaleX1}) rotate(${rotation1}deg)`;
  bee1.style.width = `${beeSize1}px`;
  bee1.style.height = `${beeSize1}px`;
  bee2.style.transform = `translate(${beeX2 - beeSize2 / 2}px, ${beeY2 - beeSize2 / 2}px) scaleX(${scaleX2}) rotate(${rotation2}deg)`;
  bee2.style.width = `${beeSize2}px`;
  bee2.style.height = `${beeSize2}px`;

  checkCollision();

  requestAnimationFrame(animate);
}

// Add some CSS to improve trail appearance
const styleElement = document.createElement('style');
styleElement.textContent = `
  .trail {
    position: absolute;
    background-color: rgba(255, 220, 0, 0.4);
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 1;
  }
`;
document.head.appendChild(styleElement);

animate();

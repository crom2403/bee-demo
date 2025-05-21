let bee1 = document.querySelector(".bee1");
let bee2 = document.querySelector(".bee2");
let darkModeToggle = document.querySelector("#darkModeToggle");
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

// Flower management
let flowers = []; // Array to store active flower (only one at a time)
let lastFlowerDisappearTime = 0; // Time when last flower disappeared

// Function to create a new falling flower
const createFlower = () => {
    // Remove existing flower if present
    flowers.forEach(flower => {
        flower.element.remove();
        flower.isActive = false;
    });
    flowers = [];

    const flowerElement = document.createElement("div");
    flowerElement.className = "flower";
    flowerElement.style.backgroundImage = 'url("https://i.pinimg.com/originals/ab/5a/0e/ab5a0e2686b7d63cc6c9cf698295de46.gif")';
    document.body.appendChild(flowerElement);
    const x = Math.random() * (windowWidth - 40);
    flowers.push({
        element: flowerElement,
        baseX: x,
        x: x,
        y: -40,
        velocityX: 0,
        velocityY: 0,
        isActive: true,
        speed: 1, // Halved from 2 for twice slower fall
        swayAmplitude: 50,
        swayFrequency: 0.005
    });
};

// Check if a new flower can be created every 30 seconds
setInterval(() => {
    const now = Date.now();
    if (flowers.length === 0 && (lastFlowerDisappearTime === 0 || now - lastFlowerDisappearTime >= 30000)) {
        createFlower();
    }
}, 30000);
createFlower(); // Create initial flower

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
const beeSpeed = 0.03;
const waypointCount = 5;
let trailLength = 15;
let trailInterval = 30;
const stunDuration = 1000;
const collisionDistance = 120;
const avoidanceDistance = 100;
const bounceStrength = 300;
const avoidanceStrength = 50;
const spinSpeed = 720;
const friction = 0.95;
const minSize = 10;
const maxSize = 200;
const manualMaxSize = 2000;
let lastMouseMove = Date.now();
const idleTimeout = 2000;
let isIdle = true;
let isHeartFlight = false;
let heartT = 0;
const heartSpeed = 0.15;
const heartDuration = 2000;
let heartStartTime = 0;
let forceCollision = false;
let splitCount = 0;
const flowerRadius = 30;
const flowerHitRadius = 60;
const flowerBounceStrength = 4;
const gravity = 0.05; // Halved from 0.1 for twice slower fall

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
    const size = 80 / (1 + Math.log2(totalBees));
    return {
        element,
        x: parentBee.x + (Math.random() - 0.5) * 20,
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
        trailLength = 20;
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
        splitCount++;
    } else if (key === "d") {
        createFlower(); // Create a new flower immediately when 'D' is pressed
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
        splitCount = 0;
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
            if (dist < avoidanceDistance && !beeA.isStunned && !beeB.isStunned && !forceCollision) {
                const angle = Math.atan2(beeB.y - beeA.y, beeB.x - beeA.x);
                beeA.velocityX -= Math.cos(angle) * avoidanceStrength * 0.05;
                beeA.velocityY -= Math.sin(angle) * avoidanceStrength * 0.05;
                beeB.velocityX += Math.cos(angle) * avoidanceStrength * 0.05;
                beeB.velocityY += Math.sin(angle) * avoidanceStrength * 0.05;
            }
        }
    }
    forceCollision = false;
};

// Check bee-flower collision
const checkBeeFlowerCollision = () => {
    if (flowers.length === 0 || isHeartFlight) return;
    const bee = bees[0];
    const flower = flowers[0];
    const dist = distance(bee.x, bee.y, flower.x, flower.y);
    if (dist < flowerHitRadius && !bee.isStunned) {
        const dx = bee.x - flower.x;
        const dy = bee.y - flower.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;
        const normalizedDx = dx / magnitude;
        const normalizedDy = dy / magnitude;
        flower.velocityX = normalizedDx * flowerBounceStrength;
        flower.velocityY = -Math.abs(normalizedDy * flowerBounceStrength);
    }
};

// Heart-shaped path
const getHeartPosition = (t, offsetX = 0, offsetY = 0) => {
    const scale = 20;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    let posX = windowWidth / 2 + x * scale + offsetX;
    let posY = windowHeight / 2 + y * scale + offsetY;
    posX = Math.max(50, Math.min(windowWidth - 50, posX));
    posY = Math.max(50, Math.min(windowHeight - 50, posY));
    return { x: posX, y: posY };
};

// Animation loop
const animate = () => {
    const now = Date.now();

    // Update flower position with physics
    flowers.forEach(flower => {
        if (flower.isActive) {
            flower.x += flower.velocityX;
            flower.y += flower.velocityY;
            flower.velocityY += gravity;
            flower.velocityX *= 0.98;
            if (Math.abs(flower.velocityY) < 0.5) {
                const swayOffset = Math.sin(now * flower.swayFrequency) * flower.swayAmplitude;
                flower.x = flower.baseX + swayOffset;
            }
            flower.element.style.transform = `translate(${flower.x}px, ${flower.y}px)`;
            if (flower.y > windowHeight) {
                flower.isActive = false;
                flower.element.remove();
                flowers = [];
                lastFlowerDisappearTime = now; // Record disappearance time
            }
        }
    });

    // Update window dimensions
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    // Update bee targets
    bees.forEach((bee, index) => {
        if (flowers.length > 0 && !isHeartFlight && index !== 0) {
            const latestFlower = flowers[0];
            const flowerX = latestFlower.x;
            const flowerY = latestFlower.y;
            const angle = (index * 2 * Math.PI) / bees.length;
            bee.targetX = flowerX + Math.cos(angle) * flowerRadius;
            bee.targetY = flowerY + Math.sin(angle) * flowerRadius;
            bee.size = 30;
        } else if (isIdle || index > 0) {
            const currentWaypoint = bee.waypoints[bee.currentWaypoint];
            bee.targetX = currentWaypoint.x;
            bee.targetY = currentWaypoint.y;
            if (distance(bee.x, bee.y, currentWaypoint.x, currentWaypoint.y) < 50) {
                bee.currentWaypoint = (bee.currentWaypoint + 1) % bee.waypoints.length;
                if (bee.currentWaypoint === 0) {
                    bee.waypoints = generateWaypoints(!bee.isOriginal, bees[0].x, bees[0].y);
                }
            }
        }
    });

    if (isHeartFlight) {
        const elapsed = now - heartStartTime;
        if (elapsed > heartDuration) {
            isHeartFlight = false;
            trailLength = 15;
            trailInterval = 30;
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
                const scaleX = 1;
                bee.element.style.transform = `translate(${bee.x - bee.size / 2}px, ${bee.y - bee.size / 2}px) scaleX(${scaleX}) rotate(${bee.rotation}deg)`;
                bee.element.style.width = `${bee.size}px`;
                bee.element.style.height = `${bee.size}px`;
                bee.element.style.zIndex = 100;
                if (now - bee.lastTrailTime > trailInterval) {
                    createTrail(bee.x - bee.size / 4, bee.y - bee.size / 4, bee.trailElements, bee.size);
                    bee.lastTrailTime = now;
                }
            });
            checkCollision();
            requestAnimationFrame(animate);
            return;
        }
    }

    // Normal movement
    const currentTime = Date.now();
    if (currentTime - lastMouseMove > idleTimeout) {
        isIdle = true;
    }
    bees.forEach((bee, index) => {
        const prevX = bee.x, prevY = bee.y;
        if (!bee.isStunned && !isHeartFlight) {
            const speed = flowers.length > 0 && index !== 0 ? beeSpeed * 1.5 : beeSpeed;
            bee.x += (bee.targetX - bee.x) * speed;
            bee.y += (bee.targetY - bee.y) * speed;
        } else if (bee.isStunned) {
            bee.x += bee.velocityX;
            bee.y += bee.velocityY;
            bee.velocityX *= friction;
            bee.velocityY *= friction;
            bee.rotation += spinSpeed * (1 / 60);
        }

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
        if ((index === 0 && isIdle && !isHeartFlight && flowers.length === 0) || (index !== 0 && !isHeartFlight && flowers.length === 0)) {
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
    checkBeeFlowerCollision();

    requestAnimationFrame(animate);
};

animate();
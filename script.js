let bee1 = document.querySelector(".bee1");
let bee2 = document.querySelector(".bee2");
let number1 = document.querySelector(".number1");
let number2 = document.querySelector(".number2");
let darkModeToggle = document.querySelector("#darkModeToggle");
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

// Flower management
let flowers = [];
let lastFlowerDisappearTime = 0;

const createFlower = () => {
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
        speed: 1,
        swayAmplitude: 50,
        swayFrequency: 0.005
    });
};

setInterval(() => {
    const now = Date.now();
    if (flowers.length === 0 && (lastFlowerDisappearTime === 0 || now - lastFlowerDisappearTime >= 30000)) {
        createFlower();
    }
}, 30000);
createFlower();

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
        isFalling: false,
        isFlipped: false,
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
        isFalling: false,
        isFlipped: false,
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
const gravity = 0.05;
const jumpVelocity = -10;
const fastFallGravity = 0.2;

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

// Bubble management
let bubbles = [];
const minBubbleSize = 20;
const maxBubbleSize = 200;
const growthRate = 100;

function createExplosion(x, y) {
    const baseHue = Math.random() * 360;
    const sparkColors = [
        `hsl(${baseHue}, 100%, 70%)`,
        `hsl(${(baseHue + 30) % 360}, 100%, 70%)`,
        `hsl(${(baseHue - 30 + 360) % 360}, 100%, 80%)`
    ];
    const glowColors = [
        `hsl(${(baseHue + 60) % 360}, 80%, 60%)`,
        `hsl(${(baseHue - 60 + 360) % 360}, 80%, 60%)`,
        `rgba(255, 255, 255, 0.8)`
    ];

    const bursts = [
        { count: 30, sparkSize: 4, glowSize: 12, velocity: 15, delay: 0 },
        { count: 20, sparkSize: 3, glowSize: 10, velocity: 12, delay: 150 },
        { count: 15, sparkSize: 2, glowSize: 8, velocity: 10, delay: 300 }
    ];

    bursts.forEach(burst => {
        setTimeout(() => {
            // Sparks
            for (let i = 0; i < burst.count; i++) {
                const angle = (i / burst.count) * 360 + (Math.random() * 10 - 5);
                const velocity = burst.velocity * (0.8 + Math.random() * 0.4);
                const size = burst.sparkSize * (0.8 + Math.random() * 0.4);
                const rotation = Math.random() * 360;

                const spark = document.createElement('div');
                spark.className = 'particle spark';
                spark.style.left = x + 'px';
                spark.style.top = y + 'px';
                spark.style.width = size + 'px';
                spark.style.height = size + 'px';

                const sparkColor = sparkColors[Math.floor(Math.random() * sparkColors.length)];
                spark.style.background = sparkColor;
                spark.style.boxShadow = `0 0 ${size * 5}px ${size / 2}px ${sparkColor}`;

                const tx = Math.cos(angle * Math.PI / 180) * velocity * 20;
                const ty = Math.sin(angle * Math.PI / 180) * velocity * 20;

                spark.style.setProperty('--tx', `${tx}px`);
                spark.style.setProperty('--ty', `${ty}px`);
                spark.style.setProperty('--rotation', `${rotation}deg`);
                spark.style.setProperty('--final-scale', 0.1 + Math.random() * 0.2);

                const duration = 1 + Math.random() * 0.5;
                spark.style.animation = `explode ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards, flicker 0.15s ease-in-out infinite`;

                spark.style.zIndex = '1000';
                document.body.appendChild(spark);
                setTimeout(() => spark.remove(), duration * 1000);
            }

            // Glows
            for (let i = 0; i < Math.floor(burst.count / 2); i++) {
                const angle = (i / (burst.count / 2)) * 360 + (Math.random() * 15 - 7.5);
                const velocity = burst.velocity * (0.6 + Math.random() * 0.3);
                const size = burst.glowSize * (0.8 + Math.random() * 0.4);
                const rotation = Math.random() * 360;

                const glow = document.createElement('div');
                glow.className = 'particle glow';
                glow.style.left = x + 'px';
                glow.style.top = y + 'px';
                glow.style.width = size + 'px';
                glow.style.height = size + 'px';

                const glowColor = glowColors[Math.floor(Math.random() * glowColors.length)];
                glow.style.background = `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`;
                glow.style.filter = 'blur(2px)';

                const tx = Math.cos(angle * Math.PI / 180) * velocity * 15;
                const ty = Math.sin(angle * Math.PI / 180) * velocity * 15;

                glow.style.setProperty('--tx', `${tx}px`);
                glow.style.setProperty('--ty', `${ty}px`);
                glow.style.setProperty('--rotation', `${rotation}deg`);
                glow.style.setProperty('--final-scale', 0.2 + Math.random() * 0.3);

                const duration = 1.2 + Math.random() * 0.6;
                glow.style.animation = `explode ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;

                glow.style.zIndex = '999';
                document.body.appendChild(glow);
                setTimeout(() => glow.remove(), duration * 1000);
            }
        }, burst.delay);
    });
}

let isCreatingBubble = false;
let currentBubble = null;
let bubbleStartTime = 0;

document.addEventListener('mousedown', (event) => {
    isCreatingBubble = true;
    bubbleStartTime = Date.now();

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.style.left = event.clientX + 'px';
    bubble.style.top = event.clientY + 'px';
    
    bubble.style.width = minBubbleSize + 'px';
    bubble.style.height = minBubbleSize + 'px';
    
    const hue = Math.random() * 360;
    bubble.style.background = `radial-gradient(circle at 30% 30%, 
        rgba(255, 255, 255, 0.9) 5%,
        rgba(255, 255, 255, 0.5) 15%,
        hsla(${hue}, 70%, 70%, 0.3) 40%,
        hsla(${hue}, 70%, 70%, 0.2) 80%)`;
    
    document.body.appendChild(bubble);

    currentBubble = {
        element: bubble,
        x: event.clientX,
        y: event.clientY,
        size: minBubbleSize,
        velocityX: 0,
        velocityY: 0,
        popped: false,
        hue: hue
    };
});

document.addEventListener('mouseup', () => {
    if (isCreatingBubble && currentBubble) {
        isCreatingBubble = false;
        
        const sizeRatio = (currentBubble.size - minBubbleSize) / (maxBubbleSize - minBubbleSize);
        currentBubble.velocityX = (Math.random() - 0.5) * 2 * (1 + sizeRatio);
        currentBubble.velocityY = -Math.random() * 2 - 1 - sizeRatio;
        
        bubbles.push(currentBubble);
        currentBubble = null;
    }
});

document.addEventListener('mousemove', (event) => {
    if (isCreatingBubble && currentBubble) {
        const holdTime = Date.now() - bubbleStartTime;
        const newSize = Math.min(maxBubbleSize, minBubbleSize + (holdTime / 1000) * growthRate);
        
        currentBubble.size = newSize;
        currentBubble.x = event.clientX;
        currentBubble.y = event.clientY;
        
        currentBubble.element.style.width = newSize + 'px';
        currentBubble.element.style.height = newSize + 'px';
        currentBubble.element.style.left = event.clientX + 'px';
        currentBubble.element.style.top = event.clientY + 'px';
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'z') {
        bubbles.forEach(bubble => {
            if (!bubble.popped) {
                createExplosion(bubble.x, bubble.y);
                bubble.element.remove();
            }
        });
        bubbles = [];
    }
});

function checkBubbleCollisions() {
    bubbles.forEach((bubble1, index1) => {
        if (bubble1.popped) return;

        bubble1.x += bubble1.velocityX;
        bubble1.y += bubble1.velocityY;

        if (bubble1.x - bubble1.size/2 < 0 || bubble1.x + bubble1.size/2 > windowWidth) {
            bubble1.velocityX *= -0.8;
            bubble1.x = Math.max(bubble1.size/2, Math.min(windowWidth - bubble1.size/2, bubble1.x));
        }
        if (bubble1.y - bubble1.size/2 < 0 || bubble1.y + bubble1.size/2 > windowHeight) {
            bubble1.velocityY *= -0.8;
            bubble1.y = Math.max(bubble1.size/2, Math.min(windowHeight - bubble1.size/2, bubble1.y));
        }

        bubbles.forEach((bubble2, index2) => {
            if (index1 !== index2 && !bubble2.popped) {
                const dx = bubble2.x - bubble1.x;
                const dy = bubble2.y - bubble1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = (bubble1.size + bubble2.size) / 2;

                if (distance < minDistance) {
                    const angle = Math.atan2(dy, dx);
                    const targetX = bubble1.x + Math.cos(angle) * minDistance;
                    const targetY = bubble1.y + Math.sin(angle) * minDistance;
                    
                    const ax = (targetX - bubble2.x) * 0.05;
                    const ay = (targetY - bubble2.y) * 0.05;
                    
                    const tempVx = bubble1.velocityX;
                    const tempVy = bubble1.velocityY;
                    
                    bubble1.velocityX = bubble2.velocityX * 0.8 + (Math.random() - 0.5) * 0.5;
                    bubble1.velocityY = bubble2.velocityY * 0.8 + (Math.random() - 0.5) * 0.5;
                    bubble2.velocityX = tempVx * 0.8 + (Math.random() - 0.5) * 0.5;
                    bubble2.velocityY = tempVy * 0.8 + (Math.random() - 0.5) * 0.5;
                    
                    bubble1.velocityX -= ax;
                    bubble1.velocityY -= ay;
                    bubble2.velocityX += ax;
                    bubble2.velocityY += ay;
                }
            }
        });

        bubble1.velocityY += gravity;
        bubble1.velocityX *= 0.995;
        bubble1.velocityY *= 0.995;

        bubble1.element.style.left = bubble1.x + 'px';
        bubble1.element.style.top = bubble1.y + 'px';

        bees.forEach(bee => {
            const dx = bee.x - bubble1.x;
            const dy = bee.y - bubble1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (bee.size / 2 + bubble1.size / 2) * 0.8) {
                createExplosion(bubble1.x, bubble1.y);
                bubble1.element.classList.add('bubble-pop');
                bubble1.popped = true;

                setTimeout(() => {
                    if (bubble1.element.parentNode) {
                        document.body.removeChild(bubble1.element);
                        bubbles = bubbles.filter(b => b !== bubble1);
                    }
                }, 300);
            }
        });
    });
}

bees[0].waypoints = generateWaypoints();
bees[1].waypoints = generateWaypoints(true, bees[0].targetX, bees[0].targetY);

const distance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

const updateSize = (dist) => {
    const maxDistance = Math.sqrt(windowWidth * windowWidth + windowHeight * windowHeight) / 2;
    const size = maxSize - (dist / maxDistance) * (maxSize - minSize);
    return Math.max(minSize, size);
};

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
        isFalling: false,
        isFlipped: false,
        waypoints: generateWaypoints(true, parentBee.x, parentBee.y),
        currentWaypoint: 0,
        trailElements: [],
        lastTrailTime: 0,
        isOriginal: false
    };
};

document.addEventListener("mousemove", (event) => {
    if (!isHeartFlight && !bees[0].isFalling) {
        bees[0].targetX = event.clientX;
        bees[0].targetY = event.clientY;
        lastMouseMove = Date.now();
        isIdle = false;
    }
});

document.addEventListener("touchmove", (event) => {
    if (!isHeartFlight && !bees[0].isFalling) {
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
    if (!isHeartFlight && !bees[0].isFalling) {
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
            bee.isFalling = false;
            bee.isFlipped = false;
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
            bee.isFalling = false;
            bee.isFlipped = false;
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
        createFlower();
    } else if (key === "e" && !isHeartFlight) {
        bees.forEach(bee => {
            if (!bee.isStunned) {
                bee.isFalling = true;
                bee.isFlipped = true;
                bee.velocityX = 0;
                bee.velocityY = 0;
                bee.rotation = 0;
            }
        });
    } else if (key === "f" && !isHeartFlight) {
        bees.forEach(bee => {
            if (!bee.isStunned) {
                bee.isFalling = true;
                bee.isFlipped = false;
                bee.velocityY = jumpVelocity;
                bee.velocityX = 0;
                bee.rotation = 0;
            }
        });
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
                isFalling: false,
                isFlipped: false,
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
                isFalling: false,
                isFlipped: false,
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
                beeA.isFalling = false;
                beeA.isFlipped = false;
                beeB.isFalling = false;
                beeB.isFlipped = false;
                setTimeout(() => {
                    beeA.isStunned = false;
                    beeB.isStunned = false;
                    beeA.rotation = 0;
                    beeB.rotation = 0;
                    beeA.velocityX = 0;
                    beeB.velocityX = 0;
                    beeA.velocityY = 0;
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

const checkBeeFlowerCollision = () => {
    if (flowers.length === 0 || isHeartFlight) return;
    const bee = bees[0];
    const flower = flowers[0];
    const dist = distance(bee.x, bee.y, flower.x, flower.y);
    if (dist < flowerHitRadius && !bee.isStunned && !bee.isFalling) {
        const dx = bee.x - flower.x;
        const dy = bee.y - flower.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;
        const normalizedDx = dx / magnitude;
        const normalizedDy = dy / magnitude;
        flower.velocityX = normalizedDx * flowerBounceStrength;
        flower.velocityY = -Math.abs(normalizedDy * flowerBounceStrength);
    }
};

const getHeartPosition = (t, offsetX = 0, offsetY = 0) => {
    const scale = 20 * 0.8;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    let posX = windowWidth / 2 + x * scale + offsetX;
    let posY = windowHeight / 2 + y * scale + offsetY;
    posX = Math.max(50, Math.min(windowWidth - 50, posX));
    posY = Math.max(50, Math.min(windowHeight - 50, posY));
    return { x: posX, y: posY };
};

const animate = () => {
    const now = Date.now();

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
                lastFlowerDisappearTime = now;
            }
        }
    });

    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    bees.forEach((bee, index) => {
        if (flowers.length > 0 && !isHeartFlight && index !== 0 && !bee.isFalling) {
            const latestFlower = flowers[0];
            const flowerX = latestFlower.x;
            const flowerY = latestFlower.y;
            const angle = (index * 2 * Math.PI) / bees.length;
            bee.targetX = flowerX + Math.cos(angle) * flowerRadius;
            bee.targetY = flowerY + Math.sin(angle) * flowerRadius;
            bee.size = 30;
        } else if ((isIdle || index > 0) && !isHeartFlight && !bee.isFalling) {
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

    checkBubbleCollisions();

    if (isHeartFlight) {
        const elapsed = now - heartStartTime;
        if (elapsed > heartDuration) {
            isHeartFlight = false;
            trailLength = 15;
            trailInterval = 30;
            isIdle = true;
            bees.forEach(bee => {
                bee.waypoints = generateWaypoints(!bee.isOriginal, bee.x, bee.y);
                bee.isFalling = false;
                bee.isFlipped = false;
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
            requestAnimationFrame(animate);
            return;
        }
    }

    const currentTime = Date.now();
    if (currentTime - lastMouseMove > idleTimeout) {
        isIdle = true;
    }
    bees.forEach((bee, index) => {
        const prevX = bee.x, prevY = bee.y;
        if (!bee.isStunned && !isHeartFlight && !bee.isFalling) {
            const speed = flowers.length > 0 && index !== 0 ? beeSpeed * 1.5 : beeSpeed;
            bee.x += (bee.targetX - bee.x) * speed;
            bee.y += (bee.targetY - bee.y) * speed;
        } else if (bee.isStunned) {
            bee.x += bee.velocityX;
            bee.y += bee.velocityY;
            bee.velocityX *= friction;
            bee.velocityY *= friction;
            bee.rotation += spinSpeed * (1 / 60);
        } else if (bee.isFalling) {
            bee.x += bee.velocityX;
            bee.y += bee.velocityY;
            if (bee.velocityY < 0) {
                bee.velocityY += gravity;
                if (bee.y < bee.size / 2) {
                    bee.y = bee.size / 2;
                    bee.velocityY = 0;
                }
            } else {
                bee.velocityY += fastFallGravity;
            }
            bee.velocityX *= friction;
            if (bee.y > windowHeight - bee.size / 2) {
                bee.y = windowHeight - bee.size / 2;
                bee.velocityY = 0;
                bee.isFalling = false;
                bee.isFlipped = false;
            }
            if (bee.x < bee.size / 2 || bee.x > windowWidth - bee.size / 2) {
                bee.velocityX *= -0.8;
                bee.x = Math.max(bee.size / 2, Math.min(windowWidth - bee.size / 2, bee.x));
            }
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
        if ((index === 0 && isIdle && !isHeartFlight && flowers.length === 0 && !bee.isFalling) || 
            (index !== 0 && !isHeartFlight && flowers.length === 0 && !bee.isFalling)) {
            if (!bee.isOriginal || index !== 0) {
                bee.size = updateSize(dist);
            }
        }

        const flipTransform = bee.isFlipped ? ' rotateZ(180deg)' : '';
        bee.element.style.zIndex = Math.round(bee.size);
        bee.element.style.transform = `translate(${bee.x - bee.size / 2}px, ${bee.y - bee.size / 2}px) scaleX(${scaleX}) rotate(${bee.rotation}deg)${flipTransform}`;
        bee.element.style.width = `${bee.size}px`;
        bee.element.style.height = `${bee.size}px`;
    });

    checkCollision();
    checkBeeFlowerCollision();

    requestAnimationFrame(animate);
};

animate();
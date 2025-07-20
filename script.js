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
    // Chỉ xóa hoa cũ nếu có hoa đang tồn tại
    if (flowers.length > 0) {
        flowers.forEach(flower => {
            if (flower.element && flower.element.parentNode) {
                flower.element.remove();
            }
            flower.isActive = false;
        });
        flowers = [];
    }
    
    // Kiểm tra thời gian từ lần hoa cuối cùng biến mất
    const now = Date.now();
    if (now - lastFlowerDisappearTime < 3000) { // Tối thiểu 3 giây mới tạo hoa mới
        const remainingTime = 3000 - (now - lastFlowerDisappearTime);
        setTimeout(createFlower, remainingTime);
        return;
    }

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

// Tạo hoa đầu tiên ngay khi trang web tải xong
setTimeout(() => {
    createFlower();
    
    // Sau đó cứ mỗi 30 giây kiểm tra và tạo hoa mới nếu cần
    setInterval(() => {
        if (flowers.length === 0) {
            createFlower();
        }
    }, 30000);
}, 1000); // Đợi 1 giây sau khi tải trang rồi mới tạo hoa đầu tiên

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
let beeSpeed = 0.03;
const defaultBeeSpeed = 0.03;
const boostedBeeSpeed = 0.1; // Tốc độ bay nhanh hơn khi chạm hoa
let speedBoostEndTime = 0;
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
let bubbleCounter = 1; // Tracks bubble numbers internally

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
        number: bubbleCounter,
        x: event.clientX,
        y: event.clientY,
        size: minBubbleSize,
        velocityX: 0,
        velocityY: 0,
        popped: false,
        hue: hue
    };

    bubbleCounter++;
});

document.addEventListener('mouseup', () => {
    if (isCreatingBubble && currentBubble) {
        isCreatingBubble = false;
        
        // Check if adding this bubble would exceed 5
        if (bubbles.length >= 5) {
            const oldestBubble = bubbles.shift(); // Remove the oldest bubble
            if (!oldestBubble.popped) {
                createExplosion(oldestBubble.x, oldestBubble.y);
                oldestBubble.element.classList.add('bubble-pop');
                oldestBubble.popped = true;
                setTimeout(() => {
                    if (oldestBubble.element.parentNode) {
                        document.body.removeChild(oldestBubble.element);
                    }
                }, 300);
            }
        }

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
        currentBubble.element.style.left = currentBubble.x + 'px';
        currentBubble.element.style.top = currentBubble.y + 'px';
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
        bubbleCounter = 1; // Reset counter
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

// Thêm 1 con ong mới
const addNewBee = () => {
    const newBee = createBee(bees[0]); // Tạo ong mới dựa trên ong đầu tiên
    bees.push(newBee);
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
    
    // Kiểm tra va chạm cho tất cả các con ong
    bees.forEach(bee => {
        if (bee.isStunned || bee.isFalling) return;
        
        const flower = flowers[0];
        const dist = distance(bee.x, bee.y, flower.x, flower.y);
        const hitRadius = 60; // Bán kính va chạm
        
        if (dist < hitRadius) {
            // Tăng tốc độ bay cho ong
            beeSpeed = boostedBeeSpeed;
            speedBoostEndTime = Date.now() + 2000; // Tăng tốc trong 2 giây
            
            // Làm hoa bay lên
            const dx = bee.x - flower.x;
            const dy = bee.y - flower.y;
            const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;
            const normalizedDx = dx / magnitude;
            const normalizedDy = dy / magnitude;
            
            // Giảm lực đẩy để hoa bay chậm hơn
            flower.velocityX = normalizedDx * 3; // Giảm lực đẩy ngang
            flower.velocityY = -4; // Giảm lực đẩy lên
        }
    });
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
            // Cập nhật vị trí hoa
            flower.x += flower.velocityX;
            flower.y += flower.velocityY;
            
            // Giảm trọng lực để hoa rơi chậm hơn (bằng 1/2 so với trước)
            flower.velocityY += 0.1; // Giảm trọng lực
            
            // Thêm hiệu ứng đung đưa khi rơi
            const swingAmount = 0.5; // Biên độ đung đưa
            const swingSpeed = 0.005; // Tốc độ đung đưa
            const swingOffset = Math.sin(now * swingSpeed) * swingAmount;
            
            // Giảm dần vận tốc ngang và thêm đung đưa
            flower.velocityX = (flower.velocityX * 0.95) + swingOffset;
            
            // Giới hạn vận tốc tối đa
            const maxSpeed = 20;
            const speed = Math.sqrt(flower.velocityX * flower.velocityX + flower.velocityY * flower.velocityY);
            if (speed > maxSpeed) {
                flower.velocityX = (flower.velocityX / speed) * maxSpeed;
                flower.velocityY = (flower.velocityY / speed) * maxSpeed;
            }
            
            // Kiểm tra va chạm với biên màn hình
            if (flower.x < 0) {
                flower.x = 0;
                flower.velocityX = Math.abs(flower.velocityX) * 0.7; // Đổi hướng và giảm tốc
            } else if (flower.x > windowWidth) {
                flower.x = windowWidth;
                flower.velocityX = -Math.abs(flower.velocityX) * 0.7;
            }
            
            // Cập nhật vị trí hiển thị
            flower.element.style.transform = `translate(${flower.x}px, ${flower.y}px)`;
            
            // Kiểm tra nếu hoa rơi ra khỏi đáy màn hình hoặc bay lên quá cao
            if (flower.y > windowHeight + 100 || flower.y < -100) {
                flower.isActive = false;
                flower.element.remove();
                flowers = flowers.filter(f => f !== flower);
                lastFlowerDisappearTime = now;
                
                // Tự động tạo hoa mới sau 30 giây
                if (flowers.length === 0) {
                    setTimeout(createFlower, 30000);
                }
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
            
            // Chỉ bay theo hoa khi hoa đang ở trong khung hình hoặc đang rơi xuống
            const isFlowerInView = flowerY > 0 && flowerY < windowHeight;
            const isFlowerFalling = latestFlower.velocityY > 0; // velocityY > 0 có nghĩa là đang rơi xuống
            
            if (isFlowerInView || isFlowerFalling) {
                const angle = (index * 2 * Math.PI) / bees.length;
                bee.targetX = flowerX + Math.cos(angle) * flowerRadius;
                bee.targetY = flowerY + Math.sin(angle) * flowerRadius;
                bee.size = 30;
            }
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
    if (Date.now() > speedBoostEndTime) {
        beeSpeed = defaultBeeSpeed;
    }

    bees.forEach((bee, index) => {
        const prevX = bee.x, prevY = bee.y;
        if (!bee.isStunned && !isHeartFlight && !bee.isFalling) {
            // Tăng tốc độ bay nếu là ong thứ nhất (bay theo chuột) và đang trong thời gian tăng tốc
            const speed = (index === 0 && beeSpeed === boostedBeeSpeed) ? beeSpeed * 1.5 : 
                         (flowers.length > 0 && index !== 0) ? beeSpeed * 1.5 : beeSpeed;
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
function createParticle(x, y, size, directionX, directionY, index, total) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Smaller particles at the end of the trail
    const sizeMultiplier = 0.2 + (0.8 * (total - index) / total);
    const particleSize = size * (0.1 + Math.random() * 0.2) * sizeMultiplier;
    
    particle.style.width = `${particleSize}px`;
    particle.style.height = `${particleSize}px`;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    // Calculate opacity based on position in trail
    const opacity = 0.1 + (0.7 * (total - index) / total);
    particle.style.opacity = opacity;
    
    document.body.appendChild(particle);
    
    // Calculate end position slightly behind the star
    const distance = 5 + Math.random() * 10;
    const endX = x - directionX * distance * (0.5 + Math.random() * 0.5);
    const endY = y - directionY * distance * (0.5 + Math.random() * 0.5);
    
    // Add slight random movement
    const randomX = (Math.random() - 0.5) * 5;
    const randomY = (Math.random() - 0.5) * 5;
    
    const duration = 400 + Math.random() * 300;
    
    particle.animate([
        { 
            transform: 'translate(0, 0) scale(1)',
            opacity: opacity 
        },
        { 
            transform: `translate(${randomX}px, ${randomY}px) scale(0.2)`,
            opacity: 0 
        }
    ], {
        duration: duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
    
    // Remove particle after animation
    setTimeout(() => {
        if (document.body.contains(particle)) {
            particle.remove();
        }
    }, duration);
}

// Hàm tạo màu sắc ngẫu nhiên với xác suất ưu tiên màu trắng
function getRandomColor() {
    const rand = Math.random();
    // 70% là màu trắng, 30% còn lại chia đều cho các màu khác
    if (rand < 0.7) return '#ffffff'; // Trắng
    
    // 30% còn lại chia đều cho 4 màu
    const colors = [
        '#ff4d4d', // Đỏ nhạt
        '#ffeb3b', // Vàng
        '#4caf50', // Xanh lá
        '#2196f3'  // Xanh dương
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Thêm biến toàn cục để kiểm soát chế độ đặc biệt
let specialStarMode = false;

function createShootingStar(forceCircle = false) {
    if (!document.body.classList.contains('dark-mode')) return Promise.resolve();

    const star = document.createElement('div');
    star.className = 'shooting-star';
    
    // Tạo màu sắc ngẫu nhiên với ưu tiên màu trắng
    const starColor = getRandomColor();
    
    // Tạo hiệu ứng ánh sáng với màu tương ứng
    star.style.boxShadow = `0 0 15px 2px ${starColor}`;
    star.style.filter = 'blur(1px)';
    star.style.zIndex = '1000';
    star.style.backgroundColor = starColor;
    
    // Xác định xem sao này có bay thành vòng tròn không
    // Nếu là chế độ đặc biệt (nhấn H) hoặc ngẫu nhiên 10%
    const willCircle = forceCircle || (Math.random() < 0.1);
    
    // Khởi tạo các biến hướng bay
    let dx, dy;

    // Choose a random edge to start from (0: top, 1: right, 2: bottom, 3: left)
    const edge = Math.floor(Math.random() * 4);
    
    // Set start and end positions based on the chosen edge
    let startX, startY, endX, endY;
    
    switch (edge) {
        case 0: // Top
            startX = Math.random() * window.innerWidth;
            startY = -20;
            endX = startX + (Math.random() - 0.5) * window.innerWidth * 0.5;
            endY = window.innerHeight + 20;
            break;
        case 1: // Right
            startX = window.innerWidth + 20;
            startY = Math.random() * window.innerHeight;
            endX = -20;
            endY = startY + (Math.random() - 0.5) * window.innerHeight * 0.5;
            break;
        case 2: // Bottom
            startX = Math.random() * window.innerWidth;
            startY = window.innerHeight + 20;
            endX = startX + (Math.random() - 0.5) * window.innerWidth * 0.5;
            endY = -20;
            break;
        case 3: // Left
            startX = -20;
            startY = Math.random() * window.innerHeight;
            endX = window.innerWidth + 20;
            endY = startY + (Math.random() - 0.5) * window.innerHeight * 0.5;
            break;
    }
    
    // Calculate angle for trail direction
    dx = endX - startX;
    dy = endY - startY;
    const angle = Math.atan2(dy, dx);
    
    // Lưu lại góc bay ban đầu để sử dụng khi cần
    const initialAngle = angle;
    
    // Hide the main star
    star.style.display = 'none';
    document.body.appendChild(star);
    
    // Duration based on distance (shorter duration = faster movement)
    const distance = Math.sqrt(dx * dx + dy * dy);
    let duration = 800 + (distance / window.innerWidth) * 1200; // 0.8-2 seconds (faster)
    
    // Nếu là sao đặc biệt, tăng thời gian bay để kịp vẽ vòng tròn
    if (willCircle) {
        duration *= 2; // Tăng thời gian bay lên gấp đôi
    }
    
    // Trail circles configuration
    const circleCount = 12; // More circles for a longer trail
    const circleSpacing = 12; // Closer spacing between circles
    const circles = [];
    
    // Create trail circles with 50% smaller size
    for (let i = 0; i < circleCount; i++) {
        const circle = document.createElement('div');
        circle.className = 'trail-circle';
        const size = (12 - (i * 0.7)) * 0.5; // 50% smaller size
        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;
        // Thêm màu sắc cho vòng tròn đuôi sao băng
        circle.style.backgroundColor = starColor;
        circle.style.left = `${startX}px`;
        circle.style.top = `${startY}px`;
        circle.style.opacity = '0';
        document.body.appendChild(circle);
        circles.push({
            element: circle,
            x: startX,
            y: startY,
            active: false,
            size: size
        });
    }
    
    let lastCirclePos = { x: startX, y: startY };
    let distanceSinceLastCircle = 0;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1.4);
        
        // Current position
        let currentX, currentY;
        
        if (willCircle) {
            // Tính vector hướng bay ban đầu
            const dirX = endX - startX;
            const dirY = endY - startY;
            const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
            const normDirX = dirX / dirLength;
            const normDirY = dirY / dirLength;
            
            // Vector pháp tuyến (xoay 90 độ ngược chiều kim đồng hồ)
            const normalX = -normDirY;
            const normalY = normDirX;
            
            // Bán kính xoắn ốc (tỉ lệ với khoảng cách bay)
            const maxRadius = dirLength * 0.2;
            
            // Tỷ lệ thời gian cho từng giai đoạn
            const approachRatio = 0.2;  // 20% thời gian bay vào tâm xoắn ốc
            const spiralRatio = 0.8;    // 60% thời gian xoắn ốc
            const exitRatio = 0.4;      // 20% thời gian bay ra
            
            if (progress < approachRatio) {
                // Giai đoạn 1: Bay vào tâm xoắn ốc
                const t = progress / approachRatio;
                const easeT = easeInOutCubic(t);
                
                // Điểm đích là tâm của xoắn ốc (30% quãng đường)
                const targetX = startX + dirX * 0.3;
                const targetY = startY + dirY * 0.3;
                
                // Di chuyển từ điểm bắt đầu đến tâm xoắn ốc
                currentX = startX + (targetX - startX) * easeT;
                currentY = startY + (targetY - startY) * easeT;
                
                // Xoay sao theo hướng bay
                const angle = Math.atan2(dirY, dirX) * (180 / Math.PI) + 90;
                star.style.transform = `rotate(${angle}deg)`;
                
            } else if (progress < approachRatio + spiralRatio) {
                // Giai đoạn 2: Bay theo đường xoắn ốc
                const t = (progress - approachRatio) / spiralRatio;
                
                // Góc quay (đủ 1 vòng 2*PI)
                const angle = t * Math.PI * 2;
                
                // Bán kính tăng dần từ 0 đến maxRadius
                const radius = maxRadius * t;
                
                // Tâm xoắn ốc (30% quãng đường)
                const centerX = startX + dirX * 0.3;
                const centerY = startY + dirY * 0.3;
                
                // Tính vị trí trên đường xoắn ốc
                const offsetX = Math.cos(angle) * radius;
                const offsetY = Math.sin(angle) * radius;
                
                // Xoay offset theo hướng bay
                const rotatedX = offsetX * normalX - offsetY * normDirX;
                const rotatedY = offsetX * normalY - offsetY * normDirY;
                
                // Di chuyển dọc theo đường bay trong khi xoắn ốc
                const forwardProgress = 0.3 + t * 0.5; // Từ 30% đến 80% quãng đường
                const pathX = startX + dirX * forwardProgress;
                const pathY = startY + dirY * forwardProgress;
                
                currentX = pathX + rotatedX;
                currentY = pathY + rotatedY;
                
                // Xoay sao theo hướng tiếp tuyến với đường xoắn ốc
                const tangentAngle = angle + Math.PI/2;
                const finalAngle = Math.atan2(
                    Math.cos(tangentAngle) * normalY - Math.sin(tangentAngle) * normDirY,
                    Math.cos(tangentAngle) * normalX - Math.sin(tangentAngle) * normDirX
                ) * (180 / Math.PI) + 90;
                star.style.transform = `rotate(${finalAngle}deg)`;
                
            } else {
                // Giai đoạn 3: Bay ra khỏi màn hình
                const t = (progress - approachRatio - spiralRatio) / exitRatio;
                const easeT = easeInOutCubic(t);
                
                // Điểm bắt đầu bay ra (80% quãng đường)
                const startExitX = startX + dirX * 0.8;
                const startExitY = startY + dirY * 0.8;
                
                // Di chuyển từ điểm cuối xoắn ốc ra khỏi màn hình
                currentX = startExitX + (endX - startExitX) * easeT;
                currentY = startExitY + (endY - startExitY) * easeT;
                
                // Xoay sao theo hướng bay ra
                const angle = Math.atan2(dirY, dirX) * (180 / Math.PI) + 90;
                star.style.transform = `rotate(${angle}deg)`;
            }
        } else {
            // Bay thẳng bình thường
            currentX = startX + (endX - startX) * progress;
            currentY = startY + (endY - startY) * progress;
            
            // Sử dụng góc bay ban đầu để xoay sao
            star.style.transform = `rotate(${initialAngle * (180 / Math.PI) + 90}deg)`;
        }
        
        // Update star position
        star.style.left = `${currentX}px`;
        star.style.top = `${currentY}px`;
        
        // Calculate distance moved since last frame
        const dx = currentX - lastCirclePos.x;
        const dy = currentY - lastCirclePos.y;
        const distanceMoved = Math.sqrt(dx * dx + dy * dy);
        distanceSinceLastCircle += distanceMoved;
        
        // Update trail circles
        if (distanceSinceLastCircle >= circleSpacing) {
            // Move circles in the trail
            for (let i = circles.length - 1; i > 0; i--) {
                if (circles[i - 1].active) {
                    circles[i].x = circles[i - 1].x;
                    circles[i].y = circles[i - 1].y;
                    circles[i].active = true;
                }
            }
            
            // Add new circle at current position
            circles[0].x = currentX;
            circles[0].y = currentY;
            circles[0].active = true;
            
            distanceSinceLastCircle = 0;
        }
        
        // Update circle positions and styles
        circles.forEach((circle, index) => {
            if (circle.active) {
                circle.element.style.left = `${circle.x}px`;
                circle.element.style.top = `${circle.y}px`;
                const opacity = 0.8 - (index / circleCount) * 0.9;
                circle.element.style.opacity = opacity;
                const scale = 0.5 + (1 - index / circleCount) * 0.5;
                circle.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
            }
        });
        
        lastCirclePos = { x: currentX, y: currentY };
        
        // Continue animation if not finished
        if (progress < 1) {
            try {
                requestAnimationFrame(animate);
            } catch (e) {
                console.error('Animation loop error:', e);
                cleanup();
            }
        } else {
            // Clean up circles with fade out effect
            circles.forEach(circle => {
                try {
                    if (circle && circle.element && document.body.contains(circle.element)) {
                        circle.element.style.transition = 'opacity 0.3s';
                        circle.element.style.opacity = '0';
                        setTimeout(() => {
                            try {
                                if (circle && circle.element && document.body.contains(circle.element)) {
                                    circle.element.remove();
                                }
                            } catch (e) {
                                console.warn('Error removing circle:', e);
                            }
                        }, 300);
                    }
                } catch (e) {
                    console.warn('Error cleaning up circle:', e);
                }
            });
            
            try {
                if (star && document.body.contains(star)) {
                    star.style.transition = 'opacity 0.5s';
                    star.style.opacity = '0';
                    setTimeout(() => {
                        try {
                            if (star && document.body.contains(star)) {
                                star.remove();
                            }
                        } catch (e) {
                            console.warn('Error removing star:', e);
                        }
                    }, 500);
                }
            } catch (e) {
                console.warn('Error cleaning up star:', e);
            }
        }
    }
    
    // Bắt đầu animation với kiểm tra lỗi
    try {
        requestAnimationFrame(animate);
    } catch (e) {
        console.error('Animation error:', e);
        // Dọn dẹp nếu có lỗi
        cleanup();
    }
    
    // Hàm dọn dẹp khi animation kết thúc hoặc lỗi
    function cleanup() {
        // Dọn dẹp các phần tử
        circles.forEach(circle => {
            try {
                if (circle && circle.element && document.body.contains(circle.element)) {
                    circle.element.remove();
                }
            } catch (e) {
                console.warn('Error cleaning up circle:', e);
            }
        });
        
        try {
            if (star && document.body.contains(star)) {
                star.remove();
            }
        } catch (e) {
            console.warn('Error cleaning up star:', e);
        }
    }
    
    // Return promise that resolves when animation completes
    return new Promise(resolve => {
        setTimeout(() => {
            cleanup();
            resolve();
        }, duration);
    });
}

// Create meteors with variable timing for more natural appearance
function scheduleNextMeteor() {
    if (document.body.classList.contains('dark-mode')) {
        if (Math.random() < 0.4) { // Higher chance of creating a meteor
            createMeteor();
        }
    }
    const nextTime = 1000 + Math.random() * 3000; // Random time between 1-4 seconds
    setTimeout(scheduleNextMeteor, nextTime);
}

// Function to start shooting star shower
async function startShootingStarShower() {
    if (!document.body.classList.contains('dark-mode')) return;
    
    // Create 3-6 shooting stars in sequence
    const starCount = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < starCount; i++) {
        await createShootingStar();
        // Random delay between stars (300-800ms)
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    }
}

// Function to schedule the next shooting star
function scheduleNextShootingStar() {
    if (!document.body.classList.contains('dark-mode')) return;
    
    // Random delay between 5-15 seconds
    const delay = 5000 + Math.random() * 10000;
    
    setTimeout(() => {
        if (document.body.classList.contains('dark-mode')) {
            createShootingStar().then(() => {
                scheduleNextShootingStar();
            });
        }
    }, delay);
}

// Start the initial shooting star after 2 seconds if in dark mode
if (document.body.classList.contains('dark-mode')) {
    setTimeout(scheduleNextShootingStar, 2000);
}

// Global variables for star management
let currentStarCount = 10; // Initial star count
let starReductionStep = 0; // Track how many times we've reduced stars
const MAX_STAR_REDUCTION_STEPS = 4; // Maximum number of reduction steps

// Create stars for the night sky
function createStars(count = currentStarCount) {
    // Remove existing stars if any
    const existingStars = document.querySelector('.stars-container');
    if (existingStars) {
        existingStars.remove();
    }
    
    currentStarCount = count; // Update current star count

    const starsCount = count; // Use the provided count parameter
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    document.body.appendChild(starsContainer);

    for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Random size between 1px and 3px
        const size = 1 + Math.random() * 2;
        
        // Random opacity for twinkling effect
        const opacity = 0.1 + Math.random() * 0.9;
        
        // Random animation delay and duration for twinkling
        const delay = Math.random() * 5;
        const duration = 3 + Math.random() * 4;
        
        // Apply styles
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.opacity = opacity;
        star.style.animation = `twinkle ${duration}s infinite`;
        star.style.animationDelay = `${delay}s`;
        
        // Random twinkle intensity for some stars
        if (Math.random() > 0.8) {
            star.style.boxShadow = '0 0 10px 2px rgba(255, 255, 255, 0.9)';
            star.style.animation = `twinkle ${duration}s infinite, twinkleColor ${duration * 1.5}s infinite`;
            
            // Random star color (slightly blue or white)
            const hue = 200 + Math.random() * 40 - 20; // Blue-ish hue
            star.style.backgroundColor = `hsl(${hue}, 100%, 85%)`;
        }
        
        starsContainer.appendChild(star);
    }
}

// Toggle dark mode function
function toggleDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const isDarkMode = document.body.classList.toggle('dark-mode');
    
    if (isDarkMode) {
        darkModeToggle.textContent = '';
        createStars();
        if (!document.querySelector('.stars-container')) {
            createStars();
        }
        // Schedule shooting stars in dark mode
        setTimeout(scheduleNextShootingStar, 2000);
    } else {
        darkModeToggle.textContent = '';
        const stars = document.querySelector('.stars-container');
        if (stars) {
            stars.remove();
        }
    }
}

// Toggle dark mode on button click
document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

// Function to reset all bees to the same size
function resetBeesSize() {
    const targetSize = 40; // Target size in pixels (reduced from 60px to 40px)
    
    bees.forEach(bee => {
        // Skip if bee doesn't have an element or is not active
        if (!bee.element || !bee.isActive) return;
        
        // Set target size
        bee.targetSize = targetSize;
        
        // Apply size immediately
        bee.element.style.width = `${targetSize}px`;
        bee.element.style.height = `${targetSize}px`;
        
        // Reset any scaling
        bee.element.style.transform = 'scale(1)';
    });
}

// Hàm tạo hiệu ứng easing cho chuyển động mượt mà
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

// Biến để theo dõi trạng thái ẩn/hiện của ong
let beesVisible = true;

// Hàm ẩn/hiện tất cả các con ong và đường bay của chúng
function toggleBeesVisibility() {
    beesVisible = !beesVisible;
    
    // 1. Xử lý các phần tử ong
    const beeElements = document.querySelectorAll('.bee1, .bee2, .bee');
    beeElements.forEach(bee => {
        if (beesVisible) {
            // Hiển thị lại ong
            bee.style.opacity = '1';
            bee.style.visibility = 'visible';
            bee.style.display = '';
            bee.style.pointerEvents = 'auto';
            // Khôi phục hiệu ứng
            bee.style.boxShadow = '';
            bee.style.filter = '';
            bee.style.textShadow = '';
        } else {
            // Ẩn ong
            bee.style.opacity = '0';
            bee.style.visibility = 'hidden';
            bee.style.display = 'none';
            bee.style.pointerEvents = 'none';
            // Tắt hiệu ứng
            bee.style.boxShadow = 'none';
            bee.style.filter = 'none';
            bee.style.textShadow = 'none';
        }
    });
    
    // 2. Xử lý các phần tử đường bay
    const trailElements = document.querySelectorAll('.trail, [class*="trail"], [id*="trail"]');
    trailElements.forEach(trail => {
        // Kiểm tra xem có phải là trail của ong không (không phải của sao băng)
        const isBeeTrail = !trail.classList.contains('shooting-star') && 
                          !trail.classList.contains('meteor-trail') &&
                          !trail.id.includes('shooting') &&
                          !trail.id.includes('meteor');
        
        if (isBeeTrail) {
            if (beesVisible) {
                // Hiển thị lại đường bay
                trail.style.opacity = '1';
                trail.style.visibility = 'visible';
                trail.style.display = '';
            } else {
                // Ẩn đường bay
                trail.style.opacity = '0';
                trail.style.visibility = 'hidden';
                trail.style.display = 'none';
            }
        }
    });

    // Hiển thị thông báo
    const feedback = document.createElement('div');
    feedback.textContent = beesVisible ? 'Hiện ong' : 'Ẩn ong';
    feedback.style.position = 'fixed';
    feedback.style.top = '50px';
    feedback.style.right = '10px';
    feedback.style.color = 'white';
    feedback.style.backgroundColor = 'rgba(0,0,0,0.7)';
    feedback.style.padding = '5px 10px';
    feedback.style.borderRadius = '5px';
    feedback.style.zIndex = '10000';
    feedback.style.transition = 'opacity 0.5s';
    document.body.appendChild(feedback);
    
    // Tự động ẩn thông báo sau 1.5 giây
    setTimeout(() => {
        if (document.body.contains(feedback)) {
            feedback.style.opacity = '0';
            setTimeout(() => feedback.remove(), 500);
        }
    }, 1500);
}

// Xử lý sự kiện bàn phím
document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'j') {
        event.preventDefault();
        toggleBeesVisibility();
    } else if (event.code === 'Space') {
        event.preventDefault(); // Prevent scrolling when pressing space
        toggleDarkMode();
    } else if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        resetBeesSize();
    } else if (event.key.toLowerCase() === 'd' && flowers.length === 0) {
        // Nhấn D để tạo hoa ngay lập tức
        event.preventDefault();
        createFlower();
    } else if (event.key.toLowerCase() === 'g') {
        // Nhấn G để thêm 1 con ong mới
        event.preventDefault();
        addNewBee();
    } else if (event.key.toLowerCase() === 'h') {
        // Nhấn H để tạo sao băng đặc biệt (luôn bay vòng tròn)
        event.preventDefault();
        createShootingStar(true); // Force circle mode
    } else if (event.key.toLowerCase() === 'x' && document.body.classList.contains('dark-mode')) {
        event.preventDefault();
        
        const starsContainer = document.querySelector('.stars-container');
        if (!starsContainer) {
            // Lần đầu nhấn X: tạo 5 sao
            currentStarCount = 5;
            createStars(5);
        } else {
            // Các lần nhấn tiếp theo: tăng dần lên 20, 40, 60, 80, 100, sau đó về 0
            if (currentStarCount === 0) {
                currentStarCount = 5;
            } else if (currentStarCount < 100) {
                currentStarCount = Math.min(100, currentStarCount + 20);
            } else {
                currentStarCount = 0;
            }
            
            // Cập nhật số sao
            if (currentStarCount > 0) {
                createStars(currentStarCount);
            } else {
                // Xóa hết sao nếu về 0
                starsContainer.remove();
            }
        }
        
        // Hiển thị thông báo số sao hiện tại
        const feedback = document.createElement('div');
        feedback.textContent = currentStarCount > 0 ? `Sao: ${currentStarCount}` : 'Đã tắt sao';
        feedback.style.position = 'fixed';
        feedback.style.top = '10px';
        feedback.style.right = '10px';
        feedback.style.color = 'white';
        feedback.style.backgroundColor = 'rgba(0,0,0,0.7)';
        feedback.style.padding = '5px 10px';
        feedback.style.borderRadius = '5px';
        feedback.style.zIndex = '10000';
        feedback.style.transition = 'opacity 0.5s';
        document.body.appendChild(feedback);
        
        // Tự động ẩn thông báo sau 1.5 giây
        setTimeout(() => {
            if (document.body.contains(feedback)) {
                feedback.style.opacity = '0';
                setTimeout(() => feedback.remove(), 500);
            }
        }, 1500);
    }
});

// Initialize stars if dark mode is already on
if (document.body.classList.contains('dark-mode')) {
    createStars();
    setTimeout(scheduleNextShootingStar, 2000);
}

// Add keyboard event listener for 'S' key
document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 's' && document.body.classList.contains('dark-mode')) {
        startShootingStarShower();
    }
});

animate();
const bee1 = document.querySelector(".bee1")
const bee2 = document.querySelector(".bee2")
const windowWidth = window.innerWidth
const windowHeight = window.innerHeight

let targetX1 = windowWidth / 2
let targetY1 = windowHeight / 2
let targetX2 = windowWidth / 2 + 100
let targetY2 = windowHeight / 2 + 100
let beeX1 = targetX1, beeY1 = targetY1
let beeX2 = targetX2, beeY2 = targetY2
let beeSize1 = 20, beeSize2 = 20
let minSize = 10
let maxSize = 150 // Distance-based max size
let manualMaxSize = 150 // Manual max size for wheel adjustment
let rotation1 = 0, rotation2 = 0

const speed = 0.05
let waypoints1 = [], waypoints2 = []
const waypointCount = 5
let currentWaypoint1 = 0, currentWaypoint2 = 0

const trailLength = 15
const trailInterval = 40
let lastTrailTime1 = 0, lastTrailTime2 = 0
const trailElements1 = [], trailElements2 = []

let isBee1Stunned = false, isBee2Stunned = false
const stunDuration = 1000
const collisionDistance = 80
const bounceStrength = 200
const spinSpeed = 360 // Degrees per second during stun

let lastMouseMove = Date.now()
const idleTimeout = 2000 // 2 seconds of inactivity triggers idle mode
let isIdle1 = true // Start in idle mode for bee1

let velocityX1 = 0, velocityY1 = 0
let velocityX2 = 0, velocityY2 = 0
const friction = 0.95 // Damping factor for bounce velocity

const generateWaypoints = () => {
  const waypoints = []
  for (let i = 0; i < waypointCount; i++) {
    waypoints.push({
      x: Math.random() * (windowWidth - 200) + 100,
      y: Math.random() * (windowHeight - 200) + 100,
    })
  }
  return waypoints
}

waypoints1 = generateWaypoints()
waypoints2 = generateWaypoints()

const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

const updateSize = (dist) => {
  const maxDistance = Math.sqrt(windowWidth * windowWidth + windowHeight * windowHeight) / 2
  const size = maxSize - (dist / maxDistance) * (maxSize - minSize)
  return Math.max(minSize, size)
}

document.addEventListener("mousemove", (event) => {
  targetX1 = event.clientX
  targetY1 = event.clientY
  lastMouseMove = Date.now()
  isIdle1 = false
})

document.addEventListener("touchmove", (event) => {
  event.preventDefault() // Prevent scrolling/zooming
  if (event.touches.length > 0) {
    targetX1 = event.touches[0].clientX
    targetY1 = event.touches[0].clientY
    lastMouseMove = Date.now()
    isIdle1 = false
  }
}, { passive: false })

document.addEventListener("wheel", (event) => {
  // Normalize deltaY for consistent resizing across browsers
  const sizeChange = event.deltaY < 0 ? 10 : -10 // Scroll up: +10, Scroll down: -10
  beeSize1 = Math.min(manualMaxSize, Math.max(minSize, beeSize1 + sizeChange))
})

const createTrail = (x, y, elements, beeSize) => {
  const trail = document.createElement("div")
  trail.className = "trail"
  const trailSize = beeSize * 0.3 // Trail size is 30% of bee size
  trail.style.left = `${x}px`
  trail.style.top = `${y}px`
  trail.style.width = `${trailSize}px`
  trail.style.height = `${trailSize}px`
  document.body.appendChild(trail)
  elements.push(trail)

  setTimeout(() => {
    trail.remove()
    elements.splice(elements.indexOf(trail), 1)
  }, 800)

  if (elements.length > trailLength) {
    const oldTrail = elements.shift()
    oldTrail.remove()
  }
}

function checkCollision() {
  const dist = distance(beeX1, beeY1, beeX2, beeY2)
  if (dist < collisionDistance && !isBee1Stunned && !isBee2Stunned && Math.abs(beeSize1 - beeSize2) < 0.1) {
    const angle = Math.atan2(beeY2 - beeY1, beeX2 - beeX1)
    velocityX1 = -Math.cos(angle) * bounceStrength * 0.05
    velocityY1 = -Math.sin(angle) * bounceStrength * 0.05
    velocityX2 = Math.cos(angle) * bounceStrength * 0.05
    velocityY2 = Math.sin(angle) * bounceStrength * 0.05

    isBee1Stunned = true
    isBee2Stunned = true

    setTimeout(() => {
      isBee1Stunned = false
      isBee2Stunned = false
      rotation1 = 0
      rotation2 = 0
      velocityX1 = 0
      velocityY1 = 0
      velocityX2 = 0
      velocityY2 = 0
    }, stunDuration)
  }
}

function animate() {
  const currentTime = Date.now()

  if (currentTime - lastMouseMove > idleTimeout) {
    isIdle1 = true
  }

  if (isIdle1) {
    targetX1 = waypoints1[currentWaypoint1].x
    targetY1 = waypoints1[currentWaypoint1].y
    if (distance(beeX1, beeY1, targetX1, targetY1) < 20) {
      currentWaypoint1 = (currentWaypoint1 + 1) % waypoints1.length
      if (currentWaypoint1 === 0) waypoints1 = generateWaypoints()
    }
  }

  targetX2 = waypoints2[currentWaypoint2].x
  targetY2 = waypoints2[currentWaypoint2].y
  if (distance(beeX2, beeY2, targetX2, targetY2) < 20) {
    currentWaypoint2 = (currentWaypoint2 + 1) % waypoints2.length
    if (currentWaypoint2 === 0) waypoints2 = generateWaypoints()
  }

  const prevBeeX1 = beeX1, prevBeeY1 = beeY1
  const prevBeeX2 = beeX2, prevBeeY2 = beeY2

  if (!isBee1Stunned) {
    beeX1 += (targetX1 - beeX1) * speed
    beeY1 += (targetY1 - beeY1) * speed
  } else {
    beeX1 += velocityX1
    beeY1 += velocityY1
    velocityX1 *= friction
    velocityY1 *= friction
    rotation1 += spinSpeed * (1 / 60)
  }
  if (!isBee2Stunned) {
    beeX2 += (targetX2 - beeX2) * speed
    beeY2 += (targetY2 - beeY2) * speed
  } else {
    beeX2 += velocityX2
    beeY2 += velocityY2
    velocityX2 *= friction
    velocityY2 *= friction
    rotation2 += spinSpeed * (1 / 60)
  }

  let scaleX1 = 1, scaleX2 = 1
  if (beeX1 > prevBeeX1 + 1) scaleX1 = -1
  else if (beeX1 < prevBeeX1 - 1) scaleX1 = 1
  if (beeX2 > prevBeeX2 + 1) scaleX2 = -1
  else if (beeX2 < prevBeeX2 - 1) scaleX2 = 1

  if (
    (Math.abs(beeX1 - prevBeeX1) > 1 || Math.abs(beeY1 - prevBeeY1) > 1) &&
    currentTime - lastTrailTime1 > trailInterval
  ) {
    createTrail(beeX1 - beeSize1 / 4, beeY1 - beeSize1 / 4, trailElements1, beeSize1)
    lastTrailTime1 = currentTime
  }
  if (
    (Math.abs(beeX2 - prevBeeX2) > 1 || Math.abs(beeY2 - prevBeeY2) > 1) &&
    currentTime - lastTrailTime2 > trailInterval
  ) {
    createTrail(beeX2 - beeSize2 / 4, beeY2 - beeSize2 / 4, trailElements2, beeSize2)
    lastTrailTime2 = currentTime
  }

  const dist1 = distance(beeX1, beeY1, windowWidth / 2, windowHeight / 2)
  const dist2 = distance(beeX2, beeY2, windowWidth / 2, windowHeight / 2)
  if (isIdle1) {
    beeSize1 = updateSize(dist1) // Revert to distance-based size when idle
  }
  beeSize2 = updateSize(dist2)

  bee1.style.transform = `translate(${beeX1 - beeSize1 / 2}px, ${
    beeY1 - beeSize1 / 2
  }px) scaleX(${scaleX1}) rotate(${rotation1}deg)`
  bee1.style.width = `${beeSize1}px`
  bee1.style.height = `${beeSize1}px`
  bee2.style.transform = `translate(${beeX2 - beeSize2 / 2}px, ${
    beeY2 - beeSize2 / 2
  }px) scaleX(${scaleX2}) rotate(${rotation2}deg)`
  bee2.style.width = `${beeSize2}px`
  bee2.style.height = `${beeSize2}px`

  checkCollision()

  requestAnimationFrame(animate)
}

animate()

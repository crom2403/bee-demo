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
let manualMaxSize = 500 // Manual max size for wheel adjustment
let rotation1 = 0, rotation2 = 0

const speed = 0.08 // Base speed for normal movement
let waypoints1 = [], waypoints2 = []
const waypointCount = 5
let currentWaypoint1 = 0, currentWaypoint2 = 0

let trailLength = 15
let trailInterval = 40
let lastTrailTime1 = 0, lastTrailTime2 = 0
const trailElements1 = [], trailElements2 = []

let isBee1Stunned = false, isBee2Stunned = false
const stunDuration = 1000 // 1 seconds for stun
const collisionDistance = 120 // Increased for higher collision chance
const bounceStrength = 200
const spinSpeed = 2400 // 3600 degrees / 1.5 seconds = 2400 deg/s for 10 rotations

let lastMouseMove = Date.now()
const idleTimeout = 2000 // 2 seconds of inactivity triggers idle mode
let isIdle1 = true // Start in idle mode for bee1

let velocityX1 = 0, velocityY1 = 0
let velocityX2 = 0, velocityY2 = 0
const friction = 0.95 // Damping factor for bounce velocity

// Heart-shaped flight variables
let isHeartFlight = false
let heartT = 0
const heartSpeed = 0.3 // High speed for heart path
const heartDuration = 2000 // 2 seconds to complete heart
let heartStartTime = 0

const generateWaypoints = (isBee2 = false, baseX = null, baseY = null) => {
  const waypoints = []
  for (let i = 0; i < waypointCount; i++) {
    let x, y
    if (isBee2 && baseX !== null && baseY !== null && Math.random() < 0.7) {
      const angle = Math.random() * 2 * Math.PI
      const radius = Math.random() * 300
      x = baseX + Math.cos(angle) * radius
      y = baseY + Math.sin(angle) * radius
    } else {
      x = Math.random() * (windowWidth - 200) + 100
      y = Math.random() * (windowHeight - 200) + 100
    }
    waypoints.push({ x, y })
  }
  return waypoints
}

waypoints1 = generateWaypoints()
waypoints2 = generateWaypoints(true, targetX1, targetY1)

const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

const updateSize = (dist) => {
  const maxDistance = Math.sqrt(windowWidth * windowWidth + windowHeight * windowHeight) / 2
  const size = maxSize - (dist / maxDistance) * (maxSize - minSize)
  return Math.max(minSize, size)
}

document.addEventListener("mousemove", (event) => {
  if (!isHeartFlight) {
    targetX1 = event.clientX
    targetY1 = event.clientY
    lastMouseMove = Date.now()
    isIdle1 = false
  }
})

document.addEventListener("touchmove", (event) => {
  if (!isHeartFlight) {
    event.preventDefault()
    if (event.touches.length > 0) {
      targetX1 = event.touches[0].clientX
      targetY1 = event.touches[0].clientY
      lastMouseMove = Date.now()
      isIdle1 = false
    }
  }, { passive: false })

document.addEventListener("wheel", (event) => {
  if (!isHeartFlight) {
    const sizeChange = event.deltaY < 0 ? 10 : -10
    beeSize1 = Math.min(manualMaxSize, Math.max(minSize, beeSize1 + sizeChange))
  }
})

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "a" && !isHeartFlight) {
    isHeartFlight = true
    heartStartTime = Date.now()
    heartT = 0
    waypoints1 = [...waypoints1]
    waypoints2 = [...waypoints2]
    trailLength = 30 // Increase for motion blur
    trailInterval = 20 // Decrease for denser trails
  }
})

const createTrail = (x, y, elements, beeSize) => {
  const trail = document.createElement("div")
  trail.className = "trail"
  const trailSize = beeSize * 0.3
  trail.style.left = `${x}px`
  trail.style.top = `${y}px`
  trail.style.width = `${trailSize}px`
  trail.style.height = `${trailSize}px`
  document.body.appendChild(trail)
  elements.push(trail)

  setTimeout(() => {
    trail.remove()
    elements.splice(elements.indexOf(trail), 1)
  }, isHeartFlight ? 400 : 800)

  if (elements.length > trailLength) {
    const oldTrail = elements.shift()
    oldTrail.remove()
  }
}

function checkCollision() {
  if (isHeartFlight) return
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

const getHeartPosition = (t, offsetX = 0, offsetY = 0) => {
  const scale = 50
  const x = 16 * Math.pow(Math.sin(t), 3)
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
  return {
    x: windowWidth / 2 + x * scale + offsetX,
    y: windowHeight / 2 + y * scale + offsetY
  }
}

function animate() {
  const currentTime = Date.now()

  if (isHeartFlight) {
    const elapsed = currentTime - heartStartTime
    if (elapsed > heartDuration) {
      isHeartFlight = false
      trailLength = 15
      trailInterval = 40
      isIdle1 = true
      waypoints1 = generateWaypoints()
      waypoints2 = generateWaypoints(true, beeX1, beeY1)
    } else {
      heartT += heartSpeed
      const pos1 = getHeartPosition(heartT, 0, 0)
      beeX1 = pos1.x
      beeY1 = pos1.y
      const pos2 = getHeartPosition(heartT + Math.PI, 0, 0)
      beeX2 = pos2.x
      beeY2 = pos2.y
    }
  } else {
    if (currentTime - lastMouseMove > idleTimeout) {
      isIdle1 = true
    }

    if (isIdle1) {
      targetX1 = waypoints1[currentWaypoint1].x
      targetY1 = waypoints1[currentWaypoint1].y
      if (distance(beeX1, beeY1, targetX1, targetY1) < 20) {
        currentWaypoint1 = (currentWaypoint1 + 1) % waypoints1.length
        if (currentWaypoint1 === 0) waypoints1 = generateWaypoints()
        waypoints2 = generateWaypoints(true, targetX1, targetY1)
      }
    }

    targetX2 = waypoints2[currentWaypoint2].x
    targetY2 = waypoints2[currentWaypoint2].y
    if (distance(beeX2, beeY2, targetX2, targetY2) < 20) {
      currentWaypoint2 = (currentWaypoint2 + 1) % waypoints2.length
      if (currentWaypoint2 === 0) waypoints2 = generateWaypoints(true, beeX1, beeY1)
    }
  }

  const prevBeeX1 = beeX1, prevBeeY1 = beeY1
  const prevBeeX2 = beeX2, prevBeeY2 = beeY2

  if (!isHeartFlight) {
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
  if (isIdle1 && !isHeartFlight) {
    beeSize1 = updateSize(dist1)
  }
  beeSize2 = updateSize(dist2)

  if (beeSize1 > beeSize2) {
    bee1.style.zIndex = 10
    bee2.style.zIndex = 5
  } else {
    bee1.style.zIndex = 5
    bee2.style.zIndex = 10
  }

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

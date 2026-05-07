// ==========================================
// 1. CORE ENGINE CLASSES
// ==========================================

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
  }
  update(w, h) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > w) this.vx *= -1;
    if (this.y < 0 || this.y > h) this.vy *= -1;
  }
}

class Rectangle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  contains(p) {
    return (
      p.x >= this.x - this.w &&
      p.x <= this.x + this.w &&
      p.y >= this.y - this.h &&
      p.y <= this.y + this.h
    );
  }
  intersects(r) {
    return !(
      r.x - r.w > this.x + this.w ||
      r.x + r.w < this.x - this.w ||
      r.y - r.h > this.y + this.h ||
      r.y + r.h < this.y - this.h
    );
  }
}

class QuadTree {
  constructor(b, c, d = 0) {
    this.boundary = b;
    this.capacity = c;
    this.points = [];
    this.divided = false;
    this.depth = d;
  }
  subdivide() {
    let { x, y, w, h } = this.boundary;
    this.nw = new QuadTree(
      new Rectangle(x - w / 2, y - h / 2, w / 2, h / 2),
      this.capacity,
      this.depth + 1,
    );
    this.ne = new QuadTree(
      new Rectangle(x + w / 2, y - h / 2, w / 2, h / 2),
      this.capacity,
      this.depth + 1,
    );
    this.sw = new QuadTree(
      new Rectangle(x - w / 2, y + h / 2, w / 2, h / 2),
      this.capacity,
      this.depth + 1,
    );
    this.se = new QuadTree(
      new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2),
      this.capacity,
      this.depth + 1,
    );
    this.divided = true;
  }
  insert(p) {
    if (!this.boundary.contains(p)) return false;
    if (this.points.length < this.capacity) {
      this.points.push(p);
      return true;
    }
    if (!this.divided) this.subdivide();
    return (
      this.nw.insert(p) ||
      this.ne.insert(p) ||
      this.sw.insert(p) ||
      this.se.insert(p)
    );
  }
  query(r, res = { found: [], visited: [] }) {
    res.visited.push(this.boundary);
    if (!this.boundary.intersects(r)) return res;
    for (let p of this.points) if (r.contains(p)) res.found.push(p);
    if (this.divided) {
      this.nw.query(r, res);
      this.ne.query(r, res);
      this.sw.query(r, res);
      this.se.query(r, res);
    }
    return res;
  }
}

// ==========================================
// 2. GLOBAL STATE
// ==========================================

let agents = [];
let qtree;
let agentSlider, querySlider;
let observerToggle, gridToggle, debugToggle;
let histQT = [],
  histLin = [];

let isScanning = false;
let isPaused = false;
let scanData = null;
let playbackIdx = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("Courier New");

  // SLIDERS
  agentSlider = createSlider(10, 8000, 3000, 10);
  agentSlider.position(30, 310);
  querySlider = createSlider(1, 2000, 800, 10);
  querySlider.position(30, 375);

  // TOGGLES
  observerToggle = createCheckbox(" LIVE OBSERVER RADAR", true);
  observerToggle.position(30, 415);
  styleCheckbox(observerToggle, "#00FF96");

  gridToggle = createCheckbox(" SPATIAL STRUCTURE GRID", true);
  gridToggle.position(30, 445);
  styleCheckbox(gridToggle, "#A0D0FF"); // Light blue

  debugToggle = createCheckbox(" SPATIAL INDEX ANALYSIS", false);
  debugToggle.position(30, 475);
  styleCheckbox(debugToggle, "#00FFFF");

  spawnAgents(3000);
}

function styleCheckbox(cb, col) {
  cb.style("color", col);
  cb.style("font-weight", "bold");
  cb.style("font-size", "12px");
}

function mousePressed() {
  if (debugToggle.checked() && mouseX > 400) {
    isPaused = true;
    isScanning = true;
    let range = new Rectangle(mouseX, mouseY, 90, 90);
    let result = qtree.query(range);

    // Sort visited nodes by size (Descending)
    let sortedVisited = [...result.visited].sort(
      (a, b) => b.w * b.h - a.w * a.h,
    );

    scanData = {
      visited: sortedVisited,
      found: result.found.map((p) => ({ x: p.x, y: p.y })),
      range: range,
    };
    playbackIdx = 0;
  } else {
    isPaused = false;
    isScanning = false;
  }
}

function draw() {
  background(3, 5, 10);

  if (agentSlider.value() !== agents.length) spawnAgents(agentSlider.value());

  if (!isPaused) {
    let boundary = new Rectangle(width / 2, height / 2, width / 2, height / 2);
    qtree = new QuadTree(boundary, 4);
    for (let a of agents) {
      a.update(width, height);
      qtree.insert(a);
    }
  }

  // 1. Light Ghost-Grid
  if (gridToggle.checked()) drawQuadGrid(qtree);

  // 2. Dim Background Agents
  for (let a of agents) {
    stroke(255, 15); // Darker background points
    strokeWeight(1.2);
    point(a.x, a.y);
  }

  let mouseRange = new Rectangle(mouseX, mouseY, 90, 90);
  let liveRes = qtree.query(mouseRange);

  // 3. Live Radar + Tethers
  if (!isPaused && observerToggle.checked()) {
    stroke(0, 255, 150, 180);
    noFill();
    strokeWeight(2.5);
    rectMode(CENTER);
    rect(mouseRange.x, mouseRange.y, mouseRange.w * 2, mouseRange.h * 2);

    for (let p of liveRes.found) {
      stroke(0, 255, 150, 40);
      strokeWeight(1);
      line(mouseX, mouseY, p.x, p.y);
      stroke(0, 255, 150);
      strokeWeight(7);
      point(p.x, p.y);
    }
  }

  // ==========================================
  // ANALYSIS RENDERER
  // ==========================================
  if (isScanning && scanData) {
    if (frameCount % 6 === 0 && playbackIdx < scanData.visited.length)
      playbackIdx++;

    if (playbackIdx < scanData.visited.length) {
      let b = scanData.visited[playbackIdx];
      rectMode(CENTER);
      fill(0, 255, 255, 50);
      stroke(0, 255, 255);
      strokeWeight(3);
      rect(b.x, b.y, b.w * 2, b.h * 2);

      push();
      fill(255);
      noStroke();
      textAlign(CENTER);
      textSize(15);
      textStyle(BOLD);
      text("ANALYZING NODE: " + playbackIdx, b.x, b.y - b.h - 15);
      pop();
    } else {
      push();
      fill(0, 255, 150);
      noStroke();
      textAlign(CENTER);
      textSize(20);
      textStyle(BOLD);
      text(
        "MATCH SECURED: " + scanData.found.length + " TARGETS",
        scanData.range.x,
        scanData.range.y - scanData.range.h - 30,
      );
      for (let p of scanData.found) {
        stroke(255, 255, 0);
        strokeWeight(9);
        point(p.x, p.y);
        stroke(255, 255, 0, 40);
        strokeWeight(1);
        line(scanData.range.x, scanData.range.y, p.x, p.y);
      }
      pop();
    }
  }

  runTelemetry(liveRes.visited.length, liveRes.found.length);
}

function drawQuadGrid(node) {
  // Light, subtle ice-blue grid
  stroke(150, 220, 255, 15);
  strokeWeight(0.5);
  noFill();
  rectMode(CENTER);
  rect(
    node.boundary.x,
    node.boundary.y,
    node.boundary.w * 2,
    node.boundary.h * 2,
  );
  if (node.divided) {
    drawQuadGrid(node.nw);
    drawQuadGrid(node.ne);
    drawQuadGrid(node.sw);
    drawQuadGrid(node.se);
  }
}

function runTelemetry(visited, foundCount) {
  let currentLin = 0,
    currentQT = 0;
  if (!isPaused) {
    let queries = querySlider.value();
    let testArea = new Rectangle(random(width), random(height), 80, 80);
    let t0 = performance.now();
    for (let i = 0; i < queries; i++) {
      let c = 0;
      for (let a of agents) {
        if (testArea.contains(a)) c++;
      }
    }
    currentLin = performance.now() - t0;
    let t1 = performance.now();
    for (let i = 0; i < queries; i++) {
      qtree.query(testArea);
    }
    currentQT = performance.now() - t1;
  }

  let smoothLin =
    histLin.length > 0
      ? currentLin * 0.2 + histLin[histLin.length - 1] * 0.8
      : currentLin;
  let smoothQT =
    histQT.length > 0
      ? currentQT * 0.2 + histQT[histQT.length - 1] * 0.8
      : currentQT;
  histLin.push(smoothLin);
  histQT.push(smoothQT);
  if (histLin.length > 120) {
    histLin.shift();
    histQT.shift();
  }

  // PRUNING EFFICIENCY CALC
  let totalPotentialNodes = agents.length / 2;
  let pruningEff = (1 - visited / totalPotentialNodes) * 100;

  // HUD PANELS
  fill(8, 12, 20, 245);
  stroke(0, 150, 255, 120);
  strokeWeight(2);
  rectMode(CORNER);
  rect(15, 15, 380, 260, 6);
  rect(15, 285, 380, 225, 6);
  rect(15, 520, 380, 140, 6);

  push();
  fill(255);
  noStroke();
  textAlign(LEFT);
  textSize(19);
  textStyle(BOLD);
  text("GEONEXUS | TELEMETRY", 35, 55);
  fill(0, 200, 255);
  textSize(14);
  text("SPATIAL DIAGNOSTICS:", 35, 90);
  fill(240);
  textStyle(NORMAL);
  textSize(16);
  text("ACTIVE AGENTS:    " + agents.length, 35, 125);
  text("TARGETS LOCKED:   " + foundCount, 35, 150);
  text("PRUNING EFFICIENCY: " + max(0, pruningEff).toFixed(1) + "%", 35, 175);

  fill(0, 255, 150);
  textStyle(BOLD);
  textSize(17);
  text("QUADTREE LATENCY: " + smoothQT.toFixed(2) + " ms", 35, 210);
  fill(255, 60, 80);
  text("LINEAR LATENCY:   " + smoothLin.toFixed(2) + " ms", 35, 240);

  fill(255);
  textSize(12);
  textStyle(BOLD);
  text("INJECTION POPULATION", 35, 305);
  text("BATCH QUERY LOAD", 35, 370);
  pop();

  // GRAPH
  let maxV = Math.max(...histLin, 5);
  let gY = 520;
  noFill();
  stroke(255, 60, 80);
  strokeWeight(2.5);
  beginShape();
  for (let i = 0; i < histLin.length; i++)
    vertex(
      map(i, 0, 120, 25, 385),
      map(histLin[i], 0, maxV, gY + 130, gY + 30),
    );
  endShape();
  stroke(0, 255, 150);
  beginShape();
  for (let i = 0; i < histQT.length; i++)
    vertex(map(i, 0, 120, 25, 385), map(histQT[i], 0, maxV, gY + 130, gY + 30));
  endShape();

  push();
  fill(255);
  noStroke();
  textStyle(BOLD);
  textSize(12);
  text("PEAK: " + maxV.toFixed(1) + "ms", 30, gY + 20);
  textAlign(RIGHT);
  text(
    "SYSTEM: " + (isPaused ? 0 : Math.floor(frameRate())) + "Hz",
    385,
    gY + 20,
  );
  text("0ms", 385, gY + 135);
  pop();
}

function spawnAgents(n) {
  agents = [];
  for (let i = 0; i < n; i++)
    agents.push(new Point(random(width), random(height)));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

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
let agentSlider, querySlider, debugToggle;
let histQT = [],
  histLin = [];
let playbackIdx = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Courier New");

  agentSlider = createSlider(10, 8000, 3000, 10);
  agentSlider.position(30, 280);

  querySlider = createSlider(1, 2000, 800, 10);
  querySlider.position(30, 340);

  debugToggle = createCheckbox(" ENGINE TRAVERSAL", false);
  debugToggle.position(30, 380);
  debugToggle.style("color", "#FF00FF");
  debugToggle.style("font-weight", "bold");

  spawnAgents(3000);
}

function draw() {
  background(5, 8, 15);

  if (agentSlider.value() !== agents.length) spawnAgents(agentSlider.value());

  let boundary = new Rectangle(width / 2, height / 2, width / 2, height / 2);
  qtree = new QuadTree(boundary, 4);

  for (let a of agents) {
    a.update(width, height);
    qtree.insert(a);
    stroke(255, 80);
    strokeWeight(1.5);
    point(a.x, a.y);
  }

  drawGrid(qtree);

  let range = new Rectangle(mouseX, mouseY, 90, 90);
  let res = qtree.query(range);

  // TRAVERSAL VISUALS
  if (debugToggle.checked()) {
    if (dist(mouseX, mouseY, pmouseX, pmouseY) > 2) playbackIdx = 0;
    if (frameCount % 3 === 0 && playbackIdx < res.visited.length) playbackIdx++;
    rectMode(CENTER);
    noStroke();
    let limit = Math.min(playbackIdx, res.visited.length);
    for (let i = 0; i < limit; i++) {
      let b = res.visited[i];
      fill(255, 0, 255, 12);
      rect(b.x, b.y, b.w * 2, b.h * 2);
    }
  }

  // RADAR
  stroke(0, 255, 150);
  noFill();
  strokeWeight(2);
  rect(range.x, range.y, range.w * 2, range.h * 2);

  for (let p of res.found) {
    stroke(0, 255, 150);
    strokeWeight(6);
    point(p.x, p.y);
    stroke(0, 255, 150, 40);
    strokeWeight(0.5);
    line(mouseX, mouseY, p.x, p.y);
  }

  runPerformance(res.visited.length, res.found.length);
}

// ==========================================
// 3. TELEMETRY RENDERERS
// ==========================================

function drawGrid(node) {
  stroke(0, 150, 255, 15);
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
    drawGrid(node.nw);
    drawGrid(node.ne);
    drawGrid(node.sw);
    drawGrid(node.se);
  }
}

function runPerformance(visited, foundCount) {
  let queries = querySlider.value();
  let testArea = new Rectangle(random(width), random(height), 80, 80);

  let t0 = performance.now();
  for (let i = 0; i < queries; i++) {
    let c = 0;
    for (let a of agents) {
      if (testArea.contains(a)) c++;
    }
  }
  histLin.push(performance.now() - t0);

  let t1 = performance.now();
  for (let i = 0; i < queries; i++) {
    qtree.query(testArea);
  }
  histQT.push(performance.now() - t1);

  if (histLin.length > 100) {
    histLin.shift();
    histQT.shift();
  }

  // CALC PRUNING %
  // Total potential nodes in a balanced tree with capacity 4 is roughly agents/2
  let totalPotentialNodes = Math.max(agents.length / 2, 1);
  let pruningEfficiency = max(
    0,
    (1 - visited / totalPotentialNodes) * 100,
  ).toFixed(2);

  // DRAW PANELS
  fill(10, 15, 25, 240);
  stroke(0, 150, 255, 100);
  strokeWeight(1.5);
  rectMode(CORNER);
  rect(15, 15, 330, 225, 8); // Header
  rect(15, 250, 330, 155, 8); // Controls
  rect(15, 415, 330, 110, 8); // Graph

  // TEXT DATA
  fill(255);
  noStroke();
  textAlign(LEFT);
  textSize(14);
  textStyle(BOLD);
  text("GEONEXUS | TELEMETRY", 35, 45);

  textSize(11);
  textStyle(NORMAL);
  fill(0, 200, 255);
  text("DIAGNOSTICS:", 35, 75);

  fill(255);
  text("ACTIVE AGENTS:    " + agents.length, 35, 100);
  text("TARGETS LOCKED:   " + foundCount, 35, 120);
  text("NODES VISITED:    " + visited, 35, 140);
  fill(0, 200, 255);
  text("PRUNING EFFICIENCY: " + pruningEfficiency + "%", 35, 160);

  fill(0, 255, 150);
  textStyle(BOLD);
  text(
    "QUADTREE LATENCY: " + histQT[histQT.length - 1]?.toFixed(2) + " ms",
    35,
    190,
  );
  fill(255, 60, 80);
  text(
    "LINEAR LATENCY:   " + histLin[histLin.length - 1]?.toFixed(2) + " ms",
    35,
    210,
  );

  // SLIDER LABELS
  fill(255);
  textStyle(BOLD);
  text("INJECTION LOAD (Agent Count)", 35, 275);
  text("CONCURRENCY LOAD (Batch Size)", 35, 335);

  // GRAPH DATA
  let maxV = Math.max(...histLin, ...histQT, 5);
  noFill();
  stroke(255, 60, 80);
  beginShape();
  for (let i = 0; i < histLin.length; i++)
    vertex(map(i, 0, 100, 25, 335), map(histLin[i], 0, maxV, 515, 435));
  endShape();
  stroke(0, 255, 150);
  beginShape();
  for (let i = 0; i < histQT.length; i++)
    vertex(map(i, 0, 100, 25, 335), map(histQT[i], 0, maxV, 515, 435));
  endShape();

  // GRAPH AXIS LABELS
  fill(200);
  textStyle(NORMAL);
  textSize(9);
  text("MAX PEAK: " + maxV.toFixed(1) + "ms", 25, 430);
  textAlign(RIGHT);
  text("0ms", 335, 510);
}

function spawnAgents(n) {
  agents = [];
  for (let i = 0; i < n; i++)
    agents.push(new Point(random(width), random(height)));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

var animationInterval = 5;
var cellSize = 50;

setTimeout(function() {
  alert('Click on a few squares to create road blockers, then click on the blue square to find the shortest path.')
}, 500);

class Matrix {
  constructor(cellCount, cellSize) {
    this.el = document.getElementById("root");
    this.blocking = false;
    this.cellCount = cellCount;
    this.cellSize = cellSize;
    this.cells = [];
    this.iStart = this.cellCount - 1;
    this.jStart = 0;
    this.iEnd = 0;
    this.jEnd = this.cellCount - 1;
    this.ms = 0;
  }

  render() {
    this.el.setAttribute("width", this.cellCount * this.cellSize);
    this.el.setAttribute("height", this.cellCount * this.cellSize);
    for (let i = 0; i < this.cellCount; i++) {
      for (let j = 0; j < this.cellCount; j++) {
        this.cells[i] = this.cells[i] || [];
        this.cells[i][j] = this.append(i, j);
      }
    }
    this.addBlockListeners();
    this.addPathListeners();
  }

  append(i, j) {
    const cell = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    cell.setAttribute("y", i * this.cellSize);
    cell.setAttribute("x", j * this.cellSize);
    cell.setAttribute("width", this.cellSize);
    cell.setAttribute("height", this.cellSize);
    this.el.append(cell);
    return cell;
  }

  addBlockListeners() {
    this.el.addEventListener("mousedown", e => {
      if (this.canBlock(e.target) && e.which === 1) {
        this.block(e.target);
        this.blocking = true;
      }
    });

    this.el.addEventListener("mouseup", e => {
      this.blocking = false;
    });

    this.el.addEventListener("mouseover", e => {
      if (this.canBlock(e.target) && this.blocking) {
        this.block(e.target);
      }
    });
  }

  addPathListeners() {
    this.start = this.cells[this.iStart][this.jStart];
    this.end = this.cells[this.iEnd][this.jEnd];
    this.start.classList.add("start");
    this.end.classList.add("end");
    this.start.addEventListener("click", e => {
      if (!this.graph) {
        this.buildGraph();
        this.traverse();
      }
    });
  }

  buildGraph() {
    this.graph = new Graph();
    for (let j = 0; j < this.cellCount; j++) {
      for (let i = 0; i < this.cellCount; i++) {
        if (this.isBlockedAt(i, j)) {
          continue;
        }
        const iPlus = i + 1;
        const jPlus = j + 1;
        if (iPlus < this.cellCount && !this.isBlockedAt(iPlus, j)) {
          const u = `${i},${j}`;
          const v = `${iPlus},${j}`;
          this.graph.addEdge(u, v);
        }
        if (jPlus < this.cellCount && !this.isBlockedAt(i, jPlus)) {
          const u = `${i},${j}`;
          const v = `${i},${jPlus}`;
          this.graph.addEdge(u, v);
        }
      }
    }
  }

  traverse() {
    const source = `${this.iStart},${this.jStart}`;
    const target = `${this.iEnd},${this.jEnd}`;
    const visit = this.visit.bind(this);
    const path = this.graph.findShortestPath(source, target, visit);
    path.forEach(step => {
      this.highlight(step[1]);
    });
  }

  canBlock(cell) {
    return !this.graph && this.start !== cell && this.end !== cell;
  }

  isBlockedAt(i, j) {
    return this.cells[i][j].classList.contains("blocked");
  }

  block(cell) {
    cell.classList.add("blocked");
  }

  visit(node) {
    this.mark(node, "visited");
  }

  highlight(node) {
    this.mark(node, "path");
  }

  mark(node, className) {
    this.ms += animationInterval;
    setTimeout(() => {
      const parts = node.split(",");
      const i = parseInt(parts[0], 10);
      const j = parseInt(parts[1], 10);
      if (i !== this.iEnd || j !== this.jEnd) {
        this.cells[i][j].classList.add(className);
      }
    }, this.ms);
  }
}

class Graph {
  constructor() {
    this.edges = {};
  }

  addEdge(u, v) {
    this.edges[u] = this.edges[u] || new Set();
    this.edges[v] = this.edges[v] || new Set();
    this.edges[u].add(v);
    this.edges[v].add(u);
  }

  findShortestPath(source, target, visit) {
    if (source === target || !this.edges[source] || !this.edges[target]) {
      return [];
    }
    const prev = this.dijkstra(source, visit)[1];
    let u = prev && prev[target];
    if (!u) {
      return [];
    }
    let v = target;
    const path = [[u, v]];
    while (u !== source) {
      v = u;
      u = prev[u];
      path.unshift([u, v]);
    }
    return path;
  }

  dijkstra(source, visit) {
    const nodes = new Set();
    const dist = {};
    const prev = {};
    for (let node of Object.keys(this.edges)) {
      dist[node] = Infinity;
      nodes.add(node);
    }
    dist[source] = 0;
    while (nodes.size > 0) {
      const u = _.minBy(Array.from(nodes), node => dist[node]);
      nodes.delete(u);
      for (let v of this.edges[u]) {
        const alt = dist[u] + 1;
        if (alt < dist[v]) {
          visit(v);
          dist[v] = alt;
          prev[v] = u;
        }
      }
    }
    return [dist, prev];
  }
}

var base = Math.min(window.innerHeight, window.innerWidth);
var cellCount = Math.floor(base / cellSize);
var m = new Matrix(cellCount, cellSize);
m.render();

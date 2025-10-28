import { ISolver, SolverStep, Position, Solution } from "@/types";
import { Maze } from "@/core/Maze";

interface DijkstraNode {
  position: Position;
  distance: number;
  previous: Position | null;
  visited: boolean;
}

export class DijkstraSolver implements ISolver {
  private maze: Maze | null = null;
  private start: Position | null = null;
  private goal: Position | null = null;
  private nodes: Map<string, DijkstraNode> = new Map();
  private priorityQueue: DijkstraNode[] = [];
  private path: Position[] = [];
  private visited: Set<string> = new Set();
  private steps: SolverStep[] = [];
  private startTime: number = 0;
  private solved: boolean = false;

  async solve(maze: Maze, start: Position, goal: Position): Promise<Solution> {
    this.maze = maze;
    this.start = start;
    this.goal = goal;
    this.reset();

    this.startTime = Date.now();
    this.initializeNodes();

    while (this.priorityQueue.length > 0) {
      // Sort by distance (simple priority queue implementation)
      this.priorityQueue.sort((a, b) => a.distance - b.distance);
      const currentNode = this.priorityQueue.shift()!;

      if (currentNode.visited) continue;
      currentNode.visited = true;

      const currentKey = this.positionToKey(currentNode.position);
      this.visited.add(currentKey);

      // Record step
      this.steps.push({
        position: currentNode.position,
        action: "explore",
        timestamp: Date.now() - this.startTime,
      });

      // Check if we reached the goal
      if (
        currentNode.position.x === this.goal.x &&
        currentNode.position.y === this.goal.y
      ) {
        this.path = this.reconstructPath();
        this.solved = true;
        break;
      }

      // Explore neighbors
      const neighbors = this.getNeighbors(currentNode.position);
      for (const neighbor of neighbors) {
        const neighborNode = this.getNode(neighbor);
        if (!neighborNode || neighborNode.visited) continue;

        const newDistance = currentNode.distance + 1; // Uniform cost of 1 per step

        if (newDistance < neighborNode.distance) {
          neighborNode.distance = newDistance;
          neighborNode.previous = currentNode.position;

          // Add to priority queue if not already there
          if (!this.priorityQueue.includes(neighborNode)) {
            this.priorityQueue.push(neighborNode);
          }
        }
      }
    }

    const endTime = Date.now();
    return {
      path: this.path,
      steps: this.steps,
      solved: this.solved,
      stats: {
        totalSteps: this.steps.length,
        timeTaken: endTime - this.startTime,
        nodesExplored: this.visited.size,
        pathLength: this.path.length,
      },
    };
  }

  async step(): Promise<boolean> {
    if (!this.maze || !this.start || !this.goal) {
      throw new Error("Solver not properly initialized");
    }

    // Initialize on first step
    if (this.nodes.size === 0) {
      this.startTime = Date.now();
      this.initializeNodes();
    }

    if (this.priorityQueue.length === 0) {
      // No more nodes to explore
      return false;
    }

    // Get next node from priority queue
    this.priorityQueue.sort((a, b) => a.distance - b.distance);
    const currentNode = this.priorityQueue.shift()!;

    if (currentNode.visited) {
      return this.step(); // Skip already visited nodes
    }

    currentNode.visited = true;
    const currentKey = this.positionToKey(currentNode.position);
    this.visited.add(currentKey);

    // Record step
    this.steps.push({
      position: currentNode.position,
      action: "explore",
      timestamp: Date.now() - this.startTime,
    });

    // Check if we reached the goal
    const reachedGoal =
      currentNode.position.x === this.goal.x &&
      currentNode.position.y === this.goal.y;
    if (reachedGoal) {
      this.path = this.reconstructPath();
      this.solved = true;
      return false; // No more steps needed
    }

    // Explore neighbors
    const neighbors = this.getNeighbors(currentNode.position);
    for (const neighbor of neighbors) {
      const neighborNode = this.getNode(neighbor);
      if (!neighborNode || neighborNode.visited) continue;

      const newDistance = currentNode.distance + 1;

      if (newDistance < neighborNode.distance) {
        neighborNode.distance = newDistance;
        neighborNode.previous = currentNode.position;

        // Add to priority queue if not already there
        if (!this.priorityQueue.includes(neighborNode)) {
          this.priorityQueue.push(neighborNode);
        }
      }
    }

    return this.priorityQueue.length > 0;
  }

  reset(): void {
    this.nodes.clear();
    this.priorityQueue = [];
    this.path = [];
    this.visited.clear();
    this.steps = [];
    this.startTime = 0;
    this.solved = false;
  }

  private initializeNodes(): void {
    if (!this.maze || !this.start) return;

    // Initialize all reachable positions
    const queue: Position[] = [this.start];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = this.positionToKey(current);

      if (visited.has(key)) continue;
      visited.add(key);

      const node: DijkstraNode = {
        position: current,
        distance:
          current.x === this.start!.x && current.y === this.start!.y
            ? 0
            : Infinity,
        previous: null,
        visited: false,
      };

      this.nodes.set(key, node);

      // Add neighbors to queue
      const neighbors = this.maze.getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = this.positionToKey(neighbor);
        if (!visited.has(neighborKey)) {
          queue.push(neighbor);
        }
      }
    }

    // Initialize priority queue with start node
    const startNode = this.nodes.get(this.positionToKey(this.start));
    if (startNode) {
      this.priorityQueue.push(startNode);
    }
  }

  private positionToKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  private getNode(pos: Position): DijkstraNode | undefined {
    return this.nodes.get(this.positionToKey(pos));
  }

  private getNeighbors(pos: Position): Position[] {
    if (!this.maze) return [];
    return this.maze.getNeighbors(pos);
  }

  private reconstructPath(): Position[] {
    if (!this.goal) return [];

    const path: Position[] = [];
    let current: Position | null = this.goal;

    while (current) {
      path.unshift(current);
      const node = this.getNode(current);
      current = node?.previous || null;
    }

    return path;
  }

  getCurrentPath(): Position[] {
    return [...this.path];
  }
}

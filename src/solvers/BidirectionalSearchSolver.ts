import { ISolver, SolverStep, Position, Solution } from "@/types";
import { Maze } from "@/core/Maze";

interface BidirectionalNode {
  position: Position;
  previous: Position | null;
  visited: boolean;
  direction: "forward" | "backward";
}

export class BidirectionalSearchSolver implements ISolver {
  private maze: Maze | null = null;
  private start: Position | null = null;
  private goal: Position | null = null;
  private forwardNodes: Map<string, BidirectionalNode> = new Map();
  private backwardNodes: Map<string, BidirectionalNode> = new Map();
  private forwardQueue: BidirectionalNode[] = [];
  private backwardQueue: BidirectionalNode[] = [];
  private path: Position[] = [];
  private visited: Set<string> = new Set();
  private steps: SolverStep[] = [];
  private startTime: number = 0;
  private solved: boolean = false;
  private meetingPoint: Position | null = null;

  initialize(maze: Maze, start: Position, goal: Position): void {
    this.maze = maze;
    this.start = start;
    this.goal = goal;
    this.reset();
  }

  async solve(maze: Maze, start: Position, goal: Position): Promise<Solution> {
    this.initialize(maze, start, goal);

    this.startTime = Date.now();
    this.initializeNodes();

    while (this.forwardQueue.length > 0 && this.backwardQueue.length > 0) {
      // Alternate between forward and backward search
      const forwardResult = this.expandFrontier(
        this.forwardQueue,
        this.forwardNodes,
        "forward"
      );
      if (forwardResult) {
        this.path = this.reconstructBidirectionalPath();
        this.solved = true;
        break;
      }

      const backwardResult = this.expandFrontier(
        this.backwardQueue,
        this.backwardNodes,
        "backward"
      );
      if (backwardResult) {
        this.path = this.reconstructBidirectionalPath();
        this.solved = true;
        break;
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
    if (this.forwardNodes.size === 0) {
      this.startTime = Date.now();
      this.initializeNodes();
    }

    if (this.forwardQueue.length === 0 && this.backwardQueue.length === 0) {
      // No more nodes to explore
      return false;
    }

    // Alternate between forward and backward search
    let expanded = false;

    if (this.forwardQueue.length > 0) {
      const result = this.expandFrontier(
        this.forwardQueue,
        this.forwardNodes,
        "forward"
      );
      if (result) {
        this.path = this.reconstructBidirectionalPath();
        this.solved = true;
        return false;
      }
      expanded = true;
    }

    if (this.backwardQueue.length > 0) {
      const result = this.expandFrontier(
        this.backwardQueue,
        this.backwardNodes,
        "backward"
      );
      if (result) {
        this.path = this.reconstructBidirectionalPath();
        this.solved = true;
        return false;
      }
      expanded = true;
    }

    return (
      expanded &&
      (this.forwardQueue.length > 0 || this.backwardQueue.length > 0)
    );
  }

  reset(): void {
    this.forwardNodes.clear();
    this.backwardNodes.clear();
    this.forwardQueue = [];
    this.backwardQueue = [];
    this.path = [];
    this.visited.clear();
    this.steps = [];
    this.startTime = 0;
    this.solved = false;
    this.meetingPoint = null;
  }

  private initializeNodes(): void {
    if (!this.maze || !this.start || !this.goal) return;

    // Initialize forward search from start
    const startKey = this.positionToKey(this.start);
    const startNode: BidirectionalNode = {
      position: this.start,
      previous: null,
      visited: false,
      direction: "forward",
    };
    this.forwardNodes.set(startKey, startNode);
    this.forwardQueue.push(startNode);

    // Initialize backward search from goal
    const goalKey = this.positionToKey(this.goal);
    const goalNode: BidirectionalNode = {
      position: this.goal,
      previous: null,
      visited: false,
      direction: "backward",
    };
    this.backwardNodes.set(goalKey, goalNode);
    this.backwardQueue.push(goalNode);
  }

  private expandFrontier(
    queue: BidirectionalNode[],
    nodes: Map<string, BidirectionalNode>,
    direction: "forward" | "backward"
  ): boolean {
    const currentNode = queue.shift()!;
    if (currentNode.visited) return false;

    currentNode.visited = true;
    const currentKey = this.positionToKey(currentNode.position);
    this.visited.add(currentKey);

    // Record step
    this.steps.push({
      position: currentNode.position,
      action: "explore",
      timestamp: Date.now() - this.startTime,
    });

    // Check if this position has been visited by the other search
    const otherNodes =
      direction === "forward" ? this.backwardNodes : this.forwardNodes;
    const otherNode = otherNodes.get(currentKey);
    if (otherNode && otherNode.visited) {
      // Found meeting point!
      this.meetingPoint = currentNode.position;
      return true;
    }

    // Explore neighbors
    const neighbors = this.getNeighbors(currentNode.position);
    for (const neighbor of neighbors) {
      const neighborKey = this.positionToKey(neighbor);
      const existingNode = nodes.get(neighborKey);

      if (existingNode && existingNode.visited) continue;

      if (!existingNode) {
        // Create new node
        const newNode: BidirectionalNode = {
          position: neighbor,
          previous: currentNode.position,
          visited: false,
          direction,
        };
        nodes.set(neighborKey, newNode);
        queue.push(newNode);
      }
    }

    return false;
  }

  private reconstructBidirectionalPath(): Position[] {
    if (!this.meetingPoint || !this.start || !this.goal) return [];

    const path: Position[] = [];

    // Build path from start to meeting point
    let current: Position | null = this.meetingPoint;
    while (current) {
      path.unshift(current);
      const node = this.forwardNodes.get(this.positionToKey(current));
      current = node?.previous || null;
    }

    // Build path from meeting point to goal (excluding meeting point to avoid duplication)
    current = this.meetingPoint;
    const goalPath: Position[] = [];
    while (current) {
      const node = this.backwardNodes.get(this.positionToKey(current));
      if (!node) break;
      current = node.previous;
      if (current) goalPath.push(current);
    }

    // Reverse goal path and append
    goalPath.reverse();
    path.push(...goalPath);

    return path;
  }

  private positionToKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  private getNeighbors(pos: Position): Position[] {
    if (!this.maze) return [];
    const allNeighbors = this.maze.getNeighbors(pos);
    return allNeighbors.filter(
      (neighbor): neighbor is Position =>
        neighbor !== undefined && this.maze!.canMove(pos, neighbor)
    );
  }

  getCurrentPath(): Position[] {
    return [...this.path];
  }
}

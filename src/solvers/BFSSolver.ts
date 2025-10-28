import { ISolver, Position, Solution } from "@/types";
import { Maze } from "@/core/Maze";

interface BFSNode {
  position: Position;
  parent: BFSNode | null;
  distance: number;
}

export class BFSSolver implements ISolver {
  private maze: Maze | null = null;
  private currentPath: Position[] = [];
  private queue: BFSNode[] = [];
  private visited: Set<string> = new Set();
  private goal: Position | null = null;
  private isComplete: boolean = false;

  initialize(maze: Maze, start: Position, goal: Position): void {
    this.maze = maze;
    this.goal = goal;
    this.currentPath = [start];
    this.queue = [];
    this.visited.clear();
    this.isComplete = false;

    // Initialize with start node
    const startNode: BFSNode = {
      position: start,
      parent: null,
      distance: 0,
    };

    this.queue.push(startNode);
    this.visited.add(this.positionToString(start));
  }

  async solve(maze: Maze, start: Position, goal: Position): Promise<Solution> {
    this.initialize(maze, start, goal);

    const startTime = performance.now();

    let steps = 0;
    const maxSteps = 10000;

    while (this.queue.length > 0 && !this.isComplete && steps < maxSteps) {
      await this.step();
      steps++;
    }

    const endTime = performance.now();

    return {
      path: this.currentPath,
      steps: this.currentPath.map((pos, index) => ({
        position: pos,
        action: index === 0 ? "move" : "explore",
        timestamp: startTime + index * 10,
      })),
      solved: this.isComplete,
      stats: {
        totalSteps: steps,
        timeTaken: endTime - startTime,
        nodesExplored: this.visited.size,
        pathLength: this.currentPath.length,
      },
    };
  }

  async step(): Promise<boolean> {
    if (!this.maze || !this.goal || this.queue.length === 0) {
      return false;
    }

    const current = this.queue.shift()!;

    // Check if we've reached the goal
    if (this.positionsEqual(current.position, this.goal)) {
      this.reconstructPath(current);
      this.isComplete = true;
      return false;
    }

    // Explore neighbors
    const neighbors = this.maze.getNeighbors(current.position);
    for (const neighbor of neighbors) {
      if (!neighbor) continue;

      const neighborKey = this.positionToString(neighbor);
      if (this.visited.has(neighborKey)) continue;

      if (!this.maze.canMove(current.position, neighbor)) continue;

      // Add to visited set and queue
      this.visited.add(neighborKey);
      const neighborNode: BFSNode = {
        position: neighbor,
        parent: current,
        distance: current.distance + 1,
      };
      this.queue.push(neighborNode);
    }

    // Update current path for visualization
    this.updateCurrentPath(current);

    return this.queue.length > 0;
  }

  getCurrentPath(): Position[] {
    return [...this.currentPath];
  }

  reset(): void {
    this.currentPath = [];
    this.queue = [];
    this.visited.clear();
    this.goal = null;
    this.isComplete = false;
  }

  private reconstructPath(endNode: BFSNode): void {
    const path: Position[] = [];
    let current: BFSNode | null = endNode;

    while (current) {
      path.unshift(current.position);
      current = current.parent;
    }

    this.currentPath = path;
  }

  private updateCurrentPath(currentNode: BFSNode): void {
    // For visualization, show the path from start to current node
    const path: Position[] = [];
    let node: BFSNode | null = currentNode;

    while (node) {
      path.unshift(node.position);
      node = node.parent;
    }

    this.currentPath = path;
  }

  private positionsEqual(pos1: Position, pos2: Position): boolean {
    return (
      pos1.x === pos2.x && pos1.y === pos2.y && (pos1.z || 0) === (pos2.z || 0)
    );
  }

  private positionToString(pos: Position): string {
    return `${pos.x},${pos.y},${pos.z || 0}`;
  }
}

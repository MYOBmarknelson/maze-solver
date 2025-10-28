import { ISolver, Position, Solution } from "@/types";
import { Maze } from "@/core/Maze";

interface AStarNode {
  position: Position;
  gCost: number; // Cost from start
  hCost: number; // Heuristic cost to goal
  fCost: number; // Total cost (g + h)
  parent: AStarNode | null;
}

export class AStarSolver implements ISolver {
  private maze: Maze | null = null;
  private currentPath: Position[] = [];
  private openSet: AStarNode[] = [];
  private closedSet: Set<string> = new Set();
  private goal: Position | null = null;
  private isComplete: boolean = false;

  initialize(maze: Maze, start: Position, goal: Position): void {
    this.maze = maze;
    this.goal = goal;
    this.currentPath = [start];
    this.openSet = [];
    this.closedSet.clear();
    this.isComplete = false;

    // Initialize start node
    const startNode: AStarNode = {
      position: start,
      gCost: 0,
      hCost: this.heuristic(start, goal),
      fCost: this.heuristic(start, goal),
      parent: null,
    };

    this.openSet.push(startNode);
  }

  async solve(maze: Maze, start: Position, goal: Position): Promise<Solution> {
    this.initialize(maze, start, goal);

    const startTime = performance.now();

    let steps = 0;
    const maxSteps = 10000;

    while (this.openSet.length > 0 && !this.isComplete && steps < maxSteps) {
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
        nodesExplored: this.closedSet.size,
        pathLength: this.currentPath.length,
      },
    };
  }

  async step(): Promise<boolean> {
    if (!this.maze || !this.goal || this.openSet.length === 0) {
      return false;
    }

    // Find node with lowest f-cost
    let currentIndex = 0;
    for (let i = 1; i < this.openSet.length; i++) {
      if (this.openSet[i]!.fCost < this.openSet[currentIndex]!.fCost) {
        currentIndex = i;
      }
    }

    const current = this.openSet.splice(currentIndex, 1)[0]!;

    // Check if we've reached the goal
    if (this.positionsEqual(current.position, this.goal)) {
      this.reconstructPath(current);
      this.isComplete = true;
      return false;
    }

    this.closedSet.add(this.positionToString(current.position));

    // Check neighbors
    const neighbors = this.maze.getNeighbors(current.position);
    for (const neighbor of neighbors) {
      if (!neighbor || this.closedSet.has(this.positionToString(neighbor))) {
        continue;
      }

      if (!this.maze.canMove(current.position, neighbor)) {
        continue;
      }

      const gCost = current.gCost + 1; // Assume uniform cost
      const hCost = this.heuristic(neighbor, this.goal);
      const fCost = gCost + hCost;

      // Check if neighbor is already in open set with lower cost
      const existingNode = this.openSet.find((node) =>
        this.positionsEqual(node.position, neighbor)
      );

      if (!existingNode) {
        const neighborNode: AStarNode = {
          position: neighbor,
          gCost,
          hCost,
          fCost,
          parent: current,
        };
        this.openSet.push(neighborNode);
      } else if (gCost < existingNode.gCost) {
        existingNode.gCost = gCost;
        existingNode.fCost = fCost;
        existingNode.parent = current;
      }
    }

    // Update current path for visualization
    this.updateCurrentPath(current);

    return this.openSet.length > 0;
  }

  getCurrentPath(): Position[] {
    return [...this.currentPath];
  }

  reset(): void {
    this.currentPath = [];
    this.openSet = [];
    this.closedSet.clear();
    this.goal = null;
    this.isComplete = false;
  }

  private heuristic(pos: Position, goal: Position): number {
    // Manhattan distance
    const dx = Math.abs(pos.x - goal.x);
    const dy = Math.abs(pos.y - goal.y);
    const dz = Math.abs((pos.z || 0) - (goal.z || 0));
    return dx + dy + dz;
  }

  private reconstructPath(endNode: AStarNode): void {
    const path: Position[] = [];
    let current: AStarNode | null = endNode;

    while (current) {
      path.unshift(current.position);
      current = current.parent;
    }

    this.currentPath = path;
  }

  private updateCurrentPath(currentNode: AStarNode): void {
    // For visualization, show the path from start to current node
    const path: Position[] = [];
    let node: AStarNode | null = currentNode;

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

import { ISolver, Position, Solution } from '@/types';
import { Maze } from '@/core/Maze';

interface DFSNode {
  position: Position;
  parent: DFSNode | null;
}

export class DFSSolver implements ISolver {
  private maze: Maze | null = null;
  private currentPath: Position[] = [];
  private stack: DFSNode[] = [];
  private visited: Set<string> = new Set();
  private goal: Position | null = null;
  private isComplete: boolean = false;

  async solve(maze: Maze, start: Position, goal: Position): Promise<Solution> {
    this.maze = maze;
    this.goal = goal;
    this.currentPath = [start];
    this.stack = [];
    this.visited.clear();
    this.isComplete = false;

    const startTime = performance.now();

    // Initialize with start node
    const startNode: DFSNode = {
      position: start,
      parent: null
    };

    this.stack.push(startNode);
    this.visited.add(this.positionToString(start));

    let steps = 0;
    const maxSteps = 10000;

    while (this.stack.length > 0 && !this.isComplete && steps < maxSteps) {
      await this.step();
      steps++;
    }

    const endTime = performance.now();

    return {
      path: this.currentPath,
      steps: this.currentPath.map((pos, index) => ({
        position: pos,
        action: index === 0 ? 'move' : 'explore',
        timestamp: startTime + (index * 10)
      })),
      solved: this.isComplete,
      stats: {
        totalSteps: steps,
        timeTaken: endTime - startTime,
        nodesExplored: this.visited.size,
        pathLength: this.currentPath.length
      }
    };
  }

  async step(): Promise<boolean> {
    if (!this.maze || !this.goal || this.stack.length === 0) {
      return false;
    }

    const current = this.stack.pop()!;

    // Check if we've reached the goal
    if (this.positionsEqual(current.position, this.goal)) {
      this.reconstructPath(current);
      this.isComplete = true;
      return false;
    }

    // Explore neighbors in reverse order for more natural exploration
    const neighbors = this.maze.getNeighbors(current.position);
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const neighbor = neighbors[i];
      if (!neighbor) continue;

      const neighborKey = this.positionToString(neighbor);
      if (this.visited.has(neighborKey)) continue;

      if (!this.maze.canMove(current.position, neighbor)) continue;

      // Add to visited set and stack
      this.visited.add(neighborKey);
      const neighborNode: DFSNode = {
        position: neighbor,
        parent: current
      };
      this.stack.push(neighborNode);
    }

    // Update current path for visualization
    this.updateCurrentPath(current);

    return this.stack.length > 0;
  }

  getCurrentPath(): Position[] {
    return [...this.currentPath];
  }

  reset(): void {
    this.currentPath = [];
    this.stack = [];
    this.visited.clear();
    this.goal = null;
    this.isComplete = false;
  }

  private reconstructPath(endNode: DFSNode): void {
    const path: Position[] = [];
    let current: DFSNode | null = endNode;

    while (current) {
      path.unshift(current.position);
      current = current.parent;
    }

    this.currentPath = path;
  }

  private updateCurrentPath(currentNode: DFSNode): void {
    // For visualization, show the path from start to current node
    const path: Position[] = [];
    let node: DFSNode | null = currentNode;

    while (node) {
      path.unshift(node.position);
      node = node.parent;
    }

    this.currentPath = path;
  }

  private positionsEqual(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y && (pos1.z || 0) === (pos2.z || 0);
  }

  private positionToString(pos: Position): string {
    return `${pos.x},${pos.y},${pos.z || 0}`;
  }
}
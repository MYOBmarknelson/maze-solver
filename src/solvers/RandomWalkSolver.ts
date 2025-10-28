import { ISolver, Position, Solution } from "@/types";
import { Maze } from "@/core/Maze";

export class RandomWalkSolver implements ISolver {
  private maze: Maze | null = null;
  private currentPath: Position[] = [];
  private visited: Set<string> = new Set();
  private goal: Position | null = null;
  private isComplete: boolean = false;

  async solve(maze: Maze, start: Position, goal: Position): Promise<Solution> {
    this.maze = maze;
    this.goal = goal;
    this.currentPath = [start];
    this.visited.clear();
    this.isComplete = false;

    const startTime = performance.now();
    let steps = 0;
    const maxSteps = 10000; // Prevent infinite loops

    while (!this.isComplete && steps < maxSteps) {
      await this.step();
      steps++;
    }

    const endTime = performance.now();

    return {
      path: this.currentPath,
      steps: this.currentPath.map((pos, index) => ({
        position: pos,
        action: index === 0 ? "move" : "explore",
        timestamp: startTime + index * 10, // Rough estimate
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
    if (!this.maze || !this.goal || this.isComplete) {
      return false;
    }

    const current = this.currentPath[this.currentPath.length - 1];
    if (!current) return false;

    // Check if we've reached the goal
    if (this.positionsEqual(current, this.goal)) {
      this.isComplete = true;
      return false;
    }

    // Get valid neighbors
    const neighbors = this.maze.getNeighbors(current);
    const validMoves = neighbors.filter(
      (neighbor): neighbor is Position =>
        neighbor !== undefined &&
        this.maze!.canMove(current, neighbor) &&
        !this.visited.has(this.positionToString(neighbor))
    );

    if (validMoves.length === 0) {
      // Dead end - backtrack
      this.currentPath.pop();
      return this.currentPath.length > 0;
    }

    // Choose random valid move
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    const nextMove = validMoves[randomIndex]!;

    this.currentPath.push(nextMove);
    this.visited.add(this.positionToString(nextMove));

    return true;
  }

  getCurrentPath(): Position[] {
    return [...this.currentPath];
  }

  reset(): void {
    this.currentPath = [];
    this.visited.clear();
    this.isComplete = false;
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

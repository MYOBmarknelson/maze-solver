import { ISolver, Position, Solution } from "@/types";
import { Maze } from "@/core/Maze";

type Direction = "north" | "south" | "east" | "west";

interface DirectionInfo {
  direction: Direction;
  delta: Position;
  left: Direction;
  right: Direction;
  opposite: Direction;
}

const DIRECTIONS: Record<Direction, DirectionInfo> = {
  north: {
    direction: "north",
    delta: { x: 0, y: -1 },
    left: "west",
    right: "east",
    opposite: "south",
  },
  south: {
    direction: "south",
    delta: { x: 0, y: 1 },
    left: "east",
    right: "west",
    opposite: "north",
  },
  east: {
    direction: "east",
    delta: { x: 1, y: 0 },
    left: "north",
    right: "south",
    opposite: "west",
  },
  west: {
    direction: "west",
    delta: { x: -1, y: 0 },
    left: "south",
    right: "north",
    opposite: "east",
  },
};

export class RightHandRuleSolver implements ISolver {
  private maze: Maze | null = null;
  private currentPath: Position[] = [];
  private currentDirection: Direction = "east"; // Start facing east
  private goal: Position | null = null;
  private isComplete: boolean = false;

  async solve(maze: Maze, start: Position, goal: Position): Promise<Solution> {
    this.maze = maze;
    this.goal = goal;
    this.currentPath = [start];
    this.currentDirection = "east"; // Always start facing east
    this.isComplete = false;

    const startTime = performance.now();

    let steps = 0;
    const maxSteps = 10000;

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
        timestamp: startTime + index * 10,
      })),
      solved: this.isComplete,
      stats: {
        totalSteps: steps,
        timeTaken: endTime - startTime,
        nodesExplored: this.currentPath.length,
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

    // Apply right-hand rule: try to turn right, then go straight, then turn left, then turn around
    const nextPosition = this.getNextPosition(current);

    if (nextPosition) {
      this.currentPath.push(nextPosition);
      return true;
    }

    // If no valid move found, we're stuck (shouldn't happen in solvable mazes)
    return false;
  }

  getCurrentPath(): Position[] {
    return [...this.currentPath];
  }

  reset(): void {
    this.currentPath = [];
    this.currentDirection = "east";
    this.goal = null;
    this.isComplete = false;
  }

  private getNextPosition(current: Position): Position | null {
    const currentDir = DIRECTIONS[this.currentDirection];

    // Try to turn right
    const rightDirection = currentDir.right;
    const rightPos = this.getPositionInDirection(current, rightDirection);
    if (rightPos && this.maze!.canMove(current, rightPos)) {
      this.currentDirection = rightDirection;
      return rightPos;
    }

    // Try to go straight
    const straightPos = this.getPositionInDirection(
      current,
      this.currentDirection
    );
    if (straightPos && this.maze!.canMove(current, straightPos)) {
      return straightPos;
    }

    // Try to turn left
    const leftDirection = currentDir.left;
    const leftPos = this.getPositionInDirection(current, leftDirection);
    if (leftPos && this.maze!.canMove(current, leftPos)) {
      this.currentDirection = leftDirection;
      return leftPos;
    }

    // Try to turn around (180 degrees)
    const oppositeDirection = currentDir.opposite;
    const oppositePos = this.getPositionInDirection(current, oppositeDirection);
    if (oppositePos && this.maze!.canMove(current, oppositePos)) {
      this.currentDirection = oppositeDirection;
      return oppositePos;
    }

    // No valid moves found
    return null;
  }

  private getPositionInDirection(
    position: Position,
    direction: Direction
  ): Position | null {
    const dirInfo = DIRECTIONS[direction];
    const newPos: Position = {
      x: position.x + dirInfo.delta.x,
      y: position.y + dirInfo.delta.y,
      z: position.z || 0,
    };

    // Check bounds
    const dimensions = this.maze!.getDimensions();
    if (
      newPos.x < 0 ||
      newPos.x >= dimensions.width ||
      newPos.y < 0 ||
      newPos.y >= dimensions.height ||
      (newPos.z || 0) < 0 ||
      (newPos.z || 0) >= dimensions.depth
    ) {
      return null;
    }

    return newPos;
  }

  private positionsEqual(pos1: Position, pos2: Position): boolean {
    return (
      pos1.x === pos2.x && pos1.y === pos2.y && (pos1.z || 0) === (pos2.z || 0)
    );
  }
}

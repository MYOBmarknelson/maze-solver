import { Maze } from "@/core/Maze";
import { Position, MazeConfig } from "@/types";

export class MazeGenerator {
  private maze: Maze;
  private config: MazeConfig;
  private algorithm: "recursive-backtracking" | "prim" =
    "recursive-backtracking";

  constructor(
    config: MazeConfig,
    algorithm: "recursive-backtracking" | "prim" = "recursive-backtracking"
  ) {
    this.config = config;
    this.algorithm = algorithm;
    this.maze = new Maze(config);
  }

  public generate(): Maze {
    this.maze.reset();

    if (this.config.puzzleType === "maze") {
      if (this.algorithm === "prim") {
        this.generateMazePrim();
      } else {
        this.generateMaze();
      }
    } else {
      this.generateLabyrinth();
    }

    // Ensure openings at start and goal positions
    this.ensureOpenings();

    // Add 5th dimension linkages if configured
    if (this.config.fifthDimension?.enabled) {
      this.addFifthDimensionLinks();
    }

    return this.maze;
  }

  private generateMaze(): void {
    // Use recursive backtracking algorithm
    const stack: Position[] = [];
    const startPosition: Position =
      this.config.dimensions === "3d" ? { x: 0, y: 0, z: 0 } : { x: 0, y: 0 };

    this.maze.markVisited(startPosition, true);
    stack.push(startPosition);

    while (stack.length > 0) {
      const current = stack[stack.length - 1]!;
      const neighbors = this.maze.getUnvisitedNeighbors(current);

      if (neighbors.length > 0) {
        // Choose a random unvisited neighbor
        const randomIndex = Math.floor(Math.random() * neighbors.length);
        const chosen = neighbors[randomIndex]!;

        // Remove wall between current and chosen
        this.removeWallBetween(current, chosen);

        // Mark chosen as visited and push to stack
        this.maze.markVisited(chosen, true);
        stack.push(chosen);
      } else {
        // Backtrack
        stack.pop();
      }
    }
  }

  private generateMazePrim(): void {
    // Use Prim's algorithm
    const frontiers: Position[] = [];
    const startPosition: Position =
      this.config.dimensions === "3d" ? { x: 0, y: 0, z: 0 } : { x: 0, y: 0 };

    // Start with the initial cell
    this.maze.markVisited(startPosition, true);

    // Add neighbors of start to frontiers
    const startNeighbors = this.maze.getNeighbors(startPosition);
    frontiers.push(...startNeighbors);

    while (frontiers.length > 0) {
      // Choose a random frontier cell
      const randomIndex = Math.floor(Math.random() * frontiers.length);
      const current = frontiers[randomIndex]!;

      // Remove from frontiers
      frontiers.splice(randomIndex, 1);

      // Skip if already visited
      if (this.maze.isVisited(current)) continue;

      // Find visited neighbors
      const neighbors = this.maze.getNeighbors(current);
      const visitedNeighbors = neighbors.filter((neighbor) =>
        this.maze.isVisited(neighbor)
      );

      if (visitedNeighbors.length > 0) {
        // Choose a random visited neighbor to connect to
        const connectTo =
          visitedNeighbors[
            Math.floor(Math.random() * visitedNeighbors.length)
          ]!;

        // Remove wall between current and chosen neighbor
        this.removeWallBetween(current, connectTo);

        // Mark current as visited
        this.maze.markVisited(current, true);

        // Add unvisited neighbors of current to frontiers
        const unvisitedNeighbors = this.maze
          .getNeighbors(current)
          .filter((neighbor) => !this.maze.isVisited(neighbor));
        frontiers.push(...unvisitedNeighbors);
      }
    }
  }

  private generateLabyrinth(): void {
    // Generate a single continuous path
    const dimensions = this.maze.getDimensions();
    const totalCells = dimensions.width * dimensions.height * dimensions.depth;

    // Create a spiral pattern for the labyrinth
    const path: Position[] = [];
    let x = 0,
      y = 0,
      z = 0;
    let dx = 1,
      dy = 0,
      dz = 0;
    let stepsInDirection = dimensions.width;
    let stepsTaken = 0;
    let directionChanges = 0;

    for (let i = 0; i < totalCells; i++) {
      const position: Position =
        this.config.dimensions === "3d" ? { x, y, z } : { x, y };

      path.push(position);

      // Move to next position
      x += dx;
      y += dy;
      z += dz;
      stepsTaken++;

      // Change direction when needed
      if (stepsTaken >= stepsInDirection) {
        stepsTaken = 0;
        directionChanges++;

        // Change direction (right turn for spiral)
        if (dx === 1) {
          dx = 0;
          dy = 1;
        } // right -> down
        else if (dy === 1) {
          dx = -1;
          dy = 0;
        } // down -> left
        else if (dx === -1) {
          dx = 0;
          dy = -1;
        } // left -> up
        else if (dy === -1) {
          dx = 1;
          dy = 0;
        } // up -> right

        // Adjust steps for next direction
        if (directionChanges % 2 === 0) {
          stepsInDirection--;
        }
      }

      // Stay within bounds
      x = Math.max(0, Math.min(x, dimensions.width - 1));
      y = Math.max(0, Math.min(y, dimensions.height - 1));
      z = Math.max(0, Math.min(z, dimensions.depth - 1));
    }

    // Remove walls along the path
    for (let i = 0; i < path.length - 1; i++) {
      this.removeWallBetween(path[i]!, path[i + 1]!);
    }
  }

  private addFifthDimensionLinks(): void {
    if (!this.config.fifthDimension) return;

    const dimensions = this.maze.getDimensions();
    const linkCount = this.config.fifthDimension.linkageCount;

    // Add links between opposite boundaries
    for (let i = 0; i < linkCount; i++) {
      // Top-Bottom links
      const topY = 0;
      const bottomY = dimensions.height - 1;
      const x1 = Math.floor(Math.random() * dimensions.width);
      const x2 = Math.floor(Math.random() * dimensions.width);

      const topPos: Position =
        this.config.dimensions === "3d"
          ? { x: x1, y: topY, z: Math.floor(Math.random() * dimensions.depth) }
          : { x: x1, y: topY };

      const bottomPos: Position =
        this.config.dimensions === "3d"
          ? {
              x: x2,
              y: bottomY,
              z: Math.floor(Math.random() * dimensions.depth),
            }
          : { x: x2, y: bottomY };

      this.maze.addLink(topPos, bottomPos);

      // Left-Right links
      const leftX = 0;
      const rightX = dimensions.width - 1;
      const y1 = Math.floor(Math.random() * dimensions.height);
      const y2 = Math.floor(Math.random() * dimensions.height);

      const leftPos: Position =
        this.config.dimensions === "3d"
          ? { x: leftX, y: y1, z: Math.floor(Math.random() * dimensions.depth) }
          : { x: leftX, y: y1 };

      const rightPos: Position =
        this.config.dimensions === "3d"
          ? {
              x: rightX,
              y: y2,
              z: Math.floor(Math.random() * dimensions.depth),
            }
          : { x: rightX, y: y2 };

      this.maze.addLink(leftPos, rightPos);

      // Front-Back links (3D only)
      if (this.config.dimensions === "3d") {
        const frontZ = 0;
        const backZ = dimensions.depth - 1;
        const x3 = Math.floor(Math.random() * dimensions.width);
        const y3 = Math.floor(Math.random() * dimensions.height);

        const frontPos: Position = { x: x3, y: y3, z: frontZ };
        const backPos: Position = { x: x3, y: y3, z: backZ };

        this.maze.addLink(frontPos, backPos);
      }
    }
  }

  private ensureOpenings(): void {
    const dimensions = this.maze.getDimensions();

    // Define start and goal positions
    const start: Position =
      this.config.dimensions === "3d" ? { x: 0, y: 0, z: 0 } : { x: 0, y: 0 };
    const goal: Position =
      this.config.dimensions === "3d"
        ? {
            x: dimensions.width - 1,
            y: dimensions.height - 1,
            z: dimensions.depth - 1,
          }
        : { x: dimensions.width - 1, y: dimensions.height - 1 };

    // Remove walls to create openings at start position
    // For start (top-left), remove north and west walls if they exist
    if (start.y === 0) {
      this.maze.setWall(start, "north", false);
    }
    if (start.x === 0) {
      this.maze.setWall(start, "west", false);
    }

    // Remove walls to create openings at goal position
    // For goal (bottom-right), remove south and east walls if they exist
    if (goal.y === dimensions.height - 1) {
      this.maze.setWall(goal, "south", false);
    }
    if (goal.x === dimensions.width - 1) {
      this.maze.setWall(goal, "east", false);
    }

    // For 3D mazes, also handle up/down walls
    if (this.config.dimensions === "3d") {
      if (start.z === 0) {
        this.maze.setWall(start, "down", false);
      }
      if (goal.z === dimensions.depth - 1) {
        this.maze.setWall(goal, "up", false);
      }
    }
  }

  private removeWallBetween(pos1: Position, pos2: Position): void {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = (pos2.z || 0) - (pos1.z || 0);

    if (dx === 1) {
      this.maze.setWall(pos1, "east", false);
    } else if (dx === -1) {
      this.maze.setWall(pos1, "west", false);
    } else if (dy === 1) {
      this.maze.setWall(pos1, "south", false);
    } else if (dy === -1) {
      this.maze.setWall(pos1, "north", false);
    } else if (dz === 1 && this.config.dimensions === "3d") {
      this.maze.setWall(pos1, "up", false);
    } else if (dz === -1 && this.config.dimensions === "3d") {
      this.maze.setWall(pos1, "down", false);
    }
  }

  public static createMaze(config: MazeConfig): Maze {
    const generator = new MazeGenerator(config);
    return generator.generate();
  }
}

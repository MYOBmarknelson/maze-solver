import { MazeCell, MazeConfig, Position } from "@/types";
import { Maze } from "@/core/Maze";

export class TimeManager {
  private config: MazeConfig | null = null;
  private maze: Maze | null = null;
  private currentTimeStep: number = 0;
  private stabilityIslands: Set<string> = new Set();
  private shiftPattern: Map<string, Position> = new Map();

  initialize(config: MazeConfig): void {
    this.config = config;
    this.reset();
    this.generateStabilityIslands();
    this.generateShiftPattern();
  }

  private generateStabilityIslands(): void {
    if (!this.config?.timeDimension?.enabled || !this.maze) return;

    const { stabilityIslands } = this.config.timeDimension;
    const dimensions = this.maze.getDimensions();
    const totalCells = dimensions.width * dimensions.height;
    const islandCount = Math.floor((stabilityIslands / 100) * totalCells);

    // Generate random stability islands
    const positions: Position[] = [];
    for (let x = 0; x < dimensions.width; x++) {
      for (let y = 0; y < dimensions.height; y++) {
        positions.push({ x, y });
      }
    }

    // Shuffle and select islands
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = positions[i];
      positions[i] = positions[j]!;
      positions[j] = temp!;
    }

    for (let i = 0; i < islandCount; i++) {
      const pos = positions[i];
      if (pos) {
        this.stabilityIslands.add(`${pos.x},${pos.y}`);
      }
    }
  }

  private generateShiftPattern(): void {
    if (!this.config?.timeDimension?.enabled || !this.maze) return;

    const dimensions = this.maze.getDimensions();

    // Generate deterministic but varied shift pattern based on time step
    for (let x = 0; x < dimensions.width; x++) {
      for (let y = 0; y < dimensions.height; y++) {
        const key = `${x},${y}`;
        if (this.stabilityIslands.has(key)) continue;

        // Calculate shift direction based on position and time pattern
        const shiftX =
          Math.sin(x * 0.5 + this.currentTimeStep * 0.1) > 0 ? 1 : -1;
        const shiftY =
          Math.cos(y * 0.5 + this.currentTimeStep * 0.1) > 0 ? 1 : -1;

        this.shiftPattern.set(key, { x: shiftX, y: shiftY });
      }
    }
  }

  shiftWalls(): boolean {
    if (!this.config?.timeDimension?.enabled || !this.maze) return false;

    const { shiftFrequency, shiftExtent } = this.config.timeDimension;
    this.currentTimeStep++;

    // Only shift at specified frequency
    if (this.currentTimeStep % shiftFrequency !== 0) return false;

    // Update shift pattern for new time step
    this.generateShiftPattern();

    const dimensions = this.maze.getDimensions();
    const shifts: Array<{ from: Position; to: Position }> = [];

    for (const [key, shift] of this.shiftPattern) {
      const parts = key.split(",");
      const xStr = parts[0];
      const yStr = parts[1];

      if (!xStr || !yStr) continue;

      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);

      if (isNaN(x) || isNaN(y)) continue;

      // Calculate new position with shift extent
      const shiftMagnitude = Math.floor(
        (shiftExtent / 100) * Math.max(dimensions.width, dimensions.height)
      );
      const toPos = {
        x: Math.max(
          0,
          Math.min(dimensions.width - 1, x + shift.x * shiftMagnitude)
        ),
        y: Math.max(
          0,
          Math.min(dimensions.height - 1, y + shift.y * shiftMagnitude)
        ),
      };

      const fromPos = { x, y };
      if (toPos.x !== x || toPos.y !== y) {
        shifts.push({ from: fromPos, to: toPos });
      }
    }

    // Apply shifts to maze by copying wall states
    for (const shift of shifts) {
      this.shiftWallState(shift.from, shift.to);
    }

    return shifts.length > 0;
  }

  private shiftWallState(from: Position, to: Position): void {
    if (!this.maze) return;

    const fromCell = this.maze.getCell(from);
    const toCell = this.maze.getCell(to);

    if (!fromCell || !toCell) return;

    // Copy wall states from 'from' to 'to'
    const directions: (keyof typeof fromCell.walls)[] = [
      "north",
      "south",
      "east",
      "west",
    ];
    if (this.config?.dimensions === "3d") {
      directions.push("up", "down");
    }

    for (const direction of directions) {
      const hasWall = fromCell.walls[direction];
      if (hasWall !== undefined) {
        this.maze.setWall(to, direction, hasWall);
      }
    }
  }

  getCurrentState(): MazeCell[][][] {
    if (!this.maze) return [];
    return this.maze.getAllCells().reduce((acc, cell) => {
      const z = cell.position.z || 0;
      const y = cell.position.y;
      const x = cell.position.x;

      if (!acc[z]) acc[z] = [];
      if (!acc[z][y]) acc[z][y] = [];
      acc[z][y][x] = cell;

      return acc;
    }, [] as MazeCell[][][]);
  }

  isStabilityIsland(position: Position): boolean {
    return this.stabilityIslands.has(`${position.x},${position.y}`);
  }

  getCurrentTimeStep(): number {
    return this.currentTimeStep;
  }

  getShiftPattern(): Map<string, Position> {
    return new Map(this.shiftPattern);
  }

  getStabilityIslands(): Position[] {
    return Array.from(this.stabilityIslands)
      .map((key) => {
        const parts = key.split(",");
        const x = parseInt(parts[0] || "0", 10);
        const y = parseInt(parts[1] || "0", 10);
        return { x, y };
      })
      .filter((pos) => !isNaN(pos.x) && !isNaN(pos.y));
  }

  setMaze(maze: Maze): void {
    this.maze = maze;
    this.reset();
    if (this.config) {
      this.initialize(this.config);
    }
  }

  reset(): void {
    this.currentTimeStep = 0;
    this.stabilityIslands.clear();
    this.shiftPattern.clear();
  }
}

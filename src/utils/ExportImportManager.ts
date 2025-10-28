import { MazeConfig, Solution, Position } from "@/types";
import { Maze } from "@/core/Maze";

export interface ExportData {
  version: string;
  timestamp: string;
  maze: {
    config: MazeConfig;
    cells: Array<{
      position: Position;
      walls: {
        north: boolean;
        south: boolean;
        east: boolean;
        west: boolean;
        up?: boolean;
        down?: boolean;
      };
      links: Position[];
    }>;
  };
  solution?: Solution;
  metadata?: {
    generator?: string;
    solveTime?: number;
    notes?: string;
  };
}

export class ExportImportManager {
  private static readonly VERSION = "1.0.0";

  /**
   * Export maze and optional solution to JSON format
   */
  static exportMaze(
    maze: Maze,
    solution?: Solution,
    metadata?: ExportData["metadata"]
  ): string {
    const exportData: ExportData = {
      version: this.VERSION,
      timestamp: new Date().toISOString(),
      maze: {
        config: maze.getConfig(),
        cells: maze.getAllCells().map((cell) => ({
          position: cell.position,
          walls: cell.walls,
          links: cell.links,
        })),
      },
      ...(solution && { solution }),
      ...(metadata && { metadata }),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import maze from JSON format
   */
  static importMaze(jsonData: string): { maze: Maze; solution?: Solution } {
    try {
      const data: ExportData = JSON.parse(jsonData);

      // Validate version compatibility
      if (!this.isVersionCompatible(data.version)) {
        throw new Error(
          `Incompatible version: ${data.version}. Expected: ${this.VERSION}`
        );
      }

      // Reconstruct maze from config
      const maze = new Maze(data.maze.config);

      // Restore cell states
      for (const cellData of data.maze.cells) {
        // Set walls
        Object.entries(cellData.walls).forEach(([direction, hasWall]) => {
          if (hasWall) {
            maze.setWall(
              cellData.position,
              direction as keyof typeof cellData.walls,
              true
            );
          }
        });

        // Restore links
        for (const link of cellData.links) {
          maze.addLink(cellData.position, link);
        }
      }

      return {
        maze,
        ...(data.solution && { solution: data.solution }),
      };
    } catch (error) {
      throw new Error(
        `Failed to import maze: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Export maze to various formats
   */
  static exportToFormat(
    maze: Maze,
    format: "json" | "csv" | "txt",
    solution?: Solution,
    metadata?: ExportData["metadata"]
  ): string {
    switch (format) {
      case "json":
        return this.exportMaze(maze, solution, metadata);

      case "csv":
        return this.exportToCSV(maze, solution);

      case "txt":
        return this.exportToText(maze, solution);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to CSV format
   */
  private static exportToCSV(maze: Maze, solution?: Solution): string {
    let csv = "x,y,z,north,south,east,west,up,down,links\n";

    for (const cell of maze.getAllCells()) {
      const { x, y, z = 0 } = cell.position;
      const walls = cell.walls;
      const links = cell.links
        .map((link) => `${link.x},${link.y},${link.z || 0}`)
        .join(";");

      csv += `${x},${y},${z},${walls.north},${walls.south},${walls.east},${
        walls.west
      },${walls.up || false},${walls.down || false},"${links}"\n`;
    }

    if (solution) {
      csv += "\nSolution Path:\n";
      csv += "step,x,y,z\n";
      solution.steps.forEach((step, index) => {
        csv += `${index + 1},${step.position.x},${step.position.y},${
          step.position.z || 0
        }\n`;
      });
    }

    return csv;
  }

  /**
   * Export to human-readable text format
   */
  private static exportToText(maze: Maze, solution?: Solution): string {
    const dimensions = maze.getDimensions();
    let text = `Maze Export - ${dimensions.width}x${dimensions.height}x${dimensions.depth}\n`;
    text += `Generated: ${new Date().toISOString()}\n\n`;

    // ASCII representation for 2D mazes
    if (dimensions.depth === 1) {
      text += this.generateASCIIRepresentation(maze);
    }

    text += "\nMaze Configuration:\n";
    text += JSON.stringify(maze.getConfig(), null, 2);

    if (solution) {
      text += "\n\nSolution:\n";
      text += `Solved: ${solution.solved}\n`;
      text += `Steps: ${solution.steps.length}\n`;
      text += `Time: ${solution.stats.timeTaken}ms\n`;
      text += `Path Length: ${solution.stats.pathLength}\n`;

      text += "\nPath:\n";
      solution.path.forEach((pos, index) => {
        text += `${index + 1}. (${pos.x}, ${pos.y}${
          pos.z !== undefined ? `, ${pos.z}` : ""
        })\n`;
      });
    }

    return text;
  }

  /**
   * Generate ASCII representation of 2D maze
   */
  private static generateASCIIRepresentation(maze: Maze): string {
    const dimensions = maze.getDimensions();
    const width = dimensions.width;
    const height = dimensions.height;

    // Create grid with walls
    const grid: string[][] = [];

    // Initialize with spaces
    for (let y = 0; y <= height * 2; y++) {
      grid[y] = new Array(width * 2 + 1).fill(" ");
    }

    // Add walls
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = maze.getCell({ x, y });
        if (!cell) continue;

        const gridX = x * 2 + 1;
        const gridY = y * 2 + 1;

        // Cell center
        if (grid[gridY] && grid[gridY][gridX] !== undefined) {
          grid[gridY]![gridX] = ".";
        }

        // Walls
        if (cell.walls.north && gridY - 1 >= 0) {
          grid[gridY - 1]![gridX] = "-";
        }
        if (cell.walls.south && gridY + 1 < grid.length) {
          grid[gridY + 1]![gridX] = "-";
        }
        if (cell.walls.east && gridX + 1 < grid[gridY]!.length) {
          grid[gridY]![gridX + 1] = "|";
        }
        if (cell.walls.west && gridX - 1 >= 0) {
          grid[gridY]![gridX - 1] = "|";
        }

        // Corners
        if (gridY - 1 >= 0) {
          if (gridX - 1 >= 0) grid[gridY - 1]![gridX - 1] = "+";
          if (gridX + 1 < grid[gridY - 1]!.length)
            grid[gridY - 1]![gridX + 1] = "+";
        }
        if (gridY + 1 < grid.length) {
          if (gridX - 1 >= 0) grid[gridY + 1]![gridX - 1] = "+";
          if (gridX + 1 < grid[gridY + 1]!.length)
            grid[gridY + 1]![gridX + 1] = "+";
        }
      }
    }

    // Convert to string
    return grid.map((row) => row.join("")).join("\n");
  }

  /**
   * Download exported data as file
   */
  static downloadExport(
    data: string,
    filename: string,
    mimeType: string = "application/json"
  ): void {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Read file as text
   */
  static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("File reading error"));
      reader.readAsText(file);
    });
  }

  /**
   * Validate export data structure
   */
  static validateExportData(data: any): data is ExportData {
    return (
      typeof data === "object" &&
      data !== null &&
      typeof data.version === "string" &&
      typeof data.timestamp === "string" &&
      typeof data.maze === "object" &&
      Array.isArray(data.maze.cells)
    );
  }

  /**
   * Check version compatibility
   */
  private static isVersionCompatible(version: string): boolean {
    const [major] = version.split(".").map(Number);
    const [currentMajor] = this.VERSION.split(".").map(Number);
    return major === currentMajor;
  }

  /**
   * Get supported export formats
   */
  static getSupportedFormats(): Array<{
    value: string;
    label: string;
    extension: string;
  }> {
    return [
      { value: "json", label: "JSON", extension: ".json" },
      { value: "csv", label: "CSV", extension: ".csv" },
      { value: "txt", label: "Text", extension: ".txt" },
    ];
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(
    prefix: string = "maze",
    extension: string = "json"
  ): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    return `${prefix}-${timestamp}.${extension}`;
  }
}

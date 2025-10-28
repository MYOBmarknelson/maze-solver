import {
  MazeCell,
  Position,
  MazeConfig
} from '@/types';

export class Maze {
  private cells: MazeCell[][][] = [];
  private config: MazeConfig;
  private width: number;
  private height: number;
  private depth: number;

  constructor(config: MazeConfig) {
    this.config = config;
    this.width = config.size.width;
    this.height = config.size.height;
    this.depth = config.dimensions === '3d' ? (config.size.depth || 1) : 1;

    this.initializeCells();
  }

  private initializeCells(): void {
    this.cells = [];

    for (let z = 0; z < this.depth; z++) {
      this.cells[z] = [];
      for (let y = 0; y < this.height; y++) {
        this.cells[z]![y] = [];
        for (let x = 0; x < this.width; x++) {
          const position: Position = this.config.dimensions === '3d'
            ? { x, y, z }
            : { x, y };

          this.cells[z]![y]![x] = {
            position,
            walls: {
              north: true,
              south: true,
              east: true,
              west: true,
              ...(this.config.dimensions === '3d' && {
                up: z < this.depth - 1,
                down: z > 0
              })
            },
            visited: false,
            links: []
          };
        }
      }
    }
  }

  public getCell(position: Position): MazeCell | null {
    const { x, y, z = 0 } = position;

    if (x < 0 || x >= this.width || y < 0 || y >= this.height || z < 0 || z >= this.depth) {
      return null;
    }

    return this.cells[z]?.[y]?.[x] ?? null;
  }

  public setWall(position: Position, direction: keyof MazeCell['walls'], hasWall: boolean): void {
    const cell = this.getCell(position);
    if (cell && cell.walls[direction] !== undefined) {
      cell.walls[direction] = hasWall;

      // Set adjacent wall for consistency
      const adjacentPos = this.getAdjacentPosition(position, direction);
      if (adjacentPos) {
        const adjacentCell = this.getCell(adjacentPos);
        if (adjacentCell) {
          const oppositeDirection = this.getOppositeDirection(direction);
          if (adjacentCell.walls[oppositeDirection] !== undefined) {
            adjacentCell.walls[oppositeDirection] = hasWall;
          }
        }
      }
    }
  }

  public hasWall(position: Position, direction: keyof MazeCell['walls']): boolean {
    const cell = this.getCell(position);
    return cell ? (cell.walls[direction] ?? false) : true;
  }

  public getNeighbors(position: Position): Position[] {
    const neighbors: Position[] = [];
    const directions: (keyof MazeCell['walls'])[] = ['north', 'south', 'east', 'west'];

    if (this.config.dimensions === '3d') {
      directions.push('up', 'down');
    }

    for (const direction of directions) {
      const neighborPos = this.getAdjacentPosition(position, direction);
      if (neighborPos && this.getCell(neighborPos)) {
        neighbors.push(neighborPos);
      }
    }

    return neighbors;
  }

  public getUnvisitedNeighbors(position: Position): Position[] {
    return this.getNeighbors(position).filter(pos => {
      const cell = this.getCell(pos);
      return cell && !cell.visited;
    });
  }

  public markVisited(position: Position, visited: boolean = true): void {
    const cell = this.getCell(position);
    if (cell) {
      cell.visited = visited;
    }
  }

  public isVisited(position: Position): boolean {
    const cell = this.getCell(position);
    return cell ? cell.visited : false;
  }

  public addLink(from: Position, to: Position): void {
    const fromCell = this.getCell(from);
    const toCell = this.getCell(to);

    if (fromCell && toCell) {
      if (!fromCell.links.some(link => this.positionsEqual(link, to))) {
        fromCell.links.push(to);
      }
      if (!toCell.links.some(link => this.positionsEqual(link, from))) {
        toCell.links.push(from);
      }
    }
  }

  public getLinks(position: Position): Position[] {
    const cell = this.getCell(position);
    return cell ? cell.links : [];
  }

  public canMove(from: Position, to: Position): boolean {
    // Check direct adjacency
    const dx = Math.abs(from.x - to.x);
    const dy = Math.abs(from.y - to.y);
    const dz = Math.abs((from.z || 0) - (to.z || 0));

    const isAdjacent = (dx + dy + dz) === 1;

    if (!isAdjacent) {
      // Check for 5th dimension links
      const fromCell = this.getCell(from);
      return fromCell ? fromCell.links.some(link => this.positionsEqual(link, to)) : false;
    }

    // Check walls
    if (dx === 1) return !this.hasWall(from, 'east');
    if (dx === -1) return !this.hasWall(from, 'west');
    if (dy === 1) return !this.hasWall(from, 'south');
    if (dy === -1) return !this.hasWall(from, 'north');
    if (dz === 1) return !this.hasWall(from, 'up');
    if (dz === -1) return !this.hasWall(from, 'down');

    return false;
  }

  public getAllCells(): MazeCell[] {
    const allCells: MazeCell[] = [];
    for (let z = 0; z < this.depth; z++) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const cell = this.cells[z]?.[y]?.[x];
          if (cell) {
            allCells.push(cell);
          }
        }
      }
    }
    return allCells;
  }

  public getDimensions(): { width: number; height: number; depth: number } {
    return { width: this.width, height: this.height, depth: this.depth };
  }

  public getConfig(): MazeConfig {
    return this.config;
  }

  public reset(): void {
    this.initializeCells();
  }

  private getAdjacentPosition(position: Position, direction: keyof MazeCell['walls']): Position | null {
    const { x, y, z = 0 } = position;

    switch (direction) {
      case 'north': return { x, y: y - 1, z };
      case 'south': return { x, y: y + 1, z };
      case 'east': return { x: x + 1, y, z };
      case 'west': return { x: x - 1, y, z };
      case 'up': return this.config.dimensions === '3d' ? { x, y, z: z + 1 } : null;
      case 'down': return this.config.dimensions === '3d' ? { x, y, z: z - 1 } : null;
      default: return null;
    }
  }

  private getOppositeDirection(direction: keyof MazeCell['walls']): keyof MazeCell['walls'] {
    switch (direction) {
      case 'north': return 'south';
      case 'south': return 'north';
      case 'east': return 'west';
      case 'west': return 'east';
      case 'up': return 'down';
      case 'down': return 'up';
      default: return direction;
    }
  }

  private positionsEqual(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y && (pos1.z || 0) === (pos2.z || 0);
  }
}
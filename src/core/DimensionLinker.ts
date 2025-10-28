import { MazeConfig, Position } from "@/types";
import { Maze } from "@/core/Maze";

export class DimensionLinker {
  private config: MazeConfig | null = null;
  private maze: Maze | null = null;
  private links: Map<string, Position> = new Map(); // from -> to mappings
  private reverseLinks: Map<string, Position> = new Map(); // to -> from mappings

  initialize(config: MazeConfig): void {
    this.config = config;
    this.reset();
    this.generateLinks();
  }

  private generateLinks(): void {
    if (!this.config?.fifthDimension?.enabled || !this.maze) return;

    const { linkageCount } = this.config.fifthDimension;
    const dimensions = this.maze.getDimensions();

    // Generate random teleportation links
    const positions: Position[] = [];
    for (let z = 0; z < dimensions.depth; z++) {
      for (let y = 0; y < dimensions.height; y++) {
        for (let x = 0; x < dimensions.width; x++) {
          positions.push({ x, y, z });
        }
      }
    }

    // Create pairs of linked positions
    const shuffledPositions = [...positions];
    for (let i = shuffledPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffledPositions[i];
      shuffledPositions[i] = shuffledPositions[j]!;
      shuffledPositions[j] = temp!;
    }

    const numLinks = Math.min(
      linkageCount,
      Math.floor(shuffledPositions.length / 2)
    );

    for (let i = 0; i < numLinks * 2; i += 2) {
      const pos1 = shuffledPositions[i];
      const pos2 = shuffledPositions[i + 1];

      if (pos1 && pos2) {
        this.addLink(pos1, pos2);
      }
    }
  }

  private addLink(from: Position, to: Position): void {
    const fromKey = this.positionToKey(from);
    const toKey = this.positionToKey(to);

    this.links.set(fromKey, to);
    this.reverseLinks.set(toKey, from);

    // Add links to maze cells
    if (this.maze) {
      this.maze.addLink(from, to);
    }
  }

  getLinkedPosition(position: Position): Position | null {
    const key = this.positionToKey(position);
    return this.links.get(key) || null;
  }

  getReverseLinkedPosition(position: Position): Position | null {
    const key = this.positionToKey(position);
    return this.reverseLinks.get(key) || null;
  }

  getAllLinks(): Array<{ from: Position; to: Position }> {
    const result: Array<{ from: Position; to: Position }> = [];

    for (const [fromKey, to] of this.links) {
      const from = this.keyToPosition(fromKey);
      if (from) {
        result.push({ from, to });
      }
    }

    return result;
  }

  hasLink(position: Position): boolean {
    const key = this.positionToKey(position);
    return this.links.has(key);
  }

  getLinkCount(): number {
    return this.links.size;
  }

  getTeleportationDistance(from: Position, to: Position): number {
    // Calculate "teleportation distance" - could be based on various factors
    const dx = Math.abs(from.x - to.x);
    const dy = Math.abs(from.y - to.y);
    const dz = Math.abs((from.z || 0) - (to.z || 0));

    // Use Euclidean distance for teleportation cost
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  getNearestLink(
    position: Position
  ): { link: Position; distance: number } | null {
    let nearest: Position | null = null;
    let minDistance = Infinity;

    for (const [fromKey] of this.links) {
      const linkPos = this.keyToPosition(fromKey);
      if (linkPos) {
        const distance = this.getTeleportationDistance(position, linkPos);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = linkPos;
        }
      }
    }

    return nearest ? { link: nearest, distance: minDistance } : null;
  }

  validateLinks(): boolean {
    // Check that all links are bidirectional and valid
    for (const [fromKey, to] of this.links) {
      const from = this.keyToPosition(fromKey);
      if (!from) return false;

      const reverseKey = this.positionToKey(to);
      const reverseFrom = this.reverseLinks.get(reverseKey);

      if (!reverseFrom || !this.positionsEqual(reverseFrom, from)) {
        return false;
      }

      // Check that maze cells exist
      if (this.maze && (!this.maze.getCell(from) || !this.maze.getCell(to))) {
        return false;
      }
    }

    return true;
  }

  reset(): void {
    this.links.clear();
    this.reverseLinks.clear();
  }

  setMaze(maze: Maze): void {
    this.maze = maze;
    this.reset();
    if (this.config) {
      this.initialize(this.config);
    }
  }

  private positionToKey(pos: Position): string {
    return `${pos.x},${pos.y},${pos.z || 0}`;
  }

  private keyToPosition(key: string): Position | null {
    const parts = key.split(",");
    const x = parseInt(parts[0] || "0", 10);
    const y = parseInt(parts[1] || "0", 10);
    const z = parseInt(parts[2] || "0", 10);

    if (isNaN(x) || isNaN(y) || isNaN(z)) return null;

    return z === 0 ? { x, y } : { x, y, z };
  }

  private positionsEqual(pos1: Position, pos2: Position): boolean {
    return (
      pos1.x === pos2.x && pos1.y === pos2.y && (pos1.z || 0) === (pos2.z || 0)
    );
  }
}

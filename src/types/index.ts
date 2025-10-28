// Core types and interfaces for the Maze and Labyrinth Constructor and Solver

export type PuzzleType = "maze" | "labyrinth";

export type DimensionType = "2d" | "3d";

export interface Position {
  x: number;
  y: number;
  z?: number; // Optional for 2D mazes
}

export interface MazeCell {
  position: Position;
  walls: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
    up?: boolean; // 3D only
    down?: boolean; // 3D only
  };
  visited: boolean;
  links: Position[]; // For 5th dimension linkages
}

export interface MazeConfig {
  puzzleType: PuzzleType;
  dimensions: DimensionType;
  size: {
    width: number;
    height: number;
    depth?: number; // 3D only
  };
  generationAlgorithm?: "recursive-backtracking" | "prim";
  timeDimension?: {
    enabled: boolean;
    shiftFrequency: number;
    stabilityIslands: number; // percentage
    shiftExtent: number; // percentage
  };
  fifthDimension?: {
    enabled: boolean;
    linkageCount: number;
  };
}

export interface SolverStep {
  position: Position;
  action: "move" | "explore" | "backtrack";
  timestamp: number;
}

export interface Solution {
  path: Position[];
  steps: SolverStep[];
  solved: boolean;
  stats: {
    totalSteps: number;
    timeTaken: number;
    nodesExplored: number;
    pathLength: number;
  };
}

export interface ISolver {
  solve(
    maze: import("./../core/Maze").Maze,
    start: Position,
    goal: Position
  ): Promise<Solution>;
  step(): Promise<boolean>; // Returns true if more steps available
  getCurrentPath(): Position[];
  reset(): void;
}

export interface IRenderer {
  initialize(container: HTMLElement): void;
  render(
    maze: import("./../core/Maze").Maze,
    currentPath?: Position[],
    solutionPath?: Position[]
  ): void;
  setLayerOpacity(layer: number, opacity: number): void;
  setCameraPosition(position: Position): void;
  dispose(): void;
}

export interface ICamera {
  position: Position;
  target: Position;
  zoom: number;
  rotate(deltaX: number, deltaY: number): void;
  pan(deltaX: number, deltaY: number): void;
  zoomIn(): void;
  zoomOut(): void;
  reset(): void;
  setPosition(position: Position): void;
}

export interface ILayerManager {
  setActiveLayer(layer: number): void;
  setLayerVisibility(layer: number, visible: boolean): void;
  setLayerOpacity(layer: number, opacity: number): void;
  getActiveLayer(): number;
  getLayerCount(): number;
}

export interface ITimeManager {
  initialize(config: MazeConfig): void;
  shiftWalls(): boolean; // Returns true if shift occurred
  getCurrentState(): MazeCell[][][];
  reset(): void;
}

export interface IDimensionLinker {
  initialize(config: MazeConfig): void;
  getLinkedPosition(position: Position): Position | null;
  getAllLinks(): Array<{ from: Position; to: Position }>;
  reset(): void;
}

export interface MazeGenerationOptions {
  seed?: number; // For reproducible generation
  algorithm?: "recursive-backtracking" | "prim" | "labyrinth";
}

export interface SolverConfig {
  algorithm: string;
  speed: "slow" | "normal" | "fast";
  heuristic?: "manhattan" | "euclidean" | "custom";
  maxSteps?: number;
}

export interface RenderConfig {
  showSolution: boolean;
  showExplored: boolean;
  animationSpeed: number;
  layerOpacity: number;
  activeLayer: number;
}

export interface AppState {
  maze: import("./../core/Maze").Maze | null;
  config: MazeConfig;
  solver: ISolver | null;
  renderer: IRenderer | null;
  timeManager: import("./../core/TimeManager").TimeManager | null;
  dimensionLinker: import("./../core/DimensionLinker").DimensionLinker | null;
  currentSolution: Solution | null;
  isGenerating: boolean;
  isSolving: boolean;
  renderConfig: RenderConfig;
}

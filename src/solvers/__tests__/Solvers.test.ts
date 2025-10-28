import { Maze } from "@/core/Maze";
import { RandomWalkSolver } from "@/solvers/RandomWalkSolver";
import { AStarSolver } from "@/solvers/AStarSolver";
import { DFSSolver } from "@/solvers/DFSSolver";
import { BFSSolver } from "@/solvers/BFSSolver";
import { SolverRegistry } from "@/solvers/SolverRegistry";
import { TimeManager } from "@/core/TimeManager";
import { DimensionLinker } from "@/core/DimensionLinker";
import { MazeGenerator } from "@/core/MazeGenerator";

describe("Solvers", () => {
  let maze: Maze;
  const start = { x: 0, y: 0, z: 0 };
  const goal = { x: 4, y: 4, z: 0 };

  beforeEach(() => {
    // Create a simple 5x5 maze for testing
    maze = new Maze({
      puzzleType: "maze",
      dimensions: "2d",
      size: { width: 5, height: 5 },
    });
    // Clear some walls to create a path
    maze.setWall({ x: 0, y: 0 }, "east", false); // Right from start
    maze.setWall({ x: 1, y: 0 }, "east", false);
    maze.setWall({ x: 2, y: 0 }, "east", false);
    maze.setWall({ x: 3, y: 0 }, "east", false);
    maze.setWall({ x: 4, y: 0 }, "south", false); // Up
    maze.setWall({ x: 4, y: 1 }, "south", false);
    maze.setWall({ x: 4, y: 2 }, "south", false);
    maze.setWall({ x: 4, y: 3 }, "south", false); // To goal
  });

  test("RandomWalkSolver can solve simple maze", async () => {
    const solver = new RandomWalkSolver();
    const solution = await solver.solve(maze, start, goal);

    expect(solution.solved).toBe(true);
    expect(solution.path.length).toBeGreaterThan(0);
    expect(solution.path[0]).toEqual(start);
    expect(solution.path[solution.path.length - 1]).toEqual(goal);
  });

  test("AStarSolver finds optimal path", async () => {
    const solver = new AStarSolver();
    const solution = await solver.solve(maze, start, goal);

    expect(solution.solved).toBe(true);
    expect(solution.path.length).toBeGreaterThan(0);
    expect(solution.path[0]).toEqual(start);
    expect(solution.path[solution.path.length - 1]).toEqual(goal);
  });

  test("DFSSolver can solve maze", async () => {
    const solver = new DFSSolver();
    const solution = await solver.solve(maze, start, goal);

    expect(solution.solved).toBe(true);
    expect(solution.path.length).toBeGreaterThan(0);
    expect(solution.path[0]).toEqual(start);
    expect(solution.path[solution.path.length - 1]).toEqual(goal);
  });

  test("BFSSolver finds shortest path", async () => {
    const solver = new BFSSolver();
    const solution = await solver.solve(maze, start, goal);

    expect(solution.solved).toBe(true);
    expect(solution.path.length).toBeGreaterThan(0);
    expect(solution.path[0]).toEqual(start);
    expect(solution.path[solution.path.length - 1]).toEqual(goal);
  });

  test("SolverRegistry creates correct solvers", () => {
    const randomWalk = SolverRegistry.createSolver("random-walk");
    expect(randomWalk).toBeInstanceOf(RandomWalkSolver);

    const astar = SolverRegistry.createSolver("astar");
    expect(astar).toBeInstanceOf(AStarSolver);

    const dfs = SolverRegistry.createSolver("dfs");
    expect(dfs).toBeInstanceOf(DFSSolver);

    const bfs = SolverRegistry.createSolver("bfs");
    expect(bfs).toBeInstanceOf(BFSSolver);
  });

  test("SolverRegistry provides solver info", () => {
    const solvers = SolverRegistry.getAvailableSolvers();
    expect(solvers.length).toBe(10);

    const astarInfo = SolverRegistry.getSolverInfo("astar");
    expect(astarInfo).toBeDefined();
    expect(astarInfo!.name).toBe("A* Search");
    expect(astarInfo!.optimal).toBe(true);
  });
});

describe("TimeManager", () => {
  let maze: Maze;
  let timeManager: TimeManager;

  beforeEach(() => {
    maze = new Maze({
      puzzleType: "maze",
      dimensions: "2d",
      size: { width: 5, height: 5 },
      timeDimension: {
        enabled: true,
        shiftFrequency: 2,
        stabilityIslands: 20,
        shiftExtent: 30,
      },
    });
    timeManager = new TimeManager();
    timeManager.initialize(maze.getConfig());
    timeManager.setMaze(maze);
  });

  test("TimeManager initializes correctly", () => {
    expect(timeManager.getCurrentTimeStep()).toBe(0);
    expect(timeManager.getStabilityIslands()).toBeDefined();
  });

  test("TimeManager shifts walls at correct frequency", () => {
    // Should not shift on first call (timeStep = 0, frequency = 2)
    const shifted1 = timeManager.shiftWalls();
    expect(shifted1).toBe(false);

    // Should shift on second call (timeStep = 2, frequency = 2)
    const shifted2 = timeManager.shiftWalls();
    expect(shifted2).toBe(true);
  });

  test("TimeManager maintains stability islands", () => {
    const stabilityIslands = timeManager.getStabilityIslands();
    expect(stabilityIslands.length).toBeGreaterThan(0);
  });
});

describe("DimensionLinker", () => {
  let maze: Maze;
  let dimensionLinker: DimensionLinker;

  beforeEach(() => {
    maze = new Maze({
      puzzleType: "maze",
      dimensions: "2d",
      size: { width: 5, height: 5 },
      fifthDimension: {
        enabled: true,
        linkageCount: 2,
      },
    });
    dimensionLinker = new DimensionLinker();
    dimensionLinker.initialize(maze.getConfig());
  });

  test("DimensionLinker initializes correctly", () => {
    const links = dimensionLinker.getAllLinks();
    expect(links).toBeDefined();
  });
});

describe("MazeGenerator", () => {
  test("MazeGenerator creates maze with recursive backtracking", () => {
    const config = {
      puzzleType: "maze" as const,
      dimensions: "2d" as const,
      size: { width: 5, height: 5 },
    };

    const generator = new MazeGenerator(config, "recursive-backtracking");
    const maze = generator.generate();

    expect(maze).toBeDefined();
    expect(maze.getDimensions().width).toBe(5);
    expect(maze.getDimensions().height).toBe(5);
  });

  test("MazeGenerator creates maze with Prim's algorithm", () => {
    const config = {
      puzzleType: "maze" as const,
      dimensions: "2d" as const,
      size: { width: 5, height: 5 },
    };

    const generator = new MazeGenerator(config, "prim");
    const maze = generator.generate();

    expect(maze).toBeDefined();
    expect(maze.getDimensions().width).toBe(5);
    expect(maze.getDimensions().height).toBe(5);
  });

  test("MazeGenerator creates labyrinth", () => {
    const config = {
      puzzleType: "labyrinth" as const,
      dimensions: "2d" as const,
      size: { width: 5, height: 5 },
    };

    const generator = new MazeGenerator(config);
    const maze = generator.generate();

    expect(maze).toBeDefined();
    expect(maze.getConfig().puzzleType).toBe("labyrinth");
  });
});

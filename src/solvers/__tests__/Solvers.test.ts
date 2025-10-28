import { Maze } from '@/core/Maze';
import { RandomWalkSolver } from '@/solvers/RandomWalkSolver';
import { AStarSolver } from '@/solvers/AStarSolver';
import { DFSSolver } from '@/solvers/DFSSolver';
import { BFSSolver } from '@/solvers/BFSSolver';
import { SolverRegistry } from '@/solvers/SolverRegistry';

describe('Solvers', () => {
  let maze: Maze;
  const start = { x: 0, y: 0, z: 0 };
  const goal = { x: 4, y: 4, z: 0 };

  beforeEach(() => {
    // Create a simple 5x5 maze for testing
    maze = new Maze({
      puzzleType: 'maze',
      dimensions: '2d',
      size: { width: 5, height: 5 }
    });
    // Clear some walls to create a path
    maze.setWall({ x: 0, y: 0 }, 'east', false); // Right from start
    maze.setWall({ x: 1, y: 0 }, 'east', false);
    maze.setWall({ x: 2, y: 0 }, 'east', false);
    maze.setWall({ x: 3, y: 0 }, 'east', false);
    maze.setWall({ x: 4, y: 0 }, 'south', false); // Up
    maze.setWall({ x: 4, y: 1 }, 'south', false);
    maze.setWall({ x: 4, y: 2 }, 'south', false);
    maze.setWall({ x: 4, y: 3 }, 'south', false); // To goal
  });

  test('RandomWalkSolver can solve simple maze', async () => {
    const solver = new RandomWalkSolver();
    const solution = await solver.solve(maze, start, goal);

    expect(solution.solved).toBe(true);
    expect(solution.path.length).toBeGreaterThan(0);
    expect(solution.path[0]).toEqual(start);
    expect(solution.path[solution.path.length - 1]).toEqual(goal);
  });

  test('AStarSolver finds optimal path', async () => {
    const solver = new AStarSolver();
    const solution = await solver.solve(maze, start, goal);

    expect(solution.solved).toBe(true);
    expect(solution.path.length).toBeGreaterThan(0);
    expect(solution.path[0]).toEqual(start);
    expect(solution.path[solution.path.length - 1]).toEqual(goal);
  });

  test('DFSSolver can solve maze', async () => {
    const solver = new DFSSolver();
    const solution = await solver.solve(maze, start, goal);

    expect(solution.solved).toBe(true);
    expect(solution.path.length).toBeGreaterThan(0);
    expect(solution.path[0]).toEqual(start);
    expect(solution.path[solution.path.length - 1]).toEqual(goal);
  });

  test('BFSSolver finds shortest path', async () => {
    const solver = new BFSSolver();
    const solution = await solver.solve(maze, start, goal);

    expect(solution.solved).toBe(true);
    expect(solution.path.length).toBeGreaterThan(0);
    expect(solution.path[0]).toEqual(start);
    expect(solution.path[solution.path.length - 1]).toEqual(goal);
  });

  test('SolverRegistry creates correct solvers', () => {
    const randomWalk = SolverRegistry.createSolver('random-walk');
    expect(randomWalk).toBeInstanceOf(RandomWalkSolver);

    const astar = SolverRegistry.createSolver('astar');
    expect(astar).toBeInstanceOf(AStarSolver);

    const dfs = SolverRegistry.createSolver('dfs');
    expect(dfs).toBeInstanceOf(DFSSolver);

    const bfs = SolverRegistry.createSolver('bfs');
    expect(bfs).toBeInstanceOf(BFSSolver);
  });

  test('SolverRegistry provides solver info', () => {
    const solvers = SolverRegistry.getAvailableSolvers();
    expect(solvers.length).toBe(4);

    const astarInfo = SolverRegistry.getSolverInfo('astar');
    expect(astarInfo).toBeDefined();
    expect(astarInfo!.name).toBe('A* Search');
    expect(astarInfo!.optimal).toBe(true);
  });
});
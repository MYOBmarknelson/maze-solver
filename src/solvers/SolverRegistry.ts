import { ISolver } from '@/types';
import { RandomWalkSolver } from './RandomWalkSolver';
import { AStarSolver } from './AStarSolver';
import { DFSSolver } from './DFSSolver';
import { BFSSolver } from './BFSSolver';

export type SolverType = 'random-walk' | 'astar' | 'dfs' | 'bfs';

export interface SolverInfo {
  type: SolverType;
  name: string;
  description: string;
  optimal: boolean; // Whether the solver finds optimal paths
  complete: boolean; // Whether the solver is guaranteed to find a solution if one exists
}

export class SolverRegistry {
  private static solvers: Map<SolverType, SolverInfo> = new Map([
    ['random-walk', {
      type: 'random-walk',
      name: 'Random Walk',
      description: 'Simple random movement until goal is reached. Fast but may take many steps.',
      optimal: false,
      complete: false
    }],
    ['astar', {
      type: 'astar',
      name: 'A* Search',
      description: 'Intelligent search using heuristics to find optimal paths efficiently.',
      optimal: true,
      complete: true
    }],
    ['dfs', {
      type: 'dfs',
      name: 'Depth-First Search',
      description: 'Explores as far as possible along each branch before backtracking.',
      optimal: false,
      complete: true
    }],
    ['bfs', {
      type: 'bfs',
      name: 'Breadth-First Search',
      description: 'Explores all neighbors at current depth before moving deeper.',
      optimal: true,
      complete: true
    }]
  ]);

  static getAvailableSolvers(): SolverInfo[] {
    return Array.from(this.solvers.values());
  }

  static getSolverInfo(type: SolverType): SolverInfo | undefined {
    return this.solvers.get(type);
  }

  static createSolver(type: SolverType): ISolver {
    switch (type) {
      case 'random-walk':
        return new RandomWalkSolver();
      case 'astar':
        return new AStarSolver();
      case 'dfs':
        return new DFSSolver();
      case 'bfs':
        return new BFSSolver();
      default:
        throw new Error(`Unknown solver type: ${type}`);
    }
  }

  static getDefaultSolver(): SolverType {
    return 'astar'; // A* is generally the best default
  }
}
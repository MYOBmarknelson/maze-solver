import { ISolver } from "@/types";
import { RandomWalkSolver } from "./RandomWalkSolver";
import { AStarSolver } from "./AStarSolver";
import { DFSSolver } from "./DFSSolver";
import { BFSSolver } from "./BFSSolver";
import { LeftHandRuleSolver } from "./LeftHandRuleSolver";
import { RightHandRuleSolver } from "./RightHandRuleSolver";
import { SlimeMoldSolver } from "./SlimeMoldSolver";
import { DijkstraSolver } from "./DijkstraSolver";
import { GreedyBestFirstSolver } from "./GreedyBestFirstSolver";
import { BidirectionalSearchSolver } from "./BidirectionalSearchSolver";

export type SolverType =
  | "random-walk"
  | "astar"
  | "dfs"
  | "bfs"
  | "left-hand"
  | "right-hand"
  | "slime-mold"
  | "dijkstra"
  | "greedy-best-first"
  | "bidirectional";

export interface SolverInfo {
  type: SolverType;
  name: string;
  description: string;
  optimal: boolean; // Whether the solver finds optimal paths
  complete: boolean; // Whether the solver is guaranteed to find a solution if one exists
}

export class SolverRegistry {
  private static solvers: Map<SolverType, SolverInfo> = new Map([
    [
      "random-walk",
      {
        type: "random-walk",
        name: "Random Walk",
        description:
          "Simple random movement until goal is reached. Fast but may take many steps.",
        optimal: false,
        complete: false,
      },
    ],
    [
      "astar",
      {
        type: "astar",
        name: "A* Search",
        description:
          "Intelligent search using heuristics to find optimal paths efficiently.",
        optimal: true,
        complete: true,
      },
    ],
    [
      "dfs",
      {
        type: "dfs",
        name: "Depth-First Search",
        description:
          "Explores as far as possible along each branch before backtracking.",
        optimal: false,
        complete: true,
      },
    ],
    [
      "bfs",
      {
        type: "bfs",
        name: "Breadth-First Search",
        description:
          "Explores all neighbors at current depth before moving deeper.",
        optimal: true,
        complete: true,
      },
    ],
    [
      "left-hand",
      {
        type: "left-hand",
        name: "Left-Hand Rule",
        description:
          "Always follows the left wall. Guaranteed to solve simply-connected mazes.",
        optimal: false,
        complete: true,
      },
    ],
    [
      "right-hand",
      {
        type: "right-hand",
        name: "Right-Hand Rule",
        description:
          "Always follows the right wall. Guaranteed to solve simply-connected mazes.",
        optimal: false,
        complete: true,
      },
    ],
    [
      "slime-mold",
      {
        type: "slime-mold",
        name: "Slime Mold Simulation",
        description:
          "Bio-inspired algorithm simulating Physarum polycephalum with pheromone trails and emergent pathfinding.",
        optimal: false,
        complete: false,
      },
    ],
    [
      "dijkstra",
      {
        type: "dijkstra",
        name: "Dijkstra's Algorithm",
        description:
          "Uniform-cost search algorithm that finds the shortest path in an unweighted graph.",
        optimal: true,
        complete: true,
      },
    ],
    [
      "greedy-best-first",
      {
        type: "greedy-best-first",
        name: "Greedy Best-First Search",
        description:
          "Heuristic-guided search that prioritizes nodes closest to the goal, but may not find optimal paths.",
        optimal: false,
        complete: false,
      },
    ],
    [
      "bidirectional",
      {
        type: "bidirectional",
        name: "Bidirectional Search",
        description:
          "Searches from both start and goal simultaneously, meeting in the middle for faster pathfinding.",
        optimal: true,
        complete: true,
      },
    ],
  ]);

  static getAvailableSolvers(): SolverInfo[] {
    return Array.from(this.solvers.values());
  }

  static getSolverInfo(type: SolverType): SolverInfo | undefined {
    return this.solvers.get(type);
  }

  static createSolver(type: SolverType): ISolver {
    switch (type) {
      case "random-walk":
        return new RandomWalkSolver();
      case "astar":
        return new AStarSolver();
      case "dfs":
        return new DFSSolver();
      case "bfs":
        return new BFSSolver();
      case "left-hand":
        return new LeftHandRuleSolver();
      case "right-hand":
        return new RightHandRuleSolver();
      case "slime-mold":
        return new SlimeMoldSolver();
      case "dijkstra":
        return new DijkstraSolver();
      case "greedy-best-first":
        return new GreedyBestFirstSolver();
      case "bidirectional":
        return new BidirectionalSearchSolver();
      default:
        throw new Error(`Unknown solver type: ${type}`);
    }
  }

  static getDefaultSolver(): SolverType {
    return "astar"; // A* is generally the best default
  }
}

import { ISolver, Position, Solution } from "@/types";
import { Maze } from "@/core/Maze";

interface SlimeAgent {
  position: Position;
  direction: number; // angle in radians
  speed: number;
  trail: Position[];
  active: boolean;
}

interface PheromoneTrail {
  position: Position;
  strength: number;
  lastUpdate: number;
}

export class SlimeMoldSolver implements ISolver {
  private maze: Maze | null = null;
  private currentPath: Position[] = [];
  private agents: SlimeAgent[] = [];
  private pheromones: Map<string, PheromoneTrail> = new Map();
  private goal: Position | null = null;
  private isComplete: boolean = false;

  // Simulation parameters
  private readonly NUM_AGENTS = 20;
  private readonly EVAPORATION_RATE = 0.95;
  private readonly ATTRACTION_STRENGTH = 0.8;
  private readonly RANDOM_MOVEMENT = 0.3;

  initialize(maze: Maze, start: Position, goal: Position): void {
    this.maze = maze;
    this.goal = goal;
    this.currentPath = [start];
    this.agents = [];
    this.pheromones.clear();
    this.isComplete = false;

    // Initialize agents
    this.initializeAgents(start);
  }

  async solve(maze: Maze, start: Position, goal: Position): Promise<Solution> {
    this.initialize(maze, start, goal);

    const startTime = performance.now();

    let steps = 0;
    const maxSteps = 2000; // Allow more steps for emergent behavior

    while (!this.isComplete && steps < maxSteps) {
      await this.step();
      steps++;

      // Check if any agent reached the goal
      if (this.checkGoalReached()) {
        this.isComplete = true;
        this.extractSolutionPath();
        break;
      }
    }

    const endTime = performance.now();

    return {
      path: this.currentPath,
      steps: this.currentPath.map((pos, index) => ({
        position: pos,
        action: index === 0 ? "move" : "explore",
        timestamp: startTime + index * 10,
      })),
      solved: this.isComplete,
      stats: {
        totalSteps: steps,
        timeTaken: endTime - startTime,
        nodesExplored: this.pheromones.size,
        pathLength: this.currentPath.length,
      },
    };
  }

  async step(): Promise<boolean> {
    if (!this.maze || this.agents.length === 0) {
      return false;
    }

    // Update pheromone trails (evaporation)
    this.updatePheromones();

    // Move all agents
    for (const agent of this.agents) {
      if (!agent.active) continue;
      this.moveAgent(agent);
    }

    // Remove inactive agents
    this.agents = this.agents.filter((agent) => agent.active);

    return this.agents.length > 0;
  }

  getCurrentPath(): Position[] {
    return [...this.currentPath];
  }

  reset(): void {
    this.currentPath = [];
    this.agents = [];
    this.pheromones.clear();
    this.goal = null;
    this.isComplete = false;
  }

  private initializeAgents(start: Position): void {
    for (let i = 0; i < this.NUM_AGENTS; i++) {
      const agent: SlimeAgent = {
        position: { ...start },
        direction: Math.random() * 2 * Math.PI, // Random initial direction
        speed: 0.5 + Math.random() * 0.5, // Variable speed
        trail: [{ ...start }],
        active: true,
      };
      this.agents.push(agent);
    }
  }

  private moveAgent(agent: SlimeAgent): void {
    const currentPos = agent.position;

    // Calculate forces from pheromones and goal
    const forces = this.calculateForces(agent);

    // Update direction based on forces
    agent.direction += forces.angle * 0.1;

    // Add some random movement
    agent.direction += (Math.random() - 0.5) * this.RANDOM_MOVEMENT;

    // Calculate new position
    const newX = currentPos.x + Math.cos(agent.direction) * agent.speed;
    const newY = currentPos.y + Math.sin(agent.direction) * agent.speed;

    const newPos: Position = {
      x: Math.round(newX),
      y: Math.round(newY),
      z: currentPos.z || 0,
    };

    // Check if new position is valid
    if (
      this.isValidPosition(newPos) &&
      this.maze!.canMove(currentPos, newPos)
    ) {
      agent.position = newPos;
      agent.trail.push({ ...newPos });

      // Deposit pheromone
      this.depositPheromone(newPos);

      // Limit trail length to prevent memory issues
      if (agent.trail.length > 100) {
        agent.trail.shift();
      }
    } else {
      // Hit a wall, change direction randomly
      agent.direction += (Math.random() - 0.5) * Math.PI;
    }

    // Deactivate agent if it's been exploring too long without progress
    if (agent.trail.length > 200) {
      agent.active = false;
    }
  }

  private calculateForces(agent: SlimeAgent): {
    angle: number;
    magnitude: number;
  } {
    let totalForceX = 0;
    let totalForceY = 0;

    // Goal attraction (weak)
    if (this.goal) {
      const dx = this.goal.x - agent.position.x;
      const dy = this.goal.y - agent.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 0) {
        totalForceX += (dx / distance) * 0.1;
        totalForceY += (dy / distance) * 0.1;
      }
    }

    // Pheromone attraction/repulsion
    const neighbors = this.maze!.getNeighbors(agent.position);
    for (const neighbor of neighbors) {
      if (!neighbor) continue;

      const pheromone = this.pheromones.get(this.positionToString(neighbor));
      if (pheromone && pheromone.strength > 0.1) {
        const dx = neighbor.x - agent.position.x;
        const dy = neighbor.y - agent.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          // Attraction to strong pheromone trails
          const attraction = pheromone.strength * this.ATTRACTION_STRENGTH;
          totalForceX += (dx / distance) * attraction;
          totalForceY += (dy / distance) * attraction;
        }
      }
    }

    // Calculate resulting angle
    const angle = Math.atan2(totalForceY, totalForceX);
    const magnitude = Math.sqrt(
      totalForceX * totalForceX + totalForceY * totalForceY
    );

    return { angle, magnitude };
  }

  private depositPheromone(position: Position): void {
    const key = this.positionToString(position);
    const existing = this.pheromones.get(key);

    if (existing) {
      existing.strength = Math.min(existing.strength + 0.2, 1.0);
      existing.lastUpdate = Date.now();
    } else {
      this.pheromones.set(key, {
        position: { ...position },
        strength: 0.2,
        lastUpdate: Date.now(),
      });
    }
  }

  private updatePheromones(): void {
    const toRemove: string[] = [];

    for (const [key, pheromone] of this.pheromones) {
      // Evaporate pheromones over time
      pheromone.strength *= this.EVAPORATION_RATE;

      // Remove very weak pheromones
      if (pheromone.strength < 0.01) {
        toRemove.push(key);
      }
    }

    // Remove weak pheromones
    for (const key of toRemove) {
      this.pheromones.delete(key);
    }
  }

  private checkGoalReached(): boolean {
    if (!this.goal) return false;

    return this.agents.some(
      (agent) => agent.active && this.positionsEqual(agent.position, this.goal!)
    );
  }

  private extractSolutionPath(): void {
    if (!this.goal) return;

    // Find the strongest pheromone path to the goal
    const path = this.findStrongestPath(this.goal);
    this.currentPath =
      path.length > 0
        ? path
        : [
            this.maze!.getConfig().size.width > 0
              ? { x: 0, y: 0, z: 0 }
              : { x: 0, y: 0 },
          ];
  }

  private findStrongestPath(goal: Position): Position[] {
    const visited = new Set<string>();
    const path: Position[] = [];

    // Simple greedy approach: follow strongest pheromones
    let current = { ...goal };

    while (true) {
      path.unshift({ ...current });

      if (this.positionsEqual(current, { x: 0, y: 0, z: 0 })) {
        break; // Reached start
      }

      const neighbors = this.maze!.getNeighbors(current).filter((neighbor) =>
        this.maze!.canMove(current, neighbor)
      );
      let bestNeighbor: Position | null = null;
      let bestStrength = 0;

      for (const neighbor of neighbors) {
        if (!neighbor) continue;

        const key = this.positionToString(neighbor);
        if (visited.has(key)) continue;

        const pheromone = this.pheromones.get(key);
        if (pheromone && pheromone.strength > bestStrength) {
          bestStrength = pheromone.strength;
          bestNeighbor = neighbor;
        }
      }

      if (!bestNeighbor || bestStrength < 0.05) {
        break; // No good path found
      }

      visited.add(this.positionToString(bestNeighbor));
      current = bestNeighbor;
    }

    return path;
  }

  private isValidPosition(position: Position): boolean {
    const dimensions = this.maze!.getDimensions();
    return (
      position.x >= 0 &&
      position.x < dimensions.width &&
      position.y >= 0 &&
      position.y < dimensions.height &&
      (position.z || 0) >= 0 &&
      (position.z || 0) < dimensions.depth
    );
  }

  private positionsEqual(pos1: Position, pos2: Position): boolean {
    return (
      pos1.x === pos2.x && pos1.y === pos2.y && (pos1.z || 0) === (pos2.z || 0)
    );
  }

  private positionToString(pos: Position): string {
    return `${pos.x},${pos.y},${pos.z || 0}`;
  }
}

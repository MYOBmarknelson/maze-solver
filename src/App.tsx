import React, { useState, useEffect, useRef, useCallback } from "react";
import { MazeGenerator } from "@/core/MazeGenerator";
import { ThreeRenderer } from "@/renderers/ThreeRenderer";
import { SolverRegistry, SolverType } from "@/solvers/SolverRegistry";
import { AppState, MazeConfig, Position } from "@/types";
import "./App.css";

const App: React.FC = () => {
  // Application state
  const [appState, setAppState] = useState<AppState>({
    maze: null,
    config: {
      puzzleType: "maze",
      dimensions: "2d",
      size: { width: 10, height: 10 },
    },
    solver: null,
    renderer: null,
    currentSolution: null,
    isGenerating: false,
    isSolving: false,
    renderConfig: {
      showSolution: true,
      showExplored: true,
      animationSpeed: 1,
      layerOpacity: 1,
      activeLayer: 0,
    },
  });

  // Refs for DOM elements
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize renderer when component mounts
  useEffect(() => {
    if (canvasRef.current && !appState.renderer) {
      const renderer = new ThreeRenderer();
      renderer.initialize(canvasRef.current);
      setAppState((prev) => ({ ...prev, renderer }));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (appState.renderer) {
        appState.renderer.dispose();
      }
    };
  }, []);

  // Generate maze
  const generateMaze = useCallback(async () => {
    setAppState((prev) => ({ ...prev, isGenerating: true }));

    try {
      const generator = new MazeGenerator(appState.config);
      const maze = await generator.generate();

      setAppState((prev) => ({
        ...prev,
        maze,
        currentSolution: null,
        isGenerating: false,
      }));

      // Render the maze
      if (appState.renderer) {
        appState.renderer.render(maze);
      }
    } catch (error) {
      console.error("Failed to generate maze:", error);
      setAppState((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [appState.config]);

  // Start solving
  const startSolving = useCallback(
    async (solverType: SolverType) => {
      if (!appState.maze) return;

      const solver = SolverRegistry.createSolver(solverType);
      const start: Position = { x: 0, y: 0, z: 0 };
      const goal: Position = {
        x: appState.config.size.width - 1,
        y: appState.config.size.height - 1,
        z:
          appState.config.dimensions === "3d"
            ? (appState.config.size.depth || 1) - 1
            : 0,
      };

      setAppState((prev) => ({ ...prev, solver, isSolving: true }));

      try {
        const solution = await solver.solve(appState.maze, start, goal);

        setAppState((prev) => ({
          ...prev,
          currentSolution: solution,
          isSolving: false,
        }));

        // Render solution
        if (appState.renderer && solution.path.length > 0) {
          appState.renderer.render(appState.maze!, undefined, solution.path);
        }
      } catch (error) {
        console.error("Failed to solve maze:", error);
        setAppState((prev) => ({ ...prev, isSolving: false }));
      }
    },
    [appState.maze, appState.config]
  );

  // Step-by-step solving
  const stepSolve = useCallback(async () => {
    if (!appState.solver || !appState.maze) return;

    const hasMoreSteps = await appState.solver.step();
    const currentPath = appState.solver.getCurrentPath();

    // Update visualization
    if (appState.renderer && currentPath.length > 0) {
      appState.renderer.render(appState.maze, currentPath);
    }

    if (!hasMoreSteps) {
      setAppState((prev) => ({ ...prev, isSolving: false }));
    }
  }, [appState.solver, appState.maze, appState.renderer]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<MazeConfig>) => {
    setAppState((prev) => ({
      ...prev,
      config: { ...prev.config, ...newConfig },
      maze: null,
      currentSolution: null,
    }));
  }, []);

  // Reset everything
  const reset = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      maze: null,
      solver: null,
      currentSolution: null,
      isGenerating: false,
      isSolving: false,
    }));

    // Clear the renderer by not rendering anything
    if (appState.renderer) {
      // For now, we'll just leave the scene as is
      // TODO: Implement proper scene clearing in ThreeRenderer
    }
  }, [appState.renderer]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Maze and Labyrinth Constructor and Solver</h1>
        <p>
          Real-time 3D maze visualization and intelligent solving algorithms
        </p>
      </header>

      <div className="app-content">
        <div className="controls-panel">
          <div className="control-section">
            <h3>Maze Configuration</h3>
            <div className="control-group">
              <label>
                Type:
                <select
                  value={appState.config.puzzleType}
                  onChange={(e) =>
                    updateConfig({
                      puzzleType: e.target.value as "maze" | "labyrinth",
                    })
                  }
                >
                  <option value="maze">Maze</option>
                  <option value="labyrinth">Labyrinth</option>
                </select>
              </label>
            </div>

            <div className="control-group">
              <label>
                Dimensions:
                <select
                  value={appState.config.dimensions}
                  onChange={(e) =>
                    updateConfig({ dimensions: e.target.value as "2d" | "3d" })
                  }
                >
                  <option value="2d">2D</option>
                  <option value="3d">3D</option>
                </select>
              </label>
            </div>

            <div className="control-group">
              <label>
                Width:
                <input
                  type="number"
                  min="3"
                  max="50"
                  value={appState.config.size.width}
                  onChange={(e) =>
                    updateConfig({
                      size: {
                        ...appState.config.size,
                        width: parseInt(e.target.value) || 10,
                      },
                    })
                  }
                />
              </label>
            </div>

            <div className="control-group">
              <label>
                Height:
                <input
                  type="number"
                  min="3"
                  max="50"
                  value={appState.config.size.height}
                  onChange={(e) =>
                    updateConfig({
                      size: {
                        ...appState.config.size,
                        height: parseInt(e.target.value) || 10,
                      },
                    })
                  }
                />
              </label>
            </div>

            {appState.config.dimensions === "3d" && (
              <div className="control-group">
                <label>
                  Depth:
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={appState.config.size.depth || 1}
                    onChange={(e) =>
                      updateConfig({
                        size: {
                          ...appState.config.size,
                          depth: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                  />
                </label>
              </div>
            )}

            <button
              onClick={generateMaze}
              disabled={appState.isGenerating}
              className="generate-btn"
            >
              {appState.isGenerating ? "Generating..." : "Generate Maze"}
            </button>
          </div>

          <div className="control-section">
            <h3>Solver Selection</h3>
            {SolverRegistry.getAvailableSolvers().map((solverInfo) => (
              <button
                key={solverInfo.type}
                onClick={() => startSolving(solverInfo.type)}
                disabled={!appState.maze || appState.isSolving}
                className="solver-btn"
                title={solverInfo.description}
              >
                {solverInfo.name}
                {solverInfo.optimal && <span className="optimal-badge">★</span>}
              </button>
            ))}

            {appState.solver && appState.isSolving && (
              <button onClick={stepSolve} className="step-btn">
                Step
              </button>
            )}
          </div>

          <div className="control-section">
            <h3>Actions</h3>
            <button onClick={reset} className="reset-btn">
              Reset
            </button>
          </div>

          {appState.currentSolution && (
            <div className="control-section">
              <h3>Solution Stats</h3>
              <div className="stats">
                <div>
                  Solved: {appState.currentSolution.solved ? "Yes" : "No"}
                </div>
                <div>Steps: {appState.currentSolution.stats.totalSteps}</div>
                <div>
                  Time: {appState.currentSolution.stats.timeTaken.toFixed(2)}ms
                </div>
                <div>
                  Path Length: {appState.currentSolution.stats.pathLength}
                </div>
                <div>
                  Nodes Explored: {appState.currentSolution.stats.nodesExplored}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="visualization-panel">
          <div ref={canvasRef} className="canvas-container" />
          {!appState.maze && !appState.isGenerating && (
            <div className="placeholder">
              <p>Generate a maze to begin visualization</p>
            </div>
          )}
          {appState.isGenerating && (
            <div className="loading">
              <p>Generating maze...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MazeGenerator } from "@/core/MazeGenerator";
import { TimeManager } from "@/core/TimeManager";
import { DimensionLinker } from "@/core/DimensionLinker";
import { ThreeRenderer } from "@/renderers/ThreeRenderer";
import { ExportImportManager } from "@/utils/ExportImportManager";
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
    timeManager: null,
    dimensionLinker: null,
    currentSolution: null,
    isGenerating: false,
    isSolving: false,
    renderConfig: {
      showSolution: false, // Changed to false by default
      showExplored: true,
      animationSpeed: 1,
      layerOpacity: 1,
      activeLayer: 0,
    },
  });

  // VCR-like playback state
  const [playbackState, setPlaybackState] = useState<{
    isPlaying: boolean;
    currentStep: number;
    totalSteps: number;
    exploredSteps: Position[][];
  }>({
    isPlaying: false,
    currentStep: 0,
    totalSteps: 0,
    exploredSteps: [],
  });

  // Solver comparison results
  const [comparisonResults, setComparisonResults] = useState<Array<{
    solverName: string;
    steps: number;
    time: number;
    pathLength: number;
  }> | null>(null);

  // Currently selected solver type
  const [selectedSolverType, setSelectedSolverType] =
    useState<SolverType | null>(null);

  // Refs for DOM elements
  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const [isRendererReady, setIsRendererReady] = useState(false);

  // Accordion state for sidebar panels
  const [expandedPanels, setExpandedPanels] = useState({
    mazeConfig: true, // Keep maze config open by default
    solverControls: false,
    actions: false,
    solverSelection: false,
    solutionStats: false,
    threeDControls: false,
  });

  // Toggle panel expansion
  const togglePanel = useCallback((panelName: keyof typeof expandedPanels) => {
    setExpandedPanels((prev) => ({
      ...prev,
      [panelName]: !prev[panelName],
    }));
  }, []);

  // Collapse all panels
  const collapseAllPanels = useCallback(() => {
    setExpandedPanels({
      mazeConfig: false,
      solverControls: false,
      actions: false,
      solverSelection: false,
      solutionStats: false,
      threeDControls: false,
    });
  }, []);

  // Initialize renderer when component mounts
  useEffect(() => {
    console.log("useEffect running, canvasRef.current:", canvasRef.current);
    if (canvasRef.current && !rendererRef.current) {
      console.log("Initializing renderer");
      const renderer = new ThreeRenderer();
      renderer.initialize(canvasRef.current);
      rendererRef.current = renderer;
      setIsRendererReady(true);
      console.log("Renderer initialized and stored in ref");
    } else if (!canvasRef.current) {
      console.log("Canvas ref not available yet");
    } else {
      console.log("Renderer already exists");
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Re-render when showSolution toggle changes
  useEffect(() => {
    if (rendererRef.current && appState.maze) {
      const currentPath = appState.solver?.getCurrentPath() || [];
      const solutionPath =
        appState.renderConfig.showSolution && appState.currentSolution
          ? appState.currentSolution.path
          : undefined;
      rendererRef.current.render(appState.maze, currentPath, solutionPath);
    }
  }, [
    appState.renderConfig.showSolution,
    appState.currentSolution,
    appState.maze,
  ]);

  // Generate maze
  const generateMaze = useCallback(async () => {
    console.log("Generate maze clicked", appState.config);
    setAppState((prev) => ({ ...prev, isGenerating: true }));

    // Collapse all panels when generating maze
    collapseAllPanels();

    try {
      console.log("Creating maze generator...");
      const generator = new MazeGenerator(
        appState.config,
        appState.config.generationAlgorithm || "recursive-backtracking"
      );
      console.log("Generator created, calling generate...");
      const maze = generator.generate();
      console.log("Maze generated:", maze);
      console.log("Maze dimensions:", maze.getDimensions());
      console.log("Maze has cells:", maze.getAllCells().length);

      // Initialize time manager if time dimension is enabled
      const timeManager = new TimeManager();
      if (appState.config.timeDimension?.enabled) {
        console.log("Initializing time manager...");
        timeManager.initialize(appState.config);
        timeManager.setMaze(maze);
      }

      // Initialize dimension linker if 5th dimension is enabled
      const dimensionLinker = new DimensionLinker();
      if (appState.config.fifthDimension?.enabled) {
        console.log("Initializing dimension linker...");
        dimensionLinker.initialize(appState.config);
        // Links are already added during maze generation
      }

      console.log("Setting app state...");
      setAppState((prev) => ({
        ...prev,
        maze,
        timeManager: appState.config.timeDimension?.enabled
          ? timeManager
          : null,
        dimensionLinker: appState.config.fifthDimension?.enabled
          ? dimensionLinker
          : null,
        currentSolution: null,
        isGenerating: false,
      }));

      // Render the maze
      console.log("Rendering maze, renderer:", rendererRef.current);
      if (rendererRef.current) {
        rendererRef.current.render(maze);
        console.log("Maze rendered successfully");
      } else {
        console.log("No renderer available - maze generated but not rendered");
      }
    } catch (error) {
      console.error("Failed to generate maze:", error);
      setAppState((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [appState.config]);

  // Start solving - now pre-calculates solution
  const startSolving = useCallback(
    async (solverType: SolverType) => {
      if (!appState.maze) return;

      // Reset visual search and playback state
      setPlaybackState({
        isPlaying: false,
        currentStep: 0,
        totalSteps: 0,
        exploredSteps: [],
      });

      setSelectedSolverType(solverType);

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

      // Pre-calculate solution
      const startTime = performance.now();
      const solution = await solver.solve(appState.maze, start, goal);
      const endTime = performance.now();

      // Store solution
      const finalSolution = {
        solved: solution.solved,
        path: solution.path,
        steps: solution.steps,
        stats: {
          totalSteps: solution.stats.totalSteps,
          timeTaken: endTime - startTime,
          pathLength: solution.path.length,
          nodesExplored: solution.stats.nodesExplored,
        },
      };

      // Re-initialize solver for step-by-step playback
      solver.reset();
      solver.initialize(appState.maze, start, goal);

      setAppState((prev) => ({
        ...prev,
        solver,
        currentSolution: finalSolution,
        isSolving: false,
      }));

      // Render maze with solution if enabled
      if (rendererRef.current) {
        const solutionPath = appState.renderConfig.showSolution
          ? finalSolution.path
          : undefined;
        rendererRef.current.render(appState.maze, [], solutionPath);
      }
    },
    [appState.maze, appState.config, appState.renderConfig.showSolution]
  );

  // VCR Controls - Play/Pause
  const togglePlayback = useCallback(async () => {
    if (!appState.solver || !appState.maze) return;

    if (playbackState.isPlaying) {
      // Pause
      setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
      setAppState((prev) => ({ ...prev, isSolving: false }));
    } else {
      // Play
      setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
      setAppState((prev) => ({ ...prev, isSolving: true }));

      const stepDelay = 1000 / appState.renderConfig.animationSpeed;

      let hasMoreSteps = true;
      let steps: Position[][] = [];

      while (hasMoreSteps && playbackState.isPlaying) {
        hasMoreSteps = await appState.solver.step();
        const currentPath = appState.solver.getCurrentPath();
        steps.push([...currentPath]);

        // Update visualization
        if (rendererRef.current && currentPath.length > 0) {
          const solutionPath =
            appState.renderConfig.showSolution && appState.currentSolution
              ? appState.currentSolution.path
              : undefined;
          rendererRef.current.render(appState.maze, currentPath, solutionPath);
        }

        await new Promise((resolve) => setTimeout(resolve, stepDelay));

        if (!hasMoreSteps) {
          setPlaybackState((prev) => ({
            ...prev,
            isPlaying: false,
            currentStep: steps.length,
            totalSteps: steps.length,
            exploredSteps: steps,
          }));
          setAppState((prev) => ({ ...prev, isSolving: false }));
        }
      }
    }
  }, [
    appState.solver,
    appState.maze,
    appState.renderConfig.animationSpeed,
    appState.renderConfig.showSolution,
    appState.currentSolution,
    playbackState.isPlaying,
  ]);

  // Step forward
  const stepForward = useCallback(async () => {
    if (!appState.solver || !appState.maze || appState.isSolving) return;

    const hasMoreSteps = await appState.solver.step();
    const currentPath = appState.solver.getCurrentPath();

    if (rendererRef.current) {
      const solutionPath =
        appState.renderConfig.showSolution && appState.currentSolution
          ? appState.currentSolution.path
          : undefined;
      rendererRef.current.render(appState.maze, currentPath, solutionPath);
    }

    if (!hasMoreSteps) {
      setPlaybackState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  }, [
    appState.solver,
    appState.maze,
    appState.isSolving,
    appState.renderConfig.showSolution,
    appState.currentSolution,
  ]);

  // Reset playback
  const resetPlayback = useCallback(() => {
    if (!appState.solver || !appState.maze) return;

    appState.solver.reset();

    const start: Position = { x: 0, y: 0, z: 0 };
    const goal: Position = {
      x: appState.config.size.width - 1,
      y: appState.config.size.height - 1,
      z:
        appState.config.dimensions === "3d"
          ? (appState.config.size.depth || 1) - 1
          : 0,
    };

    appState.solver.initialize(appState.maze, start, goal);

    setPlaybackState({
      isPlaying: false,
      currentStep: 0,
      totalSteps: 0,
      exploredSteps: [],
    });

    if (rendererRef.current) {
      const solutionPath =
        appState.renderConfig.showSolution && appState.currentSolution
          ? appState.currentSolution.path
          : undefined;
      rendererRef.current.render(appState.maze, [], solutionPath);
    }
  }, [
    appState.solver,
    appState.maze,
    appState.config,
    appState.renderConfig.showSolution,
    appState.currentSolution,
  ]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<MazeConfig>) => {
    setAppState((prev) => ({
      ...prev,
      config: { ...prev.config, ...newConfig },
      maze: null,
      currentSolution: null,
    }));
  }, []);

  // Export maze configuration
  const exportMaze = useCallback(() => {
    if (!appState.maze) return;

    try {
      const data = ExportImportManager.exportToFormat(
        appState.maze,
        "json",
        appState.currentSolution || undefined
      );
      const filename = ExportImportManager.generateFilename("maze", "json");
      ExportImportManager.downloadExport(data, filename);
    } catch (error) {
      console.error("Failed to export maze:", error);
    }
  }, [appState.maze, appState.currentSolution]);

  // Import maze configuration
  const importMaze = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const { maze, solution } = ExportImportManager.importMaze(content);

          setAppState((prev) => ({
            ...prev,
            maze,
            config: maze.getConfig(),
            currentSolution: solution || null,
          }));

          // Reinitialize managers if needed
          const config = maze.getConfig();
          if (config.timeDimension?.enabled) {
            const timeManager = new TimeManager();
            timeManager.initialize(config);
            timeManager.setMaze(maze);
            setAppState((prev) => ({ ...prev, timeManager }));
          }

          if (config.fifthDimension?.enabled) {
            const dimensionLinker = new DimensionLinker();
            dimensionLinker.initialize(config);
            setAppState((prev) => ({ ...prev, dimensionLinker }));
          }

          // Render the imported maze
          if (rendererRef.current) {
            rendererRef.current.render(maze, solution?.path);
          }
        } catch (error) {
          console.error("Failed to import maze:", error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // Compare solvers
  const compareSolvers = useCallback(async () => {
    if (!appState.maze) return;

    const results: Array<{
      solverName: string;
      steps: number;
      time: number;
      pathLength: number;
    }> = [];

    const solversToTest = [
      "astar",
      "dijkstra",
      "greedy-best-first",
      "bidirectional",
      "bfs",
      "dfs",
    ];

    for (const solverType of solversToTest) {
      try {
        const solver = SolverRegistry.createSolver(solverType as any);
        const start: Position = { x: 0, y: 0, z: 0 };
        const goal: Position = {
          x: appState.config.size.width - 1,
          y: appState.config.size.height - 1,
          z:
            appState.config.dimensions === "3d"
              ? (appState.config.size.depth || 1) - 1
              : 0,
        };

        const startTime = performance.now();
        const solution = await solver.solve(appState.maze, start, goal);
        const endTime = performance.now();

        results.push({
          solverName: solverType.toUpperCase().replace(/-/g, " "),
          steps: solution.stats.totalSteps,
          time: endTime - startTime,
          pathLength: solution.path.length,
        });
      } catch (error) {
        console.error(`Failed to run ${solverType}:`, error);
      }
    }

    setComparisonResults(results);
    console.log("Solver Comparison Results:", results);
  }, [appState.maze, appState.config]);

  // Reset everything
  const reset = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      maze: null,
      solver: null,
      timeManager: null,
      dimensionLinker: null,
      currentSolution: null,
      isGenerating: false,
      isSolving: false,
    }));

    // Clear the renderer by not rendering anything
    if (rendererRef.current) {
      // For now, we'll just leave the scene as is
      // TODO: Implement proper scene clearing in ThreeRenderer
    }
  }, []);

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
            <h3
              className="accordion-header"
              onClick={() => togglePanel("mazeConfig")}
            >
              Maze Configuration
              <span
                className={`accordion-icon ${
                  expandedPanels.mazeConfig ? "expanded" : ""
                }`}
              >
                ▼
              </span>
            </h3>
            {expandedPanels.mazeConfig && (
              <>
                <div className="maze-config-row">
                  <div className="dropdowns-column">
                    <div className="control-group">
                      <label>
                        Type:
                        <select
                          value={appState.config.puzzleType}
                          onChange={(e) =>
                            updateConfig({
                              puzzleType: e.target.value as
                                | "maze"
                                | "labyrinth",
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
                            updateConfig({
                              dimensions: e.target.value as "2d" | "3d",
                            })
                          }
                        >
                          <option value="2d">2D</option>
                          <option value="3d">3D</option>
                        </select>
                      </label>
                    </div>

                    <div className="control-group">
                      <label>
                        Generation Algorithm:
                        <select
                          value={
                            appState.config.generationAlgorithm ||
                            "recursive-backtracking"
                          }
                          onChange={(e) =>
                            updateConfig({
                              generationAlgorithm: e.target.value as
                                | "recursive-backtracking"
                                | "prim",
                            })
                          }
                        >
                          <option value="recursive-backtracking">
                            Recursive Backtracking
                          </option>
                          <option value="prim">Prim's Algorithm</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="dimensions-column">
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
                  </div>
                </div>

                <div className="control-section time-dimension-section">
                  <h4>Time Dimension</h4>
                  <div className="control-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={
                          appState.config.timeDimension?.enabled || false
                        }
                        onChange={(e) =>
                          updateConfig({
                            timeDimension: {
                              enabled: e.target.checked,
                              shiftFrequency:
                                appState.config.timeDimension?.shiftFrequency ||
                                5,
                              stabilityIslands:
                                appState.config.timeDimension
                                  ?.stabilityIslands || 20,
                              shiftExtent:
                                appState.config.timeDimension?.shiftExtent ||
                                30,
                            },
                          })
                        }
                      />
                      Enable Time Dimension
                    </label>
                  </div>

                  {appState.config.timeDimension?.enabled && (
                    <>
                      <div className="control-group">
                        <label>
                          Shift Frequency:
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={appState.config.timeDimension.shiftFrequency}
                            onChange={(e) =>
                              updateConfig({
                                timeDimension: {
                                  enabled: true,
                                  shiftFrequency: parseInt(e.target.value) || 5,
                                  stabilityIslands:
                                    appState.config.timeDimension
                                      ?.stabilityIslands || 20,
                                  shiftExtent:
                                    appState.config.timeDimension
                                      ?.shiftExtent || 30,
                                },
                              })
                            }
                          />
                        </label>
                      </div>

                      <div className="control-group">
                        <label>
                          Stability Islands (%):
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={
                              appState.config.timeDimension.stabilityIslands
                            }
                            onChange={(e) =>
                              updateConfig({
                                timeDimension: {
                                  enabled: true,
                                  shiftFrequency:
                                    appState.config.timeDimension
                                      ?.shiftFrequency || 5,
                                  stabilityIslands:
                                    parseInt(e.target.value) || 20,
                                  shiftExtent:
                                    appState.config.timeDimension
                                      ?.shiftExtent || 30,
                                },
                              })
                            }
                          />
                        </label>
                      </div>

                      <div className="control-group">
                        <label>
                          Shift Extent (%):
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={appState.config.timeDimension.shiftExtent}
                            onChange={(e) =>
                              updateConfig({
                                timeDimension: {
                                  enabled: true,
                                  shiftFrequency:
                                    appState.config.timeDimension
                                      ?.shiftFrequency || 5,
                                  stabilityIslands:
                                    appState.config.timeDimension
                                      ?.stabilityIslands || 20,
                                  shiftExtent: parseInt(e.target.value) || 30,
                                },
                              })
                            }
                          />
                        </label>
                      </div>
                    </>
                  )}
                </div>

                <div className="control-section fifth-dimension-section">
                  <h4>5th Dimension</h4>
                  <div className="control-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={
                          appState.config.fifthDimension?.enabled || false
                        }
                        onChange={(e) =>
                          updateConfig({
                            fifthDimension: {
                              enabled: e.target.checked,
                              linkageCount:
                                appState.config.fifthDimension?.linkageCount ||
                                3,
                            },
                          })
                        }
                      />
                      Enable 5th Dimension
                    </label>
                  </div>

                  {appState.config.fifthDimension?.enabled && (
                    <div className="control-group">
                      <label>
                        Linkage Count:
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={appState.config.fifthDimension.linkageCount}
                          onChange={(e) =>
                            updateConfig({
                              fifthDimension: {
                                enabled: true,
                                linkageCount: parseInt(e.target.value) || 3,
                              },
                            })
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    console.log("Button clicked!");
                    generateMaze();
                  }}
                  disabled={appState.isGenerating || !isRendererReady}
                  className="generate-btn"
                >
                  {appState.isGenerating ? "Generating..." : "Generate Maze"}
                </button>
              </>
            )}
          </div>

          <div className="control-section">
            <h3
              className="accordion-header"
              onClick={() => togglePanel("solverControls")}
            >
              Solver Controls
              <span
                className={`accordion-icon ${
                  expandedPanels.solverControls ? "expanded" : ""
                }`}
              >
                ▼
              </span>
            </h3>
            {expandedPanels.solverControls && (
              <>
                <div className="control-group">
                  <label>
                    Animation Speed:
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={appState.renderConfig.animationSpeed}
                      onChange={(e) =>
                        setAppState((prev) => ({
                          ...prev,
                          renderConfig: {
                            ...prev.renderConfig,
                            animationSpeed: parseFloat(e.target.value),
                          },
                        }))
                      }
                    />
                    {appState.renderConfig.animationSpeed.toFixed(1)}x
                    (steps/sec)
                  </label>
                </div>

                <div className="control-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={appState.renderConfig.showSolution}
                      onChange={(e) =>
                        setAppState((prev) => ({
                          ...prev,
                          renderConfig: {
                            ...prev.renderConfig,
                            showSolution: e.target.checked,
                          },
                        }))
                      }
                    />
                    Show Solution Path
                  </label>
                </div>

                <div className="control-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={appState.renderConfig.showExplored}
                      onChange={(e) =>
                        setAppState((prev) => ({
                          ...prev,
                          renderConfig: {
                            ...prev.renderConfig,
                            showExplored: e.target.checked,
                          },
                        }))
                      }
                    />
                    Show Explored Path
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="control-section">
            <h3
              className="accordion-header"
              onClick={() => togglePanel("actions")}
            >
              Actions
              <span
                className={`accordion-icon ${
                  expandedPanels.actions ? "expanded" : ""
                }`}
              >
                ▼
              </span>
            </h3>
            {expandedPanels.actions && (
              <>
                <button onClick={reset} className="reset-btn">
                  Reset
                </button>
                <button
                  onClick={exportMaze}
                  disabled={!appState.maze}
                  className="export-btn"
                >
                  Export Maze
                </button>
                <button onClick={importMaze} className="import-btn">
                  Import Maze
                </button>
                <button
                  onClick={compareSolvers}
                  disabled={!appState.maze}
                  className="compare-btn"
                >
                  Compare Solvers
                </button>
              </>
            )}
          </div>

          <div className="control-section">
            <h3
              className="accordion-header"
              onClick={() => togglePanel("solverSelection")}
            >
              Solver Selection
              <span
                className={`accordion-icon ${
                  expandedPanels.solverSelection ? "expanded" : ""
                }`}
              >
                ▼
              </span>
            </h3>
            {expandedPanels.solverSelection && (
              <>
                {SolverRegistry.getAvailableSolvers().map((solverInfo) => (
                  <button
                    key={solverInfo.type}
                    onClick={() => startSolving(solverInfo.type)}
                    disabled={!appState.maze || appState.isSolving}
                    className={`solver-btn ${
                      selectedSolverType === solverInfo.type
                        ? "active-solver"
                        : ""
                    }`}
                    title={solverInfo.description}
                  >
                    {solverInfo.name}
                    {solverInfo.optimal && (
                      <span className="optimal-badge">★</span>
                    )}
                  </button>
                ))}

                {appState.solver && (
                  <div className="vcr-controls">
                    <button
                      onClick={resetPlayback}
                      disabled={appState.isSolving}
                      className="vcr-btn"
                      title="Reset to start"
                    >
                      ⏮
                    </button>
                    <button
                      onClick={togglePlayback}
                      disabled={!appState.solver}
                      className="vcr-btn play-pause"
                    >
                      {playbackState.isPlaying ? "⏸" : "▶"}
                    </button>
                    <button
                      onClick={stepForward}
                      disabled={appState.isSolving}
                      className="vcr-btn"
                      title="Step forward"
                    >
                      ⏭
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {comparisonResults && (
            <div className="control-section">
              <h3
                className="accordion-header"
                onClick={() => setComparisonResults(null)}
              >
                Solver Comparison Results
                <span className="accordion-icon expanded">▼</span>
              </h3>
              <div className="comparison-results">
                <table>
                  <thead>
                    <tr>
                      <th>Solver</th>
                      <th>Steps</th>
                      <th>Time (ms)</th>
                      <th>Path Length</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResults.map((result, index) => (
                      <tr key={index}>
                        <td>{result.solverName}</td>
                        <td>{result.steps}</td>
                        <td>{result.time.toFixed(2)}</td>
                        <td>{result.pathLength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {appState.currentSolution && (
            <div className="control-section">
              <h3
                className="accordion-header"
                onClick={() => togglePanel("solutionStats")}
              >
                Solution Stats
                <span
                  className={`accordion-icon ${
                    expandedPanels.solutionStats ? "expanded" : ""
                  }`}
                >
                  ▼
                </span>
              </h3>
              {expandedPanels.solutionStats && (
                <div className="stats">
                  <div>
                    Solved: {appState.currentSolution.solved ? "Yes" : "No"}
                  </div>
                  <div>Steps: {appState.currentSolution.stats.totalSteps}</div>
                  <div>
                    Time: {appState.currentSolution.stats.timeTaken.toFixed(2)}
                    ms
                  </div>
                  <div>
                    Path Length: {appState.currentSolution.stats.pathLength}
                  </div>
                  <div>
                    Nodes Explored:{" "}
                    {appState.currentSolution.stats.nodesExplored}
                  </div>
                </div>
              )}
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

          {appState.maze && appState.config.dimensions === "3d" && (
            <div className="control-section">
              <h3
                className="accordion-header"
                onClick={() => togglePanel("threeDControls")}
              >
                3D Controls
                <span
                  className={`accordion-icon ${
                    expandedPanels.threeDControls ? "expanded" : ""
                  }`}
                >
                  ▼
                </span>
              </h3>
              {expandedPanels.threeDControls && (
                <>
                  <div className="control-group">
                    <label>
                      Layer: {appState.renderConfig.activeLayer + 1}/
                      {appState.maze.getDimensions().depth}
                      <input
                        type="range"
                        min="0"
                        max={appState.maze.getDimensions().depth - 1}
                        value={appState.renderConfig.activeLayer}
                        onChange={(e) => {
                          const layer = parseInt(e.target.value);
                          setAppState((prev) => ({
                            ...prev,
                            renderConfig: {
                              ...prev.renderConfig,
                              activeLayer: layer,
                            },
                          }));
                          if (rendererRef.current) {
                            rendererRef.current.setLayerOpacity(
                              layer,
                              appState.renderConfig.layerOpacity
                            );
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="control-group">
                    <label>
                      Opacity:
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={appState.renderConfig.layerOpacity}
                        onChange={(e) => {
                          const opacity = parseFloat(e.target.value);
                          setAppState((prev) => ({
                            ...prev,
                            renderConfig: {
                              ...prev.renderConfig,
                              layerOpacity: opacity,
                            },
                          }));
                          if (rendererRef.current) {
                            rendererRef.current.setLayerOpacity(
                              appState.renderConfig.activeLayer,
                              opacity
                            );
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="control-group">
                    <button
                      onClick={() => {
                        if (rendererRef.current) {
                          rendererRef.current.setCameraPosition({
                            x: 0,
                            y: 0,
                            z: 10,
                          });
                        }
                      }}
                      className="camera-btn"
                    >
                      Reset Camera
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

# Maze and Labyrinth Constructor and Solver

## Overview

The Maze and Labyrinth Constructor and Solver is an interactive TypeScript application that allows users to create, visualize, and solve mazes and labyrinths in 2D, 3D, with optional time-based shifting walls, and 5th-dimensional linkages. The system ensures all generated puzzles are solvable and provides multiple solving algorithms including traditional pathfinding methods and bio-inspired approaches like slime mold simulation.

### Key Definitions
- **Maze**: A puzzle with multiple pathways, dead ends, and choice points requiring decision-making to reach the goal
- **Labyrinth**: A single, winding pathway with no branches or dead ends - a single continuous path from start to finish

## Core Features

- **Puzzle Type Selection**: Choose between traditional mazes (multi-path with dead ends) or labyrinths (single winding path)
- **Multi-Dimensional Maze Generation**: Support for 2D and 3D spatial dimensions
- **Time Dimension**: Optional wall shifting with configurable frequency, stability islands, and shift extent
- **5th Dimension**: Simple linkages connecting opposite boundaries (top-bottom, left-right, front-back)
- **Configurable Parameters**: User-defined sizes (minimum 2 cells per dimension), shift patterns, and linkage counts
- **Multiple Solving Algorithms**: Random walk, left/right-hand rules, DFS, BFS, slime mold simulation, and additional pathfinding methods
- **Visualization**: Real-time maze rendering with solver path animation
- **Export/Import**: Save and load maze configurations
- **Solvability Guarantee**: All generated mazes have at least one valid solution path

## Configuration Options

### Puzzle Type
- **Maze**: Traditional maze with multiple paths, dead ends, and choice points
- **Labyrinth**: Single continuous pathway with no branches or dead ends

### Spatial Dimensions
- **2D Mode**: Width × Height grid
- **3D Mode**: Width × Height × Depth grid
- **Minimum Size**: 2 cells in each dimension
- **Maximum Size**: 50 cells per dimension (configurable)

### Time Dimension (Optional)
- **Shift Frequency**: How often walls shift (turns, time units, or user-triggered)
- **Stability Islands**: Percentage of maze that remains static during shifts
- **Shift Extent**: How much of the maze changes per shift (percentage or absolute count)
- **Shift Behavior**: Deterministic patterns based on initial seed to ensure repeatable solvability (not random)

### 5th Dimension (Optional)
- **Linkage Types**: 
  - Top ↔ Bottom
  - Left ↔ Right  
  - Front ↔ Back
- **Linkage Count**: Number of connections per type (1-10)
- **Linkage Behavior**: Instant teleportation between linked cells

## Solving Algorithms

### Traditional Methods
- **Random Walk**: A mathematical formalization of a path that consists of a succession of random steps. In maze solving, the algorithm moves to a randomly chosen adjacent cell at each step until the goal is reached. While simple and guaranteed to eventually find the solution, it may take many more steps than optimal paths. (See: https://en.wikipedia.org/wiki/Random_walk)
- **Left-Hand Rule**: Always follow left wall
- **Right-Hand Rule**: Always follow right wall
- **Depth-First Search (DFS)**: Explore deepest paths first
- **Breadth-First Search (BFS)**: Explore all neighbors before deepening

### Advanced Methods
- **A* Search**: Heuristic-based shortest path finding
- **Dijkstra's Algorithm**: Shortest path with uniform costs
- **Slime Mold Simulation**: Bio-inspired algorithm mimicking Physarum polycephalum behavior
  - Agents leave pheromone trails
  - Paths strengthen based on traffic
  - Emergent shortest path formation

### Additional Useful Algorithms
- **Greedy Best-First Search**: Heuristic-driven exploration
- **Bidirectional Search**: Search from start and goal simultaneously
- **Jump Point Search**: Optimized grid pathfinding for uniform costs

## User Interface

### Main Screen
**Objective**: Display the maze, controls, and solver visualization

**User Actions**:
- Generate new maze with current configuration
- Start/stop solver animation
- Adjust solver animation speed (steps per second)
- Toggle highlight of true solution path
- Switch between solving algorithms
- Adjust view (2D slice selection for 3D mazes)
- Export current maze configuration
- Import saved maze configuration
- **3D Controls** (when in 3D mode):
  - Rotate view (mouse drag or WASD keys)
  - Zoom in/out (mouse wheel or +/- keys)
  - Pan view (right-click drag or arrow keys)
  - Select active layer (layer slider or Page Up/Down)
  - Toggle layer transparency mode
  - Reset camera to default position

**Transitions**:
- Click "Configure" → Configuration Screen
- Click "Solve" → Solver Selection Screen
- Maze completion → Results Screen

**ASCII Layout**:
```
+-----------------------------------+
| Maze and Labyrinth Constructor    |
+-----------------------------------+
|                                   |
|  [Maze Canvas - 3D/2D View]       |
|                                   |
|  +-----------------------------+  |
|  | Current Position: (x,y,z)  |  |
|  | Goal: (x,y,z)              |  |
|  | Steps: 0                   |  |
|  +-----------------------------+  |
|                                   |
|  [3D Controls]                    |
|  Layer: [<<] 3/5 [>>]             |
|  Opacity: [Low] [Med] [High]      |
|  View: [Rotate] [Zoom] [Reset]    |
|                                   |
|  [Controls]                       |
|  Generate | Solve | Configure     |
|  Speed: [<<] [||] [>>]            |
|  [ ] Highlight Solution Path      |
|                                   |
+-----------------------------------+
```

### Configuration Screen
**Objective**: Set maze parameters and generation options

**User Actions**:
- Select puzzle type (Maze or Labyrinth)
- Select spatial dimensions (2D/3D)
- Set size for each dimension
- Enable/disable time dimension and set parameters
- Enable/disable 5th dimension and set linkage count
- Choose generation algorithm (recursive backtracking, Prim's, etc.)

**Transitions**:
- Click "Apply" → Return to Main Screen with new maze
- Click "Cancel" → Return to Main Screen

**ASCII Layout**:
```
+-----------------------------------+
| Maze Configuration                |
+-----------------------------------+
| Puzzle Type: [Maze] [Labyrinth]   |
|                                   |
| Dimensions: [2D] [3D]             |
|                                   |
| Size:                             |
| Width: [10]  Height: [10]         |
| Depth: [5]   (3D only)            |
|                                   |
| Time Dimension: [Enabled]         |
| Frequency: [5 turns]              |
| Stability: [20%]                  |
| Shift Extent: [30%]               |
|                                   |
| 5th Dimension: [Enabled]          |
| Linkages: [3]                     |
|                                   |
| [Apply] [Cancel]                  |
+-----------------------------------+
```

### Solver Selection Screen
**Objective**: Choose solving algorithm and parameters

**User Actions**:
- Select from available algorithms
- Set algorithm-specific parameters (speed, heuristics, etc.)
- Configure solver animation speed (steps per second)
- Start solver with selected algorithm

**Transitions**:
- Click "Start" → Return to Main Screen with solver running
- Click "Cancel" → Return to Main Screen

**ASCII Layout**:
```
+-----------------------------------+
| Solver Selection                  |
+-----------------------------------+
| Algorithm:                        |
| [Random Walk]                     |
| [Left-Hand Rule]                  |
| [Right-Hand Rule]                 |
| [Depth-First Search]              |
| [Breadth-First Search]            |
| [A* Search]                       |
| [Slime Mold Simulation]           |
|                                   |
| Parameters:                       |
| Speed: [Slow] [Normal] [Fast]     |
| Heuristic: [Manhattan] (A* only)  |
|                                   |
| [Start] [Cancel]                  |
+-----------------------------------+
```

### Results Screen
**Objective**: Display solver results and statistics

**User Actions**:
- View solution path
- Compare different algorithms
- Export results
- Return to main screen

**Transitions**:
- Click "Back" → Main Screen

**ASCII Layout**:
```
+-----------------------------------+
| Solver Results                    |
+-----------------------------------+
| Algorithm: A* Search              |
| Path Length: 47 steps             |
| Time Taken: 2.3 seconds           |
| Nodes Explored: 156               |
|                                   |
| Solution Path:                    |
| (0,0) → (1,0) → (1,1) → ...       |
|                                   |
| [Compare] [Export] [Back]         |
+-----------------------------------+
```

## Asset Manifest

### Visual Assets
- **Wall Textures**: Stone-colored materials (various shades of gray, brown, and tan stone textures)
- **Floor/Ceiling Textures**: Stone or earth-toned patterns for spatial reference
- **Player Avatar**: 3D model or 2D sprite representing current position
- **Goal Marker**: Distinct visual indicator for target location
- **Solver Trails**: Colored paths showing algorithm exploration
- **Time Shift Effects**: Animation particles for wall movements
- **5th Dimension Portals**: Glowing effects for linkages

### Audio Assets
- **Movement Sounds**: Footsteps, wall collisions
- **Solver Sounds**: Different tones for each algorithm
- **Completion Chime**: Success notification
- **Shift Warning**: Audio cue for time-based changes

### Data Assets
- **Maze Templates**: Pre-built configurations for testing
- **Algorithm Configurations**: Parameter sets for different solvers
- **Export Formats**: JSON, CSV for maze and solution data

## Technical Implementation Notes

### Technology Stack
- **Language**: TypeScript (strict mode, full type coverage)
- **UI Framework**: High-performance 3D-capable framework (Three.js with React or vanilla WebGL)
- **Build Tool**: Vite (for fast development and optimized production builds)
- **Testing**: Jest for unit tests, Cypress for end-to-end testing
- **3D Rendering**: WebGL-based real-time 3D rendering with hardware acceleration

### TypeScript Architecture
### TypeScript Architecture
- **Core Classes**:
  - `Maze`: Represents the multi-dimensional maze structure
  - `Solver`: Abstract base class for all solving algorithms
  - `Renderer`: Handles 2D/3D visualization using Three.js/WebGL
  - `Camera`: Manages 3D view transformations (rotation, zoom, pan)
  - `LayerManager`: Controls layer visibility and opacity levels
  - `TimeManager`: Controls wall shifting mechanics
  - `DimensionLinker`: Manages 5th dimensional connections

- **Key Interfaces**:
  - `IMazeCell`: Defines cell properties (walls, position, links)
  - `ISolver`: Algorithm interface with step() and solve() methods
  - `IRenderer`: Rendering abstraction for different viewports
  - `ICamera`: Camera control interface for view manipulation
  - `ILayerConfig`: Configuration for layer visibility and opacity

### Solvability Guarantee
- **Generation Algorithms**:
  - **Maze Generation**: Recursive backtracking, Prim's algorithm ensuring perfect mazes with multiple paths
  - **Labyrinth Generation**: Single-path algorithms creating continuous winding corridors without branches
  - Post-generation validation to confirm solution existence for both types

- **Time Dimension Handling**:
  - Pre-compute all possible maze states using deterministic shift patterns
  - Ensure solution path exists across all time shifts
  - Stability islands maintain critical path segments
  - Use seeded random number generation for repeatable configurations

### Performance Considerations
- **Real-time 3D Rendering**: 60fps target with hardware-accelerated WebGL
- **Spatial Optimization**: Use bitmasks for wall representations
- **Solver Efficiency**: Implement priority queues for A* and Dijkstra
- **Rendering**: WebGL/Three.js for 3D, Canvas2D for 2D views
  - Level-of-detail (LOD) rendering for large mazes
  - Frustum culling to avoid rendering off-screen geometry
  - Instanced rendering for repeated wall/floor elements
  - Texture atlasing for efficient GPU utilization
  - Separate render passes for opaque and transparent layers
- **Memory Management**: Stream maze generation for large dimensions
- **3D Interaction**: Raycasting for mouse picking and collision detection
- **Animation**: RequestAnimationFrame for smooth 60fps rendering
- **State Management**: Efficient layer visibility toggling without full re-render

### Additional Features
- **Maze Analysis**: Dead-end counting, branching factor calculation
- **Solver Comparison**: Side-by-side algorithm performance metrics
- **Custom Algorithms**: Plugin system for user-defined solvers
- **Animation Controls**: Adjustable solver speed and solution path highlighting
- **Deterministic Shifts**: Seeded time-based changes for repeatable solving
- **Accessibility**: Keyboard navigation, screen reader support
- **Mobile Support**: Touch controls for solver interaction

### 3D Visualization Features
- **Layer Selection**: Navigate through 3D maze levels (z-axis layers)
  - Active layer rendered fully opaque for clear viewing
  - Inactive layers rendered with transparency (10-30% opacity) for spatial context
  - Slider or buttons to switch between layers
  - Keyboard shortcuts (Page Up/Down) for quick layer navigation
  
- **Camera Controls**:
  - **Rotation**: Mouse drag or touch to rotate view around maze center
  - **Zoom**: Mouse wheel or pinch gesture to zoom in/out
  - **Pan**: Right-click drag or two-finger drag to translate view
  - **Reset View**: Button to return to default camera position
  
- **Viewing Modes**:
  - **Layer Mode**: View specific z-level with transparent context
  - **Full 3D Mode**: View entire maze with all layers semi-transparent
  - **Isometric Mode**: Fixed angle view for consistent spatial reference
  - **Free Camera Mode**: Full 6-DOF camera control
  
- **Visual Enhancements**:
  - Grid overlays to distinguish layers
  - Current layer highlight/border
  - Depth cues (fog, desaturation) for distant layers
  - Smooth transitions when switching layers
  - Player position indicator visible through transparent layers

## Quality Standards
- **TypeScript**: Strict mode, full type coverage
- **Testing**: Jest for unit tests (>90% coverage), Cypress for end-to-end testing
- **Performance**: Smooth 60fps real-time 3D rendering, sub-second solver steps
- **Documentation**: Comprehensive API docs and user guide

## Success Criteria
- All maze and labyrinth configurations generate solvable puzzles
- Mazes provide multiple pathways with dead ends requiring decision-making
- Labyrinths provide single continuous paths without choice points
- Each solver algorithm finds a valid path for both puzzle types
- Smooth performance across all dimension combinations
- Intuitive user interface with clear visual feedback
- Comprehensive test coverage (>90%)
- Export/import functionality preserves maze integrity
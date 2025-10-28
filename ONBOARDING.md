# Onboarding Guide

Welcome to the Maze and Labyrinth Constructor and Solver project! This guide will help you get up to speed with the codebase and development workflow.

## Project Overview

This is a sophisticated TypeScript application that creates and solves multi-dimensional mazes and labyrinths with real-time 3D rendering. The project combines algorithmic complexity with modern web technologies.

## Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher
- **Git**: For version control
- **VS Code**: Recommended editor with TypeScript support
- **Modern Browser**: Chrome/Edge/Firefox with WebGL support

### Initial Setup

1. **Clone and Install**:
   ```bash
   git clone https://github.com/MYOBmarknelson/maze-solver.git
   cd maze-solver
   npm install
   ```

2. **Verify Setup**:
   ```bash
   npm run type-check  # Should pass without errors
   npm test           # Should run successfully
   npm run dev        # Should start development server
   ```

## Architecture Deep Dive

### Core Concepts

#### Maze vs Labyrinth
- **Maze**: Multi-path puzzle with dead ends and choices
- **Labyrinth**: Single continuous path without branches

#### Dimensionality
- **2D**: Traditional grid-based mazes
- **3D**: Volumetric mazes with layer navigation
- **Time**: Dynamic wall shifting
- **5th Dimension**: Boundary teleportation

### Key Classes

#### Core Classes (`src/core/`)
- **`Maze`**: Central data structure representing the puzzle
- **`Solver`**: Abstract base class for all solving algorithms
- **`TimeManager`**: Handles wall shifting mechanics
- **`DimensionLinker`**: Manages 5th dimensional connections

#### Rendering (`src/renderers/`)
- **`Renderer`**: Main rendering coordinator
- **`Camera`**: 3D view controls and transformations
- **`LayerManager`**: Handles layer visibility and opacity

#### Solvers (`src/solvers/`)
- **`RandomWalkSolver`**: Simple random movement
- **`AStarSolver`**: Heuristic-based optimal pathfinding
- **`SlimeMoldSolver`**: Bio-inspired emergent behavior

### Data Flow

```
User Input → Configuration → Maze Generation → Solver Selection → Rendering → User Feedback
```

## Development Workflow

### Daily Development

1. **Pull Latest Changes**:
   ```bash
   git pull origin main
   ```

2. **Create Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Development Loop**:
   ```bash
   npm run dev        # Start development server
   # Make changes, test in browser
   npm run type-check # Ensure no type errors
   npm test          # Run unit tests
   ```

4. **Code Quality**:
   ```bash
   npm run lint      # Check code style
   npm run type-check # Full type checking
   ```

### Adding New Features

#### 1. New Solver Algorithm
```typescript
// src/solvers/NewSolver.ts
export class NewSolver implements ISolver {
  solve(maze: Maze): Solution {
    // Implementation
  }

  step(): boolean {
    // Single step execution
  }
}
```

#### 2. New Rendering Feature
```typescript
// src/renderers/NewRenderer.ts
export class NewRenderer {
  render(maze: Maze, camera: Camera): void {
    // WebGL rendering logic
  }
}
```

#### 3. UI Component
```typescript
// src/components/NewComponent.tsx
export const NewComponent: React.FC<Props> = ({ ... }) => {
  // Component logic
};
```

### Testing Strategy

#### Unit Tests (Jest)
- Test individual functions and classes
- Mock external dependencies
- Focus on algorithmic correctness

#### End-to-End Tests (Cypress)
- Test complete user workflows
- Verify rendering and interactions
- Ensure performance requirements

### Performance Considerations

#### Rendering Optimizations
- **Frustum Culling**: Don't render off-screen geometry
- **Level of Detail**: Simplify distant objects
- **Instanced Rendering**: Efficient repetition of similar objects
- **Texture Atlasing**: Minimize texture switches

#### Memory Management
- **Bitmasks**: Compact maze representation
- **Object Pooling**: Reuse solver instances
- **Streaming**: Generate large mazes incrementally

## Common Tasks

### Debugging 3D Rendering
1. Check browser WebGL support
2. Verify Three.js scene setup
3. Use browser dev tools for GPU profiling
4. Check for WebGL errors in console

### Adding New Assets
1. Place files in `public/assets/`
2. Update asset manifest in code
3. Test loading and rendering
4. Optimize file sizes

### Performance Profiling
```bash
# Use browser dev tools
# Check frame rate with FPS meter
# Profile memory usage
# Analyze WebGL calls
```

## Code Standards

### TypeScript
- Strict mode enabled
- Full type coverage required
- Use interfaces for complex objects
- Avoid `any` type

### Naming Conventions
- Classes: PascalCase
- Methods/Properties: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case

### Commit Messages
```
feat: add new solver algorithm
fix: resolve 3D rendering bug
docs: update API documentation
test: add unit tests for maze generation
```

## Troubleshooting

### Common Issues

#### Build Fails
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version`
- Verify package.json integrity

#### Tests Failing
- Run single test: `npm test -- --testNamePattern="test name"`
- Check test setup and mocks
- Verify dependencies

#### 3D Not Rendering
- Check WebGL support
- Verify Three.js import
- Check for console errors
- Test with simpler scene

### Getting Help

1. **Check Documentation**: README.md, this guide, code comments
2. **Run Tests**: Ensure local setup works
3. **Search Issues**: Check GitHub issues for similar problems
4. **Ask Questions**: Create detailed issue with reproduction steps

## Next Steps

1. Explore the codebase by running the app
2. Try modifying a simple solver algorithm
3. Add a small UI enhancement
4. Write tests for your changes
5. Submit a pull request

Welcome aboard! The maze awaits... 🧩
# Maze and Labyrinth Constructor and Solver

A sophisticated interactive TypeScript application for creating, visualizing, and solving multi-dimensional mazes and labyrinths with real-time 3D rendering capabilities.

## Features

- **Puzzle Types**: Choose between traditional mazes (multi-path with dead ends) or labyrinths (single winding path)
- **Multi-Dimensional Support**: 2D and 3D spatial dimensions
- **Time Dimension**: Optional wall shifting with configurable parameters
- **5th Dimension**: Boundary linkages for advanced puzzle complexity
- **Real-time 3D Rendering**: Hardware-accelerated WebGL rendering at 60fps
- **Multiple Solvers**: 10+ algorithms including A*, slime mold simulation, and bio-inspired methods
- **Interactive Controls**: Rotate, zoom, pan, and layer navigation for 3D mazes
- **Export/Import**: Save and load maze configurations

## Technology Stack

- **Language**: TypeScript (strict mode)
- **UI Framework**: High-performance 3D framework (Three.js/WebGL)
- **Build Tool**: Vite
- **Testing**: Jest (unit tests) + Cypress (end-to-end)
- **Rendering**: WebGL with hardware acceleration

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/MYOBmarknelson/maze-solver.git
cd maze-solver

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Configure Maze**: Choose puzzle type (Maze/Labyrinth), dimensions, and advanced options
2. **Generate**: Create your maze with the selected parameters
3. **Solve**: Select from multiple solving algorithms and watch real-time visualization
4. **Explore**: Use 3D controls to navigate and examine the maze structure

### 3D Controls

- **Rotate**: Left-click and drag
- **Zoom**: Mouse wheel
- **Pan**: Right-click and drag
- **Layer Navigation**: Use slider or keyboard shortcuts (Page Up/Down)
- **Reset View**: Click reset button

## Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests
npm test

# End-to-end tests
npm run test:e2e

# Build for production
npm run build
```

### Project Structure

```
src/
├── core/           # Core maze and solver classes
├── components/     # React components
├── renderers/      # 3D rendering logic
├── solvers/        # Solving algorithms
├── types/          # TypeScript definitions
├── utils/          # Utility functions
└── assets/         # Application assets

tests/              # Test files
docs/               # Documentation
public/             # Static assets
```

### Architecture

The application follows a modular architecture with clear separation of concerns:

- **Core Classes**: Maze representation, solver abstraction, time management
- **Rendering**: WebGL-based 3D visualization with Three.js
- **Algorithms**: Multiple pathfinding implementations
- **UI**: Component-based interface with real-time controls

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

```bash
# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## Performance

- **Target**: 60fps real-time 3D rendering
- **Optimization**: Level-of-detail rendering, frustum culling, instanced rendering
- **Memory**: Efficient bitmask representations for maze structures

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Maze generation algorithms inspired by classic computer science literature
- 3D rendering powered by Three.js
- Bio-inspired algorithms based on real-world phenomena
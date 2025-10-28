# GitHub Copilot Instructions

This document provides guidelines for AI-assisted development on the Maze and Labyrinth Constructor and Solver project.

## Project Context

**Type**: Interactive TypeScript web application
**Domain**: Algorithmic puzzle generation and solving
**Complexity**: Multi-dimensional mazes with real-time 3D rendering
**Tech Stack**: TypeScript, Three.js/WebGL, Vite, Jest, Cypress

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode, full type coverage, no `any` types
- **Naming**: PascalCase for classes, camelCase for methods/properties
- **Structure**: Modular architecture with clear separation of concerns
- **Documentation**: JSDoc comments for public APIs

### Architecture Patterns
- **Core Classes**: Maze, Solver, Renderer, Camera, LayerManager
- **Component Structure**: React-like components with TypeScript interfaces
- **Algorithm Implementation**: Abstract solver base class with concrete implementations
- **Rendering**: WebGL-based 3D visualization with performance optimizations

## Common Development Tasks

### Adding a New Solver Algorithm
1. Create class extending `ISolver` interface
2. Implement `solve()` and `step()` methods
3. Add to solver registry/factory
4. Write comprehensive unit tests
5. Update UI solver selection

### Implementing 3D Features
1. Use Three.js for rendering primitives
2. Implement camera controls (rotate, zoom, pan)
3. Add layer management for 3D mazes
4. Optimize for 60fps performance
5. Handle WebGL context loss gracefully

### UI Component Development
1. Define TypeScript interfaces for props/state
2. Implement component with proper event handling
3. Add accessibility features (ARIA labels, keyboard navigation)
4. Test across different screen sizes
5. Ensure responsive design

## Code Generation Prompts

### New Solver Implementation
```
Create a TypeScript class for [AlgorithmName] solver that implements ISolver interface.
Include proper type annotations, error handling, and performance optimizations.
The algorithm should work with multi-dimensional mazes and support step-by-step execution.
```

### 3D Rendering Component
```
Implement a Three.js-based renderer for maze visualization with:
- Layer transparency controls
- Camera orbit controls
- Performance optimizations (frustum culling, LOD)
- WebGL error handling
- TypeScript strict mode compliance
```

### UI Component
```
Create a React component for [ComponentName] with:
- TypeScript interfaces for props and state
- Event handlers for user interactions
- Accessibility features
- Responsive design
- Integration with maze state management
```

## Testing Requirements

### Unit Tests
- Test algorithmic correctness
- Mock external dependencies
- Cover edge cases and error conditions
- Maintain >90% code coverage

### Integration Tests
- Test component interactions
- Verify data flow between modules
- Test rendering pipeline
- Validate performance requirements

### End-to-End Tests
- Test complete user workflows
- Verify cross-browser compatibility
- Test 3D rendering functionality
- Validate export/import features

## Performance Considerations

### Rendering Optimizations
- Use instanced rendering for repeated geometry
- Implement level-of-detail (LOD) systems
- Apply frustum culling techniques
- Minimize draw calls and state changes

### Memory Management
- Use object pooling for solver instances
- Implement efficient data structures (bitmasks for mazes)
- Stream large maze generation
- Clean up WebGL resources properly

### Algorithm Efficiency
- Implement priority queues for A* and Dijkstra
- Use spatial data structures for neighbor finding
- Cache expensive computations
- Profile and optimize hot paths

## Error Handling

### WebGL Context Loss
- Detect context loss events
- Reinitialize rendering pipeline
- Preserve application state
- Provide user feedback

### Algorithm Failures
- Handle unsolvable mazes gracefully
- Provide fallback solvers
- Log errors for debugging
- Maintain UI responsiveness

### Network/Storage Issues
- Handle localStorage quota exceeded
- Provide offline functionality
- Validate file imports
- Show appropriate error messages

## Accessibility Guidelines

### Keyboard Navigation
- All interactive elements keyboard accessible
- Logical tab order
- Keyboard shortcuts for common actions
- Focus management for modal dialogs

### Screen Reader Support
- ARIA labels and descriptions
- Semantic HTML structure
- Live regions for dynamic content
- Alternative text for visual elements

### Visual Accessibility
- Sufficient color contrast
- Scalable text and UI elements
- Reduced motion preferences
- High contrast mode support

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Feature Detection
- WebGL 2.0 support
- ES2020 features
- Modern CSS Grid/Flexbox
- Web Workers for heavy computations

## Documentation Standards

### Code Comments
- JSDoc for public methods and classes
- Inline comments for complex logic
- TODO comments for future improvements
- Parameter and return type documentation

### API Documentation
- Comprehensive README
- Architecture decision records
- Performance benchmarks
- Troubleshooting guides

## Security Considerations

### Input Validation
- Validate maze configuration parameters
- Sanitize file imports
- Prevent code injection in dynamic content
- Validate algorithm parameters

### Performance Security
- Prevent infinite loops in algorithms
- Limit computational complexity
- Implement timeouts for long operations
- Monitor memory usage

## Deployment Checklist

### Pre-deployment
- [ ] TypeScript compilation passes
- [ ] All tests pass (unit + e2e)
- [ ] Linting passes
- [ ] Bundle size within limits
- [ ] Performance benchmarks met

### Production Build
- [ ] Optimized bundle generation
- [ ] Source maps for debugging
- [ ] Asset optimization (compression, caching)
- [ ] CDN configuration for assets

### Post-deployment
- [ ] Error monitoring setup
- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] Rollback plan prepared

## AI-Assisted Development Tips

### Effective Prompting
- Include specific technical requirements
- Reference existing code patterns
- Specify performance constraints
- Mention browser compatibility needs

### Code Review with AI
- Ask for security vulnerability checks
- Request performance optimization suggestions
- Verify accessibility compliance
- Check for TypeScript best practices

### Debugging Assistance
- Provide error messages and stack traces
- Include browser console output
- Describe expected vs actual behavior
- Mention environment details

This guide ensures consistent, high-quality AI-assisted development that aligns with the project's technical standards and architectural vision.
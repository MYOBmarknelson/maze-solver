import * as THREE from 'three';
import { Maze } from '@/core/Maze';
import { Position, IRenderer, ICamera, ILayerManager } from '@/types';

export class ThreeRenderer implements IRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container!: HTMLElement;
  private maze: Maze | null = null;

  // 3D objects
  private walls: THREE.Group = new THREE.Group();
  private floor: THREE.Group = new THREE.Group();
  private player: THREE.Mesh | null = null;
  private solutionPath: THREE.Group = new THREE.Group();
  private exploredPath: THREE.Group = new THREE.Group();

  // Camera controls
  private cameraController: ICamera;
  private layerManager: ILayerManager;

  // Materials
  private wallMaterial: THREE.MeshLambertMaterial;
  private floorMaterial: THREE.MeshLambertMaterial;
  private solutionMaterial: THREE.MeshBasicMaterial;
  private exploredMaterial: THREE.MeshBasicMaterial;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    // Initialize materials with stone-like colors
    this.wallMaterial = new THREE.MeshLambertMaterial({
      color: 0x8B7355, // Stone brown
      transparent: false
    });

    this.floorMaterial = new THREE.MeshLambertMaterial({
      color: 0x696969, // Dim gray
      transparent: false
    });

    this.solutionMaterial = new THREE.MeshBasicMaterial({
      color: 0x00FF00, // Green
      transparent: true,
      opacity: 0.7
    });

    this.exploredMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFF00, // Yellow
      transparent: true,
      opacity: 0.5
    });

    // Initialize camera controller and layer manager
    this.cameraController = new CameraController(this.camera);
    this.layerManager = new LayerManager(this.scene);

    // Set up lighting
    this.setupLighting();

    // Start render loop
    this.animate();
  }

  public initialize(container: HTMLElement): void {
    this.container = container;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x2c3e50); // Dark blue-gray background
    container.appendChild(this.renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Set initial camera position
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);
  }

  public render(maze: Maze, currentPath?: Position[], solutionPath?: Position[]): void {
    this.maze = maze;
    this.clearScene();
    this.buildMazeGeometry();
    this.updatePaths(currentPath, solutionPath);
  }

  public setLayerOpacity(layer: number, opacity: number): void {
    this.layerManager.setLayerOpacity(layer, opacity);
  }

  public setCameraPosition(position: Position): void {
    this.cameraController.setPosition(position);
  }

  public dispose(): void {
    this.renderer.dispose();
    window.removeEventListener('resize', () => this.onWindowResize());
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Point light for better illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.4);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);
  }

  private buildMazeGeometry(): void {
    if (!this.maze) return;

    const dimensions = this.maze.getDimensions();
    const cellSize = 1;
    const wallHeight = 1;
    const wallThickness = 0.1;

    // Clear existing geometry
    this.walls.clear();
    this.floor.clear();

    // Build walls and floor for each cell
    for (const cell of this.maze.getAllCells()) {
      const { x, z = 0 } = cell.position;
      const worldX = x * cellSize;
      const worldZ = z * cellSize;

      // Create floor
      const floorGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
      const floorMesh = new THREE.Mesh(floorGeometry, this.floorMaterial);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.set(worldX + cellSize / 2, 0, worldZ + cellSize / 2);
      this.floor.add(floorMesh);

      // Create walls
      if (cell.walls.north) {
        const wallGeometry = new THREE.BoxGeometry(cellSize, wallHeight, wallThickness);
        const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
        wallMesh.position.set(worldX + cellSize / 2, wallHeight / 2, worldZ);
        this.walls.add(wallMesh);
      }

      if (cell.walls.south) {
        const wallGeometry = new THREE.BoxGeometry(cellSize, wallHeight, wallThickness);
        const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
        wallMesh.position.set(worldX + cellSize / 2, wallHeight / 2, worldZ + cellSize);
        this.walls.add(wallMesh);
      }

      if (cell.walls.east) {
        const wallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, cellSize);
        const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
        wallMesh.position.set(worldX + cellSize, wallHeight / 2, worldZ + cellSize / 2);
        this.walls.add(wallMesh);
      }

      if (cell.walls.west) {
        const wallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, cellSize);
        const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
        wallMesh.position.set(worldX, wallHeight / 2, worldZ + cellSize / 2);
        this.walls.add(wallMesh);
      }

      // 3D walls
      if (dimensions.depth > 1) {
        if (cell.walls.up) {
          const wallGeometry = new THREE.BoxGeometry(cellSize, wallThickness, cellSize);
          const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
          wallMesh.position.set(worldX + cellSize / 2, wallHeight, worldZ + cellSize / 2);
          this.walls.add(wallMesh);
        }

        if (cell.walls.down && z > 0) {
          const wallGeometry = new THREE.BoxGeometry(cellSize, wallThickness, cellSize);
          const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
          wallMesh.position.set(worldX + cellSize / 2, 0, worldZ + cellSize / 2);
          this.walls.add(wallMesh);
        }
      }
    }

    // Add groups to scene
    this.scene.add(this.walls);
    this.scene.add(this.floor);
  }

  private updatePaths(currentPath?: Position[], solutionPath?: Position[]): void {
    // Clear existing paths
    this.exploredPath.clear();
    this.solutionPath.clear();

    if (currentPath && currentPath.length > 0) {
      this.drawPath(currentPath, this.exploredMaterial, this.exploredPath);
    }

    if (solutionPath && solutionPath.length > 0) {
      this.drawPath(solutionPath, this.solutionMaterial, this.solutionPath);
    }

    // Add paths to scene
    this.scene.add(this.exploredPath);
    this.scene.add(this.solutionPath);
  }

  private drawPath(path: Position[], material: THREE.Material, group: THREE.Group): void {
    const sphereGeometry = new THREE.SphereGeometry(0.1);

    for (const position of path) {
      const { x, z = 0 } = position;
      const worldX = x + 0.5;
      const worldY = 0.5;
      const worldZ = z + 0.5;

      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.position.set(worldX, worldY, worldZ);
      group.add(sphere);
    }
  }

  private clearScene(): void {
    // Remove existing geometry
    this.scene.remove(this.walls);
    this.scene.remove(this.floor);
    this.scene.remove(this.exploredPath);
    this.scene.remove(this.solutionPath);

    if (this.player) {
      this.scene.remove(this.player);
      this.player = null;
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }
}

class CameraController implements ICamera {
  private _camera: THREE.PerspectiveCamera;
  public position: Position = { x: 0, y: 0, z: 0 };
  public target: Position = { x: 0, y: 0, z: 0 };
  public zoom: number = 1;

  constructor(camera: THREE.PerspectiveCamera) {
    this._camera = camera;
    // Suppress unused variable warning - will be used in full implementation
    void this._camera;
  }

  rotate(_deltaX: number, _deltaY: number): void {
    // TODO: Implement camera rotation with OrbitControls or similar
    // For now, this is a placeholder
  }

  pan(_deltaX: number, _deltaY: number): void {
    // TODO: Implement camera pan
    // For now, this is a placeholder
  }

  zoomIn(): void {
    this.zoom *= 0.9;
    // TODO: Apply zoom to camera
  }

  zoomOut(): void {
    this.zoom *= 1.1;
    // TODO: Apply zoom to camera
  }

  reset(): void {
    this.position = { x: 10, y: 10, z: 10 };
    this.target = { x: 0, y: 0, z: 0 };
    this.zoom = 1;
    // TODO: Apply reset to camera
  }

  setPosition(position: Position): void {
    this.position = position;
    // TODO: Apply position to camera
  }
}

class LayerManager implements ILayerManager {
  private _scene: THREE.Scene;
  private layerObjects: Map<number, THREE.Object3D[]> = new Map();
  private activeLayer: number = 0;

  constructor(scene: THREE.Scene) {
    this._scene = scene;
    // Suppress unused variable warning - will be used in full implementation
    void this._scene;
  }

  setActiveLayer(layer: number): void {
    this.activeLayer = layer;
    this.updateLayerVisibility();
  }

  setLayerVisibility(layer: number, visible: boolean): void {
    const objects = this.layerObjects.get(layer);
    if (objects) {
      objects.forEach(obj => {
        obj.visible = visible;
      });
    }
  }

  setLayerOpacity(layer: number, opacity: number): void {
    const objects = this.layerObjects.get(layer);
    if (objects) {
      objects.forEach(obj => {
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.Material) {
          obj.material.transparent = opacity < 1;
          obj.material.opacity = opacity;
        }
      });
    }
  }

  getActiveLayer(): number {
    return this.activeLayer;
  }

  getLayerCount(): number {
    return this.layerObjects.size;
  }

  private updateLayerVisibility(): void {
    // TODO: Implement layer visibility logic
    // Show active layer opaque, others semi-transparent
    for (const layer of this.layerObjects.keys()) {
      const opacity = layer === this.activeLayer ? 1.0 : 0.3;
      this.setLayerOpacity(layer, opacity);
    }
  }
}
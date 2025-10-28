import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Maze } from "@/core/Maze";
import { Position, IRenderer, ICamera, ILayerManager } from "@/types";

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
  private links: THREE.Group = new THREE.Group();
  private entryExitMarkers: THREE.Group = new THREE.Group();

  // Camera controls
  private cameraController: ICamera;
  private controls: OrbitControls | null = null;
  private layerManager: ILayerManager;

  // Materials
  private wallMaterial: THREE.MeshLambertMaterial;
  private floorMaterial: THREE.MeshLambertMaterial;
  private entryMaterial: THREE.MeshLambertMaterial;
  private exitMaterial: THREE.MeshLambertMaterial;
  private solutionMaterial: THREE.MeshBasicMaterial;
  private exploredMaterial: THREE.MeshBasicMaterial;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    // Initialize materials with stone-like colors
    this.wallMaterial = new THREE.MeshLambertMaterial({
      color: 0x8b7355, // Stone brown
      transparent: false,
    });

    this.floorMaterial = new THREE.MeshLambertMaterial({
      color: 0x696969, // Dim gray
      transparent: false,
    });

    this.entryMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ff00, // Green for entry
      transparent: false,
    });

    this.exitMaterial = new THREE.MeshLambertMaterial({
      color: 0xff0000, // Red for exit
      transparent: false,
    });

    this.solutionMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00, // Green
      transparent: true,
      opacity: 0.7,
    });

    this.exploredMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00, // Yellow
      transparent: true,
      opacity: 0.5,
    });

    // Initialize camera controller and layer manager
    this.cameraController = new CameraController(this.camera, this.controls);
    this.layerManager = new LayerManager(this.scene);

    // Initialize OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 2; // Prevent going below ground

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
    window.addEventListener("resize", () => this.onWindowResize());

    // Set initial camera position
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);
  }

  public render(
    maze: Maze,
    currentPath?: Position[],
    solutionPath?: Position[]
  ): void {
    this.maze = maze;
    this.clearScene();
    this.buildMazeGeometry();
    this.buildLinkGeometry();
    this.updatePaths(currentPath, solutionPath);

    // Position camera to center on maze
    this.positionCameraForMaze();
  }

  public setLayerOpacity(layer: number, opacity: number): void {
    this.layerManager.setLayerOpacity(layer, opacity);
  }

  public setCameraPosition(position: Position): void {
    this.cameraController.setPosition(position);
  }

  public dispose(): void {
    this.renderer.dispose();
    window.removeEventListener("resize", () => this.onWindowResize());
  }

  private positionCameraForMaze(): void {
    if (!this.maze) return;

    const dimensions = this.maze.getDimensions();
    const cellSize = 1;

    // Calculate maze center in world coordinates
    const mazeCenterX = (dimensions.width * cellSize) / 2;
    const mazeCenterZ = (dimensions.height * cellSize) / 2;
    const mazeCenterY = 0; // Ground level

    // Calculate camera distance based on larger dimension for good visibility
    const maxDimension = Math.max(dimensions.width, dimensions.height);
    const cameraDistance = maxDimension * 1.5; // Scale factor for good view

    // Position camera above and to the side of maze center
    const cameraX = mazeCenterX + cameraDistance * 0.7;
    const cameraY = cameraDistance * 0.8;
    const cameraZ = mazeCenterZ + cameraDistance * 0.7;

    // Set camera position and target
    this.camera.position.set(cameraX, cameraY, cameraZ);
    this.camera.lookAt(mazeCenterX, mazeCenterY, mazeCenterZ);

    // Update controls target
    if (this.controls) {
      this.controls.target.set(mazeCenterX, mazeCenterY, mazeCenterZ);
      this.controls.update();
    }

    // Update camera controller
    this.cameraController.setPosition({
      x: cameraX,
      y: cameraY,
      z: cameraZ,
    });
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
    this.entryExitMarkers.clear();

    // Define entry and exit positions
    const entryPos: Position = { x: 0, y: 0, z: 0 };
    const exitPos: Position = {
      x: dimensions.width - 1,
      y: dimensions.height - 1,
      z: dimensions.depth > 1 ? dimensions.depth - 1 : 0,
    };

    // Build walls and floor for each cell
    for (const cell of this.maze.getAllCells()) {
      const { x, y, z = 0 } = cell.position;
      const worldX = x * cellSize;
      const worldZ = y * cellSize; // Use Y coordinate for Z axis (ground plane)

      // Check if this is entry or exit cell
      const isEntry =
        x === entryPos.x && y === entryPos.y && z === (entryPos.z || 0);
      const isExit =
        x === exitPos.x && y === exitPos.y && z === (exitPos.z || 0);

      // Create floor with special material for entry/exit
      let floorMat = this.floorMaterial;
      if (isEntry) floorMat = this.entryMaterial;
      if (isExit) floorMat = this.exitMaterial;

      const floorGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
      const floorMesh = new THREE.Mesh(floorGeometry, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.set(worldX + cellSize / 2, 0, worldZ + cellSize / 2);
      this.floor.add(floorMesh);

      // Create walls (skip walls for entry/exit doors)
      if (
        cell.walls.north &&
        !(isEntry && y === 0) &&
        !(isExit && y === dimensions.height - 1)
      ) {
        const wallGeometry = new THREE.BoxGeometry(
          cellSize,
          wallHeight,
          wallThickness
        );
        const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
        wallMesh.position.set(worldX + cellSize / 2, wallHeight / 2, worldZ);
        this.walls.add(wallMesh);
      }

      if (
        cell.walls.south &&
        !(isEntry && y === 0) &&
        !(isExit && y === dimensions.height - 1)
      ) {
        const wallGeometry = new THREE.BoxGeometry(
          cellSize,
          wallHeight,
          wallThickness
        );
        const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
        wallMesh.position.set(
          worldX + cellSize / 2,
          wallHeight / 2,
          worldZ + cellSize
        );
        this.walls.add(wallMesh);
      }

      if (
        cell.walls.east &&
        !(isEntry && x === 0) &&
        !(isExit && x === dimensions.width - 1)
      ) {
        const wallGeometry = new THREE.BoxGeometry(
          wallThickness,
          wallHeight,
          cellSize
        );
        const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
        wallMesh.position.set(
          worldX + cellSize,
          wallHeight / 2,
          worldZ + cellSize / 2
        );
        this.walls.add(wallMesh);
      }

      if (
        cell.walls.west &&
        !(isEntry && x === 0) &&
        !(isExit && x === dimensions.width - 1)
      ) {
        const wallGeometry = new THREE.BoxGeometry(
          wallThickness,
          wallHeight,
          cellSize
        );
        const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
        wallMesh.position.set(worldX, wallHeight / 2, worldZ + cellSize / 2);
        this.walls.add(wallMesh);
      }

      // 3D walls
      if (dimensions.depth > 1) {
        if (cell.walls.up) {
          const wallGeometry = new THREE.BoxGeometry(
            cellSize,
            wallThickness,
            cellSize
          );
          const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
          wallMesh.position.set(
            worldX + cellSize / 2,
            wallHeight,
            worldZ + cellSize / 2
          );
          this.walls.add(wallMesh);
        }

        if (cell.walls.down && z > 0) {
          const wallGeometry = new THREE.BoxGeometry(
            cellSize,
            wallThickness,
            cellSize
          );
          const wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterial);
          wallMesh.position.set(
            worldX + cellSize / 2,
            0,
            worldZ + cellSize / 2
          );
          this.walls.add(wallMesh);
        }
      }
    }

    // Add groups to scene
    this.scene.add(this.walls);
    this.scene.add(this.floor);
    this.scene.add(this.entryExitMarkers);

    // Create entry/exit markers
    this.createEntryExitMarkers(entryPos, exitPos);
  }

  private createEntryExitMarkers(entryPos: Position, exitPos: Position): void {
    const markerRadius = 0.3;
    const markerHeight = 0.1;

    // Entry marker (green sphere)
    const entryGeometry = new THREE.SphereGeometry(markerRadius, 16, 16);
    const entryMarker = new THREE.Mesh(entryGeometry, this.entryMaterial);
    entryMarker.position.set(entryPos.x + 0.5, markerHeight, entryPos.y + 0.5);
    this.entryExitMarkers.add(entryMarker);

    // Exit marker (red sphere)
    const exitGeometry = new THREE.SphereGeometry(markerRadius, 16, 16);
    const exitMarker = new THREE.Mesh(exitGeometry, this.exitMaterial);
    exitMarker.position.set(exitPos.x + 0.5, markerHeight, exitPos.y + 0.5);
    this.entryExitMarkers.add(exitMarker);

    // Add glowing effects
    const entryGlowGeometry = new THREE.SphereGeometry(
      markerRadius * 1.2,
      16,
      16
    );
    const entryGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
    });
    const entryGlow = new THREE.Mesh(entryGlowGeometry, entryGlowMaterial);
    entryGlow.position.copy(entryMarker.position);
    this.entryExitMarkers.add(entryGlow);

    const exitGlowGeometry = new THREE.SphereGeometry(
      markerRadius * 1.2,
      16,
      16
    );
    const exitGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3,
    });
    const exitGlow = new THREE.Mesh(exitGlowGeometry, exitGlowMaterial);
    exitGlow.position.copy(exitMarker.position);
    this.entryExitMarkers.add(exitGlow);
  }

  private buildLinkGeometry(): void {
    if (!this.maze) return;

    // Clear existing links
    this.links.clear();

    // Create material for links (glowing effect)
    const linkMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
    });

    // Get all links from the maze
    for (const cell of this.maze.getAllCells()) {
      for (const linkPos of cell.links) {
        // Create a cylinder to represent the link
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        const linkMesh = new THREE.Mesh(geometry, linkMaterial);

        // Position the link between the two cells
        const startX = cell.position.x + 0.5;
        const startY = 0.5;
        const startZ = cell.position.y + 0.5; // Use maze Y for world Z

        const endX = linkPos.x + 0.5;
        const endY = 0.5;
        const endZ = linkPos.y + 0.5; // Use maze Y for world Z

        // Position at midpoint
        linkMesh.position.set(
          (startX + endX) / 2,
          (startY + endY) / 2,
          (startZ + endZ) / 2
        );

        // Rotate to connect the points
        const direction = new THREE.Vector3(
          endX - startX,
          endY - startY,
          endZ - startZ
        );
        const length = direction.length();
        linkMesh.scale.y = length;
        linkMesh.lookAt(endX, endY, endZ);

        this.links.add(linkMesh);

        // Add glowing spheres at connection points
        const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.8,
        });

        const startSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        startSphere.position.set(startX, startY, startZ);
        this.links.add(startSphere);

        const endSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        endSphere.position.set(endX, endY, endZ);
        this.links.add(endSphere);
      }
    }

    // Add links to scene
    this.scene.add(this.links);
  }

  private updatePaths(
    currentPath?: Position[],
    solutionPath?: Position[]
  ): void {
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

  private drawPath(
    path: Position[],
    material: THREE.Material,
    group: THREE.Group
  ): void {
    const sphereGeometry = new THREE.SphereGeometry(0.1);

    for (const position of path) {
      const { x, y } = position;
      const worldX = x + 0.5;
      const worldY = 0.5;
      const worldZ = y + 0.5; // Use maze Y for world Z axis

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
    this.scene.remove(this.links);
    this.scene.remove(this.entryExitMarkers);

    if (this.player) {
      this.scene.remove(this.player);
      this.player = null;
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize(): void {
    this.camera.aspect =
      this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
  }
}

class CameraController implements ICamera {
  private _camera: THREE.PerspectiveCamera;
  private _controls: OrbitControls;
  public position: Position = { x: 0, y: 0, z: 0 };
  public target: Position = { x: 0, y: 0, z: 0 };
  public zoom: number = 1;

  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls | null) {
    this._camera = camera;
    this._controls = controls!;
    this.updatePosition();
  }

  private updatePosition(): void {
    if (!this._controls) return;

    this.position = {
      x: this._camera.position.x,
      y: this._camera.position.y,
      z: this._camera.position.z,
    };
    this.target = {
      x: this._controls.target.x,
      y: this._controls.target.y,
      z: this._controls.target.z,
    };
    this.zoom = this._camera.zoom;
  }

  rotate(_deltaX: number, _deltaY: number): void {
    // OrbitControls handles rotation through mouse/touch automatically
    // This method is kept for interface compatibility
    this.updatePosition();
  }

  pan(_deltaX: number, _deltaY: number): void {
    // OrbitControls handles panning through mouse/touch automatically
    // This method is kept for interface compatibility
    this.updatePosition();
  }

  zoomIn(): void {
    if (!this._controls) return;

    // Zoom in by moving camera closer
    const direction = new THREE.Vector3();
    direction
      .subVectors(this._camera.position, this._controls.target)
      .normalize();
    this._camera.position.addScaledVector(direction, -2);
    this._controls.update();
    this.updatePosition();
  }

  zoomOut(): void {
    if (!this._controls) return;

    // Zoom out by moving camera farther
    const direction = new THREE.Vector3();
    direction
      .subVectors(this._camera.position, this._controls.target)
      .normalize();
    this._camera.position.addScaledVector(direction, 2);
    this._controls.update();
    this.updatePosition();
  }

  reset(): void {
    // Reset to a position that works well for typical mazes
    this._camera.position.set(20, 15, 20);
    if (this._controls) {
      this._controls.target.set(0, 0, 0);
      this._controls.update();
    }
    this.zoom = 1;
    this._camera.zoom = 1;
    this._camera.updateProjectionMatrix();
    this.updatePosition();
  }

  setPosition(position: Position): void {
    this._camera.position.set(position.x, position.y || 10, position.z || 10);
    if (this._controls) {
      this._controls.update();
    }
    this.updatePosition();
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
      objects.forEach((obj) => {
        obj.visible = visible;
      });
    }
  }

  setLayerOpacity(layer: number, opacity: number): void {
    const objects = this.layerObjects.get(layer);
    if (objects) {
      objects.forEach((obj) => {
        if (
          obj instanceof THREE.Mesh &&
          obj.material instanceof THREE.Material
        ) {
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

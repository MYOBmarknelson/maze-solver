// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock Three.js for testing
jest.mock("three", () => ({
  Scene: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
  })),
  Camera: jest.fn(),
  WebGLRenderer: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    setSize: jest.fn(),
    domElement: document.createElement("canvas"),
  })),
  Vector3: jest.fn().mockImplementation((x, y, z) => ({ x, y, z })),
  Matrix4: jest.fn(),
  BoxGeometry: jest.fn(),
  MeshBasicMaterial: jest.fn(),
  Mesh: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Mock performance.now
global.performance.now = jest.fn(() => Date.now());

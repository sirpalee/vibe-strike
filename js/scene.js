import * as THREE from 'three';
import { groundMaterial, cubeMaterial } from './materials.js';

// Set up scene function
export function createScene() {
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create desert ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    scene.add(ground);

    // Add reference cubes
    createReferenceCubes(scene);

    return scene;
}

// Create reference cubes
function createReferenceCube(scene, x, z) {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(x, 0.5, z); // Position cube on ground with half height above
    scene.add(cube);
    return cube;
}

// Create a grid of reference cubes
function createReferenceCubes(scene) {
    const referenceCubes = [];
    for (let x = -20; x <= 20; x += 10) {
        for (let z = -20; z <= 20; z += 10) {
            if (x !== 0 || z !== 0) { // Skip center position where helicopter will be
                referenceCubes.push(createReferenceCube(scene, x, z));
            }
        }
    }
    return referenceCubes;
} 
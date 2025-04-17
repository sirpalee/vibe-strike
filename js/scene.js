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

    // Create desert ground plane - 1km x 1km (1000m x 1000m)
    const groundSize = 1000;  // 1km in meters
    const groundSegments = 100;  // More segments for better deformation
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, groundSegments, groundSegments);
    
    // Apply procedural deformation for sand dunes - make sure changes are visible
    const positions = groundGeometry.attributes.position;
    
    // More pronounced noise function for height with higher amplitude
    function noise(x, z) {
        // Create multi-octave noise for more natural looking dunes
        const scale1 = 0.005;  // Large scale dunes (increased scale for more variation)
        const scale2 = 0.02;   // Medium scale features
        const scale3 = 0.1;    // Small details
        
        // Use sine waves with higher amplitudes for more visible effect
        let y = 0;
        // Large dunes (increased to 15m height)
        y += 15.0 * Math.sin(x * scale1) * Math.cos(z * scale1 * 1.1);
        // Medium features (increased to 5m)
        y += 5.0 * Math.sin(x * scale2 * 1.3 + 0.5) * Math.cos(z * scale2 * 0.7 + 0.5);
        // Small details (increased to 1m)
        y += 1.0 * Math.sin(x * scale3 * 0.9 + 1.0) * Math.cos(z * scale3 * 1.1 + 1.0);
        
        return y;
    }
    
    // Apply height to vertices - ensure we're updating correctly
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        
        // Set the Y value directly with the noise function
        positions.setY(i, noise(x, z));
    }
    
    // Mark the position attribute as needing update
    positions.needsUpdate = true;
    
    // Need to update normals for proper lighting
    groundGeometry.computeVertexNormals();
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    scene.add(ground);

    // Add reference cubes with more spread to show the larger terrain
    createReferenceCubes(scene);

    // Add a large reference marker at origin (5m tall red pole)
    const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(0, 2.5, 0); // Center at origin, half height above ground
    scene.add(pole);

    return scene;
}

// Create reference cubes
function createReferenceCube(scene, x, z) {
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2); // Larger cubes (2m) for better visibility
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    
    // Position cube on ground with half height above
    cube.position.set(x, 1, z);
    scene.add(cube);
    return cube;
}

// Create a grid of reference cubes spread out further
function createReferenceCubes(scene) {
    const referenceCubes = [];
    // Place cubes every 100m up to 400m from center
    for (let x = -400; x <= 400; x += 100) {
        for (let z = -400; z <= 400; z += 100) {
            if (x !== 0 || z !== 0) { // Skip center position where helicopter will be
                referenceCubes.push(createReferenceCube(scene, x, z));
            }
        }
    }
    return referenceCubes;
} 
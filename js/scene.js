import * as THREE from 'three';
import { groundMaterial, cubeMaterial, sandMaterial } from './materials.js';

// More pronounced noise function for height with amplified features
// Moved to outer scope so it can be used by both createScene and createReferenceCube
function noise(x, z) {
    // Create multi-octave noise for more natural looking dunes
    const scale1 = 0.02;  // Adjusted for smaller terrain - large scale dunes
    const scale2 = 0.05;  // Adjusted for smaller terrain - medium scale features
    const scale3 = 0.2;   // Adjusted for smaller terrain - small details
    
    // Use sine waves with amplified values for more pronounced dunes
    let y = 0;
    // Large dunes
    y += 8.0 * Math.sin(x * scale1) * Math.cos(z * scale1 * 1.1);
    // Medium features
    y += 3.0 * Math.sin(x * scale2 * 1.3 + 0.5) * Math.cos(z * scale2 * 0.7 + 0.5);
    // Small details
    y += 1.0 * Math.sin(x * scale3 * 0.9 + 1.0) * Math.cos(z * scale3 * 1.1 + 1.0);
    
    // Add some additional randomization for more natural look
    y += Math.sin(x * 0.3 + z * 0.2) * 0.5;
    
    // Total height is now up to 12.5m
    return y;
}

// Set up scene function
export function createScene() {
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased ambient light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased directional light
    directionalLight.position.set(5, 10, 5); // Adjusted light position
    directionalLight.castShadow = true; // Enable shadows
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
    
    // Add a second directional light from the opposite direction for better deformation visibility
    const secondaryLight = new THREE.DirectionalLight(0xffffcc, 0.8);
    secondaryLight.position.set(-10, 8, -10);
    secondaryLight.castShadow = true;
    secondaryLight.shadow.mapSize.width = 1024;
    secondaryLight.shadow.mapSize.height = 1024;
    scene.add(secondaryLight);
    
    // Add a point light for extra highlights
    const pointLight = new THREE.PointLight(0xffffff, 0.6);
    pointLight.position.set(0, 30, 0);
    scene.add(pointLight);

    // Add a helper sphere to show the light position
    const lightSphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    const lightSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const lightSphere = new THREE.Mesh(lightSphereGeometry, lightSphereMaterial);
    lightSphere.position.copy(directionalLight.position);
    scene.add(lightSphere);

    // Add a debug ground plane first - completely flat for visibility testing
    const debugGroundGeometry = new THREE.PlaneGeometry(200, 200); // Match terrain size
    const debugGroundMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xA0522D, // Brown color
        side: THREE.DoubleSide, // Visible from both sides
        wireframe: true // Use wireframe to better see deformation above it
    });
    const debugGround = new THREE.Mesh(debugGroundGeometry, debugGroundMaterial);
    debugGround.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    debugGround.position.y = -0.1; // Slightly below the deformed terrain
    scene.add(debugGround);

    // Create desert ground plane - reduced to 200m x 200m for better visibility of deformation
    const groundSize = 200;  // Reduced to 200m
    const groundSegments = 500;  // Keeping high segment count for detail
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, groundSegments, groundSegments);
    
    // Apply procedural deformation for sand dunes - with doubled heights
    const positions = groundGeometry.attributes.position;
    
    // Apply height to vertices using the noise function in outer scope
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
    
    // Create color variations based on height for better visual cues
    const colors = new Float32Array(positions.count * 3);
    
    for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        // Normalize height to 0-1 range approximately
        const heightRatio = (y + 2) / 14; 
        
        // Create color gradient based on height
        if (heightRatio < 0.3) {
            // Lower areas - darker
            colors[i * 3] = 0.7; // R
            colors[i * 3 + 1] = 0.5; // G
            colors[i * 3 + 2] = 0.3; // B
        } else if (heightRatio < 0.7) {
            // Mid-level areas - medium
            colors[i * 3] = 0.9; // R
            colors[i * 3 + 1] = 0.75; // G
            colors[i * 3 + 2] = 0.5; // B
        } else {
            // Higher areas - lighter
            colors[i * 3] = 1.0; // R
            colors[i * 3 + 1] = 0.9; // G
            colors[i * 3 + 2] = 0.7; // B
        }
    }
    
    // Add color attribute to geometry
    groundGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create the terrain mesh with the prepared material
    const ground = new THREE.Mesh(groundGeometry, sandMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    ground.receiveShadow = true; // Enable shadow receiving
    scene.add(ground);

    // Add reference cubes with more spread to show the larger terrain
    createReferenceCubes(scene);

    // Add a large reference marker at origin (5m tall red pole)
    const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(0, 2.5, 0); // Center at origin, half height above ground
    scene.add(pole);

    // Add a grid helper for better spatial awareness
    const gridHelper = new THREE.GridHelper(200, 20, 0x000000, 0x000000);
    gridHelper.position.y = 0.1; // Slightly above ground level
    scene.add(gridHelper);

    return scene;
}

// Create reference cubes
function createReferenceCube(scene, x, z) {
    const cubeGeometry = new THREE.BoxGeometry(3, 6, 3); // Taller cubes (6m) for better visibility
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    
    // Get the height at this position by sampling our noise function from the outer scope
    const y = noise(x, z);
    
    // Position cube on ground with base at terrain height
    cube.position.set(x, y + 3, z); // Half height above terrain
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
    return cube;
}

// Create a grid of reference cubes spread out further
function createReferenceCubes(scene) {
    const referenceCubes = [];
    // Place cubes every 40m in the 200m terrain
    for (let x = -80; x <= 80; x += 40) {
        for (let z = -80; z <= 80; z += 40) {
            if (x !== 0 || z !== 0) { // Skip center position where helicopter will be
                referenceCubes.push(createReferenceCube(scene, x, z));
            }
        }
    }
    return referenceCubes;
} 
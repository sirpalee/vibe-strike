import * as THREE from 'three';
import { 
    cubeMaterial, 
    terrainMaterial, 
    lightSphereMaterial, 
    poleMaterial,
    wireframeMaterial
} from './materials.js';
import { sandDuneNoise } from './procedurals.js';

// Set up scene function
export function createScene() {
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
    
    const secondaryLight = new THREE.DirectionalLight(0xffffcc, 0.8);
    secondaryLight.position.set(-10, 8, -10);
    secondaryLight.castShadow = true;
    secondaryLight.shadow.mapSize.width = 1024;
    secondaryLight.shadow.mapSize.height = 1024;
    scene.add(secondaryLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 0.6);
    pointLight.position.set(0, 30, 0);
    scene.add(pointLight);

    // Add light position indicator
    const lightSphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    const lightSphere = new THREE.Mesh(lightSphereGeometry, lightSphereMaterial);
    lightSphere.position.copy(directionalLight.position);
    scene.add(lightSphere);

    // Create terrain - using the simplest possible approach
    const terrainSize = 2000; // Increased to 2km
    const terrainSegments = 500; // Increased to 500 segments
    const terrainGeometry = new THREE.PlaneGeometry(
        terrainSize, 
        terrainSize, 
        terrainSegments, 
        terrainSegments
    );
    
    // Apply height deformation
    const positionAttribute = terrainGeometry.getAttribute('position');
    const posArray = positionAttribute.array;
    
    // Fix the coordinate order for proper deformation
    for (let i = 0; i < posArray.length; i += 3) {
        // In THREE.js, vertices are stored as (x,y,z) triplets
        const x = posArray[i];        // x is at index i
        const y = posArray[i + 1];    // z is at index i+2
        
        // Apply the height function to the y-coordinate (height)
        posArray[i + 2] = sandDuneNoise(x, y);
    }
    
    // Mark position attribute as needing update
    positionAttribute.needsUpdate = true;
    terrainGeometry.computeVertexNormals();
    
    // Create solid terrain mesh
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);
    
    // Create wireframe overlay for the same geometry
    const wireframe = new THREE.Mesh(
        // Clone the geometry to avoid sharing material settings
        terrainGeometry.clone(),
        wireframeMaterial
    );
    wireframe.rotation.x = -Math.PI / 2;
    wireframe.position.y = 0.1; // Slightly above terrain to prevent z-fighting
    scene.add(wireframe);

    // Add reference cubes to show terrain height
    const referenceCubes = [];
    // Place cubes every 400m in the 2km terrain
    for (let x = -800; x <= 800; x += 400) {
        for (let z = -800; z <= 800; z += 400) {
            if (x !== 0 || z !== 0) { // Skip center position where helicopter will be
                const cubeSize = 30; // Size for visibility on larger terrain
                const cubeHeight = 6; // Original height (reduced back from 60)
                const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeHeight, cubeSize);
                const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
                
                // Get the height at this position
                const y = sandDuneNoise(x, z);
                
                // Position cube on terrain with bottom at terrain height
                cube.position.set(x, y + cubeHeight/2, z);
                cube.castShadow = true;
                cube.receiveShadow = true;
                scene.add(cube);
                
                referenceCubes.push(cube);
            }
        }
    }

    // Add a pole at the origin
    const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(0, 2.5, 0);
    pole.castShadow = true;
    scene.add(pole);

    return scene;
} 
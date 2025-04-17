import * as THREE from 'three';

// Load texture
const textureLoader = new THREE.TextureLoader();
const heliTexture = textureLoader.load('assets/scout_heli.png');

// Create simple diffuse material for helicopter
export const simpleDiffuse = new THREE.ShaderMaterial({
    uniforms: {
        diffuseMap: { value: heliTexture }
    },
    vertexShader: `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D diffuseMap;
        varying vec2 vUv;
        
        void main() {
            vec4 texColor = texture2D(diffuseMap, vec2(vUv.x, 1.0 - vUv.y));
            gl_FragColor = texColor;
        }
    `
});

// Create reference cube material
export const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0xFF0000,
    emissive: 0x440000, // Slight glow for better visibility
    roughness: 0.7,
    metalness: 0.3
});

// Debug ground material for flat reference surface
export const debugGroundMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x444444, // Dark gray for better contrast
    side: THREE.DoubleSide, // Visible from both sides
    wireframe: true // Show as wireframe
});

// Terrain material for the deformed ground - simple, solid material
export const terrainMaterial = new THREE.MeshLambertMaterial({
    color: 0xE6C88E, // Light sand color
    side: THREE.DoubleSide // Ensure both sides are visible
});

// Light sphere material to mark light positions
export const lightSphereMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffff00 // Yellow for visibility
});

// Red pole material for origin marker
export const poleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000 // Red
}); 
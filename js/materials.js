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

// Create ground material
export const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xD2B48C, // Desert/sand color
    roughness: 0.8,
    metalness: 0.1
});

// Create reference cube material
export const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0xFF0000,
    emissive: 0x440000, // Slight glow for better visibility
    roughness: 0.7,
    metalness: 0.3
});

// Create sand terrain material with enhanced visualization
export const sandMaterial = new THREE.MeshPhongMaterial({
    color: 0xDCB877, // Desert sand color
    specular: 0x222222, // Slight specular highlights
    shininess: 5, // Low shininess for natural look
    side: THREE.DoubleSide, // Make visible from both sides
    flatShading: true, // Use flat shading to enhance visibility of terrain shape
    vertexColors: true // Enable vertex coloring for height-based coloring
}); 
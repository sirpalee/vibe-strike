import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { simpleDiffuse } from './materials.js';
import { createScene } from './scene.js';
import { defaultSettings, getDefaultSettings } from './settings.js';
import { sandDuneNoise } from './procedurals.js';

// Create scene
const scene = createScene();

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000); // Increased far plane for 2km terrain
camera.position.set(0, 30, -20); // Restore original camera position
camera.lookAt(0, 10, 0); // Restore original look-at point

// Create renderer
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false // Ensure alpha is disabled
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadow mapping
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows
renderer.setClearColor(0x87CEEB, 1); // Set clear color to sky blue
renderer.outputEncoding = THREE.sRGBEncoding; // Use sRGB color space for better appearance
document.body.appendChild(renderer.domElement);

// Load GLTF model
const loader = new GLTFLoader();
let model;
const helicopterHeight = 10; // Height above ground
const INITIAL_POSITION = new THREE.Vector3(0, helicopterHeight, 0);

// Helicopter configuration - initialize with default settings
const config = getDefaultSettings();

// Rotation control variables
let currentRotation = 0;
let rotationVelocity = 0;

// Tilt control variables
let currentTilt = 0;

// Euler and Quaternion for handling rotations
const modelEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const modelQuaternion = new THREE.Quaternion();

// Movement direction vector
const movementDirection = new THREE.Vector3();
let currentVelocity = new THREE.Vector3();

// Time tracking
let lastTime = 0;

// Keyboard controls
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

window.addEventListener('keydown', (event) => {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = true;
    }
});

window.addEventListener('keyup', (event) => {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = false;
    }
});

// Reset helicopter function
function resetHelicopter() {
    if (model) {
        // Reset position
        model.position.copy(INITIAL_POSITION);

        // Reset rotation and tilt
        currentRotation = 0;
        currentTilt = 0;
        rotationVelocity = 0;

        // Reset velocity
        currentVelocity.set(0, 0, 0);

        // Reset controls display
        modelEuler.set(currentTilt, currentRotation, 0);
        modelQuaternion.setFromEuler(modelEuler);
        model.quaternion.copy(modelQuaternion);
    }
}

// Create UI
function createUI() {
    // Main UI container
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '10px';
    uiContainer.style.left = '10px';
    uiContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    uiContainer.style.padding = '10px';
    uiContainer.style.borderRadius = '5px';
    uiContainer.style.color = 'white';
    uiContainer.style.fontFamily = 'Arial, sans-serif';
    uiContainer.style.zIndex = '1000';
    uiContainer.style.minWidth = '250px';
    document.body.appendChild(uiContainer);

    // Create UI header with collapse toggle
    const headerContainer = document.createElement('div');
    headerContainer.style.display = 'flex';
    headerContainer.style.justifyContent = 'space-between';
    headerContainer.style.alignItems = 'center';
    headerContainer.style.marginBottom = '10px';
    headerContainer.style.cursor = 'pointer';

    const headerText = document.createElement('div');
    headerText.textContent = 'Helicopter Controls';
    headerText.style.fontWeight = 'bold';

    const toggleButton = document.createElement('span');
    toggleButton.textContent = '▼'; // Down arrow indicates collapsible
    toggleButton.style.fontSize = '12px';

    headerContainer.appendChild(headerText);
    headerContainer.appendChild(toggleButton);
    uiContainer.appendChild(headerContainer);

    // Create controls container that can be collapsed
    const controlsContainer = document.createElement('div');
    uiContainer.appendChild(controlsContainer);

    // Toggle control panel visibility when header is clicked
    let controlsVisible = true;
    headerContainer.addEventListener('click', () => {
        controlsVisible = !controlsVisible;
        controlsContainer.style.display = controlsVisible ? 'block' : 'none';
        toggleButton.textContent = controlsVisible ? '▼' : '▲';
    });

    // Full turn time (seconds)
    const turnTimeContainer = createControlGroup("Full Turn Time (seconds):", controlsContainer);
    const turnTimeSlider = createSlider(2, 20, config.fullTurnTimeSeconds, 0.1);
    const turnTimeInput = createNumberInput(2, 20, config.fullTurnTimeSeconds, 0.1);

    // Connect slider and input field
    turnTimeSlider.addEventListener('input', () => {
        const value = parseFloat(turnTimeSlider.value);
        updateTurnTimeValue(value);
        turnTimeInput.value = value.toFixed(1);
    });

    turnTimeInput.addEventListener('change', () => {
        const value = parseFloat(turnTimeInput.value);
        if (!isNaN(value) && value > 0) {
            updateTurnTimeValue(value);

            // Only update slider if value is within its range
            if (value >= 2 && value <= 20) {
                turnTimeSlider.value = value;
            }
        } else {
            turnTimeInput.value = config.fullTurnTimeSeconds.toFixed(1);
        }
    });

    function updateTurnTimeValue(value) {
        config.fullTurnTimeSeconds = value;
        config.ROTATION_SPEED = (Math.PI * 2) / config.fullTurnTimeSeconds;
    }

    turnTimeContainer.appendChild(turnTimeSlider);
    turnTimeContainer.appendChild(turnTimeInput);

    // Acceleration time
    const accelContainer = createControlGroup("Acceleration Time (seconds):", controlsContainer);
    const accelSlider = createSlider(0.1, 3, config.ACCELERATION_TIME, 0.1);
    const accelInput = createNumberInput(0.1, 3, config.ACCELERATION_TIME, 0.1);

    accelSlider.addEventListener('input', () => {
        const value = parseFloat(accelSlider.value);
        config.ACCELERATION_TIME = value;
        accelInput.value = value.toFixed(1);
    });

    accelInput.addEventListener('change', () => {
        const value = parseFloat(accelInput.value);
        if (!isNaN(value) && value > 0) {
            config.ACCELERATION_TIME = value;

            // Only update slider if value is within its range
            if (value >= 0.1 && value <= 3) {
                accelSlider.value = value;
            }
        } else {
            accelInput.value = config.ACCELERATION_TIME.toFixed(1);
        }
    });

    accelContainer.appendChild(accelSlider);
    accelContainer.appendChild(accelInput);

    // Deceleration time
    const decelContainer = createControlGroup("Deceleration Time (seconds):", controlsContainer);
    const decelSlider = createSlider(0.1, 3, config.DECELERATION_TIME, 0.1);
    const decelInput = createNumberInput(0.1, 3, config.DECELERATION_TIME, 0.1);

    decelSlider.addEventListener('input', () => {
        const value = parseFloat(decelSlider.value);
        config.DECELERATION_TIME = value;
        decelInput.value = value.toFixed(1);
    });

    decelInput.addEventListener('change', () => {
        const value = parseFloat(decelInput.value);
        if (!isNaN(value) && value > 0) {
            config.DECELERATION_TIME = value;

            // Only update slider if value is within its range
            if (value >= 0.1 && value <= 3) {
                decelSlider.value = value;
            }
        } else {
            decelInput.value = config.DECELERATION_TIME.toFixed(1);
        }
    });

    decelContainer.appendChild(decelSlider);
    decelContainer.appendChild(decelInput);

    // Max speed
    const speedContainer = createControlGroup("Max Speed (units/second):", controlsContainer);
    const speedSlider = createSlider(1, 20, config.MAX_SPEED, 1);
    const speedInput = createNumberInput(1, 20, config.MAX_SPEED, 1);

    speedSlider.addEventListener('input', () => {
        const value = parseFloat(speedSlider.value);
        config.MAX_SPEED = value;
        speedInput.value = value.toFixed(0);
    });

    speedInput.addEventListener('change', () => {
        const value = parseFloat(speedInput.value);
        if (!isNaN(value) && value > 0) {
            config.MAX_SPEED = value;

            // Only update slider if value is within its range
            if (value >= 1 && value <= 20) {
                speedSlider.value = value;
            }
        } else {
            speedInput.value = config.MAX_SPEED.toFixed(0);
        }
    });

    speedContainer.appendChild(speedSlider);
    speedContainer.appendChild(speedInput);

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'space-between';
    buttonsContainer.style.marginTop = '10px';
    controlsContainer.appendChild(buttonsContainer);

    // Default settings button
    const defaultButton = document.createElement('button');
    defaultButton.textContent = 'Set to Default';
    defaultButton.style.flex = '1';
    defaultButton.style.marginRight = '5px';
    defaultButton.style.padding = '8px';
    defaultButton.style.backgroundColor = '#2196F3';
    defaultButton.style.border = 'none';
    defaultButton.style.borderRadius = '3px';
    defaultButton.style.color = 'white';
    defaultButton.style.cursor = 'pointer';
    defaultButton.addEventListener('click', () => {
        // Reset settings to default
        const defaults = getDefaultSettings();
        Object.assign(config, defaults);

        // Update all UI elements
        turnTimeSlider.value = config.fullTurnTimeSeconds;
        turnTimeInput.value = config.fullTurnTimeSeconds.toFixed(1);

        accelSlider.value = config.ACCELERATION_TIME;
        accelInput.value = config.ACCELERATION_TIME.toFixed(1);

        decelSlider.value = config.DECELERATION_TIME;
        decelInput.value = config.DECELERATION_TIME.toFixed(1);

        speedSlider.value = config.MAX_SPEED;
        speedInput.value = config.MAX_SPEED.toFixed(0);
    });
    buttonsContainer.appendChild(defaultButton);

    // Reset helicopter button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Helicopter';
    resetButton.style.flex = '1';
    resetButton.style.marginLeft = '5px';
    resetButton.style.padding = '8px';
    resetButton.style.backgroundColor = '#f44336';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '3px';
    resetButton.style.color = 'white';
    resetButton.style.cursor = 'pointer';
    resetButton.addEventListener('click', resetHelicopter);
    buttonsContainer.appendChild(resetButton);

    // Helper function to create a control group
    function createControlGroup(label, parent) {
        const group = document.createElement('div');
        group.style.marginBottom = '10px';

        const labelElement = document.createElement('div');
        labelElement.textContent = label;
        labelElement.style.marginBottom = '5px';

        group.appendChild(labelElement);
        parent.appendChild(group);
        return group;
    }

    // Helper function to create a slider
    function createSlider(min, max, value, step) {
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        slider.style.width = '150px';
        slider.style.marginRight = '10px';
        slider.style.verticalAlign = 'middle';

        return slider;
    }

    // Helper function to create a number input field
    function createNumberInput(min, max, value, step) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = value.toFixed(step < 1 ? 1 : 0);
        input.style.width = '50px';
        input.style.padding = '2px';
        input.style.verticalAlign = 'middle';

        return input;
    }
}

loader.load(
    'assets/scout_heli.glb',
    function (gltf) {
        model = gltf.scene;

        // Apply simple diffuse material to all meshes in the model
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = simpleDiffuse;
            }
        });

        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Position the helicopter above the ground
        model.position.copy(INITIAL_POSITION);

        // Scale the model if needed
        // model.scale.set(0.5, 0.5, 0.5);
        model.castShadow = true; // Enable shadow casting for helicopter

        scene.add(model);

        // Update camera to look at the helicopter
        camera.lookAt(model.position);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error happened:', error);
    }
);

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Camera follow variables
const initialCameraOffset = new THREE.Vector3(0, 20, -20); // Restore original offset
const initialViewDirection = new THREE.Vector3(0, -10, 10).normalize(); // Restore original view direction

// Animation loop
function animate(time) {
    requestAnimationFrame(animate);

    // Calculate delta time in seconds
    const deltaTime = Math.min((time - lastTime) / 1000, 0.1); // Cap deltaTime to prevent jumps
    lastTime = time;

    // Handle rotation and tilt based on keyboard input with momentum
    if (model) {
        // Determine target velocity based on key presses for rotation
        let targetRotationVelocity = 0;
        if (keys.ArrowLeft) {
            targetRotationVelocity = config.ROTATION_SPEED;
        } else if (keys.ArrowRight) {
            targetRotationVelocity = -config.ROTATION_SPEED;
        }

        // Apply proper acceleration/deceleration for rotation
        if (targetRotationVelocity !== 0) {
            // Accelerating
            const accelerationRate = config.ROTATION_SPEED / config.ACCELERATION_TIME;
            if (Math.sign(targetRotationVelocity) === Math.sign(rotationVelocity)) {
                // Same direction, accelerate to target
                if (Math.abs(rotationVelocity) < Math.abs(targetRotationVelocity)) {
                    rotationVelocity += Math.sign(targetRotationVelocity) * accelerationRate * deltaTime;
                    // Clamp to target velocity
                    if (Math.abs(rotationVelocity) > Math.abs(targetRotationVelocity)) {
                        rotationVelocity = targetRotationVelocity;
                    }
                }
            } else {
                // Opposite direction or from zero, start accelerating in new direction
                rotationVelocity += Math.sign(targetRotationVelocity) * accelerationRate * deltaTime;
            }
        } else {
            // Decelerating to stop
            const decelerationRate = config.ROTATION_SPEED / config.DECELERATION_TIME;
            if (Math.abs(rotationVelocity) > 0) {
                const decelStep = Math.sign(rotationVelocity) * decelerationRate * deltaTime;
                rotationVelocity -= decelStep;

                // Check if we've decelerated past zero
                if (Math.sign(rotationVelocity) !== Math.sign(rotationVelocity + decelStep)) {
                    rotationVelocity = 0;
                }
            }
        }

        // Apply rotation to Y axis (heading)
        currentRotation += rotationVelocity * deltaTime;

        // Determine target tilt based on key presses
        let targetTiltValue = 0;
        if (keys.ArrowUp) {
            targetTiltValue = config.MAX_TILT; // Tilt nose down
        } else if (keys.ArrowDown) {
            targetTiltValue = -config.MAX_TILT; // Tilt nose up
        }

        // Calculate tilt speed (constant speed to reach max tilt in TILT_TIME)
        const tiltSpeed = config.MAX_TILT / config.TILT_TIME;

        // Move toward target at a constant speed
        if (Math.abs(targetTiltValue - currentTilt) > tiltSpeed * deltaTime) {
            // Not close enough to reach in this frame, move at constant speed
            if (targetTiltValue > currentTilt) {
                currentTilt += tiltSpeed * deltaTime;
            } else {
                currentTilt -= tiltSpeed * deltaTime;
            }
        } else {
            // Close enough to reach target in this frame
            currentTilt = targetTiltValue;
        }

        // Apply rotations in the correct order using Euler angles
        modelEuler.set(currentTilt, currentRotation, 0);
        modelQuaternion.setFromEuler(modelEuler);
        model.quaternion.copy(modelQuaternion);

        // Calculate movement based on tilt and direction
        // Calculate speed based on tilt (linear interpolation)
        let currentSpeed = 0;
        if (currentTilt !== 0) {
            // Map tilt to speed
            const tiltRatio = Math.abs(currentTilt) / config.MAX_TILT;
            currentSpeed = config.MAX_SPEED * tiltRatio;

            // Calculate direction based on helicopter's current rotation
            // For forward/backward movement, we need the negative/positive Z axis of the helicopter
            movementDirection.set(0, 0, currentTilt > 0 ? 1 : -1);

            // Apply the helicopter's rotation to the movement direction
            movementDirection.applyQuaternion(modelQuaternion);

            // Ensure movement is only on the X-Z plane (maintain Y height)
            movementDirection.y = 0;
            movementDirection.normalize();

            // Calculate velocity based on direction and speed
            currentVelocity.copy(movementDirection).multiplyScalar(currentSpeed);
        } else {
            // No tilt means no movement
            currentVelocity.set(0, 0, 0);
        }

        // Apply movement velocity
        model.position.add(currentVelocity.clone().multiplyScalar(deltaTime));

        // Ensure helicopter maintains its height above the terrain
        // Calculate terrain height at current position using sandDuneNoise
        const terrainHeight = sandDuneNoise(model.position.x, model.position.z);
        // Set helicopter height to be terrain height + constant offset
        model.position.y = terrainHeight + helicopterHeight;
        
        // Update camera position to follow helicopter but maintain fixed orientation
        // Simply add the initial offset to the helicopter position without rotation
        camera.position.copy(model.position).add(initialCameraOffset);
        
        // Make camera look at helicopter
        camera.lookAt(model.position);
    }

    renderer.render(scene, camera);
}

// Create UI when the page loads
createUI();

// Start animation loop
animate(0); 
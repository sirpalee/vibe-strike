// Default helicopter configuration parameters
export const defaultSettings = {
    // Rotation parameters
    ROTATION_SPEED: Math.PI / 4, // Calculated from fullTurnTimeSeconds
    ACCELERATION_TIME: 1.0, // Time to reach full speed in seconds
    DECELERATION_TIME: 0.5, // Time to slow down in seconds
    MAX_SPEED: 10, // Units per second at maximum tilt
    fullTurnTimeSeconds: 8, // For UI display purposes

    // Tilt parameters
    MAX_TILT: Math.PI / 8, // Maximum tilt angle (22.5 degrees)
    TILT_TIME: 2.0 // Time to reach maximum tilt in seconds
};

// Helper function to reset settings to default
export function getDefaultSettings() {
    // Return a fresh copy of the default settings
    return JSON.parse(JSON.stringify(defaultSettings));
} 
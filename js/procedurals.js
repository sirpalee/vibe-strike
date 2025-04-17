/**
 * Procedural generation functions for terrain and other elements
 */

/**
 * Generates sand dune height for a given x,z coordinate
 * Uses a combination of sine waves at different scales for natural looking terrain
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @returns {number} Height value at the given coordinates
 */
export function sandDuneNoise(x, z) {
    // Create multi-octave noise for more natural looking dunes
    const scale1 = 0.02;  // Large scale dunes
    const scale2 = 0.05;  // Medium scale features
    const scale3 = 0.2;   // Small details scale
    
    // Use sine waves with more reasonable amplitudes
    let y = 0;
    // Large dunes - moderate height
    y += 5.0 * Math.sin(x * scale1) * Math.cos(z * scale1 * 1.1);
    // Medium features
    y += 2.0 * Math.sin(x * scale2 * 1.3 + 0.5) * Math.cos(z * scale2 * 0.7 + 0.5);
    // Small details
    y += 0.5 * Math.sin(x * scale3 * 0.9 + 1.0) * Math.cos(z * scale3 * 1.1 + 1.0);
    
    // Limit the total height to about 8 meters maximum
    return y;
}

/**
 * Heights can be further modified or additional procedural functions can be added here
 */ 
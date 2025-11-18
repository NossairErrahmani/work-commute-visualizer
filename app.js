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
        // Time intervals in minutes
        const intervals = [15, 30, 45];
        const colors = ['#dc2626', '#ea580c', '#eab308']; // red, orange, yellow
        const opacities = [0.3, 0.3, 0.3];

        // Average speeds for different transport modes (km/h)
        const speedMap = {
            'foot-walking': 5,        // 5 km/h typical walking speed
            'cycling-regular': 15,    // 15 km/h typical cycling speed
            'driving-car': 40,        // 40 km/h average in urban areas
            'public-transit': 20      // 20 km/h including stops and transfers
        };

        const speed = speedMap[selectedMode] || 5;

        // Create circular isochrones based on straight-line distance
        // This is an approximation - real travel times vary with roads, terrain, etc.
        for (let i = intervals.length - 1; i >= 0; i--) {
            const timeMinutes = intervals[i];
            const radiusKm = (speed * timeMinutes) / 60;

            // Convert km to degrees (approximate, varies with latitude)
            // 1 degree latitude ≈ 111 km
            // 1 degree longitude ≈ 111 km * cos(latitude)
            const radiusLat = radiusKm / 111;
            const radiusLon = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

            // Create circle with 32 points for smooth appearance
            const points = [];
            for (let j = 0; j < 32; j++) {
                const angle = (j / 32) * 2 * Math.PI;
                const pointLat = lat + radiusLat * Math.sin(angle);
                const pointLon = lon + radiusLon * Math.cos(angle);
                points.push([pointLat, pointLon]);
            }

            const layer = L.polygon(points, {
                color: colors[i],
                weight: 2,
                opacity: 0.8,
                fillColor: colors[i],
                fillOpacity: opacities[i]
            }).bindPopup(`<strong>${timeMinutes} minutes</strong><br>by ${getModeLabel(selectedMode)}<br><em>(approximate)</em>`);

            layer.addTo(map);
            isochroneLayers.push(layer);
        }

        // Only auto-fit map bounds on initial load, not when changing modes
        if (autoFit && isochroneLayers.length > 0) {
            const group = L.featureGroup(isochroneLayers);
            map.fitBounds(group.getBounds().pad(0.1));
        }

        // Show reset view button after isochrones are loaded
        showResetViewButton();
    } catch (error) {
        console.error('Isochrone error:', error);
        showError(error.message || 'Error generating commute zones. Please try again.');
    } finally {
        showLoading(false);
    }
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

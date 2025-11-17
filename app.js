// Global variables
let map;
let currentMarker;
let isochroneLayers = [];
let selectedMode = 'foot-walking';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupEventListeners();
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

            // If there's a current location, regenerate isochrones
            if (currentMarker) {
                const latLng = currentMarker.getLatLng();
                generateIsochrones(latLng.lat, latLng.lng);
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
}

// Generate isochrones (commute time zones)
async function generateIsochrones(lat, lon) {
    // Check if API key is configured
    if (!window.ORS_API_KEY || window.ORS_API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please configure your OpenRouteService API key in config.js. See README for instructions.');
        return;
    }

    showLoading(true);
    hideError();

    // Clear existing isochrone layers
    isochroneLayers.forEach(layer => map.removeLayer(layer));
    isochroneLayers = [];

    try {
        // Request isochrones for 15, 30, and 45 minutes
        const intervals = [900, 1800, 2700]; // in seconds (15, 30, 45 minutes)
        const colors = ['#dc2626', '#ea580c', '#eab308']; // red, orange, yellow
        const opacities = [0.3, 0.3, 0.3];

        // Map public transit to cycling-regular profile (approximates transit speeds)
        const apiMode = selectedMode === 'public-transit' ? 'cycling-regular' : selectedMode;
        const url = 'https://api.openrouteservice.org/v2/isochrones/' + apiMode;

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

            // Fit map to show all isochrones
            const group = L.featureGroup(isochroneLayers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
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

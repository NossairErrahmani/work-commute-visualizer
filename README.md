# 🗺️ HR Commute Heatmap

An intuitive web application that helps HR professionals visualize commute times and find candidates who live within a reasonable commuting distance from your office location.

## ✨ Features

- **Interactive Map**: Click anywhere on the map or search for an address/company name
- **Visual Heatmap**: See areas within 15min (red), 30min (orange), and 45min (yellow) commute times
- **Multiple Transport Modes**: Choose between walking, cycling, driving, or public transit
- **Smart UX**: Guided onboarding with clear instructions and disabled controls until ready
- **Zoom-Friendly**: Heatmap respects your zoom level when switching modes
- **Reset View Button**: Quickly return to view all commute zones
- **Real-time Isochrone Generation**: Instantly visualize reachable areas based on actual travel times
- **Free & Scalable**: Built with free APIs and designed to minimize costs

## 🚀 Quick Start

### 1. Run the Application

Simply open `index.html` in your web browser. No build tools or server required!

```bash
# On Mac/Linux
open index.html

# On Windows
start index.html

# Or just double-click the index.html file
```

### 2. Use the Application

1. **Search for a location**: Enter your office address or company name in the search box, or click anywhere on the map
2. **Select transport mode**: Choose walking, cycling, driving, or public transit
3. **View the heatmap**: See the color-coded commute zones instantly
4. **Explore**: Zoom and pan the map - the heatmap stays in place
5. **Reset view**: Click the "Reset View" button to fit all zones back into view

## 🛠️ Technology Stack

### Why These Technologies?

- **Leaflet.js** - Free, open-source map library (no API key needed!)
- **OpenStreetMap** - Free map tiles (no API key needed!)
- **Nominatim** - Free geocoding service (no API key needed!)
- **Vanilla JavaScript** - No build tools, dependencies, or frameworks required

### Cost Analysis

For an MVP and even moderate production use:

| Service | Free Tier | Cost Beyond Free |
|---------|-----------|------------------|
| Map Display (OSM) | Unlimited | Always free |
| Geocoding (Nominatim) | Unlimited* | Always free |
| Isochrones | Client-side calculation | Always free |

*Nominatim has usage limits but no hard cap - be respectful with requests

**Bottom line**: 100% free! All calculations are done client-side in your browser.

## 📖 How It Works

1. **Geocoding**: When you enter an address, Nominatim (OpenStreetMap's geocoding service) converts it to coordinates

2. **Isochrone Calculation**: The app calculates approximate reachable areas based on straight-line distance and typical travel speeds:
   - **Walking**: 5 km/h typical walking speed
   - **Cycling**: 15 km/h typical cycling speed
   - **Driving**: 40 km/h average in urban areas
   - **Public Transit**: 20 km/h including stops and transfers

   Note: These are approximations based on circular zones. Real travel times may vary due to roads, terrain, and other factors.

3. **Visualization**: The results are displayed as colored circular polygons on the map using Leaflet

## 🎨 Features Explained

### Transport Modes

- **Walking** 🚶: 5 km/h average walking speed
- **Cycling** 🚴: 15 km/h typical cycling speed
- **Driving** 🚗: 40 km/h average in urban areas
- **Public Transit** 🚇: 20 km/h approximate speed including walking, waiting, and transfers

Note: These are straight-line distance estimates. Actual commute times may vary based on road networks, terrain, traffic, and transit availability.

### Time Zones

- **Red (0-15 min)**: Immediate proximity - ideal candidates
- **Orange (15-30 min)**: Reasonable commute - good candidates
- **Yellow (30-45 min)**: Extended commute - acceptable for some roles

## 🔒 Privacy & Security

- All calculations are performed client-side in your browser
- No user data is stored or transmitted to any server (except for geocoding with Nominatim)
- No API keys required
- Suitable for processing candidate addresses confidentially

## 🚀 Deployment Options

### Option 1: Local Use (Simplest)
Just open `index.html` - perfect for personal use or small teams

### Option 2: Static Hosting (Free)
Deploy to any static hosting service:
- **GitHub Pages**: Free hosting directly from your repo
- **Netlify**: Free tier with easy deployment
- **Vercel**: Free tier for static sites
- **AWS S3**: Extremely cheap static hosting

All of these are essentially free for this use case!

### GitHub Pages Deployment

```bash
# Enable GitHub Pages in your repo settings
# Point it to the main branch
# Your app will be live at: https://yourusername.github.io/work-commute-visualizer/
```

## ⚠️ Important Notes

### Nominatim Usage Policy

Please be respectful:
- Maximum 1 request per second
- Don't abuse the free service
- Consider setting up your own Nominatim instance for high-volume use

## 🤝 Contributing

Potential improvements:

- [x] Add public transit mode
- [x] Improved UX with guided onboarding
- [x] Zoom-respecting heatmap updates
- [x] Reset view functionality
- [ ] Cache previously searched locations
- [ ] Export heatmap as PDF/image
- [ ] Compare multiple locations side-by-side
- [ ] Add demographic data overlay
- [ ] Save favorite locations
- [ ] Custom time intervals
- [ ] Distance-based zones (in addition to time-based)

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Troubleshooting

### "Location not found"
- Try being more specific (add city, state, or country)
- Try a landmark or well-known company name
- Make sure you're online

### Map not loading
- Check your internet connection
- Make sure JavaScript is enabled
- Try a different browser
- Check browser console for errors (F12)

## 🎯 Use Cases

Perfect for:
- **Recruiters**: Find candidates within commute range
- **HR Teams**: Assess office location accessibility
- **Real Estate**: Evaluate property locations for employees
- **Relocation**: Help employees find housing near new offices
- **Remote/Hybrid**: Determine who can reasonably come to office

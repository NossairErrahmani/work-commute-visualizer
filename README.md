# 🗺️ HR Commute Heatmap

An intuitive web application that helps HR professionals visualize commute times and find candidates who live within a reasonable commuting distance from your office location.

## ✨ Features

- **Interactive Map**: Click anywhere on the map or search for an address/company name
- **Visual Heatmap**: See areas within 15min (red), 30min (orange), and 45min (yellow) commute times
- **Multiple Transport Modes**: Choose between walking, cycling, or driving
- **Real-time Isochrone Generation**: Instantly visualize reachable areas based on actual travel times
- **Free & Scalable**: Built with free APIs and designed to minimize costs

## 🚀 Quick Start

### 1. Get a Free API Key

This app uses OpenRouteService for calculating commute times. Their free tier includes **2,000 requests per day** - more than enough for typical HR use!

1. Visit [OpenRouteService Sign Up](https://openrouteservice.org/dev/#/signup)
2. Create a free account
3. Go to your dashboard and copy your API key
4. Paste it into `config.js`:

```javascript
window.ORS_API_KEY = 'your-actual-api-key-here';
```

### 2. Run the Application

Simply open `index.html` in your web browser. No build tools or server required!

```bash
# On Mac/Linux
open index.html

# On Windows
start index.html

# Or just double-click the index.html file
```

### 3. Use the Application

1. **Search for a location**: Enter your office address or company name in the search box
2. **Or click on the map**: Place a pin anywhere you'd like
3. **Select transport mode**: Choose walking, cycling, or driving
4. **View the heatmap**: See the color-coded commute zones instantly

## 🛠️ Technology Stack

### Why These Technologies?

- **Leaflet.js** - Free, open-source map library (no API key needed!)
- **OpenStreetMap** - Free map tiles (no API key needed!)
- **Nominatim** - Free geocoding service (no API key needed!)
- **OpenRouteService** - Free isochrone API (2,000 requests/day free tier)
- **Vanilla JavaScript** - No build tools, dependencies, or frameworks required

### Cost Analysis

For an MVP and even moderate production use:

| Service | Free Tier | Cost Beyond Free |
|---------|-----------|------------------|
| Map Display (OSM) | Unlimited | Always free |
| Geocoding (Nominatim) | Unlimited* | Always free |
| Isochrones (ORS) | 2,000/day | $0.0004 per request |

*Nominatim has usage limits but no hard cap - be respectful with requests

**Bottom line**: For typical HR usage (10-50 searches per day), this will cost you **$0/month**. Even at scale (500 searches/day), you're looking at ~$3.60/month.

## 📖 How It Works

1. **Geocoding**: When you enter an address, Nominatim (OpenStreetMap's geocoding service) converts it to coordinates
2. **Isochrone Calculation**: OpenRouteService calculates the actual reachable areas within specified time limits, considering:
   - Real road networks
   - Traffic patterns
   - Transport mode capabilities
   - Geographic obstacles
3. **Visualization**: The results are displayed as colored polygons on the map using Leaflet

## 🎨 Features Explained

### Transport Modes

- **Walking** 🚶: Average walking speed, considers pedestrian paths
- **Cycling** 🚴: Standard cycling speed, uses bike-friendly routes
- **Driving** 🚗: Car travel times, considers road networks

### Time Zones

- **Red (0-15 min)**: Immediate proximity - ideal candidates
- **Orange (15-30 min)**: Reasonable commute - good candidates
- **Yellow (30-45 min)**: Extended commute - acceptable for some roles

## 🔒 Privacy & Security

- All API calls are made client-side from the user's browser
- No user data is stored or transmitted to any server (except the mapping APIs)
- API key is stored locally in your browser
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

### API Rate Limits

OpenRouteService free tier: 2,000 requests/day

Each heatmap generation = 1 request

If you need more, consider:
- Caching results for frequently searched locations
- Upgrading to a paid plan (~$3-10/month for 10,000-50,000 requests)

### Nominatim Usage Policy

Please be respectful:
- Maximum 1 request per second
- Don't abuse the free service
- Consider setting up your own Nominatim instance for high-volume use

## 🤝 Contributing

This is an MVP! Potential improvements:

- [ ] Add public transit mode
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

### "Please configure your OpenRouteService API key"
- Make sure you've copied `config.example.js` to `config.js`
- Add your actual API key to `config.js`
- Refresh the page

### "Location not found"
- Try being more specific (add city, state, or country)
- Try a landmark or well-known company name
- Make sure you're online

### "API rate limit exceeded"
- You've used your 2,000 daily requests
- Wait 24 hours or upgrade your OpenRouteService plan

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

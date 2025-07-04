# 3D Solar System Simulation

An advanced, interactive 3D solar system simulation built with Three.js, featuring realistic planetary orbits, stunning visual effects, and comprehensive controls.

![Solar System Preview](preview.png)

## 🌟 Features

### Core Features
- **Realistic Solar System**: All 8 planets with accurate relative sizes, distances, and orbital speeds
- **Interactive 3D Environment**: Full camera controls with mouse/touch support
- **Individual Planet Controls**: Adjust orbital speed for each planet independently
- **Global Speed Control**: Master speed control for the entire simulation
- **Play/Pause Functionality**: Start and stop the animation at any time

### Visual Effects
- **Stunning Graphics**: High-quality 3D rendering with realistic lighting
- **Planet Trails**: Beautiful orbital trails showing planet paths
- **Starfield Background**: Thousands of procedurally generated stars
- **Planet Labels**: Informative labels with planet names
- **Special Effects**: 
  - Saturn's rings
  - Earth's atmosphere
  - Jupiter's glow effect
  - Sun's corona

### Advanced Features
- **Dark/Light Theme Toggle**: Switch between dark and light UI themes
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Performance Optimization**: Adaptive quality based on device performance
- **Planet Information**: Hover tooltips with detailed planet information
- **Camera Focus**: Click on planets to focus the camera
- **Orbit Visualization**: Toggle orbital paths on/off
- **Realistic Size Mode**: Switch between scaled and realistic planet sizes

## 🚀 Getting Started

### Prerequisites
- Modern web browser with WebGL support
- Local web server (for development)

### Installation

1. **Clone or download** this repository
2. **Start a local web server** in the project directory:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
3. **Open your browser** and navigate to `http://localhost:8000`

## 🎮 Controls

### Mouse Controls
- **Left Click + Drag**: Rotate the camera around the solar system
- **Right Click + Drag**: Pan the camera
- **Scroll Wheel**: Zoom in and out
- **Click on Planet**: Focus camera on the selected planet
- **Hover over Planet**: Show planet information tooltip

### Touch Controls (Mobile)
- **Single Touch + Drag**: Rotate the camera
- **Two Finger Pinch**: Zoom in/out
- **Two Finger Drag**: Pan the camera

### UI Controls
- **Play/Pause Button**: Start/stop the animation
- **Reset Button**: Reset all planets to random positions and default speeds
- **Global Speed Slider**: Control the overall simulation speed (0x to 5x)
- **Individual Planet Sliders**: Control each planet's orbital speed independently
- **View Options**: Toggle orbits, labels, stars, trails, and realistic sizes
- **Theme Toggle**: Switch between dark and light themes
- **Fullscreen Button**: Enter/exit fullscreen mode

## 🌍 Planet Information

| Planet  | Distance from Sun | Orbital Period | Special Features |
|---------|------------------|----------------|------------------|
| Mercury | 57.9 million km  | 88 days        | Smallest planet, closest to Sun |
| Venus   | 108.2 million km | 225 days       | Hottest planet, thick atmosphere |
| Earth   | 149.6 million km | 365 days       | Our home, only known planet with life |
| Mars    | 227.9 million km | 687 days       | Red planet, largest volcano in solar system |
| Jupiter | 778.5 million km | 12 years       | Largest planet, gas giant with 80+ moons |
| Saturn  | 1.43 billion km  | 29 years       | Famous ring system |
| Uranus  | 2.87 billion km  | 84 years       | Ice giant, rotates on its side |
| Neptune | 4.50 billion km  | 165 years      | Windiest planet, speeds up to 2,100 km/h |

## 🛠️ Technical Details

### Technologies Used
- **Three.js**: 3D graphics library
- **WebGL**: Hardware-accelerated 3D rendering
- **HTML5 Canvas**: Rendering surface
- **CSS3**: Modern styling with animations
- **Vanilla JavaScript**: No frameworks, pure JS implementation

### Performance Optimizations
- **Adaptive Quality**: Automatically adjusts rendering quality based on device performance
- **Efficient Geometry**: Optimized 3D models for smooth performance
- **Smart Culling**: Only renders visible objects
- **Mobile Optimizations**: Reduced complexity for mobile devices
- **Memory Management**: Proper cleanup and resource management

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers with WebGL support

## 📱 Mobile Support

The simulation is fully responsive and optimized for mobile devices:
- Touch-friendly controls
- Adaptive UI layout
- Performance optimizations for mobile hardware
- Reduced visual complexity on low-end devices

## 🎨 Customization

### Adding New Planets
To add new celestial bodies, modify the `planetData` array in `script.js`:

```javascript
{
    name: 'Pluto',
    radius: 0.2,
    distance: 180,
    speed: 0.4,
    rotationSpeed: 0.02,
    color: 0x8c7853,
    info: 'Former ninth planet, now classified as a dwarf planet.',
    realDistance: '5.9 billion km',
    realPeriod: '248 years'
}
```

### Modifying Visual Effects
- Edit materials in the `createPlanet()` method
- Adjust lighting in the `setupLighting()` method
- Modify particle effects in the `createStarField()` method

## 🐛 Troubleshooting

### Common Issues
1. **Black screen**: Check browser WebGL support
2. **Poor performance**: Try disabling trails and reducing quality
3. **Controls not working**: Ensure JavaScript is enabled
4. **Mobile issues**: Try landscape orientation for better experience

### Performance Tips
- Close other browser tabs
- Use hardware acceleration if available
- Reduce browser zoom level
- Disable trails on slower devices

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Three.js community for the amazing 3D library
- NASA for planetary data and inspiration
- Font Awesome for icons
- Google Fonts for typography

---

**Enjoy exploring the solar system!** 🚀🌌

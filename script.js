// 3D Solar System Simulation
class SolarSystemSimulation {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        
        // Animation state
        this.isPlaying = true;
        this.globalSpeed = 1.0;
        this.cameraSpeed = 1.0;
        
        // Solar system objects
        this.sun = null;
        this.planets = [];
        this.planetData = [];
        this.starField = null;
        this.orbitLines = [];
        this.planetTrails = [];
        
        // UI state
        this.showOrbits = true;
        this.showLabels = true;
        this.showStars = true;
        this.showTrails = true;
        this.realisticSizes = false;
        this.isDarkTheme = true;

        // Time-based speed calculations
        this.timeUnits = {
            'second': 1,
            'minute': 60,
            'hour': 3600,
            'day': 86400,
            'week': 604800,
            'month': 2629746, // Average month (30.44 days)
            'year': 31556952  // Average year (365.25 days)
        };

        // Validate time units on initialization
        this.validateTimeUnits();

        // Mouse interaction
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.hoveredPlanet = null;

        // Performance monitoring
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.currentFPS = 60;
        
        this.init();
    }

    init() {
        this.showLoadingScreen();
        this.updateLoadingProgress(10, 'Initializing 3D Scene...');

        this.setupScene();
        this.updateLoadingProgress(30, 'Creating Solar System...');

        this.createSolarSystem();
        this.updateLoadingProgress(70, 'Setting up Controls...');

        this.setupControls();
        this.updateLoadingProgress(85, 'Preparing Interface...');

        this.setupEventListeners();
        this.updateLoadingProgress(95, 'Starting Simulation...');

        this.animate();
        this.updateLoadingProgress(100, 'Ready!');

        setTimeout(() => this.hideLoadingScreen(), 500);
    }

    showLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('app').classList.add('hidden');
    }

    updateLoadingProgress(percentage, message) {
        const progressBar = document.querySelector('.loading-progress');
        const loadingText = document.querySelector('.loading-content h2');

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    hideLoadingScreen() {
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('app').classList.remove('hidden');
        }, 1000);
    }

    setupScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 50, 100);

        // Create renderer
        const canvas = document.getElementById('solar-system-canvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight - 80);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.5;

        // Performance optimizations
        this.renderer.powerPreference = "high-performance";
        this.renderer.antialias = window.devicePixelRatio === 1;

        // Setup lighting
        this.setupLighting();

        // Create starfield
        this.createStarField();
    }

    setupLighting() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
        this.scene.add(ambientLight);

        // Sun light (point light at center)
        const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.1;
        sunLight.shadow.camera.far = 1000;
        this.scene.add(sunLight);

        // Additional directional light for better planet visibility
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight.position.set(50, 50, 50);
        this.scene.add(directionalLight);
    }

    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 10000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            // Random position in sphere
            const radius = 2000 + Math.random() * 3000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);

            // Random star color (white to blue-white)
            const intensity = 0.5 + Math.random() * 0.5;
            colors[i] = intensity;
            colors[i + 1] = intensity;
            colors[i + 2] = intensity + Math.random() * 0.3;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.starField = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.starField);
    }

    createPlanetTrails() {
        this.planetTrails = [];

        this.planetData.forEach((data, index) => {
            const trailGeometry = new THREE.BufferGeometry();
            const trailMaterial = new THREE.LineBasicMaterial({
                color: data.color,
                transparent: true,
                opacity: 0.3,
                linewidth: 2
            });

            const maxTrailLength = 100;
            const positions = new Float32Array(maxTrailLength * 3);
            trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const trail = new THREE.Line(trailGeometry, trailMaterial);
            trail.userData = {
                planetIndex: index,
                positions: [],
                maxLength: maxTrailLength
            };

            this.planetTrails.push(trail);
            this.scene.add(trail);
        });
    }

    createSolarSystem() {
        // Planet data with realistic properties
        this.planetData = [
            {
                name: 'Mercury',
                radius: 0.38,
                distance: 15,
                speed: 4.74,
                rotationSpeed: 0.01,
                color: 0x8c7853,
                info: 'The smallest planet and closest to the Sun.',
                realDistance: '57.9 million km',
                realPeriod: '88 days',
                orbitalPeriodDays: 88
            },
            {
                name: 'Venus',
                radius: 0.95,
                distance: 22,
                speed: 3.50,
                rotationSpeed: -0.004,
                color: 0xffc649,
                info: 'The hottest planet with a thick, toxic atmosphere.',
                realDistance: '108.2 million km',
                realPeriod: '225 days',
                orbitalPeriodDays: 225
            },
            {
                name: 'Earth',
                radius: 1.0,
                distance: 30,
                speed: 2.98,
                rotationSpeed: 0.02,
                color: 0x6b93d6,
                info: 'Our home planet, the only known planet with life.',
                realDistance: '149.6 million km',
                realPeriod: '365 days',
                orbitalPeriodDays: 365
            },
            {
                name: 'Mars',
                radius: 0.53,
                distance: 45,
                speed: 2.41,
                rotationSpeed: 0.018,
                color: 0xcd5c5c,
                info: 'The Red Planet, with the largest volcano in the solar system.',
                realDistance: '227.9 million km',
                realPeriod: '687 days',
                orbitalPeriodDays: 687
            },
            {
                name: 'Jupiter',
                radius: 2.5,
                distance: 70,
                speed: 1.31,
                rotationSpeed: 0.04,
                color: 0xd8ca9d,
                info: 'The largest planet, a gas giant with over 80 moons.',
                realDistance: '778.5 million km',
                realPeriod: '12 years',
                orbitalPeriodDays: 4333
            },
            {
                name: 'Saturn',
                radius: 2.1,
                distance: 95,
                speed: 0.97,
                rotationSpeed: 0.038,
                color: 0xfad5a5,
                info: 'Famous for its prominent ring system.',
                realDistance: '1.43 billion km',
                realPeriod: '29 years',
                orbitalPeriodDays: 10759
            },
            {
                name: 'Uranus',
                radius: 1.6,
                distance: 120,
                speed: 0.68,
                rotationSpeed: 0.03,
                color: 0x4fd0e7,
                info: 'An ice giant that rotates on its side.',
                realDistance: '2.87 billion km',
                realPeriod: '84 years',
                orbitalPeriodDays: 30687
            },
            {
                name: 'Neptune',
                radius: 1.5,
                distance: 150,
                speed: 0.54,
                rotationSpeed: 0.032,
                color: 0x4b70dd,
                info: 'The windiest planet with speeds up to 2,100 km/h.',
                realDistance: '4.50 billion km',
                realPeriod: '165 years',
                orbitalPeriodDays: 60190
            }
        ];

        // Create the Sun
        this.createSun();

        // Create planets
        for (let i = 0; i < this.planetData.length; i++) {
            this.createPlanet(this.planetData[i], i);
        }

        // Create orbit lines
        this.createOrbitLines();

        // Create planet trails
        this.createPlanetTrails();
    }

    createSun() {
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);

        // Create simple, beautiful sun material
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.4
        });

        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.name = 'Sun';
        this.scene.add(this.sun);

        // Add simple sun glow effect
        const glowGeometry = new THREE.SphereGeometry(7, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sun.add(sunGlow);
    }









    createPlanet(data, index) {
        const planetGeometry = new THREE.SphereGeometry(data.radius, 64, 64);

        // Create realistic planet material based on planet type
        const planetMaterial = this.createPlanetMaterial(data);

        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.position.x = data.distance;
        planet.castShadow = true;
        planet.receiveShadow = true;
        planet.name = data.name;
        planet.userData = {
            ...data,
            angle: Math.random() * Math.PI * 2,
            originalSpeed: data.speed,
            currentSpeed: data.speed,
            index: index,
            material: planetMaterial
        };

        this.planets.push(planet);
        this.scene.add(planet);

        // Add planet label
        this.createPlanetLabel(planet, data.name);

        // Add special effects for certain planets
        if (data.name === 'Saturn') {
            this.createSaturnRings(planet);
        } else if (data.name === 'Earth') {
            this.createEarthAtmosphere(planet);
            this.createEarthClouds(planet);
        } else if (data.name === 'Jupiter') {
            this.createJupiterEffect(planet);
            this.createJupiterStorm(planet);
        } else if (data.name === 'Mars') {
            this.createMarsDustStorm(planet);
        } else if (data.name === 'Venus') {
            this.createVenusAtmosphere(planet);
        }
    }

    createPlanetMaterial(data) {
        switch (data.name) {
            case 'Mercury':
                return new THREE.MeshPhongMaterial({
                    color: 0xa0a0a0,
                    shininess: 8,
                    specular: 0x333333,
                    emissive: 0x1a1a1a,
                    emissiveIntensity: 0.02
                });

            case 'Venus':
                return new THREE.MeshPhongMaterial({
                    color: 0xffc649,
                    shininess: 120,
                    specular: 0x666666,
                    emissive: 0x332200,
                    emissiveIntensity: 0.15
                });

            case 'Earth':
                return new THREE.MeshPhongMaterial({
                    color: 0x6b93d6,
                    shininess: 100,
                    specular: 0x444444,
                    emissive: 0x001122,
                    emissiveIntensity: 0.03
                });

            case 'Mars':
                return new THREE.MeshPhongMaterial({
                    color: 0xcd5c5c,
                    shininess: 15,
                    specular: 0x222222,
                    emissive: 0x220000,
                    emissiveIntensity: 0.05
                });

            case 'Jupiter':
                return new THREE.MeshPhongMaterial({
                    color: 0xd8ca9d,
                    shininess: 40,
                    specular: 0x444444,
                    emissive: 0x332211,
                    emissiveIntensity: 0.08
                });

            case 'Saturn':
                return new THREE.MeshPhongMaterial({
                    color: 0xfad5a5,
                    shininess: 50,
                    specular: 0x555555,
                    emissive: 0x221100,
                    emissiveIntensity: 0.06
                });

            case 'Uranus':
                return new THREE.MeshPhongMaterial({
                    color: 0x4fd0e7,
                    shininess: 100,
                    specular: 0x666666,
                    emissive: 0x002244,
                    emissiveIntensity: 0.12
                });

            case 'Neptune':
                return new THREE.MeshPhongMaterial({
                    color: 0x4b70dd,
                    shininess: 110,
                    specular: 0x777777,
                    emissive: 0x001155,
                    emissiveIntensity: 0.15
                });

            default:
                return new THREE.MeshPhongMaterial({
                    color: data.color,
                    shininess: 30,
                    specular: 0x222222
                });
        }
    }

    createPlanetLabel(planet, name) {
        // Create text sprite for planet label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        // Create gradient background
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Add border
        context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        context.lineWidth = 2;
        context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

        context.fillStyle = '#ffffff';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(name, canvas.width / 2, canvas.height / 2 + 8);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(8, 2, 1);
        sprite.position.y = planet.userData.radius + 3;
        sprite.name = `${name}_label`;

        planet.add(sprite);
    }

    createSaturnRings(saturn) {
        // Create beautiful ring system
        const ringSegments = [
            { inner: 2.5, outer: 3.0, opacity: 0.9, color: 0xfad5a5 },
            { inner: 3.1, outer: 3.4, opacity: 0.7, color: 0xe6c28a },
            { inner: 3.5, outer: 3.8, opacity: 0.5, color: 0xd4b896 },
            { inner: 3.9, outer: 4.2, opacity: 0.8, color: 0xc9a876 }
        ];

        ringSegments.forEach((segment, index) => {
            const ringGeometry = new THREE.RingGeometry(segment.inner, segment.outer, 64);
            const ringMaterial = new THREE.MeshLambertMaterial({
                color: segment.color,
                transparent: true,
                opacity: segment.opacity,
                side: THREE.DoubleSide
            });

            const rings = new THREE.Mesh(ringGeometry, ringMaterial);
            rings.rotation.x = Math.PI / 2;
            rings.name = `SaturnRing_${index}`;
            saturn.add(rings);
        });
    }

    createEarthAtmosphere(earth) {
        const atmosphereGeometry = new THREE.SphereGeometry(earth.userData.radius * 1.08, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.25,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        atmosphere.name = 'EarthAtmosphere';
        earth.add(atmosphere);
    }

    createEarthClouds(earth) {
        const cloudGeometry = new THREE.SphereGeometry(earth.userData.radius * 1.03, 32, 32);
        const cloudMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            side: THREE.FrontSide
        });
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        clouds.name = 'EarthClouds';
        earth.add(clouds);
    }

    createJupiterEffect(jupiter) {
        // Add a subtle glow effect to Jupiter
        const glowGeometry = new THREE.SphereGeometry(jupiter.userData.radius * 1.05, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xd8ca9d,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        jupiter.add(glow);
    }

    createJupiterStorm(jupiter) {
        // Create the Great Red Spot
        const stormGeometry = new THREE.SphereGeometry(jupiter.userData.radius * 0.4, 16, 16);
        const stormMaterial = new THREE.MeshBasicMaterial({
            color: 0xcc3333,
            transparent: true,
            opacity: 0.8,
            emissive: 0x220000,
            emissiveIntensity: 0.1
        });
        const storm = new THREE.Mesh(stormGeometry, stormMaterial);
        storm.position.set(jupiter.userData.radius * 0.9, 0, 0);
        storm.name = 'JupiterStorm';
        jupiter.add(storm);
    }

    createMarsDustStorm(mars) {
        // Create atmospheric dust effect
        const dustGeometry = new THREE.SphereGeometry(mars.userData.radius * 1.05, 32, 32);
        const dustMaterial = new THREE.MeshBasicMaterial({
            color: 0xcc6633,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const dustAtmosphere = new THREE.Mesh(dustGeometry, dustMaterial);
        dustAtmosphere.name = 'MarsDust';
        mars.add(dustAtmosphere);
    }

    createVenusAtmosphere(venus) {
        // Create thick, toxic atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(venus.userData.radius * 1.12, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        atmosphere.name = 'VenusAtmosphere';
        venus.add(atmosphere);
    }

    createOrbitLines() {
        this.orbitLines = [];
        
        this.planetData.forEach(data => {
            const points = [];
            const segments = 128;
            
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    Math.cos(angle) * data.distance,
                    0,
                    Math.sin(angle) * data.distance
                ));
            }
            
            const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const orbitMaterial = new THREE.LineBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.3
            });
            
            const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
            orbitLine.name = `${data.name}_orbit`;
            this.orbitLines.push(orbitLine);
            this.scene.add(orbitLine);
        });
    }

    setupControls() {
        // Setup orbit controls with error checking
        try {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 10;
            this.controls.maxDistance = 500;
            this.controls.enablePan = true;
            this.controls.enableZoom = true;
            this.controls.enableRotate = true;

            console.log('OrbitControls initialized successfully');
        } catch (error) {
            console.error('Failed to initialize OrbitControls:', error);
            // Create a minimal fallback
            this.controls = {
                enableDamping: true,
                dampingFactor: 0.05,
                minDistance: 10,
                maxDistance: 500,
                enablePan: true,
                enableZoom: true,
                enableRotate: true,
                rotateSpeed: 1.0,
                zoomSpeed: 1.0,
                panSpeed: 1.0,
                update: function() {},
                dispose: function() {}
            };
        }

        // Set initial camera speed
        this.controls.rotateSpeed = this.cameraSpeed;
        this.controls.zoomSpeed = this.cameraSpeed;
        this.controls.panSpeed = this.cameraSpeed;

        // Mobile optimizations
        if (this.isMobile()) {
            this.controls.rotateSpeed = 0.5 * this.cameraSpeed;
            this.controls.zoomSpeed = 0.8 * this.cameraSpeed;
            this.controls.panSpeed = 0.8 * this.cameraSpeed;
            this.controls.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };
        }
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth < 768;
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mouse events for planet interaction
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
        
        // UI controls
        this.setupUIControls();
    }

    setupUIControls() {
        // Global controls
        const playPauseBtn = document.getElementById('play-pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        const globalSpeedSlider = document.getElementById('global-speed');
        const cameraSpeedSlider = document.getElementById('camera-speed');
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        
        // View options
        const showOrbitsCheckbox = document.getElementById('show-orbits');
        const showLabelsCheckbox = document.getElementById('show-labels');
        const showStarsCheckbox = document.getElementById('show-stars');
        const showTrailsCheckbox = document.getElementById('show-trails');
        const realisticSizesCheckbox = document.getElementById('realistic-sizes');
        
        // Panel toggle
        const panelToggle = document.getElementById('panel-toggle');
        const controlPanel = document.getElementById('control-panel');
        const controlToggleBtn = document.getElementById('control-toggle-btn');

        // Info modal
        const infoBtn = document.getElementById('info-btn');
        const infoModal = document.getElementById('info-modal');
        const closeModal = document.getElementById('close-modal');

        // Fullscreen
        const fullscreenBtn = document.getElementById('fullscreen-btn');

        // Event listeners
        playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        resetBtn.addEventListener('click', () => this.resetSimulation());
        globalSpeedSlider.addEventListener('input', (e) => this.setGlobalSpeed(parseFloat(e.target.value)));
        cameraSpeedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            console.log('Camera speed slider changed to:', speed);
            this.setCameraSpeed(speed);
        });
        
        themeToggle.addEventListener('click', () => this.toggleTheme());
        
        showOrbitsCheckbox.addEventListener('change', (e) => this.toggleOrbits(e.target.checked));
        showLabelsCheckbox.addEventListener('change', (e) => this.toggleLabels(e.target.checked));
        showStarsCheckbox.addEventListener('change', (e) => this.toggleStars(e.target.checked));
        showTrailsCheckbox.addEventListener('change', (e) => this.toggleTrails(e.target.checked));
        realisticSizesCheckbox.addEventListener('change', (e) => this.toggleRealisticSizes(e.target.checked));
        
        // Simple panel toggle - works the same on all devices
        let panelOpen = window.innerWidth > 768; // Start open on desktop, closed on mobile

        const updatePanel = () => {
            if (panelOpen) {
                // Panel is open
                controlPanel.classList.remove('collapsed');
                panelToggle.innerHTML = '<i class="fas fa-times"></i>';
                controlToggleBtn.classList.remove('show'); // Hide floating button
            } else {
                // Panel is closed
                controlPanel.classList.add('collapsed');
                panelToggle.innerHTML = '<i class="fas fa-times"></i>';
                controlToggleBtn.classList.add('show'); // Show floating button with animation
            }
        };

        // Toggle panel open/closed
        const togglePanel = () => {
            panelOpen = !panelOpen;
            updatePanel();
        };

        // Both buttons do the same thing - toggle the panel
        panelToggle.addEventListener('click', togglePanel);
        controlToggleBtn.addEventListener('click', togglePanel);

        // Close panel when clicking outside (mobile only)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && panelOpen) {
                if (!controlPanel.contains(e.target) && !controlToggleBtn.contains(e.target)) {
                    panelOpen = false;
                    updatePanel();
                }
            }
        });

        // Don't close when clicking inside panel
        controlPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Update on window resize
        window.addEventListener('resize', () => {
            // Reset panel state based on screen size
            panelOpen = window.innerWidth > 768;
            updatePanel();
        });

        // Initialize
        updatePanel();

        // Help tooltip
        const helpTooltip = document.getElementById('help-tooltip');
        const closeTooltip = document.getElementById('close-tooltip');

        // Show help tooltip on first visit
        if (!localStorage.getItem('solar-system-help-shown')) {
            setTimeout(() => {
                helpTooltip.classList.add('show');
            }, 2000);
        }

        closeTooltip.addEventListener('click', () => {
            helpTooltip.classList.remove('show');
            localStorage.setItem('solar-system-help-shown', 'true');
        });

        // Close tooltip when clicking outside
        helpTooltip.addEventListener('click', (e) => {
            if (e.target === helpTooltip) {
                helpTooltip.classList.remove('show');
                localStorage.setItem('solar-system-help-shown', 'true');
            }
        });

        // Collapsible sections
        document.querySelectorAll('.section-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const section = toggle.closest('.collapsible');
                section.classList.toggle('collapsed');
            });
        });
        
        infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
        closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) infoModal.classList.add('hidden');
        });
        
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Generate planet controls
        this.generatePlanetControls();

        // Test camera speed functionality
        console.log('Testing camera speed functionality...');
        setTimeout(() => {
            this.testCameraSpeed();
        }, 1000);
    }

    generatePlanetControls() {
        const planetControlsContainer = document.getElementById('planet-controls');

        this.planetData.forEach((data, index) => {
            const controlDiv = document.createElement('div');
            controlDiv.className = 'control-item planet-control';

            // Get planet icon based on name
            const planetIcons = {
                'Mercury': 'fas fa-circle',
                'Venus': 'fas fa-circle',
                'Earth': 'fas fa-globe',
                'Mars': 'fas fa-circle',
                'Jupiter': 'fas fa-circle',
                'Saturn': 'fas fa-ring',
                'Uranus': 'fas fa-circle',
                'Neptune': 'fas fa-circle'
            };

            const icon = planetIcons[data.name] || 'fas fa-circle';

            controlDiv.innerHTML = `
                <label for="planet-${index}-time-select">
                    <i class="${icon}"></i>
                    ${data.name} Orbital Speed
                </label>

                <!-- Time-based Speed Selector -->
                <div class="time-speed-container">
                    <label class="time-label">Complete 1 orbit in:</label>
                    <select id="planet-${index}-time-select" class="time-select">
                        <option value="second">1 Second</option>
                        <option value="minute">1 Minute</option>
                        <option value="hour">1 Hour</option>
                        <option value="day">1 Day</option>
                        <option value="week">1 Week</option>
                        <option value="month">1 Month</option>
                        <option value="year" selected>1 Year (Realistic)</option>
                    </select>
                </div>

                <!-- Manual Speed Slider (Alternative) -->
                <div class="manual-speed-container" style="display: none;">
                    <label class="speed-label">Manual Speed:</label>
                    <div class="slider-container">
                        <input type="range" id="planet-${index}-speed" min="0" max="5" step="0.1" value="1">
                        <span class="slider-value">1.0x</span>
                    </div>
                </div>

                <!-- Toggle between time-based and manual -->
                <div class="control-toggle">
                    <button type="button" class="btn btn-small toggle-mode" data-planet="${index}">
                        <i class="fas fa-exchange-alt"></i>
                        Switch to Manual
                    </button>
                </div>
            `;

            const timeSelect = controlDiv.querySelector(`#planet-${index}-time-select`);
            const manualContainer = controlDiv.querySelector('.manual-speed-container');
            const timeContainer = controlDiv.querySelector('.time-speed-container');
            const toggleBtn = controlDiv.querySelector('.toggle-mode');
            const slider = controlDiv.querySelector('input[type="range"]');
            const valueSpan = controlDiv.querySelector('.slider-value');

            // Time-based speed change
            timeSelect.addEventListener('change', (e) => {
                try {
                    const timeUnit = e.target.value;
                    const speed = this.setPlanetTimeSpeed(index, timeUnit);
                    console.log(`${data.name} set to complete orbit in 1 ${timeUnit} (speed: ${speed.toFixed(6)})`);
                } catch (error) {
                    console.error(`Error setting time-based speed for ${data.name}:`, error);
                }
            });

            // Manual speed change
            slider.addEventListener('input', (e) => {
                const speed = parseFloat(e.target.value);
                valueSpan.textContent = `${speed.toFixed(1)}x`;
                this.setPlanetSpeed(index, speed);
            });

            // Toggle between time-based and manual controls
            toggleBtn.addEventListener('click', () => {
                const isTimeMode = timeContainer.style.display !== 'none';

                if (isTimeMode) {
                    // Switch to manual mode
                    timeContainer.style.display = 'none';
                    manualContainer.style.display = 'block';
                    toggleBtn.innerHTML = '<i class="fas fa-clock"></i> Switch to Time-based';
                } else {
                    // Switch to time-based mode
                    timeContainer.style.display = 'block';
                    manualContainer.style.display = 'none';
                    toggleBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Switch to Manual';
                    // Apply current time setting
                    const timeUnit = timeSelect.value;
                    this.setPlanetTimeSpeed(index, timeUnit);
                }
            });

            // Initialize with realistic speed (1 year orbit)
            try {
                this.setPlanetTimeSpeed(index, 'year');
            } catch (error) {
                console.error(`Error initializing time-based speed for ${data.name}:`, error);
                // Fallback to original speed
                this.setPlanetSpeed(index, 1.0);
            }

            planetControlsContainer.appendChild(controlDiv);
        });
    }

    // Animation and update methods
    animate() {
        requestAnimationFrame(() => this.animate());

        // Performance monitoring
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFPSUpdate > 1000) {
            this.currentFPS = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;

            // Adaptive quality based on FPS
            this.adaptQuality();
        }

        if (this.isPlaying) {
            this.updatePlanets();
            this.updateSun();
            if (this.showTrails && this.currentFPS > 30) {
                this.updatePlanetTrails();
            }
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    adaptQuality() {
        // Reduce quality if FPS is too low
        if (this.currentFPS < 30 && this.renderer.getPixelRatio() > 1) {
            this.renderer.setPixelRatio(1);
        } else if (this.currentFPS > 50 && this.renderer.getPixelRatio() < window.devicePixelRatio) {
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }

        // Disable trails on low-end devices
        if (this.currentFPS < 25 && this.showTrails) {
            this.toggleTrails(false);
            document.getElementById('show-trails').checked = false;
        }
    }

    updatePlanets() {
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();

        this.planets.forEach(planet => {
            const data = planet.userData;

            // Update orbital position
            data.angle += data.currentSpeed * this.globalSpeed * deltaTime * 0.1;
            planet.position.x = Math.cos(data.angle) * data.distance;
            planet.position.z = Math.sin(data.angle) * data.distance;

            // Update rotation
            planet.rotation.y += data.rotationSpeed * this.globalSpeed * deltaTime * 10;

            // Update shader materials (like Jupiter)
            if (data.material && data.material.uniforms && data.material.uniforms.time) {
                data.material.uniforms.time.value = elapsedTime * this.globalSpeed;
            }

            // Update special effects
            planet.children.forEach(child => {
                if (child.name === 'EarthClouds') {
                    child.rotation.y += 0.008 * this.globalSpeed * deltaTime * 10;
                } else if (child.name === 'JupiterStorm') {
                    child.rotation.y += 0.015 * this.globalSpeed * deltaTime * 10;
                } else if (child.name === 'MarsDust') {
                    child.rotation.y += 0.012 * this.globalSpeed * deltaTime * 10;
                    child.rotation.x += 0.005 * this.globalSpeed * deltaTime * 10;
                } else if (child.name === 'VenusAtmosphere') {
                    child.rotation.y -= 0.003 * this.globalSpeed * deltaTime * 10; // Retrograde
                    // Update Venus atmosphere shader
                    if (child.material && child.material.uniforms && child.material.uniforms.time) {
                        child.material.uniforms.time.value = elapsedTime * this.globalSpeed;
                    }
                } else if (child.name === 'EarthAtmosphere') {
                    // Update Earth atmosphere shader
                    if (child.material && child.material.uniforms) {
                        if (child.material.uniforms.time) {
                            child.material.uniforms.time.value = elapsedTime * this.globalSpeed;
                        }
                        if (child.material.uniforms.viewVector) {
                            child.material.uniforms.viewVector.value.copy(this.camera.position);
                        }
                    }
                } else if (child.name && child.name.startsWith('SaturnRing_')) {
                    // Update Saturn ring shaders
                    if (child.material && child.material.uniforms && child.material.uniforms.time) {
                        child.material.uniforms.time.value = elapsedTime * this.globalSpeed;
                    }
                    // Rings rotate at different speeds
                    const ringIndex = parseInt(child.name.split('_')[1]);
                    child.rotation.z += (0.001 + ringIndex * 0.0002) * this.globalSpeed * deltaTime * 10;
                }
            });
        });
    }

    updateSun() {
        const deltaTime = this.clock.getDelta();
        this.sun.rotation.y += 0.005 * this.globalSpeed * deltaTime * 10;
    }



    updatePlanetTrails() {
        this.planetTrails.forEach((trail, index) => {
            if (this.planets[index]) {
                const planet = this.planets[index];
                const trailData = trail.userData;

                // Add current planet position to trail
                trailData.positions.push(planet.position.clone());

                // Limit trail length
                if (trailData.positions.length > trailData.maxLength) {
                    trailData.positions.shift();
                }

                // Update trail geometry
                const positions = trail.geometry.attributes.position.array;
                for (let i = 0; i < trailData.positions.length; i++) {
                    const pos = trailData.positions[i];
                    positions[i * 3] = pos.x;
                    positions[i * 3 + 1] = pos.y;
                    positions[i * 3 + 2] = pos.z;
                }

                // Clear remaining positions
                for (let i = trailData.positions.length; i < trailData.maxLength; i++) {
                    positions[i * 3] = 0;
                    positions[i * 3 + 1] = 0;
                    positions[i * 3 + 2] = 0;
                }

                trail.geometry.attributes.position.needsUpdate = true;
                trail.geometry.setDrawRange(0, trailData.positions.length);
            }
        });
    }

    // Control methods
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('play-pause-btn');
        const icon = btn.querySelector('i');
        const text = btn.querySelector('span');
        
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
            text.textContent = 'Pause';
        } else {
            icon.className = 'fas fa-play';
            text.textContent = 'Play';
        }
    }

    resetSimulation() {
        this.planets.forEach(planet => {
            const data = planet.userData;
            data.angle = Math.random() * Math.PI * 2;
            data.currentSpeed = data.originalSpeed;
        });
        
        // Reset UI controls
        document.getElementById('global-speed').value = 1;
        document.querySelector('#global-speed + .slider-value').textContent = '1.0x';
        this.globalSpeed = 1.0;

        // Reset camera speed
        document.getElementById('camera-speed').value = 1;
        document.querySelector('#camera-speed + .slider-value').textContent = '1.0x';
        this.setCameraSpeed(1.0);
        
        // Reset planet speed controls
        this.planetData.forEach((_, index) => {
            const slider = document.getElementById(`planet-${index}-speed`);
            const valueSpan = slider.parentElement.querySelector('.slider-value');
            slider.value = 1;
            valueSpan.textContent = '1.0x';
        });
    }

    setGlobalSpeed(speed) {
        this.globalSpeed = speed;
        document.querySelector('#global-speed + .slider-value').textContent = `${speed.toFixed(1)}x`;
    }

    setCameraSpeed(speed) {
        this.cameraSpeed = speed;

        // Update OrbitControls speeds
        if (this.controls) {
            // These are the correct property names for OrbitControls
            this.controls.rotateSpeed = speed;
            this.controls.zoomSpeed = speed;
            this.controls.panSpeed = speed;

            // Also update autoRotateSpeed if auto-rotate is enabled
            if (this.controls.autoRotateSpeed !== undefined) {
                this.controls.autoRotateSpeed = speed * 2.0;
            }

            console.log(`Camera speed set to: ${speed}x`);
            console.log('Controls speeds:', {
                rotate: this.controls.rotateSpeed,
                zoom: this.controls.zoomSpeed,
                pan: this.controls.panSpeed
            });
        }

        // Update UI display
        const valueElement = document.querySelector('#camera-speed + .slider-value');
        if (valueElement) {
            valueElement.textContent = `${speed.toFixed(1)}x`;
        }

        // Update status indicator
        const statusElement = document.getElementById('camera-speed-status');
        if (statusElement) {
            statusElement.textContent = `Camera speed updated to ${speed.toFixed(1)}x - Try rotating/zooming to feel the difference`;
            statusElement.style.color = '#4CAF50';

            // Reset status after 3 seconds
            setTimeout(() => {
                statusElement.textContent = 'Move the slider to test camera speed';
                statusElement.style.color = '#888';
            }, 3000);
        }
    }

    testCameraSpeed() {
        console.log('=== Camera Speed Test ===');
        console.log('Controls object:', this.controls);

        if (this.controls) {
            console.log('Current camera speeds:', {
                rotateSpeed: this.controls.rotateSpeed,
                zoomSpeed: this.controls.zoomSpeed,
                panSpeed: this.controls.panSpeed,
                cameraSpeed: this.cameraSpeed
            });

            // Test setting different speeds
            console.log('Testing speed changes...');
            this.setCameraSpeed(0.5);
            setTimeout(() => {
                this.setCameraSpeed(2.0);
                setTimeout(() => {
                    this.setCameraSpeed(1.0);
                    console.log('Camera speed test completed');
                }, 1000);
            }, 1000);
        } else {
            console.error('Controls not available for testing');
        }
    }

    setPlanetSpeed(index, speed) {
        if (this.planets[index]) {
            this.planets[index].userData.currentSpeed = this.planets[index].userData.originalSpeed * speed;
        }
    }

    // Set planet speed to an absolute value (for time-based controls)
    setPlanetAbsoluteSpeed(index, speed) {
        if (this.planets[index]) {
            this.planets[index].userData.currentSpeed = speed;
        }
    }

    // Calculate speed based on time unit for realistic orbital periods
    calculateTimeBasedSpeed(planetIndex, timeUnit) {
        const planetData = this.planetData[planetIndex];
        if (!planetData || !this.timeUnits[timeUnit]) {
            console.warn(`Invalid planet index ${planetIndex} or time unit ${timeUnit}`);
            return 1.0;
        }

        // Base calculation: how fast should the planet move to complete one orbit in the specified time
        const realOrbitalPeriodSeconds = planetData.orbitalPeriodDays * 86400; // Convert days to seconds
        const desiredPeriodSeconds = this.timeUnits[timeUnit];

        // Speed multiplier to achieve desired orbital period
        // Higher multiplier = faster orbit = shorter period
        const speedMultiplier = realOrbitalPeriodSeconds / desiredPeriodSeconds;

        // Base speed adjustment for visual appeal (planets move at reasonable speeds)
        // Clamp the speed to reasonable bounds to prevent performance issues
        const baseSpeed = 0.002; // Slightly increased base speed for better visibility
        const calculatedSpeed = baseSpeed * speedMultiplier;

        // Clamp speed between reasonable bounds
        const minSpeed = 0.0001; // Minimum speed to ensure movement is visible
        const maxSpeed = 10.0;   // Maximum speed to prevent performance issues

        const finalSpeed = Math.max(minSpeed, Math.min(maxSpeed, calculatedSpeed));

        return finalSpeed;
    }

    // Set planet speed using time-based units
    setPlanetTimeSpeed(planetIndex, timeUnit) {
        const speed = this.calculateTimeBasedSpeed(planetIndex, timeUnit);
        this.setPlanetAbsoluteSpeed(planetIndex, speed);
        return speed;
    }

    // Validate time units configuration
    validateTimeUnits() {
        const requiredUnits = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'];
        const missingUnits = requiredUnits.filter(unit => !this.timeUnits[unit]);

        if (missingUnits.length > 0) {
            console.error('Missing time units:', missingUnits);
            return false;
        }

        // Validate that all values are positive numbers
        for (const [unit, seconds] of Object.entries(this.timeUnits)) {
            if (typeof seconds !== 'number' || seconds <= 0) {
                console.error(`Invalid time unit value for ${unit}:`, seconds);
                return false;
            }
        }

        console.log('Time units validated successfully');
        return true;
    }

    toggleOrbits(show) {
        this.showOrbits = show;
        this.orbitLines.forEach(line => {
            line.visible = show;
        });
    }

    toggleLabels(show) {
        this.showLabels = show;
        this.planets.forEach(planet => {
            const label = planet.children.find(child => child.name.includes('_label'));
            if (label) {
                label.visible = show;
            }
        });
    }

    toggleStars(show) {
        this.showStars = show;
        if (this.starField) {
            this.starField.visible = show;
        }
    }

    toggleTrails(show) {
        this.showTrails = show;
        this.planetTrails.forEach(trail => {
            trail.visible = show;
        });
    }

    toggleRealisticSizes(realistic) {
        this.realisticSizes = realistic;

        this.planets.forEach(planet => {
            const data = planet.userData;
            let newRadius;

            if (realistic) {
                // Use more realistic size ratios (still scaled for visibility)
                const realSizeRatios = {
                    'Mercury': 0.1,
                    'Venus': 0.2,
                    'Earth': 0.25,
                    'Mars': 0.15,
                    'Jupiter': 2.8,
                    'Saturn': 2.3,
                    'Uranus': 1.0,
                    'Neptune': 0.95
                };
                newRadius = realSizeRatios[data.name] || data.radius;
            } else {
                // Use the original scaled sizes for better visibility
                newRadius = data.radius;
            }

            // Update planet geometry
            planet.geometry.dispose();
            planet.geometry = new THREE.SphereGeometry(newRadius, 32, 32);

            // Update label position
            const label = planet.children.find(child => child.name.includes('_label'));
            if (label) {
                label.position.y = newRadius + 3;
            }
        });

        // Update sun size if realistic
        if (this.sun) {
            const newSunRadius = realistic ? 8 : 5;
            this.sun.geometry.dispose();
            this.sun.geometry = new THREE.SphereGeometry(newSunRadius, 32, 32);

            // Update sun glow
            const sunGlow = this.sun.children[0];
            if (sunGlow) {
                sunGlow.geometry.dispose();
                sunGlow.geometry = new THREE.SphereGeometry(newSunRadius * 1.4, 32, 32);
            }
        }
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        const body = document.body;
        const themeIcon = document.querySelector('#theme-toggle i');
        
        if (this.isDarkTheme) {
            body.removeAttribute('data-theme');
            themeIcon.className = 'fas fa-moon';
        } else {
            body.setAttribute('data-theme', 'light');
            themeIcon.className = 'fas fa-sun';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    // Mouse interaction methods
    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.planets);
        
        if (intersects.length > 0) {
            const planet = intersects[0].object;
            this.showPlanetTooltip(planet, event);
            this.hoveredPlanet = planet;
        } else {
            this.hidePlanetTooltip();
            this.hoveredPlanet = null;
        }
    }

    onMouseClick() {
        if (this.hoveredPlanet) {
            this.focusOnPlanet(this.hoveredPlanet);
        }
    }

    showPlanetTooltip(planet, event) {
        const tooltip = document.getElementById('planet-tooltip');
        const data = planet.userData;
        
        document.getElementById('tooltip-name').textContent = data.name;
        document.getElementById('tooltip-info').textContent = data.info;
        document.getElementById('tooltip-distance').textContent = data.realDistance;
        document.getElementById('tooltip-period').textContent = data.realPeriod;
        
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY - 10}px`;
        tooltip.classList.remove('hidden');
    }

    hidePlanetTooltip() {
        document.getElementById('planet-tooltip').classList.add('hidden');
    }

    focusOnPlanet(planet) {
        const targetPosition = planet.position.clone();
        targetPosition.y += 10;
        targetPosition.multiplyScalar(1.5);
        
        // Smooth camera transition (simplified)
        this.controls.target.copy(planet.position);
        this.camera.position.copy(targetPosition);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / (window.innerHeight - 80);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight - 80);
    }
}

// Initialize the simulation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SolarSystemSimulation();
});

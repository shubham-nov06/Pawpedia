import { useEffect, useRef, useState } from "react";

const ANIMALS_MAP = [
    { id: 1, name: "Golden Retriever", emoji: "🐕", category: "dogs", lat: 56.5, lng: -4.2, origin: "Scotland" },
    { id: 2, name: "Siberian Husky", emoji: "🐺", category: "dogs", lat: 60.0, lng: 90.0, origin: "Siberia" },
    { id: 3, name: "German Shepherd", emoji: "🦮", category: "dogs", lat: 51.1, lng: 10.4, origin: "Germany" },
    { id: 4, name: "Labrador Retriever", emoji: "🐶", category: "dogs", lat: 53.1, lng: -57.6, origin: "Canada" },
    { id: 5, name: "Beagle", emoji: "🐕", category: "dogs", lat: 52.3, lng: -1.8, origin: "England" },
    { id: 6, name: "Pomeranian", emoji: "🦊", category: "dogs", lat: 53.5, lng: 14.5, origin: "Germany" },
    { id: 7, name: "Doberman", emoji: "🐕‍🦺", category: "dogs", lat: 51.1, lng: 10.4, origin: "Germany" },
    { id: 8, name: "Bulldog", emoji: "🐶", category: "dogs", lat: 51.5, lng: -0.1, origin: "England" },
    { id: 9, name: "Rottweiler", emoji: "🐕", category: "dogs", lat: 48.4, lng: 8.8, origin: "Germany" },
    { id: 10, name: "Poodle", emoji: "🐩", category: "dogs", lat: 51.1, lng: 10.4, origin: "Germany" },
    { id: 11, name: "Dachshund", emoji: "🌭", category: "dogs", lat: 51.1, lng: 10.4, origin: "Germany" },
    { id: 12, name: "Shih Tzu", emoji: "👑", category: "dogs", lat: 35.8, lng: 104.1, origin: "China" },
    { id: 13, name: "Border Collie", emoji: "🐑", category: "dogs", lat: 55.3, lng: -3.4, origin: "Scotland" },
    { id: 14, name: "Boxer", emoji: "🥊", category: "dogs", lat: 51.1, lng: 10.4, origin: "Germany" },
    { id: 15, name: "Chihuahua", emoji: "🐕", category: "dogs", lat: 28.6, lng: -106.0, origin: "Mexico" },
    { id: 16, name: "Samoyed", emoji: "⛄", category: "dogs", lat: 62.0, lng: 85.0, origin: "Siberia" },
    { id: 17, name: "Shiba Inu", emoji: "🦊", category: "dogs", lat: 36.2, lng: 138.2, origin: "Japan" },
    { id: 18, name: "Corgi", emoji: "👑", category: "dogs", lat: 52.1, lng: -3.7, origin: "Wales" },
    { id: 19, name: "Great Dane", emoji: "🦒", category: "dogs", lat: 56.2, lng: 9.5, origin: "Denmark" },
    { id: 20, name: "Dalmatian", emoji: "⚫", category: "dogs", lat: 43.5, lng: 16.4, origin: "Croatia" },
    { id: 21, name: "Persian", emoji: "🐱", category: "cats", lat: 32.4, lng: 53.6, origin: "Persia" },
    { id: 22, name: "Maine Coon", emoji: "🦁", category: "cats", lat: 44.6, lng: -69.3, origin: "USA" },
    { id: 23, name: "Siamese", emoji: "💙", category: "cats", lat: 15.8, lng: 100.9, origin: "Thailand" },
    { id: 24, name: "British Shorthair", emoji: "🧸", category: "cats", lat: 51.5, lng: -0.1, origin: "UK" },
    { id: 25, name: "Ragdoll", emoji: "💜", category: "cats", lat: 36.7, lng: -119.7, origin: "USA" },
    { id: 26, name: "Bengal", emoji: "🐆", category: "cats", lat: 37.0, lng: -95.7, origin: "USA" },
    { id: 27, name: "Scottish Fold", emoji: "🎩", category: "cats", lat: 56.4, lng: -3.9, origin: "Scotland" },
    { id: 28, name: "Sphynx", emoji: "🏺", category: "cats", lat: 43.7, lng: -79.4, origin: "Canada" },
    { id: 29, name: "Russian Blue", emoji: "💚", category: "cats", lat: 64.6, lng: 40.5, origin: "Russia" },
    { id: 30, name: "Abyssinian", emoji: "🏺", category: "cats", lat: 9.1, lng: 40.4, origin: "Ethiopia" },
    { id: 31, name: "Budgerigar", emoji: "🦜", category: "birds", lat: -25.3, lng: 133.7, origin: "Australia" },
    { id: 32, name: "African Grey", emoji: "🧠", category: "birds", lat: 5.0, lng: 20.0, origin: "Africa" },
    { id: 33, name: "Cockatiel", emoji: "🎵", category: "birds", lat: -25.3, lng: 133.7, origin: "Australia" },
    { id: 34, name: "Lovebird", emoji: "💕", category: "birds", lat: -1.9, lng: 29.8, origin: "Africa" },
    { id: 35, name: "Cockatoo", emoji: "👑", category: "birds", lat: -25.3, lng: 133.7, origin: "Australia" },
    { id: 36, name: "Canary", emoji: "🎤", category: "birds", lat: 28.2, lng: -15.4, origin: "Canary Islands" },
    { id: 37, name: "Macaw", emoji: "🌈", category: "birds", lat: -14.2, lng: -51.9, origin: "Brazil" },
    { id: 38, name: "Finch", emoji: "🎵", category: "birds", lat: 0.0, lng: 0.0, origin: "Worldwide" },
    { id: 39, name: "Parakeet", emoji: "💚", category: "birds", lat: -25.3, lng: 133.7, origin: "Australia" },
    { id: 40, name: "Pigeon", emoji: "🕊️", category: "birds", lat: 41.9, lng: 12.5, origin: "Europe" },
    { id: 41, name: "Syrian Hamster", emoji: "🐹", category: "small-pets", lat: 35.0, lng: 38.0, origin: "Syria" },
    { id: 42, name: "Guinea Pig", emoji: "🐾", category: "small-pets", lat: -13.1, lng: -74.2, origin: "Peru" },
    { id: 43, name: "Rabbit", emoji: "🐰", category: "small-pets", lat: 46.2, lng: 2.2, origin: "France" },
    { id: 44, name: "Chinchilla", emoji: "🌙", category: "small-pets", lat: -30.0, lng: -70.0, origin: "Andes" },
    { id: 45, name: "Ferret", emoji: "🐾", category: "small-pets", lat: 47.5, lng: 14.5, origin: "Europe" },
    { id: 46, name: "Hedgehog", emoji: "🦔", category: "small-pets", lat: 0.0, lng: 25.0, origin: "Africa" },
    { id: 47, name: "Gerbil", emoji: "🐾", category: "small-pets", lat: 46.8, lng: 103.8, origin: "Mongolia" },
    { id: 48, name: "Pet Rat", emoji: "🐀", category: "small-pets", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 49, name: "Sugar Glider", emoji: "🪂", category: "small-pets", lat: -25.3, lng: 133.7, origin: "Australia" },
    { id: 50, name: "Dwarf Hamster", emoji: "🐹", category: "small-pets", lat: 40.0, lng: 80.0, origin: "Asia" },
    { id: 51, name: "Bearded Dragon", emoji: "🐉", category: "reptiles", lat: -25.3, lng: 133.7, origin: "Australia" },
    { id: 52, name: "Leopard Gecko", emoji: "🦎", category: "reptiles", lat: 33.9, lng: 67.7, origin: "Afghanistan" },
    { id: 53, name: "Ball Python", emoji: "🐍", category: "reptiles", lat: 9.0, lng: 8.6, origin: "Nigeria" },
    { id: 54, name: "Crested Gecko", emoji: "🦎", category: "reptiles", lat: -22.2, lng: 166.4, origin: "New Caledonia" },
    { id: 55, name: "Corn Snake", emoji: "🌽", category: "reptiles", lat: 37.0, lng: -95.7, origin: "USA" },
    { id: 56, name: "Red-Eared Slider", emoji: "🐢", category: "reptiles", lat: 37.0, lng: -95.7, origin: "USA" },
    { id: 57, name: "Green Iguana", emoji: "🌿", category: "reptiles", lat: 9.7, lng: -83.7, origin: "Costa Rica" },
    { id: 58, name: "Sulcata Tortoise", emoji: "🐢", category: "reptiles", lat: 15.0, lng: 30.0, origin: "Sudan" },
    { id: 59, name: "Chameleon", emoji: "🎨", category: "reptiles", lat: -18.7, lng: 46.8, origin: "Madagascar" },
    { id: 60, name: "Blue-Tongued Skink", emoji: "💙", category: "reptiles", lat: -25.3, lng: 133.7, origin: "Australia" },
    { id: 61, name: "Betta Fish", emoji: "🐠", category: "fish", lat: 13.7, lng: 100.5, origin: "Thailand" },
    { id: 62, name: "Goldfish", emoji: "🥇", category: "fish", lat: 35.8, lng: 104.1, origin: "China" },
    { id: 63, name: "Guppy", emoji: "🌈", category: "fish", lat: 10.6, lng: -61.5, origin: "Trinidad" },
    { id: 64, name: "Oscar Fish", emoji: "🏆", category: "fish", lat: -3.4, lng: -65.0, origin: "Amazon" },
    { id: 65, name: "Arowana", emoji: "🐉", category: "fish", lat: -3.4, lng: -60.0, origin: "Amazon" },
    { id: 66, name: "Koi", emoji: "☯️", category: "fish", lat: 36.2, lng: 138.2, origin: "Japan" },
    { id: 67, name: "Discus", emoji: "👑", category: "fish", lat: -3.4, lng: -60.0, origin: "Amazon" },
    { id: 68, name: "Neon Tetra", emoji: "💡", category: "fish", lat: -3.4, lng: -65.0, origin: "Amazon" },
    { id: 69, name: "Axolotl", emoji: "🦎", category: "fish", lat: 19.4, lng: -99.1, origin: "Mexico" },
    { id: 70, name: "Clownfish", emoji: "🤡", category: "fish", lat: -8.7, lng: 115.2, origin: "Bali" },
    { id: 71, name: "Praying Mantis", emoji: "🙏", category: "insects", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 72, name: "Stick Insect", emoji: "🌿", category: "insects", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 73, name: "Tarantula", emoji: "🕷️", category: "insects", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 74, name: "Emperor Scorpion", emoji: "🦂", category: "insects", lat: 5.0, lng: -5.0, origin: "West Africa" },
    { id: 75, name: "Hissing Cockroach", emoji: "🦗", category: "insects", lat: -18.7, lng: 46.8, origin: "Madagascar" },
    { id: 76, name: "Millipede", emoji: "🐛", category: "insects", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 77, name: "Monarch Butterfly", emoji: "🦋", category: "insects", lat: 37.0, lng: -95.7, origin: "North America" },
    { id: 78, name: "Hercules Beetle", emoji: "💪", category: "insects", lat: 10.0, lng: -85.0, origin: "Central America" },
    { id: 79, name: "Honeybee", emoji: "🐝", category: "insects", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 80, name: "Leaf Beetle", emoji: "🍃", category: "insects", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 81, name: "Red Fox", emoji: "🦊", category: "wild", lat: 55.0, lng: 37.6, origin: "Russia" },
    { id: 82, name: "Snow Leopard", emoji: "❄️", category: "wild", lat: 35.0, lng: 75.0, origin: "Himalayas" },
    { id: 83, name: "Capybara", emoji: "🐾", category: "wild", lat: -14.2, lng: -51.9, origin: "Brazil" },
    { id: 84, name: "Red Panda", emoji: "🍁", category: "wild", lat: 27.7, lng: 85.3, origin: "Nepal" },
    { id: 85, name: "Meerkat", emoji: "👀", category: "wild", lat: -24.6, lng: 25.9, origin: "Botswana" },
    { id: 86, name: "Fennec Fox", emoji: "👂", category: "wild", lat: 23.4, lng: 25.6, origin: "Sahara" },
    { id: 87, name: "Quokka", emoji: "😊", category: "wild", lat: -31.9, lng: 115.8, origin: "Australia" },
    { id: 88, name: "Giant Panda", emoji: "🐼", category: "wild", lat: 30.6, lng: 103.9, origin: "Sichuan, China" },
    { id: 89, name: "Slow Loris", emoji: "🌙", category: "wild", lat: 4.2, lng: 101.9, origin: "Malaysia" },
    { id: 90, name: "Pangolin", emoji: "🐾", category: "wild", lat: 0.0, lng: 25.0, origin: "Africa" },
    { id: 91, name: "Horse", emoji: "🐎", category: "farm", lat: 45.0, lng: 66.9, origin: "Kazakhstan" },
    { id: 92, name: "Cow", emoji: "🐄", category: "farm", lat: 32.4, lng: 53.6, origin: "Iran" },
    { id: 93, name: "Goat", emoji: "🐐", category: "farm", lat: 39.9, lng: 32.8, origin: "Turkey" },
    { id: 94, name: "Sheep", emoji: "🐑", category: "farm", lat: 39.9, lng: 32.8, origin: "Turkey" },
    { id: 95, name: "Pig", emoji: "🐷", category: "farm", lat: 35.0, lng: 105.0, origin: "China" },
    { id: 96, name: "Donkey", emoji: "🫏", category: "farm", lat: 9.1, lng: 40.4, origin: "Ethiopia" },
    { id: 97, name: "Duck", emoji: "🦆", category: "farm", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 98, name: "Chicken", emoji: "🐔", category: "farm", lat: 13.7, lng: 100.5, origin: "Thailand" },
    { id: 99, name: "Dolphin", emoji: "🐬", category: "marine", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 100, name: "Sea Turtle", emoji: "🐢", category: "marine", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 101, name: "Octopus", emoji: "🐙", category: "marine", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 102, name: "Jellyfish", emoji: "🪼", category: "marine", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 103, name: "Seahorse", emoji: "🌊", category: "marine", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 104, name: "Manta Ray", emoji: "🌊", category: "marine", lat: 20.0, lng: 0.0, origin: "Worldwide" },
    { id: 105, name: "Whale Shark", emoji: "🐋", category: "marine", lat: 20.0, lng: 0.0, origin: "Worldwide" },
];

const CAT_COLORS = {
    dogs: "#ff6b6b", cats: "#ff9f7f", birds: "#6c63ff", fish: "#00d4aa",
    reptiles: "#4ecb71", "small-pets": "#ffd700", insects: "#c084fc",
    wild: "#fb923c", farm: "#84cc16", marine: "#22d3ee", all: "#6c63ff",
};

const CATEGORIES = [
    { id: "all", label: "All", icon: "🌍" },
    { id: "dogs", label: "Dogs", icon: "🐕" },
    { id: "cats", label: "Cats", icon: "🐈" },
    { id: "birds", label: "Birds", icon: "🦜" },
    { id: "fish", label: "Fish", icon: "🐠" },
    { id: "reptiles", label: "Reptiles", icon: "🦎" },
    { id: "small-pets", label: "Small Pets", icon: "🐹" },
    { id: "insects", label: "Insects", icon: "🦋" },
    { id: "wild", label: "Wild", icon: "🦊" },
    { id: "farm", label: "Farm", icon: "🐄" },
    { id: "marine", label: "Marine", icon: "🐬" },
];

export default function MapView({ onSelectAnimal, onClose }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        // Load Leaflet CSS
        if (!document.getElementById("leaflet-css")) {
            const link = document.createElement("link");
            link.id = "leaflet-css";
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        // Load Leaflet JS
        const loadLeaflet = async () => {
            if (window.L) { initMap(); return; }
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.onload = () => { setMapLoaded(true); initMap(); };
            document.head.appendChild(script);
        };

        loadLeaflet();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const initMap = () => {
        if (!mapRef.current || mapInstanceRef.current) return;
        const L = window.L;

        const map = L.map(mapRef.current, {
            center: [20, 0], zoom: 2, minZoom: 2, maxZoom: 6,
            zoomControl: false,
        });

        // Dark tile layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '© OpenStreetMap © CARTO',
            subdomains: "abcd", maxZoom: 20,
        }).addTo(map);

        // Custom zoom control
        L.control.zoom({ position: "bottomright" }).addTo(map);

        mapInstanceRef.current = map;
        addMarkers(map, "all");
        setMapLoaded(true);
    };

    const addMarkers = (map, category) => {
        const L = window.L;
        if (!L) return;

        // Remove old markers
        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];

        const filtered = category === "all" ? ANIMALS_MAP : ANIMALS_MAP.filter(a => a.category === category);
        const color = CAT_COLORS[category] || "#6c63ff";

        filtered.forEach(animal => {
            const icon = L.divIcon({
                className: "",
                html: `<div style="
          width: 36px; height: 36px; border-radius: 50%;
          background: ${color}22;
          border: 2px solid ${color};
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; cursor: pointer;
          box-shadow: 0 0 12px ${color}60, 0 2px 8px rgba(0,0,0,0.4);
          transition: transform 0.2s;
          backdrop-filter: blur(8px);
        " onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">${animal.emoji}</div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });

            const marker = L.marker([animal.lat, animal.lng], { icon })
                .addTo(map)
                .on("click", () => setSelectedAnimal(animal));

            markersRef.current.push(marker);
        });
    };

    const handleCategoryChange = (catId) => {
        setActiveCategory(catId);
        setSelectedAnimal(null);
        if (mapInstanceRef.current) {
            addMarkers(mapInstanceRef.current, catId);
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)",
            display: "flex", flexDirection: "column",
            animation: "fadeIn 0.3s ease",
        }}>
            {/* Header */}
            <div style={{
                padding: "16px 24px", display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 16, flexShrink: 0,
                background: "rgba(10,22,40,0.9)", borderBottom: "1px solid rgba(108,99,255,0.15)",
                backdropFilter: "blur(20px)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28 }}>🗺️</span>
                    <div>
                        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#e2e8f0" }}>Animal World Map</h2>
                        <p style={{ fontSize: 12, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>Origins of 105+ animals worldwide</p>
                    </div>
                </div>

                {/* Category filters */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", flex: 1, justifyContent: "center", padding: "0 10px" }}
                    className="scroll-hide">
                    {CATEGORIES.map(cat => {
                        const isActive = activeCategory === cat.id;
                        const col = CAT_COLORS[cat.id] || "#6c63ff";
                        return (
                            <button key={cat.id} onClick={() => handleCategoryChange(cat.id)} style={{
                                background: isActive ? `${col}22` : "rgba(255,255,255,0.04)",
                                border: isActive ? `1px solid ${col}` : "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 50, padding: "6px 14px", cursor: "pointer",
                                color: isActive ? col : "#64748b", fontSize: 12, whiteSpace: "nowrap",
                                fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                                transition: "all 0.2s",
                            }}>
                                {cat.icon} {cat.label}
                            </button>
                        );
                    })}
                </div>

                <button onClick={onClose} style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "50%", width: 42, height: 42, color: "#e2e8f0",
                    fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s", flexShrink: 0,
                }}>✕</button>
            </div>

            {/* Map */}
            <div style={{ flex: 1, position: "relative" }}>
                <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

                {!mapLoaded && (
                    <div style={{
                        position: "absolute", inset: 0, display: "flex", alignItems: "center",
                        justifyContent: "center", background: "#050b18", flexDirection: "column", gap: 16,
                    }}>
                        <div style={{ width: 48, height: 48, border: "3px solid rgba(108,99,255,0.2)", borderTopColor: "#6c63ff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        <p style={{ color: "#64748b", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>Loading world map…</p>
                    </div>
                )}

                {/* Animal popup */}
                {selectedAnimal && (
                    <div style={{
                        position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
                        background: "rgba(10,22,40,0.95)", backdropFilter: "blur(20px)",
                        border: `1px solid ${CAT_COLORS[selectedAnimal.category]}40`,
                        borderRadius: 20, padding: "18px 24px", minWidth: 280, maxWidth: 360,
                        boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${CAT_COLORS[selectedAnimal.category]}20`,
                        animation: "fadeUp 0.3s cubic-bezier(0.16,1,0.3,1)",
                        display: "flex", alignItems: "center", gap: 16, zIndex: 1000,
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: `${CAT_COLORS[selectedAnimal.category]}15`,
                            border: `2px solid ${CAT_COLORS[selectedAnimal.category]}40`,
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0,
                        }}>{selectedAnimal.emoji}</div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#e2e8f0", fontSize: 17, marginBottom: 3 }}>{selectedAnimal.name}</h3>
                            <p style={{ fontSize: 12, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>📍 {selectedAnimal.origin}</p>
                            <span style={{
                                display: "inline-block", marginTop: 6,
                                background: `${CAT_COLORS[selectedAnimal.category]}20`,
                                color: CAT_COLORS[selectedAnimal.category],
                                border: `1px solid ${CAT_COLORS[selectedAnimal.category]}30`,
                                padding: "2px 10px", borderRadius: 50, fontSize: 11, fontWeight: 600,
                            }}>{selectedAnimal.category}</span>
                        </div>
                        <button
                            onClick={() => onSelectAnimal && onSelectAnimal(selectedAnimal)}
                            style={{
                                background: `linear-gradient(135deg, ${CAT_COLORS[selectedAnimal.category]}, ${CAT_COLORS[selectedAnimal.category]}aa)`,
                                border: "none", borderRadius: 12, padding: "10px 16px",
                                color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer",
                                fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
                                transition: "transform 0.2s",
                            }}
                            onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
                            onMouseLeave={e => e.target.style.transform = "scale(1)"}
                        >View Details →</button>
                        <button onClick={() => setSelectedAnimal(null)} style={{
                            position: "absolute", top: 10, right: 10, background: "none", border: "none",
                            color: "#64748b", fontSize: 16, cursor: "pointer", padding: 4,
                        }}>✕</button>
                    </div>
                )}

                {/* Stats overlay */}
                <div style={{
                    position: "absolute", top: 16, left: 16,
                    background: "rgba(10,22,40,0.85)", backdropFilter: "blur(12px)",
                    border: "1px solid rgba(108,99,255,0.15)", borderRadius: 14,
                    padding: "12px 18px", display: "flex", gap: 20,
                }}>
                    {[
                        ["🐾", ANIMALS_MAP.filter(a => activeCategory === "all" || a.category === activeCategory).length, "Animals"],
                        ["🌍", new Set(ANIMALS_MAP.filter(a => activeCategory === "all" || a.category === activeCategory).map(a => a.origin)).size, "Origins"],
                    ].map(([icon, count, label]) => (
                        <div key={label} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 11 }}>{icon}</div>
                            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#6c63ff", lineHeight: 1.1 }}>{count}</div>
                            <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .leaflet-container { background: #050b18 !important; }
        .leaflet-control-zoom a { background: rgba(10,22,40,0.9) !important; color: #e2e8f0 !important; border: 1px solid rgba(108,99,255,0.2) !important; }
        .leaflet-control-zoom a:hover { background: rgba(108,99,255,0.2) !important; }
        .leaflet-control-attribution { background: rgba(5,11,24,0.8) !important; color: #334155 !important; }
        .leaflet-control-attribution a { color: #475569 !important; }
      `}</style>
        </div>
    );
}
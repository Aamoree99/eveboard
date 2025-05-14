import  { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ShipSelector.scss';

// Тип для корабля из JSON
interface Ship {
    id: number;
    name: string;
}

// Тип структуры JSON: категория -> массив кораблей
type ShipData = Record<string, Ship[]>;

const shipCategoryWords: Record<string, string[]> = {
    "Frigate": ["Wasp", "Spark", "Dart", "Phantom", "Fang", "Blink", "Ghost"],
    "Cruiser": ["Vulture", "Flame", "Drake", "Herald", "Glaive", "Vigil", "Storm"],
    "Battleship": ["Leviathan", "Howl", "Oblivion", "Maw", "Juggernaut", "Hammer", "Titan"],
    "Hauler": ["Mule", "Ox", "Drifter", "Pack", "Haul", "Wagon", "Crate"],
    "Capsule": ["Seed", "Core", "Echo", "Shell", "Node", "Pod", "Spark"],
    "Titan": ["Sovereign", "Warden", "Overlord", "Nova", "Tyrant", "Majesty", "Throne"],
    "Shuttle": ["Runner", "Skip", "Blink", "Flash", "Dart", "Zap", "Zig"],
    "Corvette": ["Crow", "Flicker", "Hornet", "Blade", "Dash", "Drift", "Skirmish"],
    "Assault Frigate": ["Rage", "Snap", "Scythe", "Edge", "Burn", "Spike", "Slash"],
    "Heavy Assault Cruiser": ["Breaker", "Maul", "Crush", "Dread", "Mauler", "Fury", "Wreck"],
    "Deep Space Transport": ["Void", "Spiral", "Longhaul", "Slip", "Tunnel", "Phase", "Trek"],
    "Elite Battleship": ["Reaper", "Annihilator", "Doom", "Oblivion", "Crux", "Executor", "Smite"],
    "Combat Battlecruiser": ["Pike", "Bruiser", "Burst", "Crash", "Shatter", "Ripper", "Fang"],
    "Flag Cruiser": ["Crest", "Glory", "Emblem", "Pride", "Standard", "Sigil", "Honor"],
    "Destroyer": ["Blitz", "Slash", "Chop", "Rush", "Snapper", "Breaker", "Buzz"],
    "Citizen Ships": ["Drift", "Wander", "Float", "Nova", "Speck", "Glide", "Flake"],
    "Mining Barge": ["Drill", "Chisel", "Rock", "Core", "Grind", "Pick", "Burrow"],
    "Dreadnought": ["Dread", "Crush", "Hammer", "Smash", "Fortress", "Titan", "Break"],
    "Freighter": ["Bulk", "Cargo", "Vault", "Crate", "Mass", "Hauler", "Block"],
    "Command Ship": ["Order", "Alpha", "Lead", "Signal", "Chant", "Overseer", "Fury"],
    "Interdictor": ["Trap", "Cage", "Pin", "Web", "Snare", "Grip", "Net"],
    "Exhumer": ["Grind", "Crack", "Extract", "Strip", "Split", "Dust", "Shard"],
    "Carrier": ["Hive", "Nest", "Brood", "Swarm", "Flight", "Wing", "Drone"],
    "Supercarrier": ["Overnest", "Command Hive", "Overflight", "Alpha Brood", "Drone Queen", "Majestic", "Sire"],
    "Covert Ops": ["Shade", "Whisper", "Cloak", "Night", "Veil", "Wraith", "Eclipse"],
    "Interceptor": ["Flash", "Fang", "Snap", "Pursuit", "Pierce", "Strike", "Thorn"],
    "Logistics": ["Angel", "Mender", "Pulse", "Lifeline", "Nano", "Beacon", "Aid"],
    "Force Recon Ship": ["Probe", "Shroud", "Trace", "Specter", "Echo", "Vigil", "Ping"],
    "Stealth Bomber": ["Shade", "Nova", "Shadow", "Bang", "Silence", "Whisper", "Ghost"],
    "Capital Industrial Ship": ["Mill", "Forge", "Plant", "Hub", "Engine", "Stack", "Flow"],
    "Electronic Attack Ship": ["Scrambler", "Pulse", "Interfere", "Jam", "Flicker", "Buzz", "Glitch"],
    "Heavy Interdiction Cruiser": ["Clamp", "Gate", "Wall", "Hold", "Anchor", "Choke", "Wedge"],
    "Black Ops": ["Night", "Obsidian", "Void", "Gloom", "Phantom", "Echo", "Ash"],
    "Marauder": ["Ravager", "Spoil", "Ruin", "Plunder", "Reaver", "Bane", "Pillage"],
    "Jump Freighter": ["Leap", "Blink", "Phase", "Vault", "Hop", "Surge", "Gate"],
    "Combat Recon Ship": ["Specter", "Jammer", "Glare", "Scramble", "Disruptor", "Interlace", "Pierce"],
    "Industrial Command Ship": ["Overhaul", "Boss", "Plant", "Bay", "Chamber", "Load", "Dock"],
    "Strategic Cruiser": ["Shift", "Edge", "Vector", "Adapt", "Sigma", "Morph", "Alpha"],
    "Prototype Exploration Ship": ["Scan", "Glide", "Echo", "Path", "Whisper", "Trace", "Dust"],
    "Attack Battlecruiser": ["Spike", "Ram", "Smash", "Storm", "Roar", "Shatter", "Snap"],
    "Blockade Runner": ["Slip", "Dart", "Weasel", "Skip", "Slick", "Breach", "Veil"],
    "Expedition Frigate": ["Scout", "Nomad", "Path", "Dust", "Track", "Scope", "Drifter"],
    "Tactical Destroyer": ["Switch", "Mode", "Form", "Posture", "Vector", "Flick", "Gear"],
    "Lancer Dreadnought": ["Lance", "Pierce", "Beam", "Spike", "Ray", "Core", "Spear"],
    "Logistics Frigate": ["Nano", "Fix", "Aid", "Patch", "Pulse", "Glow", "Thread"],
    "Command Destroyer": ["Push", "Pulse", "Lead", "Echo", "Point", "Anchor", "Drive"],
    "Force Auxiliary": ["Guardian", "Aegis", "Ward", "Protector", "Bastion", "Shell", "Sanctum"]
};

const roleWords: Record<string, string[]> = {
    "PvP": ["Hunter", "Fang", "Strike", "Nemesis", "Blade", "Snare", "Killer"],
    "Logistics": ["Beacon", "Nano", "Angel", "Mender", "Pulse", "Hope", "Lifeline"],
    "Exploration": ["Seeker", "Scanner", "Wanderer", "Path", "Echo", "Dust", "Trace"],
    "Gank": ["Spike", "Burst", "Ash", "Ruin", "Flick", "Pain", "Crash"],
    "Scouting": ["Ghost", "Shadow", "Blink", "Scope", "Watcher", "Drifter", "Whisper"],
    "EWAR": ["Jam", "Disrupt", "Scramble", "Static", "Glitch", "Noise", "Distort"]
};

interface ShipWithCategory extends Ship {
    category: string;
}

export default function ShipSelector() {
    const { t } = useTranslation();
    const [shipNameInput, setShipNameInput] = useState('');
    const [filteredShips, setFilteredShips] = useState<ShipWithCategory[]>([]);
    const [allShips, setAllShips] = useState<ShipData>({});
    const [selectedShip, setSelectedShip] = useState<ShipWithCategory | null>(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [generatedName, setGeneratedName] = useState('');

    useEffect(() => {
        fetch('/ships_grouped_by_name.json')
            .then((res) => res.json())
            .then((data: ShipData) => setAllShips(data))
            .catch((err) => console.error('Failed to load JSON:', err));
    }, []);

    useEffect(() => {
        if (shipNameInput.length < 2) {
            setFilteredShips([]);
            return;
        }

        const matches: ShipWithCategory[] = [];

        for (const [category, ships] of Object.entries(allShips)) {
            for (const ship of ships) {
                if (ship.name.toLowerCase().startsWith(shipNameInput.toLowerCase())) {
                    matches.push({ ...ship, category });
                }
            }
        }

        setFilteredShips(matches);
    }, [shipNameInput, allShips]);

    const handleGenerate = () => {
        if (!selectedShip || !selectedRole) return;

        const categoryWords = shipCategoryWords[selectedShip.category] || [];
        const roleWordList = roleWords[selectedRole] || [];

        if (categoryWords.length === 0 || roleWordList.length === 0) {
            setGeneratedName("Can't generate name for this setup");
            return;
        }

        const word1 = categoryWords[Math.floor(Math.random() * categoryWords.length)];
        const word2 = roleWordList[Math.floor(Math.random() * roleWordList.length)];
        setGeneratedName(`${word1} ${word2}`);
    };

    return (
        <div className="ship-selector">
            <h2>{t('title')}</h2>

            <div className="form-group">
                <label>{t('search')}</label>
                <input
                    type="text"
                    className="input"
                    value={shipNameInput}
                    onChange={(e) => {
                        setShipNameInput(e.target.value);
                        setSelectedShip(null);
                        setGeneratedName('');
                    }}
                />
            </div>

            {filteredShips.length > 0 && (
                <ul className="autocomplete">
                    {filteredShips.map((ship) => (
                        <li
                            key={ship.id}
                            className="autocomplete-item"
                            onClick={() => {
                                setSelectedShip(ship);
                                setShipNameInput(ship.name);
                                setFilteredShips([]);
                                setGeneratedName('');
                            }}
                        >
                            {ship.name} <span className="category">({ship.category})</span>
                        </li>
                    ))}
                </ul>
            )}

            {selectedShip && (
                <div className="info">
                    <strong>{t('selectedShip')}:</strong> {selectedShip.name} ({selectedShip.category})
                </div>
            )}

            <div className="roles">
                <p>{t('chooseRole')}:</p>
                {Object.keys(roleWords).map((role) => (
                    <button
                        key={role}
                        className={`role-btn ${selectedRole === role ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedRole(role);
                            setGeneratedName('');
                        }}
                    >
                        {role}
                    </button>
                ))}
            </div>

            <button
                className="generate-btn"
                onClick={handleGenerate}
                disabled={!selectedShip || !selectedRole}
            >
                {t('generate')}
            </button>

            {generatedName && (
                <div className="result">
                    <strong>{t('generatedName')}:</strong> {generatedName}
                </div>
            )}
        </div>
    );
}
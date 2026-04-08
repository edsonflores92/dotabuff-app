import express from 'express';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { getDotabuffData } from './dotabuff.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../../public')));

app.get('/api/dotabuff', async (req, res) => {
  try {
    const data = await getDotabuffData();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error fetching Dotabuff data' });
  }
});

app.get('/stats', (req, res) => {
  res.json({ success: true, message: 'Endpoint de estadísticas funcionando correctamente' });
});

app.get('/heroes', async (req, res) => {
  try {
    // Usar OpenDota API directamente
    const statsUrl = 'https://api.opendota.com/api/heroStats';
    const response = await axios.get(statsUrl, { timeout: 10000 });

    const heroStats = response.data;
    const heroes = [];

    for (const hero of heroStats) {
      if (hero.localized_name && hero.pub_pick && hero.pub_win) {
        const winrate = ((hero.pub_win / hero.pub_pick) * 100).toFixed(1);
        
        heroes.push({
          name: hero.localized_name,
          winrate: parseFloat(winrate),
          role: categorizeRole(hero.localized_name, hero.roles || []),
          id: hero.id
        });
      }
    }

    if (heroes.length === 0) {
      throw new Error('No se encontraron héroes en OpenDota');
    }

    res.json({ success: true, heroes: heroes.sort((a, b) => b.winrate - a.winrate), source: 'opendota' });
  } catch (error) {
    console.error('Error fetching from OpenDota:', error.message);
    const fallbackHeroes = [
      { name: 'Anti-Mage', winrate: 48.9, role: 'Hard Carry' },
      { name: 'Axe', winrate: 52.2, role: 'Off Lane' }
    ];
    res.json({ success: true, heroes: fallbackHeroes, source: 'fallback' });
  }
});

app.get('/counterpicks/:heroId', async (req, res) => {
  const heroId = Number(req.params.heroId);
  if (!heroId || Number.isNaN(heroId)) {
    return res.status(400).json({ success: false, error: 'heroId must be a number' });
  }

  try {
    const [matchupResp, statsResp] = await Promise.all([
      axios.get(`https://api.opendota.com/api/heroes/${heroId}/matchups`, { timeout: 10000 }),
      axios.get('https://api.opendota.com/api/heroStats', { timeout: 10000 })
    ]);

    const heroMap = statsResp.data.reduce((map, hero) => {
      map[hero.id] = hero.localized_name;
      return map;
    }, {});

    const targetHeroName = heroMap[heroId] || `Hero ${heroId}`;
    const matchups = matchupResp.data
      .filter(m => m.games_played >= 30)
      .map(m => ({
        heroId: m.hero_id,
        heroName: heroMap[m.hero_id] || 'Unknown',
        games: m.games_played,
        wins: m.wins,
        winrate: parseFloat(((m.wins / m.games_played) * 100).toFixed(1)),
        counterRate: parseFloat(((1 - m.wins / m.games_played) * 100).toFixed(1))
      }));

    const bestCounters = matchups.slice().sort((a, b) => a.winrate - b.winrate).slice(0, 10);
    const counterIds = new Set(bestCounters.map(c => c.heroId));
    const bestPicks = matchups.slice()
      .filter(m => !counterIds.has(m.heroId))
      .sort((a, b) => b.winrate - a.winrate)
      .slice(0, 10);

    res.json({
      success: true,
      heroId,
      heroName: targetHeroName,
      bestCounters,
      bestPicks,
      source: 'opendota'
    });
  } catch (error) {
    console.error('Error fetching counterpicks:', error.message);
    res.status(500).json({ success: false, error: 'Error fetching counterpicks' });
  }
});

const manualRoleMap = {
  'Anti-Mage': 'Hard Carry',
  'Axe': 'Off Lane',
  'Bane': 'Support',
  'Batrider': 'Off Lane',
  'Beastmaster': 'Off Lane',
  'Bloodseeker': 'Mid',
  'Bounty Hunter': 'Mid',
  'Brewmaster': 'Off Lane',
  'Bristleback': 'Off Lane',
  'Broodmother': 'Off Lane',
  'Centaur Warrunner': 'Off Lane',
  'Chaos Knight': 'Hard Carry',
  'Chen': 'Support',
  'Clinkz': 'Hard Carry',
  'Crystal Maiden': 'Support',
  'Dark Seer': 'Off Lane',
  'Dazzle': 'Support',
  'Death Prophet': 'Mid',
  'Disruptor': 'Support',
  'Doom': 'Off Lane',
  'Dragon Knight': 'Mid',
  'Drow Ranger': 'Hard Carry',
  'Earth Spirit': 'Off Lane',
  'Earthshaker': 'Off Lane',
  'Elder Titan': 'Support',
  'Ember Spirit': 'Mid',
  'Enchantress': 'Support',
  'Enigma': 'Off Lane',
  'Faceless Void': 'Hard Carry',
  'Grimstroke': 'Support',
  'Gyrocopter': 'Hard Carry',
  'Hoodwink': 'Off Lane',
  'Huskar': 'Off Lane',
  'Invoker': 'Mid',
  'Io': 'Support',
  'Jakiro': 'Support',
  'Juggernaut': 'Hard Carry',
  'Keeper of the Light': 'Support',
  'Kunkka': 'Mid',
  'Legion Commander': 'Off Lane',
  'Leshrac': 'Mid',
  'Lich': 'Support',
  'Lifestealer': 'Hard Carry',
  'Lina': 'Mid',
  'Lion': 'Support',
  'Lone Druid': 'Hard Carry',
  'Luna': 'Hard Carry',
  'Lycan': 'Hard Carry',
  'Magnus': 'Off Lane',
  'Marci': 'Off Lane',
  'Mars': 'Off Lane',
  'Medusa': 'Hard Carry',
  'Meepo': 'Hard Carry',
  'Mirana': 'Mid',
  'Monkey King': 'Off Lane',
  'Morphling': 'Hard Carry',
  'Naga Siren': 'Hard Carry',
  "Nature's Prophet": 'Off Lane',
  'Necrophos': 'Mid',
  'Night Stalker': 'Off Lane',
  'Nyx Assassin': 'Off Lane',
  'Ogre Magi': 'Support',
  'Omniknight': 'Support',
  'Oracle': 'Support',
  'Outworld Devourer': 'Mid',
  'Pangolier': 'Off Lane',
  'Phantom Assassin': 'Hard Carry',
  'Phantom Lancer': 'Hard Carry',
  'Phoenix': 'Support',
  'Puck': 'Mid',
  'Pudge': 'Off Lane',
  'Pugna': 'Mid',
  'Queen of Pain': 'Mid',
  'Razor': 'Mid',
  'Rhasta': 'Support',
  'Riki': 'Off Lane',
  'Rubick': 'Support',
  'Sand King': 'Off Lane',
  'Shadow Demon': 'Support',
  'Shadow Fiend': 'Mid',
  'Shadow Shaman': 'Support',
  'Silencer': 'Support',
  'Skywrath Mage': 'Support',
  'Slardar': 'Off Lane',
  'Slark': 'Hard Carry',
  'Snapfire': 'Support',
  'Sniper': 'Hard Carry',
  'Spectre': 'Hard Carry',
  'Spirit Breaker': 'Off Lane',
  'Storm Spirit': 'Mid',
  'Sven': 'Hard Carry',
  'Techies': 'Support',
  'Templar Assassin': 'Mid',
  'Terrorblade': 'Hard Carry',
  'Tidehunter': 'Off Lane',
  'Timbersaw': 'Off Lane',
  'Tinker': 'Mid',
  'Tiny': 'Mid',
  'Treant Protector': 'Support',
  'Troll Warlord': 'Hard Carry',
  'Tusk': 'Support',
  'Underlord': 'Off Lane',
  'Undying': 'Support',
  'Ursa': 'Hard Carry',
  'Vengeful Spirit': 'Support',
  'Venomancer': 'Support',
  'Viper': 'Mid',
  'Visage': 'Support',
  'Void Spirit': 'Mid',
  'Warlock': 'Support',
  'Weaver': 'Off Lane',
  'Windranger': 'Mid',
  'Winter Wyvern': 'Support',
  'Witch Doctor': 'Support',
  'Wraith King': 'Hard Carry',
  'Zeus': 'Mid'
};

// Función para categorizar roles de OpenDota a 4 categorías
function categorizeRole(name, roles) {
  if (manualRoleMap[name]) {
    return manualRoleMap[name];
  }

  if (!Array.isArray(roles) || roles.length === 0) return 'Unknown';

  // Fallback genérico por role array
  if (roles.includes('Carry')) return 'Hard Carry';
  if (roles.includes('Support')) return 'Support';
  if (roles.includes('Nuker') || roles.includes('Escape') || roles.includes('Ganker')) return 'Mid';
  if (roles.includes('Initiator') || roles.includes('Durable') || roles.includes('Disabler')) return 'Off Lane';
  if (roles.includes('Jungler')) return 'Off Lane';
  return roles[0];
}

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.listen(port, () => {
  console.log(`Dotabuff app listening at http://localhost:${port}`);
});

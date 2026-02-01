/**
 * Script to fetch all Daggerheart adversaries from GitHub
 * and convert them to a JavaScript data file
 *
 * Run with: node scripts/fetch-adversaries.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_API = 'https://api.github.com/repos/seansbox/daggerheart-srd/contents/adversaries';
const RAW_BASE = 'https://raw.githubusercontent.com/seansbox/daggerheart-srd/main/adversaries/';

function fetch(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'User-Agent': 'Daggerheart-Campaign-Manager' }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

function parseAdversaryMarkdown(markdown, filename) {
  const lines = markdown.split('\n');
  const adversary = {
    name: filename.replace('.md', ''),
    tier: 1,
    role: '',
    description: '',
    motives: '',
    difficulty: 0,
    thresholds: { minor: 0, major: 0 },
    hp: 0,
    stress: 0,
    attack: 0,
    attackName: '',
    attackRange: '',
    attackDamage: '',
    experience: '',
    features: []
  };

  let inFeatures = false;
  let currentFeature = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Name from H1
    if (line.startsWith('# ')) {
      adversary.name = line.replace('# ', '').trim();
      continue;
    }

    // Tier and Role line (bold italic)
    if (line.startsWith('**_Tier')) {
      const match = line.match(/\*\*_Tier (\d+) (\w+)/i);
      if (match) {
        adversary.tier = parseInt(match[1]);
        adversary.role = match[2].toLowerCase();
      }
      // Description is the rest after the role
      const descMatch = line.match(/\._\*\*\s*_(.+)_$/);
      if (descMatch) {
        adversary.description = descMatch[1].trim();
      }
      continue;
    }

    // Motives & Tactics
    if (line.includes('Motives & Tactics:')) {
      const match = line.match(/Motives & Tactics:\*\*\s*(.+)/);
      if (match) {
        adversary.motives = match[1].trim();
      }
      continue;
    }

    // Stats line: Difficulty, Thresholds, HP, Stress
    if (line.includes('Difficulty:')) {
      // Parse: **Difficulty:** 13 | **Thresholds:** 7/13 | **HP:** 6 | **Stress:** 3
      const diffMatch = line.match(/Difficulty:\*\*\s*(\d+)/);
      if (diffMatch) adversary.difficulty = parseInt(diffMatch[1]);

      const threshMatch = line.match(/Thresholds:\*\*\s*(\d+)\/(\d+)/);
      if (threshMatch) {
        adversary.thresholds.minor = parseInt(threshMatch[1]);
        adversary.thresholds.major = parseInt(threshMatch[2]);
      }

      const hpMatch = line.match(/HP:\*\*\s*(\d+)/);
      if (hpMatch) adversary.hp = parseInt(hpMatch[1]);

      const stressMatch = line.match(/Stress:\*\*\s*(\d+)/);
      if (stressMatch) adversary.stress = parseInt(stressMatch[1]);
      continue;
    }

    // Attack line
    if (line.includes('ATK:')) {
      const atkMatch = line.match(/ATK:\*\*\s*([+-]?\d+)/);
      if (atkMatch) adversary.attack = parseInt(atkMatch[1]);

      // Parse attack info: **Pincers:** Melee | 1d12+2 phy
      const attackInfoMatch = line.match(/\*\*(\w+):\*\*\s*(\w+)\s*\|\s*(.+)/);
      if (attackInfoMatch) {
        adversary.attackName = attackInfoMatch[1];
        adversary.attackRange = attackInfoMatch[2];
        adversary.attackDamage = attackInfoMatch[3].trim();
      }
      continue;
    }

    // Experience line
    if (line.includes('Experience:')) {
      const expMatch = line.match(/Experience:\*\*\s*(.+)/);
      if (expMatch) adversary.experience = expMatch[1].trim();
      continue;
    }

    // Features section
    if (line === '### FEATURES') {
      inFeatures = true;
      continue;
    }

    // Parse features
    if (inFeatures && line.startsWith('**_')) {
      // New feature: **_Double Strike - Action:_** description
      const featureMatch = line.match(/\*\*_(.+?)(?:\s*-\s*(\w+))?:_\*\*\s*(.*)/);
      if (featureMatch) {
        currentFeature = {
          name: featureMatch[1].trim(),
          type: featureMatch[2] ? featureMatch[2].toLowerCase() : 'passive',
          description: featureMatch[3].trim()
        };
        adversary.features.push(currentFeature);
      }
    } else if (inFeatures && currentFeature && line && !line.startsWith('#')) {
      // Continuation of feature description
      currentFeature.description += ' ' + line;
    }
  }

  // Clean up feature descriptions
  adversary.features.forEach(f => {
    f.description = f.description.trim();
  });

  return adversary;
}

async function main() {
  console.log('Fetching adversary list from GitHub...');

  const listData = await fetch(GITHUB_API);
  const files = JSON.parse(listData);

  console.log(`Found ${files.length} adversary files`);

  const adversaries = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.name.endsWith('.md')) continue;

    process.stdout.write(`\rFetching ${i + 1}/${files.length}: ${file.name}...`);

    try {
      const markdown = await fetch(file.download_url);
      const adversary = parseAdversaryMarkdown(markdown, file.name);
      adversaries.push(adversary);

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.error(`\nError fetching ${file.name}:`, err.message);
    }
  }

  console.log(`\n\nParsed ${adversaries.length} adversaries`);

  // Sort by tier then name
  adversaries.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.name.localeCompare(b.name);
  });

  // Generate JS file
  const output = `/**
 * Official Daggerheart Adversaries from daggerheart-srd
 * Auto-generated from: https://github.com/seansbox/daggerheart-srd/tree/main/adversaries
 * Generated: ${new Date().toISOString()}
 *
 * These can be imported into campaigns as template adversaries
 */

export const DAGGERHEART_ADVERSARIES = ${JSON.stringify(adversaries, null, 2)};

// Group by tier
export const ADVERSARIES_BY_TIER = {
  1: DAGGERHEART_ADVERSARIES.filter(a => a.tier === 1),
  2: DAGGERHEART_ADVERSARIES.filter(a => a.tier === 2),
  3: DAGGERHEART_ADVERSARIES.filter(a => a.tier === 3),
  4: DAGGERHEART_ADVERSARIES.filter(a => a.tier === 4)
};

// Group by role
export const ADVERSARIES_BY_ROLE = {
  bruiser: DAGGERHEART_ADVERSARIES.filter(a => a.role === 'bruiser'),
  skulk: DAGGERHEART_ADVERSARIES.filter(a => a.role === 'skulk'),
  social: DAGGERHEART_ADVERSARIES.filter(a => a.role === 'social'),
  solo: DAGGERHEART_ADVERSARIES.filter(a => a.role === 'solo'),
  leader: DAGGERHEART_ADVERSARIES.filter(a => a.role === 'leader'),
  support: DAGGERHEART_ADVERSARIES.filter(a => a.role === 'support'),
  horde: DAGGERHEART_ADVERSARIES.filter(a => a.role === 'horde'),
  ranged: DAGGERHEART_ADVERSARIES.filter(a => a.role === 'ranged')
};

export default DAGGERHEART_ADVERSARIES;
`;

  const outputPath = path.join(__dirname, '../src/data/daggerheartAdversaries.js');
  fs.writeFileSync(outputPath, output);

  console.log(`\nWritten to: ${outputPath}`);
  console.log('\nSample adversary:');
  console.log(JSON.stringify(adversaries[0], null, 2));
}

main().catch(console.error);

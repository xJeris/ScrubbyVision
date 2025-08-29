const express     = require('express');
const bodyParser  = require('body-parser');
const multer      = require('multer');
const fs          = require('fs');
const path        = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '../data/characters.json');

// Middleware for JSON bodies
app.use(bodyParser.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

// Multer setup: store uploads in memory, restrict to .txt
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.txt$/)) {
      return cb(new Error('Only .txt files are allowed'), false);
    }
    cb(null, true);
  }
});

// Utility to read/write data file
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeData(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf-8');
}

// POST /upload — upload a .txt file + secret key
app.post('/upload', upload.single('file'), (req, res) => {
  const userKey = req.body.key;
  if (!userKey) {
    return res.status(400).json({ error: 'Missing key' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Missing file' });
  }

  let payload;
  try {
    payload = JSON.parse(req.file.buffer.toString());
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON in file' });
  }

  // Extract only desired fields
  const {
    CharName, CharClass, CharLevel, CharacterInv,
    CharacterEquip, EquipSlotQuantities,
    CharacterSpells, CharacterSkills, TutorialsDone,
    CurHP, CurMana, CurrentXP, Gold,
    CompletedQuests, ActiveQuests,
    Keyring, AuraItem, CharmItem, CharmQual
  } = payload;

  // Build record
  const record = {
    key: userKey,
    CharName, CharClass, CharLevel, CharacterInv,
    CharacterEquip, EquipSlotQuantities,
    CharacterSpells, CharacterSkills, TutorialsDone,
    CurHP, CurMana, CurrentXP, Gold,
    CompletedQuests, ActiveQuests,
    Keyring, AuraItem, CharmItem, CharmQual
  };

  const all = readData();
  const existing = all.find(obj => obj.key === userKey);

  if (existing) {
    // preserve its index, replace data
    const idx = existing.index;
    record.index = idx;
    const updated = all.map(obj => obj.key === userKey ? record : obj);
    writeData(updated);
    return res.json({ success: true, message: 'Character updated', index: idx });
  } else {
    // new entry
    const nextIndex = all.length > 0
      ? Math.max(...all.map(o => o.index)) + 1
      : 1;
    record.index = nextIndex;
    all.push(record);
    writeData(all);
    return res.json({ success: true, message: 'Character added', index: nextIndex });
  }
});

// GET /characters — list all names + indices (no keys)
app.get('/characters', (req, res) => {
  const all = readData();
  const list = all.map(({ index, CharName }) => ({ index, CharName }));
  res.json(list);
});

// GET /character/:index — full data for one character
app.get('/character/:index', (req, res) => {
  const idx = parseInt(req.params.index, 10);
  const all = readData();
  const found = all.find(obj => obj.index === idx);
  if (!found) {
    return res.status(404).json({ error: 'Character not found' });
  }
  // do not expose the key
  const { key, ...publicData } = found;
  res.json(publicData);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

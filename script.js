const STORAGE_KEY = 'nest-sotra-savedGroups';
const GROUP_LEVELS = ['Gr1', 'Gr2', 'Gr3', 'Keeper'];

let players = [];

function setStatus(message, isError = false) {
  const statusEl = document.getElementById('statusMessage');
  if (!statusEl) return;

  statusEl.textContent = message || '';
  statusEl.classList.toggle('visible', Boolean(message));
  statusEl.classList.toggle('error', isError);
}

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn('Kunne ikke lese lagret data:', error);
    return fallback;
  }
}

function loadSavedGroups() {
  return safeParseJSON(localStorage.getItem(STORAGE_KEY), {});
}

function saveGroup(name, level) {
  const saved = loadSavedGroups();
  saved[name] = level;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

function clearSavedGroups() {
  localStorage.removeItem(STORAGE_KEY);
}

function isKnownGroup(level) {
  return GROUP_LEVELS.includes(level);
}

function getDefaultGroupForPlayer(name) {
  const savedGroups = loadSavedGroups();
  const saved = savedGroups[name];
  return isKnownGroup(saved) ? saved : 'Gr3';
}

function buildGroupMap() {
  return {
    Gr1: [],
    Gr2: [],
    Gr3: [],
    Keeper: []
  };
}

function createGroupListItem(name) {
  const li = document.createElement('li');
  li.textContent = name;
  li.draggable = true;
  li.dataset.name = name;

  li.addEventListener('dragstart', event => {
    li.classList.add('dragging');
    event.dataTransfer.setData('text/plain', name);
  });

  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
  });

  return li;
}

function renderGroupList(ul, names) {
  ul.innerHTML = '';
  names.forEach(name => {
    ul.appendChild(createGroupListItem(name));
  });
}

function updateGroups() {
  const groups = buildGroupMap();

  players.forEach(player => {
    if (groups[player.level]) {
      groups[player.level].push(player.name);
    }
  });

  Object.keys(groups).forEach(key => groups[key].sort((a, b) => a.localeCompare(b, 'nb')));

  renderGroupList(document.getElementById('gr1List'), groups.Gr1);
  renderGroupList(document.getElementById('gr2List'), groups.Gr2);
  renderGroupList(document.getElementById('gr3List'), groups.Gr3);
  renderGroupList(document.getElementById('keeperList'), groups.Keeper);

  window.generatedText =
    `Gr1:\n${groups.Gr1.join('\n')}\n\n` +
    `Gr2:\n${groups.Gr2.join('\n')}\n\n` +
    `Gr3:\n${groups.Gr3.join('\n')}\n\n` +
    `Keeper:\n${groups.Keeper.join('\n')}\n\n`;
}

function attachGroupDropHandlers() {
  const groupLists = [
    { element: document.getElementById('gr1List'), level: 'Gr1' },
    { element: document.getElementById('gr2List'), level: 'Gr2' },
    { element: document.getElementById('gr3List'), level: 'Gr3' },
    { element: document.getElementById('keeperList'), level: 'Keeper' }
  ];

  groupLists.forEach(({ element, level }) => {
    element.addEventListener('dragover', event => {
      event.preventDefault();
      element.classList.add('drag-target');
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-target');
    });

    element.addEventListener('drop', event => {
      event.preventDefault();
      element.classList.remove('drag-target');

      const name = event.dataTransfer.getData('text/plain');
      const player = players.find(item => item.name === name);

      if (!player) return;

      player.level = level;
      if (player.select) {
        player.select.value = level;
      }

      saveGroup(name, level);
      updateGroups();

      element.classList.add('group-flash');
      setTimeout(() => element.classList.remove('group-flash'), 400);

      const draggedItem = element.querySelector(`li[data-name="${CSS.escape(name)}"]`);
      if (draggedItem) {
        draggedItem.classList.add('player-drop-anim');
        setTimeout(() => draggedItem.classList.remove('player-drop-anim'), 300);
      }
    });
  });
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function isAttendingStatus(value) {
  const status = normalizeStatus(value);
  return ['kommer', 'attending', 'coming', 'yes', 'ja', 'true'].includes(status);
}

function findSheet(workbook) {
  const priorityNames = ['deltaker', 'medlemmer', 'players', 'participants', 'spond', 'sheet1'];

  const exactMatch = workbook.SheetNames.find(name => {
    const normalized = name.toLowerCase();
    return priorityNames.some(keyword => normalized.includes(keyword));
  });

  return exactMatch || workbook.SheetNames[0];
}

function parsePlayersFromRows(rows) {
  const headerIndex = rows.findIndex(row => {
    if (!Array.isArray(row)) return false;
    const values = row.map(cell => String(cell || '').trim().toLowerCase());
    return values.includes('status') && values.includes('navn');
  });

  if (headerIndex === -1) {
    throw new Error("Fant ikke kolonnene 'Status' og 'Navn' i filen.");
  }

  const headerRow = rows[headerIndex];
  const statusCol = headerRow.findIndex(cell => String(cell || '').trim().toLowerCase() === 'status');
  const nameCol = headerRow.findIndex(cell => String(cell || '').trim().toLowerCase() === 'navn');

  if (statusCol === -1 || nameCol === -1) {
    throw new Error("Excel-filen har ikke forventede kolonner.");
  }

  const parsedPlayers = [];
  rows.slice(headerIndex + 1).forEach(row => {
    if (!Array.isArray(row)) return;

    const status = normalizeStatus(row[statusCol]);
    const name = String(row[nameCol] || '').trim();

    if (!name || !isAttendingStatus(status)) return;

    if (parsedPlayers.some(player => player.name === name)) return;

    parsedPlayers.push({ name });
  });

  return parsedPlayers;
}

function createPlayerRow(player) {
  const li = document.createElement('li');
  const select = document.createElement('select');

  GROUP_LEVELS.forEach(level => {
    const option = document.createElement('option');
    option.value = level;
    option.textContent = level;
    select.appendChild(option);
  });

  select.value = getDefaultGroupForPlayer(player.name);

  const nameSpan = document.createElement('span');
  nameSpan.textContent = player.name;

  select.addEventListener('change', () => {
    const currentPlayer = players.find(item => item.name === player.name);
    if (!currentPlayer) return;

    currentPlayer.level = select.value;
    saveGroup(player.name, select.value);
    updateGroups();
  });

  li.appendChild(select);
  li.appendChild(nameSpan);

  player.select = select;
  player.level = select.value;

  return li;
}

function renderPlayersList() {
  const playerList = document.getElementById('playerList');
  if (!playerList) return;

  playerList.innerHTML = '';
  players.forEach(player => {
    playerList.appendChild(createPlayerRow(player));
  });
}

function resetPlayerGroups() {
  players.forEach(player => {
    player.level = 'Gr3';
    if (player.select) {
      player.select.value = 'Gr3';
    }
  });

  clearSavedGroups();
  updateGroups();
  setStatus('Grupper ble nullstilt til standardinnstillinger.');
}

function importFiles() {
  const fileInput = document.getElementById('fileInput');
  const files = Array.from(fileInput.files || []);

  if (files.length === 0) {
    setStatus('Velg minst én Excel-fil før du importerer.', true);
    return;
  }

  players = [];
  const playerList = document.getElementById('playerList');
  if (playerList) playerList.innerHTML = '';

  let importedCount = 0;
  let hasError = false;

  files.forEach(file => {
    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[findSheet(workbook)];

        if (!sheet) {
          throw new Error('Fant ingen gyldig sheet i Excel-filen.');
        }

        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        const parsedPlayers = parsePlayersFromRows(rows);

        parsedPlayers.forEach(player => {
          if (players.some(existing => existing.name === player.name)) return;

          players.push({
            name: player.name,
            level: getDefaultGroupForPlayer(player.name)
          });
        });

        importedCount += parsedPlayers.length;

        renderPlayersList();
        updateGroups();
      } catch (error) {
        console.error(error);
        hasError = true;
        setStatus(error.message || 'Kunne ikke lese filen.', true);
      }
    };

    reader.onerror = function () {
      hasError = true;
      setStatus('Kunne ikke lese valgt fil.', true);
    };

    reader.readAsArrayBuffer(file);
  });

  setTimeout(() => {
    if (!hasError && importedCount > 0) {
      setStatus(`Importerte ${importedCount} spillere.`);
    } else if (!hasError) {
      setStatus('Fant ingen spillere med status «kommer» i valgt fil.', true);
    }
  }, 200);
}

function copyGeneratedText() {
  if (!window.generatedText) {
    setStatus('Du må importere spillere først.', true);
    return;
  }

  navigator.clipboard.writeText(window.generatedText)
    .then(() => setStatus('Puljer kopiert!'))
    .catch(() => setStatus('Kunne ikke kopiere puljer.', true));
}

document.addEventListener('DOMContentLoaded', () => {
  attachGroupDropHandlers();

  const importButton = document.getElementById('importButton');
  const copyButton = document.getElementById('copyButton');
  const resetButton = document.getElementById('resetButton');

  if (importButton) {
    importButton.addEventListener('click', importFiles);
  }

  if (copyButton) {
    copyButton.addEventListener('click', copyGeneratedText);
  }

  if (resetButton) {
    resetButton.addEventListener('click', resetPlayerGroups);
  }

  updateGroups();
});

window.addEventListener('load', () => {
  updateGroups();
});
path":"script.js
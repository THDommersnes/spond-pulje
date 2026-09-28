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

function loadSavedGroups() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (error) {
    console.warn('Kunne ikke lese lagret grupper:', error);
    return {};
  }
}

function saveGroup(name, level) {
  const saved = loadSavedGroups();
  saved[name] = level;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

function updateGroups() {
  const groups = { Gr1: [], Gr2: [], Gr3: [], Keeper: [] };

  players.forEach(player => {
    if (groups[player.level]) {
      groups[player.level].push(player.name);
    }
  });

  Object.keys(groups).forEach(key => groups[key].sort((a, b) => a.localeCompare(b, 'nb')));

  const groupIds = ['gr1List', 'gr2List', 'gr3List', 'keeperList'];
  groupIds.forEach(id => {
    const ul = document.getElementById(id);
    if (!ul) return;
    ul.innerHTML = '';
  });

  document.getElementById('gr1List').innerHTML = groups.Gr1.map(name => `<li>${name}</li>`).join('');
  document.getElementById('gr2List').innerHTML = groups.Gr2.map(name => `<li>${name}</li>`).join('');
  document.getElementById('gr3List').innerHTML = groups.Gr3.map(name => `<li>${name}</li>`).join('');
  document.getElementById('keeperList').innerHTML = groups.Keeper.map(name => `<li>${name}</li>`).join('');

  window.generatedText =
    `Gr1:\n${groups.Gr1.join('\n')}\n\n` +
    `Gr2:\n${groups.Gr2.join('\n')}\n\n` +
    `Gr3:\n${groups.Gr3.join('\n')}\n\n` +
    `Keeper:\n${groups.Keeper.join('\n')}\n\n`;
}

function enableGroupDragAndDrop() {
  const lists = [
    { element: document.getElementById('gr1List'), level: 'Gr1' },
    { element: document.getElementById('gr2List'), level: 'Gr2' },
    { element: document.getElementById('gr3List'), level: 'Gr3' },
    { element: document.getElementById('keeperList'), level: 'Keeper' }
  ];

  lists.forEach(({ element, level }) => {
    if (!element) return;

    element.onDragOver = e => {
      e.preventDefault();
      element.classList.add('drag-target');
    };

    element.onDragLeave = () => {
      element.classList.remove('drag-target');
    };

    element.onDrop = e => {
      e.preventDefault();
      element.classList.remove('drag-target');
      const name = e.dataTransfer.getData('text/plain');
      const player = players.find(p => p.name === name);
      if (!player) return;

      player.level = level;
      if (player.select) player.select.value = level;
      saveGroup(name, level);
      updateGroups();

      element.classList.add('group-flash');
      setTimeout(() => element.classList.remove('group-flash'), 400);

      const li = [...element.querySelectorAll('li')].find(x => x.textContent.trim() === name);
      if (li) {
        li.classList.add('player-drop-anim');
        setTimeout(() => li.classList.remove('player-drop-anim'), 300);
      }
    };
  });

  document.querySelectorAll('#gr1List li, #gr2List li, #gr3List li, #keeperList li').forEach(li => {
    li.draggable = true;
    li.addEventListener('dragstart', e => {
      li.classList.add('dragging');
      e.dataTransfer.setData('text/plain', li.textContent.trim());
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
    });
  });
}

function getSavedGroupForName(name) {
  const savedGroups = loadSavedGroups();
  return GROUP_LEVELS.includes(savedGroups[name]) ? savedGroups[name] : 'Gr3';
}

function importFiles() {
  const files = Array.from(document.getElementById('fileInput').files || []);
  if (files.length === 0) {
    setStatus('Velg minst én Excel-fil.', true);
    return;
  }

  players = [];
  const savedGroups = loadSavedGroups();
  const playerList = document.getElementById('playerList');
  if (playerList) playerList.innerHTML = '';

  let processedFiles = 0;
  let importedCount = 0;
  let hasError = false;

  files.forEach(file => {
    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheet = workbook.Sheets[workbook.SheetNames[1]] || workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) {
          throw new Error('Fant ikke noe ark i Excel-filen.');
        }

        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

        const headerIndex = rows.findIndex(r => {
          if (!Array.isArray(r)) return false;
          const values = r.map(cell => (cell || '').toString().trim().toLowerCase());
          return values.includes('status') && values.includes('navn');
        });

        if (headerIndex === -1) {
          throw new Error("Fant ikke kolonnene 'Status' og 'Navn' i filen.");
        }

        const headerRow = rows[headerIndex];
        const statusCol = headerRow.findIndex(cell => (cell || '').toString().trim().toLowerCase() === 'status');
        const nameCol = headerRow.findIndex(cell => (cell || '').toString().trim().toLowerCase() === 'navn');

        if (statusCol === -1 || nameCol === -1) {
          throw new Error("Fant ikke kolonnene 'Status' og 'Navn' i filen.");
        }

        rows.slice(headerIndex + 1).forEach(row => {
          if (!Array.isArray(row)) return;
          const status = (row[statusCol] || '').toString().trim().toLowerCase();
          const name = (row[nameCol] || '').toString().trim();

          if (status === 'kommer' && name !== '') {
            if (players.some(p => p.name === name)) return;

            const li = document.createElement('li');
            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;

            const select = document.createElement('select');
            GROUP_LEVELS.forEach(level => {
              const option = document.createElement('option');
              option.value = level;
              option.textContent = level;
              select.appendChild(option);
            });

            select.value = savedGroups[name] && GROUP_LEVELS.includes(savedGroups[name]) ? savedGroups[name] : 'Gr3';

            select.addEventListener('change', () => {
              const p = players.find(x => x.name === name);
              if (!p) return;
              p.level = select.value;
              saveGroup(name, select.value);
              updateGroups();
              enableGroupDragAndDrop();
            });

            players.push({ name, level: select.value, select });
            li.appendChild(select);
            li.appendChild(nameSpan);
            playerList.appendChild(li);
            importedCount += 1;
          }
        });
      } catch (error) {
        console.error(error);
        hasError = true;
        setStatus(error.message || 'Kunne ikke lese filen.', true);
      } finally {
        processedFiles += 1;
        if (processedFiles === files.length) {
          updateGroups();
          enableGroupDragAndDrop();

          if (!hasError && importedCount > 0) {
            setStatus(`Importerte ${importedCount} spillere.`);
          } else if (!hasError && importedCount === 0) {
            setStatus('Fant ingen spillere med status «kommer».', true);
          }
        }
      }
    };

    reader.onerror = () => {
      hasError = true;
      processedFiles += 1;
      setStatus('Kunne ikke lese valgt fil.', true);
    };

    reader.readAsArrayBuffer(file);
  });
}

document.getElementById('importButton').addEventListener('click', importFiles);

document.getElementById('copyButton').addEventListener('click', () => {
  if (!window.generatedText) {
    setStatus('Du må importere spillere først.', true);
    return;
  }

  navigator.clipboard.writeText(window.generatedText)
    .then(() => setStatus('Puljer kopiert!'))
    .catch(() => setStatus('Kunne ikke kopiere.', true));
});

window.addEventListener('load', () => {
  updateGroups();
  enableGroupDragAndDrop();
});

if (document.readyState !== 'loading') {
  updateGroups();
  enableGroupDragAndDrop();
}

console.log('XLSX er:', XLSX);

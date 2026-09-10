// rebuild – markerer at filen er oppdatert

console.log("XLSX er:", XLSX);

let players = [];

/* ⭐ Lagring av grupper i localStorage */
function saveGroup(name, level) {
  const saved = JSON.parse(localStorage.getItem("savedGroups") || "{}");
  saved[name] = level;
  localStorage.setItem("savedGroups", JSON.stringify(saved));
}

function loadSavedGroups() {
  return JSON.parse(localStorage.getItem("savedGroups") || "{}");
}

/* ⭐ Oppdaterer alle grupper basert på players[] */
function updateGroups() {
  const groups = {
    Gr1: [],
    Gr2: [],
    Gr3: [],
    Keeper: []
  };

  players.forEach(p => {
    if (groups[p.level]) groups[p.level].push(p.name);
  });

  Object.keys(groups).forEach(key => groups[key].sort());

  document.getElementById("gr1List").innerHTML = groups.Gr1.map(n => `<li>${n}</li>`).join("");
  document.getElementById("gr2List").innerHTML = groups.Gr2.map(n => `<li>${n}</li>`).join("");
  document.getElementById("gr3List").innerHTML = groups.Gr3.map(n => `<li>${n}</li>`).join("");
  document.getElementById("keeperList").innerHTML = groups.Keeper.map(n => `<li>${n}</li>`).join("");

  window.generatedText =
    `Gr1:\n${groups.Gr1.join("\n")}\n\n` +
    `Gr2:\n${groups.Gr2.join("\n")}\n\n` +
    `Gr3:\n${groups.Gr3.join("\n")}\n\n` +
    `Keeper:\n${groups.Keeper.join("\n")}\n\n`;
}

/* ⭐ Import av Spond-filer */
document.getElementById('importButton').addEventListener('click', () => {
  const files = Array.from(document.getElementById('fileInput').files);

  if (files.length === 0) {
    console.warn("Ingen filer valgt");
    return;
  }

  players = [];
  const savedGroups = loadSavedGroups();

  const playerList = document.getElementById('playerList');
  playerList.innerHTML = "";

  files.forEach(file => {
    const reader = new FileReader();

    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const sheetName = workbook.SheetNames[1];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      /* ⭐ Finn header-raden */
      const headerIndex = rows.findIndex(r =>
        r.some(cell => (cell + "").trim().toLowerCase() === "status") &&
        r.some(cell => (cell + "").trim().toLowerCase() === "navn")
      );

      if (headerIndex === -1) {
        console.warn("Fant ikke kolonnene 'Status' og 'Navn' i filen.");
        return;
      }

      const headerRow = rows[headerIndex];
      const statusCol = headerRow.findIndex(c => (c + "").trim().toLowerCase() === "status");
      const nameCol = headerRow.findIndex(c => (c + "").trim().toLowerCase() === "navn");

      const tableRows = rows.slice(headerIndex + 1);

      /* ⭐ Les hver rad i tabellen */
      tableRows.forEach(row => {
        const status = (row[statusCol] || "").toString().trim().toLowerCase();
        const name = (row[nameCol] || "").toString().trim();

        if (status === "kommer" && name !== "") {

          // Unngå duplikater
          if (players.some(p => p.name === name)) return;

          const li = document.createElement("li");

          const nameSpan = document.createElement("span");
          nameSpan.textContent = name;

          const select = document.createElement("select");
          ["Gr1", "Gr2", "Gr3", "Keeper"].forEach(level => {
            const option = document.createElement("option");
            option.value = level;
            option.textContent = level;
            select.appendChild(option);
          });

          /* ⭐ Hvis spilleren har lagret gruppe → bruk den */
          if (savedGroups[name]) {
            select.value = savedGroups[name];
          } else {
            select.value = "Gr3"; // default
          }

          players.push({ name, level: select.value, select });

          /* ⭐ Oppdater grupper når dropdown endres */
          select.addEventListener("change", () => {
            const p = players.find(x => x.name === name);
            p.level = select.value;
            saveGroup(name, select.value);
            updateGroups();
          });

          /* ⭐ Riktig rekkefølge for PC/mobil */
          li.appendChild(select);
          li.appendChild(nameSpan);

          playerList.appendChild(li);
        }
      });

      updateGroups();
    };

    reader.readAsArrayBuffer(file);
  });
});

/* ⭐ Kopier-knapp */
document.getElementById("copyButton").addEventListener("click", () => {
  if (!window.generatedText) {
    alert("Du må importere spillere først.");
    return;
  }

  navigator.clipboard.writeText(window.generatedText)
    .then(() => alert("Puljer kopiert!"))
    .catch(() => alert("Kunne ikke kopiere."));
});

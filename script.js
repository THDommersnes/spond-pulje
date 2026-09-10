// rebuild
console.log("XLSX er:", XLSX);

let players = [];

document.getElementById('importButton').addEventListener('click', () => {
  const files = Array.from(document.getElementById('fileInput').files);

  if (files.length === 0) {
    console.warn("Ingen filer valgt");
    return;
  }

  players = [];
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

      let headerIndex = rows.findIndex(r =>
        r.some(cell => (cell + "").trim().toLowerCase() === "status") &&
        r.some(cell => (cell + "").trim().toLowerCase() === "navn")
      );

      if (headerIndex === -1) {
        console.warn("Fant ikke kolonnene 'Status' og 'Navn' i filen.");
        return;
      }

      const headerRow = rows[headerIndex];

      const statusCol = headerRow.findIndex(c =>
        (c + "").trim().toLowerCase() === "status"
      );

      const nameCol = headerRow.findIndex(c =>
        (c + "").trim().toLowerCase() === "navn"
      );

      const tableRows = rows.slice(headerIndex + 1);

      tableRows.forEach(row => {
        const status = (row[statusCol] || "").toString().trim().toLowerCase();
        const name = (row[nameCol] || "").toString().trim();

        if (status === "kommer" && name !== "") {

          if (players.some(p => p.name === name)) return;

          const li = document.createElement("li");

          const nameSpan = document.createElement("span");
          nameSpan.textContent = name + " ";

          const select = document.createElement("select");

          ["Gr1", "Gr2", "Gr3", "Keeper"].forEach(level => {
            const option = document.createElement("option");
            option.value = level;
            option.textContent = level;
            select.appendChild(option);
          });

          select.value = "Gr3";

          players.push({ name, level: "Gr3", select });

          select.addEventListener("change", () => {
            const p = players.find(x => x.name === name);
            p.level = select.value;
          });

          li.appendChild(nameSpan);
          li.appendChild(select);

          playerList.appendChild(li);
        }
      });
    };

    reader.readAsArrayBuffer(file);
  });
});

document.getElementById("generateGroupsButton").addEventListener("click", () => {

  const gr1 = players.filter(p => p.level === "Gr1").map(p => p.name).sort();
  const gr2 = players.filter(p => p.level === "Gr2").map(p => p.name).sort();
  const gr3 = players.filter(p => p.level === "Gr3").map(p => p.name).sort();
  const keepers = players.filter(p => p.level === "Keeper").map(p => p.name).sort();

  document.getElementById("gr1List").innerHTML = gr1.map(n => `<li>${n}</li>`).join("");
  document.getElementById("gr2List").innerHTML = gr2.map(n => `<li>${n}</li>`).join("");
  document.getElementById("gr3List").innerHTML = gr3.map(n => `<li>${n}</li>`).join("");
  document.getElementById("keeperList").innerHTML = keepers.map(n => `<li>${n}</li>`).join("");

  window.generatedText =
    `Gr1:\n${gr1.join("\n")}\n\n` +
    `Gr2:\n${gr2.join("\n")}\n\n` +
    `Gr3:\n${gr3.join("\n")}\n\n` +
    `Keeper:\n${keepers.join("\n")}\n\n`;
});

// ⭐ Kopier-knapp
document.getElementById("copyButton").addEventListener("click", () => {
  if (!window.generatedText) {
    alert("Du må generere puljer først.");
    return;
  }

  navigator.clipboard.writeText(window.generatedText)
    .then(() => alert("Puljer kopiert!"))
    .catch(() => alert("Kunne ikke kopiere."));
});

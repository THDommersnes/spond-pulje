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

      // Bruker sheet 1 (For import)
      const sheetName = workbook.SheetNames[1];
      const sheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      console.log("Alle rader:", rows);

      // Finn header-raden
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

          // Unngå duplikater hvis samme spiller finnes i begge filer
          if (players.some(p => p.name === name)) return;

          const li = document.createElement("li");

          const nameSpan = document.createElement("span");
          nameSpan.textContent = name + " ";

          const select = document.createElement("select");
          ["Gr1", "Gr2", "Gr3"].forEach(level => {
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
  const gr1 = players.filter(p => p.level === "Gr1").map(p => p.name);
  const gr2 = players.filter(p => p.level === "Gr2").map(p => p.name);
  const gr3 = players.filter(p => p.level === "Gr3").map(p => p.name);

  let output = "Puljer:\n\n";

  output += "Gr1:\n" + gr1.join("\n") + "\n\n";
  output += "Gr2:\n" + gr2.join("\n") + "\n\n";
  output += "Gr3:\n" + gr3.join("\n") + "\n\n";

  alert(output);
});

alert("script.js ble lastet!");
console.log("XLSX er:", XLSX);

let players = []; // lagrer navn + valgt gruppe

document.getElementById('importButton').addEventListener('click', () => {
  const input = document.getElementById('fileInput');
  const file = input.files?.[0];

  if (!file) {
    alert('Velg en Spond-fil først');
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);

    let workbook;
    try {
      workbook = XLSX.read(data, { type: 'array' });
    } catch (err) {
      alert("Feil ved lesing av Excel-fil");
      console.error(err);
      return;
    }

    // Spond-eksport har vanligvis sheet 1 som tabellen
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("Alle rader:", rows);

    // Finn rad med "Status" og "Navn"
    let startIndex = rows.findIndex(r =>
      (r[0] + "").trim().toLowerCase() === "status" &&
      (r[1] + "").trim().toLowerCase() === "navn"
    );

    if (startIndex === -1) {
      alert("Fant ikke kolonnene 'Status' og 'Navn' i filen.");
      return;
    }

    const tableRows = rows.slice(startIndex + 1);

    const playerList = document.getElementById('playerList');
    playerList.innerHTML = "";
    players = [];

    tableRows.forEach(row => {
      const status = (row[0] || "").toString().trim().toLowerCase();
      const name = (row[1] || "").toString().trim();

      if (status === "kommer" && name !== "") {

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


// ⭐ GENERER GRUPPER
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

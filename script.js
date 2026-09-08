alert("script.js ble lastet!");
console.log("XLSX er:", XLSX);

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
    const workbook = XLSX.read(data, { type: 'array' });

    // LESER SHEET 2 (For import)
    const sheetName = workbook.SheetNames[1];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("Alle rader:", rows);

    // Finn første rad som starter tabellen
    let startIndex = rows.findIndex(r => 
      r[0] === "Status" && r[1] === "Navn"
    );

    if (startIndex === -1) {
      alert("Fant ikke tabellen i filen.");
      return;
    }

    const tableRows = rows.slice(startIndex + 1);

    const playerList = document.getElementById('playerList');
    playerList.innerHTML = "";

    tableRows.forEach(row => {
      const status = (row[0] || "").toString().trim().toLowerCase();
      const name = (row[1] || "").toString().trim();

      if (status === "kommer" && name !== "") {
        const li = document.createElement("li");
        li.textContent = name;
        playerList.appendChild(li);
      }
    });
  };

  reader.readAsArrayBuffer(file);
});

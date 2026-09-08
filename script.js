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

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const playerList = document.getElementById('playerList');
    playerList.innerHTML = "";

    rows.slice(1).forEach(row => {
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

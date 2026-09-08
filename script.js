alert("script.js ble lastet!");
console.log("XLSX er:", XLSX);

let players = []; // lagrer navn + nivå

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

    const sheetName = workbook.SheetNames[1];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

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
    players = [];

    tableRows.forEach(row => {
      const status = (row[0] || "").toString().trim().toLowerCase();
      const name = (row[1] || "").toString().trim();

      if (status === "kommer" && name !== "") {

        // Sett nivå manuelt her:
        let level = "Gr3"; // default

        // Eksempel: du kan legge inn regler her:
        if (name.includes("Tobias")) level = "Gr1";
        if (name.includes("Helland")) level = "Gr2";

        players.push({ name, level });

        const li = document.createElement("li");
        li.textContent = `${name} (${level})`;
        playerList.appendChild(li);
      }
    });
  };

  reader.readAsArrayBuffer(file);
});


// ⭐ GENERER GRUPPER (superenkel)
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

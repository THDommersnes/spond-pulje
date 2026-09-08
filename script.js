alert("TEST FRA SCRIPT.JS");

// Finn <ul id="playerList">
const playerList = document.getElementById('playerList');

// Testnavn
["Spiller 1", "Spiller 2"].forEach(name => {

  // Lag <li>
  const li = document.createElement("li");

  // Navn
  const span = document.createElement("span");
  span.textContent = name + " ";

  // Dropdown
  const select = document.createElement("select");
  ["Gr1", "Gr2", "Gr3"].forEach(level => {
    const opt = document.createElement("option");
    opt.value = level;
    opt.textContent = level;
    select.appendChild(opt);
  });

  // Sett default
  select.value = "Gr3";

  // Sett sammen
  li.appendChild(span);
  li.appendChild(select);

  // Legg inn i listen
  playerList.appendChild(li);
});

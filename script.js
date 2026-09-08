const playerList = document.getElementById('playerList');

["Spiller 1", "Spiller 2"].forEach(name => {
  const li = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = name + " ";

  const select = document.createElement("select");
  ["Gr1", "Gr2", "Gr3"].forEach(level => {
    const opt = document.createElement("option");
    opt.value = level;
    opt.textContent = level;
    select.appendChild(opt);
  });

  li.appendChild(span);
  li.appendChild(select);
  playerList.appendChild(li);
});

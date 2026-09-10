import fs from "fs";
import fetch from "node-fetch";

const token = process.env.SPOND_TOKEN;

async function fetchSpondData() {
  const url = "https://api.spond.com/graphql";

  const query = {
    query: `
      query {
        myGroups {
          id
          name
          members {
            name
            status
          }
        }
      }
    `
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(query)
  });

  const json = await res.json();
  return json.data.myGroups;
}

function generateGroups(members) {
  const groups = {
    Gr1: [],
    Gr2: [],
    Gr3: [],
    Keeper: []
  };

  members.forEach(m => {
    const level = "Gr3"; // default
    groups[level].push(m.name);
  });

  Object.keys(groups).forEach(key => groups[key].sort());
  return groups;
}

async function main() {
  console.log("Henter data fra Spond…");

  const groupsFromSpond = await fetchSpondData();

  // Du kan velge hvilken gruppe du vil bruke
  const firstGroup = groupsFromSpond[0];
  const members = firstGroup.members.filter(m => m.status === "kommer");

  const groups = generateGroups(members);

  fs.writeFileSync("groups.json", JSON.stringify(groups, null, 2));

  console.log("groups.json oppdatert!");
}

main();

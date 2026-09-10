const fs = require("fs");
const https = require("https");

const token = process.env.SPOND_TOKEN;

function fetchSpondData() {
  // ⭐ NY URL – dette var feilen
  const url = "https://api.spond.com/graphql/v1";

  const query = JSON.stringify({
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
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Content-Length": Buffer.byteLength(query)
        }
      },
      res => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            console.error("❌ Spond API feilet med status:", res.statusCode);
            console.error("Respons:", data);
            reject(new Error("Spond API error"));
            return;
          }

          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("error", reject);
    req.write(query);
    req.end();
  });
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

  const json = await fetchSpondData();

  if (!json.data || !json.data.myGroups) {
    console.error("❌ Ugyldig respons fra Spond:", JSON.stringify(json, null, 2));
    throw new Error("Invalid Spond response");
  }

  const firstGroup = json.data.myGroups[0];
  const members = firstGroup.members.filter(m => m.status === "kommer");

  const groups = generateGroups(members);

  fs.writeFileSync("groups.json", JSON.stringify(groups, null, 2));

  console.log("✔ groups.json oppdatert!");
}

main().catch(err => {
  console.error("❌ Script feilet:", err);
  process.exit(1);
});

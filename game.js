const state = {
  day: 1,
  cash: 2000,
  debt: 1000,
  reputation: 0,
  maxInventory: 20,
  policeHeat: 0,
  currentLocation: "Südstadt",

  locations: {
    "Südstadt": "img/suedstadt.jpg",
    "Innenstadt": "img/innenstadt.jpg",
    "Bahnhof": "img/bahnhof.jpg",
    "Industriegebiet": "img/industrie.jpg"
  },

  goods: [
    { name: "Sneaker", base: 150, img: "img/sneaker.png" },
    { name: "Smartphone", base: 400, img: "img/smartphone.png" },
    { name: "Konsole", base: 350, img: "img/konsole.png" },
    { name: "Luxusuhr", base: 800, img: "img/uhr.png" },
    { name: "Konzertticket", base: 90, img: "img/ticket.png" }
  ],

  owned: {},
  prices: {}
};

const shopItems = [
  { name: "Großer Rucksack (+20 Slots)", cost: 800, effect: () => state.maxInventory += 20 },
  { name: "Preis-Scanner (+5 Ruf)", cost: 500, effect: () => state.reputation += 5 },
  { name: "Schutzweste (-10% Heat)", cost: 700, effect: () => updatePoliceHeat(-10) }
];

const npcDialogs = {
  haendler: [
    "Ey, heute habe ich gute Deals für dich.",
    "Wenn du heute groß einkaufst, wirst du es morgen feiern.",
    "Du siehst so aus, als würdest du es ernst meinen."
  ],
  informant: [
    "Die Cops sind heute unruhig, pass auf.",
    "Für 200 € drück ich ein paar Infos durch und dein Heat sinkt.",
    "Die Streifen fahren öfter durch die Südstadt, sei vorsichtig."
  ]
};

const dayEl = document.getElementById("day");
const currentLocationEl = document.getElementById("currentLocation");
const cashEl = document.getElementById("cash");
const debtEl = document.getElementById("debt");
const repEl = document.getElementById("reputation");
const invCountEl = document.getElementById("invCount");
const invMaxEl = document.getElementById("invMax");
const heatEl = document.getElementById("heat");
const locationImageEl = document.getElementById("locationImage");
const locationButtonsEl = document.getElementById("locationButtons");
const goodsTableEl = document.getElementById("goodsTable");
const logEl = document.getElementById("log");
const shopEl = document.getElementById("shop");
const endMessageEl = document.getElementById("endMessage");

document.getElementById("nextDayBtn").addEventListener("click", nextDay);
document.getElementById("upgradeBagBtn").addEventListener("click", upgradeBag);
document.getElementById("repayDebtBtn").addEventListener("click", repayDebt);
document.getElementById("npcDealerBtn").addEventListener("click", () => talkToNPC("haendler"));
document.getElementById("npcInformantBtn").addEventListener("click", npcInformantAction);
document.getElementById("saveBtn").addEventListener("click", saveGame);
document.getElementById("loadBtn").addEventListener("click", loadGame);
document.getElementById("endGameBtn").addEventListener("click", endGame);

function init() {
  state.goods.forEach(g => state.owned[g.name] = 0);
  renderLocations();
  renderShop();
  generatePrices();
  renderGoods();
  updateStats();
  log("Willkommen in Bruchsal. Die Straßen beobachten dich.", "story");
}

function log(message, type = "") {
  const div = document.createElement("div");
  div.className = "log-entry " + (type || "");
  div.textContent = "Tag " + state.day + ": " + message;
  logEl.prepend(div);
}

function renderLocations() {
  locationButtonsEl.innerHTML = "";
  for (const loc in state.locations) {
    const btn = document.createElement("button");
    btn.textContent = loc;
    btn.className = "btn btn-secondary";
    if (loc === state.currentLocation) btn.disabled = true;
    btn.addEventListener("click", () => changeLocation(loc));
    locationButtonsEl.appendChild(btn);
  }
  locationImageEl.src = state.locations[state.currentLocation];
}

function changeLocation(loc) {
  state.currentLocation = loc;
  renderLocations();
  generatePrices();
  renderGoods();
  randomEvent("travel");
  updateStats();
  log("Du gehst nach " + loc + ".");
  checkStory();
}

function generatePrices() {
  state.prices = {};
  state.goods.forEach(g => {
    let price = g.base * (0.5 + Math.random() * 1.8);
    price = Math.round(price * (1 - state.reputation * 0.01));
    if (price < Math.round(g.base * 0.3)) price = Math.round(g.base * 0.3);
    state.prices[g.name] = price;
  });
}

function renderGoods() {
  goodsTableEl.innerHTML = `
    <tr>
      <th>Bild</th>
      <th>Ware</th>
      <th>Preis</th>
      <th>Besitz</th>
      <th>Aktion</th>
    </tr>
  `;
  state.goods.forEach(g => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${g.img}" alt="${g.name}" class="item-img"></td>
      <td>${g.name}</td>
      <td>${state.prices[g.name]} €</td>
      <td>${state.owned[g.name]}</td>
      <td>
        <button class="btn" onclick="buy('${g.name}')">Kaufen</button>
        <button class="btn btn-secondary" onclick="sell('${g.name}')">Verkaufen</button>
      </td>
    `;
    goodsTableEl.appendChild(tr);
  });
}

function buy(name) {
  const price = state.prices[name];
  if (state.cash < price) {
    log("Nicht genug Cash für " + name + ".", "bad");
    return;
  }
  if (inventoryCount() >= state.maxInventory) {
    log("Dein Rucksack ist voll.", "bad");
    return;
  }
  state.cash -= price;
  state.owned[name]++;
  state.reputation += 1;
  updatePoliceHeat(2);
  updateStats();
  renderGoods();
  log("Du kaufst 1x " + name + " für " + price + " €.", "good");
  checkStory();
}

function sell(name) {
  if (state.owned[name] <= 0) {
    log("Du hast keine " + name + " zum Verkaufen.", "bad");
    return;
  }
  const price = state.prices[name];
  state.owned[name]--;
  state.cash += price;
  state.reputation += 0.5;
  updatePoliceHeat(3);
  updateStats();
  renderGoods();
  log("Du verkaufst 1x " + name + " für " + price + " €.", "good");
  checkStory();
}

function inventoryCount() {
  return Object.values(state.owned).reduce((a, b) => a + b, 0);
}

function updateStats() {
  dayEl.textContent = state.day;
  currentLocationEl.textContent = state.currentLocation;
  cashEl.textContent = state.cash;
  debtEl.textContent = state.debt;
  repEl.textContent = Math.round(state.reputation);
  invCountEl.textContent = inventoryCount();
  invMaxEl.textContent = state.maxInventory;
  heatEl.textContent = Math.round(state.policeHeat);
}

function updatePoliceHeat(amount) {
  state.policeHeat += amount;
  if (state.policeHeat < 0) state.policeHeat = 0;
  if (state.policeHeat > 100) state.policeHeat = 100;
  if (state.policeHeat >= 80) {
    policeBust();
  }
  updateStats();
}

function policeBust() {
  const fine = Math.round(state.cash * 0.4);
  state.cash -= fine;
  if (state.cash < 0) state.cash = 0;
  state.policeHeat = 30;
  log("Die Polizei schnappt dich kurz weg. Strafe: " + fine + " €.", "bad");
}

function nextDay() {
  state.day++;
  updatePoliceHeat(-10);
  if (state.debt > 0) {
    const interest = Math.round(state.debt * 0.05);
    state.debt += interest;
    log("Zinsen auf deine Schulden: +" + interest + " €.", "bad");
  }
  generatePrices();
  renderGoods();
  updateStats();
  log("Ein neuer Tag beginnt in " + state.currentLocation + ".");
  randomEvent("day");
  checkStory();
}

function upgradeBag() {
  const cost = 500;
  if (state.cash < cost) {
    log("Nicht genug Geld für ein Upgrade.", "bad");
    return;
  }
  state.cash -= cost;
  state.maxInventory += 10;
  updateStats();
  log("Du besorgst dir einen besseren Rucksack (+10 Slots).", "good");
}

function repayDebt() {
  const step = 100;
  if (state.debt <= 0) {
    log("Du hast keine Schulden mehr.", "good");
    return;
  }
  if (state.cash < step) {
    log("Zu wenig Cash, um Schulden zu tilgen.", "bad");
    return;
  }
  state.cash -= step;
  state.debt -= step;
  if (state.debt < 0) state.debt = 0;
  updateStats();
  log("Du tilgst 100 € deiner Schulden. Rest: " + state.debt + " €.", "good");
}

function renderShop() {
  shopEl.innerHTML = "";
  shopItems.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = `${item.name} – ${item.cost} €`;
    btn.addEventListener("click", () => buyShopItem(i));
    shopEl.appendChild(btn);
  });
}

function buyShopItem(i) {
  const item = shopItems[i];
  if (state.cash < item.cost) {
    log("Du kannst dir " + item.name + " nicht leisten.", "bad");
    return;
  }
  state.cash -= item.cost;
  item.effect();
  updateStats();
  log("Upgrade gekauft: " + item.name + ".", "good");
}

function talkToNPC(type) {
  const lines = npcDialogs[type];
  const msg = lines[Math.floor(Math.random() * lines.length)];
  log("NPC: " + msg, "story");
}

function npcInformantAction() {
  const cost = 200;
  if (state.cash < cost) {
    log("Der Informant lacht dich aus. Zu wenig Geld.", "bad");
    return;
  }
  state.cash -= cost;
  updatePoliceHeat(-25);
  log("Der Informant sorgt dafür, dass dein Heat sinkt.", "good");
}

function randomEvent(type) {
  const r = Math.random();
  if (type === "day") {
    if (r < 0.2) {
      const bonus = Math.round(100 + Math.random() * 300);
      state.cash += bonus;
      log("Ein alter Kontakt zahlt dir " + bonus + " € zurück.", "good");
    } else if (r > 0.8 && inventoryCount() > 0) {
      const loss = 1 + Math.floor(Math.random() * 2);
      let removed = 0;
      for (const g of state.goods) {
        while (state.owned[g.name] > 0 && removed < loss) {
          state.owned[g.name]--;
          removed++;
        }
      }
      log("Dir werden auf der Straße ein paar Sachen geklaut (" + removed + " Items).", "bad");
    }
  }
  if (type === "travel") {
    if (r < 0.15 && inventoryCount() > 0) {
      updatePoliceHeat(10);
      log("Auf dem Weg wirst du von einer Streife beobachtet. Dein Heat steigt.", "bad");
    }
  }
}

function checkStory() {
  if (state.day === 3) {
    log("Story: In der Südstadt kursiert dein Name. Manche sind neugierig.", "story");
  }
  if (state.reputation >= 15 && state.reputation < 16) {
    log("Story: Ein neuer Kontakt bietet dir bessere Deals an.", "story");
  }
  if (state.policeHeat >= 50 && state.policeHeat < 60) {
    log("Story: Die Polizei scheint deine Wege zu kennen. Zeit für Vorsicht.", "story");
  }
}

function endGame() {
  const inventoryValue = state.goods.reduce((sum, g) => sum + state.owned[g.name] * state.prices[g.name], 0);
  const netWorth = state.cash + inventoryValue - state.debt;
  endMessageEl.textContent = "Spielende! Geschätztes Vermögen: " + netWorth + " €.";
  log("Das Spiel ist vorbei. Dein Vermögen: " + netWorth + " €.", "story");

  document.getElementById("nextDayBtn").disabled = true;
  document.getElementById("upgradeBagBtn").disabled = true;
  document.getElementById("repayDebtBtn").disabled = true;
  document.getElementById("npcDealerBtn").disabled = true;
  document.getElementById("npcInformantBtn").disabled = true;
  document.getElementById("saveBtn").disabled = true;
}

function saveGame() {
  const data = {
    day: state.day,
    cash: state.cash,
    debt: state.debt,
    reputation: state.reputation,
    maxInventory: state.maxInventory,
    policeHeat: state.policeHeat,
    currentLocation: state.currentLocation,
    owned: state.owned
  };
  localStorage.setItem("streetTraderSave", JSON.stringify(data));
  log("Spiel gespeichert.", "good");
}

function loadGame() {
  const raw = localStorage.getItem("streetTraderSave");
  if (!raw) {
    log("Kein gespeicherter Spielstand gefunden.", "bad");
    return;
  }
  const data = JSON.parse(raw);
  state.day = data.day;
  state.cash = data.cash;
  state.debt = data.debt;
  state.reputation = data.reputation;
  state.maxInventory = data.maxInventory;
  state.policeHeat = data.policeHeat;
  state.currentLocation = data.currentLocation;
  state.owned = data.owned;

  renderLocations();
  generatePrices();
  renderGoods();
  updateStats();
  log("Spielstand geladen.", "good");
}

init();
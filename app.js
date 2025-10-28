// === Ініціалізація карти ===
const map = L.map('map').setView([20, 0], 2);

// Базовий шар карти (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let geojsonLayer; // шар з межами країн
let salesData = {}; // дані продажів: { "USA": 1500000, ... }

// === Колірна шкала ===
function getColor(d) {
  return d > 10000000 ? '#004080' :
         d > 5000000  ? '#005FCC' :
         d > 1000000  ? '#1A75E6' :
         d > 500000   ? '#4D94EB' :
         d > 100000   ? '#80B3F0' :
         d > 50000    ? '#B3D1F5' :
         d > 0        ? '#E6F0FA' :
                        '#636363ff';
}

// === Стиль для країн ===
function style(feature) {
  const code = feature.properties.ISO_A3; // трилітерний код країни
  const sales = salesData[code] || 0;
  return {
    fillColor: getColor(sales),
    weight: 1,
    color: '#fff',
    fillOpacity: 0.7
  };
}

// === Підсвічування при наведенні ===
function highlightFeature(e) {
  const layer = e.target;
  // властивості можуть містити різні поля з кодом країни,
  // тут намагаємось використати той, що є в geojson
  const code = (layer.feature.properties.adm0_a3_ar || layer.feature.properties.ISO_A3 || "").toUpperCase();
  const country = layer.feature.properties.admin;
  const sales = salesData[code] || 0;

  // Відкриваємо підказку (labels на англійській)
  layer.bindPopup(`<b>${country}</b><br>Cars sold: ${sales.toLocaleString()}`).openPopup();
}

function resetHighlight(e) {
  // Можна скинути стиль або закрити підказку тут, якщо потрібно
  // geojsonLayer.resetStyle(e.target);
  // e.target.closePopup();
}

// === Події для кожного гео-елемента ===
function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight
  });
}

// === Завантаження даних і оновлення карти ===
async function loadMap(year = 2024) {
  try {
    console.log(`🗺️ Loading data for ${year}...`);

    // 1️⃣ Отримуємо продажі з бекенду
    const res = await fetch(`http://localhost:3000/sales/${year}`);
    const data = await res.json();
    console.log("📊 Sales data from server:", data);

    salesData = {};
    data.forEach(r => {
      // приведення кодів до верхнього регістру на всякий випадок
      if (r.country_code) salesData[r.country_code.toUpperCase()] = r.sales;
    });

    // 2️⃣ Завантажуємо GeoJSON
    const geoRes = await fetch('world.geo.json');
    const geojson = await geoRes.json();

    // 3️⃣ Видаляємо старий шар, якщо є
    if (geojsonLayer) map.removeLayer(geojsonLayer);

    // 4️⃣ Додаємо шар з оновленим стилем
    geojsonLayer = L.geoJson(geojson, { style, onEachFeature }).addTo(map);
    geojsonLayer.eachLayer(layer => {
      const code = (layer.feature.properties.adm0_a3_ar || layer.feature.properties.ISO_A3 || "").toUpperCase();
      const country = layer.feature.properties.admin;
      const sales = salesData[code] || 0;

      const colourOverlay = getColor(sales);
      layer.setStyle({
        fill: true,
        fillColor: colourOverlay,
        fillOpacity: 0.8,
        color: '#fff',
        weight: 1
      });
    });
    // === Додаємо окремий шар для Криму як частину України ===
const crimeaGeoJson = {
  "type": "Feature",
  "properties": {
    "name": "Crimea"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [33.435988094713366, 45.971917370797485],
      [33.69946184910907, 46.219572831556434],
      [34.41040172853718, 46.005162391728845],
      [34.73201738827845, 45.96566573176062],
      [34.861792128174045, 45.76818243191957],
      [35.01265897004737, 45.73772519982549],
      [35.02078779474607, 45.65121898048466],
      [35.51000857925311, 45.40999339454612],
      [36.52999799983019, 45.46998973243717],
      [36.334712762199274, 45.11321564389402],
      [35.239999220528205, 44.93999624285175],
      [33.882511020652885, 44.361478583344194],
      [33.32642093276013, 44.564877020844904],
      [33.546924269349404, 45.03477081967486],
      [32.4541744321055, 45.327466132176085],
      [32.63080447767919, 45.51918569597899],
      [33.58816206231842, 45.85156850848023],
      [33.435988094713366, 45.971917370797485]
    ]]
  },
  "properties": {
    "admin": "Ukraine",
    "ISO_A3": "UKR"
  }
}

L.geoJson(crimeaGeoJson, {
  style: {
    fillColor: getColor(salesData["UKR"] || 0),
    weight: 1,
    color: '#fff',
    fillOpacity: 0.7
  },
  onEachFeature
}).addTo(map);

  } catch (err) {
    console.error("❌ Error loading map:", err);
  }
}

// === Завантаження списку років ===
async function loadYears() {
  try {
    const res = await fetch('http://localhost:3000/years');
    const years = await res.json();

    console.log("📅 Available years:", years);

    const select = document.getElementById('yearSelect');
    select.innerHTML = ""; // очищуємо перед вставкою

    years.forEach(y => {
      const option = document.createElement('option');
      option.value = y;
      option.textContent = y;
      select.appendChild(option);
    });

    // обираємо останній (максимальний) рік за замовчуванням
    const defaultYear = years[years.length - 1];
    select.value = defaultYear;

    select.addEventListener('change', e => {
      const year = parseInt(e.target.value);
      loadMap(year);
    });

    await loadMap(defaultYear);

  } catch (err) {
    console.error("❌ Error loading years:", err);
  }
}

// === Запуск ===
loadYears();
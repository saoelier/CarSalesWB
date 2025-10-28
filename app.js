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
  return d > 10000000 ? '#800026' :
         d > 5000000  ? '#BD0026' :
         d > 1000000  ? '#E31A1C' :
         d > 500000   ? '#FC4E2A' :
         d > 100000   ? '#FD8D3C' :
         d > 50000    ? '#FEB24C' :
         d > 0        ? '#FED976' :
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

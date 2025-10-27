// === Инициализация карты ===
const map = L.map('map').setView([20, 0], 2);

// Базовый слой карты (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let geojsonLayer; // слой с границами стран
let salesData = {}; // данные продаж: { "USA": 1500000, ... }

// === Цветовая шкала ===
function getColor(d) {
  return d > 10000000 ? '#800026' :
         d > 5000000  ? '#BD0026' :
         d > 1000000  ? '#E31A1C' :
         d > 500000   ? '#FC4E2A' :
         d > 100000   ? '#FD8D3C' :
         d > 50000    ? '#FEB24C' :
         d > 0        ? '#FED976' :
                        '#FFEDA0';
}

// === Стиль стран ===
function style(feature) {
  const code = feature.properties.ISO_A3; // трёхбуквенный код страны
  const sales = salesData[code] || 0;
  return {
    fillColor: getColor(sales),
    weight: 1,
    color: '#fff',
    fillOpacity: 0.7
  };
}

// === Подсветка при наведении ===
function highlightFeature(e) {
  const layer = e.target;
  layer.setStyle({ weight: 2, color: '#666', fillOpacity: 0.9 });

  const code = layer.feature.properties.ISO_A3;
  const country = layer.feature.properties.ADMIN;
  const sales = salesData[code] || 0;
  layer.bindPopup(`<b>${country}</b><br>Продано автомобилей: ${sales.toLocaleString()}`).openPopup();
}

function resetHighlight(e) {
  geojsonLayer.resetStyle(e.target);
  e.target.closePopup();
}

// === События для стран ===
function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight
  });
}

// === Загрузка данных и обновление карты ===
async function loadMap(year = 2024) {
  try {
    console.log(`🗺️ Загружаем данные за ${year}...`);

    // 1️⃣ Получаем продажи
    const res = await fetch(`http://localhost:3000/sales/${year}`);
    const data = await res.json();
    console.log("📊 Данные с сервера:", data);

    salesData = {};
    data.forEach(r => {
      // приведение кодов к верхнему регистру на всякий случай
      if (r.country_code) salesData[r.country_code.toUpperCase()] = r.sales;
    });

    // 2️⃣ Загружаем GeoJSON
    const geoRes = await fetch('world.geo.json');
    const geojson = await geoRes.json();

    // 3️⃣ Удаляем старый слой, если есть
    if (geojsonLayer) map.removeLayer(geojsonLayer);

    // 4️⃣ Добавляем слой с обновлённым стилем
    geojsonLayer = L.geoJson(geojson, { style, onEachFeature }).addTo(map);

  } catch (err) {
    console.error("❌ Ошибка при загрузке карты:", err);
  }
}

// === Загрузка списка годов ===
async function loadYears() {
  try {
    const res = await fetch('http://localhost:3000/years');
    const years = await res.json();

    console.log("📅 Доступные года:", years);

    const select = document.getElementById('yearSelect');
    select.innerHTML = ""; // очистим перед вставкой

    years.forEach(y => {
      const option = document.createElement('option');
      option.value = y;
      option.textContent = y;
      select.appendChild(option);
    });

    // выбираем последний (максимальный) год
    const defaultYear = years[years.length - 1];
    select.value = defaultYear;

    select.addEventListener('change', e => {
      const year = parseInt(e.target.value);
      loadMap(year);
    });

    await loadMap(defaultYear);

  } catch (err) {
    console.error("❌ Ошибка при загрузке годов:", err);
  }
}

// === Запуск ===
loadYears();
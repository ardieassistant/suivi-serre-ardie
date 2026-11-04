/**
 * ARDIE - Logique applicative Suivi Vitroplants Fruits à Pain
 * URL Google Apps Script configurée
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxaF6p4Vt-JNOn4STB3kin7eNZayU4YhCqX0RBiHT1KCy16b8KmHjJdipBjo8sN5qigAw/exec";

let state = {
  emplacements: [],
  agentsActifs: [],
  tousLesAgents: [],
  cachedReports: []
};

let chartInstance = null;

// Initialisation au chargement de l'application
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('date-label').textContent = new Date().toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
  document.getElementById('c-heure').value = new Date().toTimeString().slice(0, 5);

  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('rep-start').value = today;
  document.getElementById('rep-end').value = today;

  loadConfig();
  lucide.createIcons();
});

// Calcul automatique des vitroplants sains (Initial - Isolés - Morts)
function calcPlants() {
  const init = parseInt(document.getElementById('p-initial').value) || 0;
  const isoles = parseInt(document.getElementById('p-isoles').value) || 0;
  const morts = parseInt(document.getElementById('p-morts').value) || 0;
  const sains = Math.max(0, init - (isoles + morts));
  document.getElementById('p-sains-display').textContent = sains;
  return sains;
}

['p-initial', 'p-isoles', 'p-morts'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', calcPlants);
});

// Chargement dynamique de la configuration (Agents SharePoint et Serres)
async function loadConfig() {
  const icon = document.getElementById('sync-icon');
  if (icon) icon.classList.add('animate-spin');

  try {
    const res = await fetch(`${SCRIPT_URL}?action=getConfig`);
    state = await res.json();
    renderDropdowns();
    renderAdmin();
  } catch (err) {
    console.warn('Erreur ou mode hors ligne : chargement des données de secours.', err);
    state.emplacements = ['Serre principale', 'Serre 1', 'Serre 2'];
    state.agentsActifs = [
      { nom: 'SELAMBAYE Patrice', label: 'M. SELAMBAYE Patrice (Encadrant technique)' },
      { nom: 'MARIMOUTOU Steven', label: 'M. MARIMOUTOU Steven (Salarié en Insertion)' }
    ];
    state.tousLesAgents = [
      { name: 'SELAMBAYE Patrice', displayName: 'M. SELAMBAYE Patrice', contrat: 'Encadrant technique', atelier: 'Plateau diversification', status: 'Actif' },
      { name: 'MARIMOUTOU Steven', displayName: 'M. MARIMOUTOU Steven', contrat: 'Salarié en Insertion', atelier: 'Plateau diversification', status: 'Actif' }
    ];
    renderDropdowns();
    renderAdmin();
  } finally {
    if (icon) icon.classList.remove('animate-spin');
  }
}

// Remplissage des listes déroulantes
function renderDropdowns() {
  const sSerre = document.getElementById('global-serre');
  const sAgent = document.getElementById('global-intervenant');
  const rSerre = document.getElementById('rep-serre');

  if (sSerre) {
    sSerre.innerHTML = state.emplacements.map(e => `<option value="${e}">🌱 ${e}</option>`).join('');
  }
  if (sAgent) {
    sAgent.innerHTML = state.agentsActifs.map(a => `<option value="${a.nom}">👤 ${a.label}</option>`).join('');
  }
  if (rSerre) {
    rSerre.innerHTML = '<option value="ALL">Toutes les serres</option>' + state.emplacements.map(e => `<option value="${e}">${e}</option>`).join('');
  }
}

// Remplissage du panneau Administration
function renderAdmin() {
  const listLoc = document.getElementById('list-loc');
  const listAg = document.getElementById('list-agents');

  if (listLoc) {
    listLoc.innerHTML = state.emplacements.map(e => `
      <li class="py-2 flex justify-between items-center">
        <span class="font-medium text-slate-700">🌱 ${e}</span>
        <button onclick="delLocation('${e}')" class="text-red-600 border border-red-200 px-2 py-0.5 rounded text-[10px] hover:bg-red-50">Supprimer</button>
      </li>
    `).join('');
  }

  if (listAg) {
    listAg.innerHTML = state.tousLesAgents.map(ag => `
      <li class="py-2.5 flex justify-between items-center border-b border-slate-100">
        <div>
          <div class="font-semibold text-slate-800 text-xs">${ag.displayName || ag.name}</div>
          <div class="text-[10px] text-slate-400">${ag.contrat || ''} • ${ag.atelier || ''}</div>
        </div>
        <button onclick="toggleAgent('${ag.name}')" 
                class="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide transition ${ag.status === 'Actif' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-500'}">
          ${ag.status}
        </button>
      </li>
    `).join('');
  }

  lucide.createIcons();
}

// Envoi POST vers Google Apps Script
async function postData(payload) {
  await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

// Soumission Relevé Climatique
document.getElementById('form-clim').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-clim');
  btn.disabled = true;
  btn.innerText = "Envoi en cours...";

  await postData({
    type: 'CLIMAT',
    date: new Date().toLocaleDateString('fr-FR'),
    heure: document.getElementById('c-heure').value,
    serre: document.getElementById('global-serre').value,
    intervenant: document.getElementById('global-intervenant').value,
    temperature: document.getElementById('c-temp').value,
    humidite_air: document.getElementById('c-hygro').value,
    lumens: document.getElementById('c-lumens').value || '-',
    humidite_terreau: document.getElementById('c-hum-terreau').value || '-',
    ph: document.getElementById('c-ph').value || '-',
    eclairage: document.getElementById('c-eclairage').value,
    arrosage: document.getElementById('c-arrosage').value || '-',
    remarque: document.getElementById('c-remarque').value || '-'
  });

  alert("Relevé climatique enregistré !");
  document.getElementById('c-remarque').value = '';
  btn.disabled = false;
  btn.innerHTML = `<i data-lucide="check" class="w-5 h-5"></i><span>Valider le Relevé</span>`;
  lucide.createIcons();
});

// Soumission Suivi Plants
document.getElementById('form-plants').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-plants');
  btn.disabled = true;
  btn.innerText = "Envoi en cours...";

  await postData({
    type: 'SUIVI_PLANTS',
    date: new Date().toLocaleDateString('fr-FR'),
    heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    serre: document.getElementById('global-serre').value,
    intervenant: document.getElementById('global-intervenant').value,
    initial: document.getElementById('p-initial').value,
    isoles: document.getElementById('p-isoles').value,
    morts: document.getElementById('p-morts').value,
    surveillance: document.getElementById('p-surveillance').value,
    sains: calcPlants(),
    observations: document.getElementById('p-observations').value || '-'
  });

  alert("Bilan vitroplants enregistré !");
  btn.disabled = false;
  btn.innerHTML = `<i data-lucide="check-circle-2" class="w-5 h-5"></i><span>Valider le Bilan Journalier</span>`;
  lucide.createIcons();
});

// Actions Administration
async function addLocation() {
  const input = document.getElementById('new-loc');
  const v = input.value.trim();
  if (!v) return;
  await postData({ type: 'MANAGE_LOCATION', subAction: 'ADD', name: v });
  input.value = '';
  loadConfig();
}

async function delLocation(name) {
  if (!confirm(`Supprimer l'emplacement "${name}" ?`)) return;
  await postData({ type: 'MANAGE_LOCATION', subAction: 'DELETE', name });
  loadConfig();
}

async function toggleAgent(name) {
  await postData({ type: 'MANAGE_AGENT', subAction: 'TOGGLE_STATUS', name });
  loadConfig();
}

// Module Rapports et Graphiques Chart.js
async function queryReports() {
  const type = document.getElementById('rep-type').value;
  const serre = document.getElementById('rep-serre').value;
  const start = document.getElementById('rep-start').value;
  const end = document.getElementById('rep-end').value;

  const url = `${SCRIPT_URL}?action=getReports&type=${type}&serre=${serre}&startDate=${start}&endDate=${end}`;
  const res = await fetch(url);
  const data = await res.json();
  state.cachedReports = data;

  const thead = document.getElementById('thead-reports');
  const tbody = document.getElementById('tbody-reports');
  const chartBox = document.getElementById('chart-container');

  if (!data || data.length === 0) {
    thead.innerHTML = `<tr><th class="p-2">Aucun résultat trouvé pour cette sélection</th></tr>`;
    tbody.innerHTML = '';
    chartBox.classList.add('hidden');
    return;
  }

  // Rendu Tableau
  const cols = Object.keys(data[0]);
  thead.innerHTML = `<tr>${cols.map(c => `<th class="p-2 whitespace-nowrap">${c}</th>`).join('')}</tr>`;
  tbody.innerHTML = data.map(row => `
    <tr class="hover:bg-slate-50">
      ${cols.map(c => `<td class="p-2 whitespace-nowrap">${row[c]}</td>`).join('')}
    </tr>
  `).join('');

  // Rendu Graphique
  chartBox.classList.remove('hidden');
  renderChart(type, data);
}

function renderChart(type, data) {
  const ctx = document.getElementById('mainChart').getContext('2d');
  const chartTitle = document.getElementById('chart-title');

  if (chartInstance) chartInstance.destroy();

  if (type === 'CLIMAT') {
    chartTitle.textContent = "Évolution Température (°C) et Humidité Air (%)";
    const labels = data.map(r => r.Heure || r.heure);
    const temps = data.map(r => Number(r.Temperature || r.temperature || 0));
    const hygros = data.map(r => Number(r.Humidite_Air || r.humidite_air || 0));

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Température (°C)',
            data: temps,
            borderColor: '#ea580c',
            backgroundColor: '#ea580c',
            yAxisID: 'y'
          },
          {
            label: 'Humidité Air (%)',
            data: hygros,
            borderColor: '#0284c7',
            backgroundColor: '#0284c7',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { type: 'linear', position: 'left', min: 20, max: 40 },
          y1: { type: 'linear', position: 'right', min: 50, max: 100, grid: { drawOnChartArea: false } }
        }
      }
    });
  } else {
    chartTitle.textContent = "Cohorte Vitroplants : Sains vs Pertes";
    const labels = data.map(r => r.Date || r.date);
    const sains = data.map(r => Number(r.Nb_Sains || r.sains || 0));
    const morts = data.map(r => Number(r.Nb_Morts || r.morts || 0));
    const isoles = data.map(r => Number(r.Nb_Isoles || r.isoles || 0));

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Sains', data: sains, backgroundColor: '#059669' },
          { label: 'Isolés', data: isoles, backgroundColor: '#d97706' },
          { label: 'Morts', data: morts, backgroundColor: '#dc2626' }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { stacked: true },
          y: { stacked: true }
        }
      }
    });
  }
}

// Export CSV
function exportTableToCSV() {
  if (!state.cachedReports.length) return alert("Veuillez d'abord afficher les données");
  const cols = Object.keys(state.cachedReports[0]);
  let csv = cols.join(';') + '\n';
  state.cachedReports.forEach(r => {
    csv += cols.map(c => `"${(r[c] || '').toString().replace(/"/g, '""')}"`).join(';') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ardie_export_${Date.now()}.csv`;
  a.click();
}

// Navigation par Onglets
function switchTab(id) {
  ['clim', 'plants', 'reports', 'admin'].forEach(k => {
    document.getElementById(`tab-${k}`).classList.add('hidden');
    document.getElementById(`btn-${k}`).classList.remove('bg-white', 'text-emerald-900', 'shadow-sm');
    document.getElementById(`btn-${k}`).classList.add('text-slate-600');
  });
  document.getElementById(`tab-${id}`).classList.remove('hidden');
  document.getElementById(`btn-${id}`).classList.add('bg-white', 'text-emerald-900', 'shadow-sm');
  document.getElementById(`btn-${id}`).classList.remove('text-slate-600');
  lucide.createIcons();
}

// PWA Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

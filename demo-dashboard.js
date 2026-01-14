const sampleData = {
    rpis: [
        {
            id: 'rpi-1',
            nom: 'RPi Nord',
            devices: [
                {
                    id: 'esp-air-1',
                    nom: 'ESP-Air-1',
                    capteurs: [
                        { sensor_id: 't1', type: 'Temperature', unite: 'C', valeur: 22.5 },
                        { sensor_id: 'h1', type: 'Humidite', unite: '%', valeur: 48 },
                        { sensor_id: 'c1', type: 'CO2', unite: 'ppm', valeur: 640 }
                    ]
                },
                {
                    id: 'esp-energy-1',
                    nom: 'ESP-Energy',
                    capteurs: [
                        { sensor_id: 'p1', type: 'Puissance', unite: 'kW', valeur: 6.3 },
                        { sensor_id: 'v1', type: 'Vibration', unite: 'mm/s', valeur: 1.5 }
                    ]
                }
            ]
        },
        {
            id: 'rpi-2',
            nom: 'RPi Sud',
            devices: [
                {
                    id: 'esp-froid-2',
                    nom: 'ESP-Froid',
                    capteurs: [
                        { sensor_id: 'f1', type: 'Froid', unite: 'C', valeur: 4.2 },
                        { sensor_id: 'door-2', type: 'Porte', unite: 'etat', valeur: 1 }
                    ]
                },
                {
                    id: 'esp-air-2',
                    nom: 'ESP-Air-2',
                    capteurs: [
                        { sensor_id: 't2', type: 'Temperature', unite: 'C', valeur: 21.1 },
                        { sensor_id: 'h2', type: 'Humidite', unite: '%', valeur: 52 }
                    ]
                }
            ]
        },
        {
            id: 'rpi-3',
            nom: 'RPi Est',
            devices: [
                {
                    id: 'esp-flow-3',
                    nom: 'ESP-Flow',
                    capteurs: [
                        { sensor_id: 'fl1', type: 'Debit eau', unite: 'L/min', valeur: 12.5 },
                        { sensor_id: 'pr1', type: 'Pression', unite: 'bar', valeur: 2.1 }
                    ]
                }
            ]
        }
    ],
    projets: [
        { nom: 'Smart Building POC', info: '18 capteurs - Equipe R&D' },
        { nom: 'Suivi froid pharma', info: '9 capteurs - Ops' },
        { nom: 'Pilotage usine', info: '27 capteurs - Industrialisation' }
    ],
    utilisateurs: ['alice', 'bob', 'charles', 'dora']
};

const widgets = new Map();
const zoneWidgets = document.getElementById('zone-widgets');
let emptyState = null;

document.addEventListener('DOMContentLoaded', () => {
    ensureEmptyState();
    renderRpis();
    renderProjets();
    wireModals();
    setInterval(autoUpdate, 3200);
});

function ensureEmptyState() {
    emptyState = document.getElementById('empty-state');
    if (!emptyState) {
        emptyState = document.createElement('div');
        emptyState.className = 'empty';
        emptyState.id = 'empty-state';
        emptyState.innerHTML = '<div>Selectionnez un capteur dans la liste pour afficher un widget.</div>';
        zoneWidgets.appendChild(emptyState);
    }
}

function renderRpis() {
    const list = document.getElementById('rpi-list');
    list.innerHTML = '';
    sampleData.rpis.forEach(rpi => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'rpi-item';
        item.dataset.rpiId = rpi.id;
        item.dataset.rpiNom = rpi.nom;
        item.innerHTML = `
            <span class="rpi-label">${rpi.nom}</span>
            <span class="rpi-arrow">></span>
        `;
        item.addEventListener('click', (e) => {
            e.preventDefault();
            toggleRpi(item, rpi);
        });
        list.appendChild(item);
    });
}

function toggleRpi(link, rpi) {
    const next = link.nextElementSibling;
    if (next && next.classList.contains('esp-box')) {
        next.remove();
        link.classList.remove('selected');
        return;
    }
    document.querySelectorAll('.esp-box').forEach(el => el.remove());
    document.querySelectorAll('.rpi-item').forEach(el => el.classList.remove('selected'));
    const box = document.createElement('div');
    box.className = 'esp-box';
    rpi.devices.forEach(dev => {
        const line = document.createElement('div');
        line.className = 'esp-line';
        line.textContent = dev.nom;
        line.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleEsp(line, dev, rpi.nom);
        });
        box.appendChild(line);
    });
    link.insertAdjacentElement('afterend', box);
    link.classList.add('selected');
}

function toggleEsp(line, device, rpiName) {
    const next = line.nextElementSibling;
    if (next && next.classList.contains('capteur-box')) {
        next.remove();
        line.classList.remove('selected');
        return;
    }
    line.parentElement.querySelectorAll('.capteur-box').forEach(el => el.remove());
    const box = document.createElement('div');
    box.className = 'capteur-box';
    device.capteurs.forEach(capteur => {
        const cLine = document.createElement('div');
        cLine.className = 'capteur-line';
        cLine.dataset.sensorId = capteur.sensor_id;
        cLine.textContent = `${capteur.type} (${capteur.unite})`;
        cLine.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWidget(capteur, rpiName, device.nom, cLine);
        });
        box.appendChild(cLine);
    });
    line.insertAdjacentElement('afterend', box);
    line.classList.add('selected');
}

function toggleWidget(capteur, rpiName, espName, lineEl) {
    if (widgets.has(capteur.sensor_id)) {
        removeWidget(capteur.sensor_id);
        lineEl.classList.remove('selected');
        return;
    }
    addWidget(capteur, rpiName, espName);
    lineEl.classList.add('selected');
}

function addWidget(capteur, rpiName, espName) {
    const card = document.createElement('div');
    card.className = 'widget-card';
    card.id = `widget-${capteur.sensor_id}`;
    card.innerHTML = `
        <div class="widget-head">
            <div>
                <div class="widget-title">${capteur.type}</div>
                <div class="widget-meta">${rpiName} / ${espName}</div>
            </div>
            <button class="btn-close" aria-label="Supprimer">x</button>
        </div>
        <div class="metric-line">
            <span class="metric-value" data-value>${formatValue(capteur.valeur, capteur.unite)}</span>
            <span class="metric-unit">${capteur.unite}</span>
            <span class="tag">${capteur.sensor_id}</span>
        </div>
        <div class="spark" data-chart></div>
        <div class="widget-meta" data-time>Mis a jour en local</div>
    `;
    card.querySelector('.btn-close').addEventListener('click', () => removeWidget(capteur.sensor_id));
    zoneWidgets.prepend(card);
    if (emptyState) emptyState.style.display = 'none';

    const series = generateSeries(capteur.valeur);
    drawSpark(card.querySelector('[data-chart]'), series);

    widgets.set(capteur.sensor_id, {
        capteur: { ...capteur },
        element: card,
        series
    });
}

function removeWidget(id) {
    const entry = widgets.get(id);
    if (entry && entry.element) entry.element.remove();
    widgets.delete(id);
    const chip = document.querySelector(`.capteur-line[data-sensor-id="${id}"]`);
    if (chip) chip.classList.remove('selected');
    if (!widgets.size && emptyState) emptyState.style.display = 'block';
}

function generateSeries(base) {
    const arr = [];
    let cur = base;
    for (let i = 0; i < 24; i++) {
        cur = Math.max(0, cur + (Math.random() - 0.5) * (base * 0.05 + 1));
        arr.push(cur);
    }
    return arr;
}

function drawSpark(container, series) {
    const width = container.clientWidth || 260;
    const height = container.clientHeight || 90;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = max - min || 1;
    const points = series.map((v, i) => {
        const x = (i / (series.length - 1)) * width;
        const y = height - ((v - min) / span) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    container.innerHTML = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <polyline points="${points}" fill="none" stroke="${randomColor()}" stroke-width="2" />
        </svg>
    `;
}

function randomColor() {
    const colors = ['#22c55e', '#00d4ff', '#eab308', '#f97316', '#a855f7'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function formatValue(val, unit) {
    if (unit === 'etat') return val > 0.5 ? 'ON' : 'OFF';
    if (unit === '%' || unit === 'ppm') return Math.round(val);
    if (unit === 'L/min') return val.toFixed(1);
    if (unit === 'bar') return val.toFixed(2);
    return val.toFixed(1);
}

function renderProjets() {
    const zone = document.getElementById('zone-projets');
    const selectSupp = document.getElementById('select-projet-supp');
    const selectShare = document.getElementById('select-projet-partage');
    zone.innerHTML = '';
    selectSupp.innerHTML = '';
    selectShare.innerHTML = '';
    sampleData.projets.forEach(p => {
        const item = document.createElement('div');
        item.className = 'projet-item';
        item.innerHTML = `<div>${p.nom}</div><div class="meta">${p.info}</div>`;
        zone.appendChild(item);

        const opt1 = document.createElement('option');
        opt1.value = p.nom;
        opt1.textContent = p.nom;
        selectSupp.appendChild(opt1);
        const opt2 = opt1.cloneNode(true);
        selectShare.appendChild(opt2);
    });

    const selectUsers = document.getElementById('select-user-partage');
    selectUsers.innerHTML = '';
    sampleData.utilisateurs.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u;
        opt.textContent = u;
        selectUsers.appendChild(opt);
    });
}

function autoUpdate() {
    widgets.forEach(entry => {
        const drift = entry.capteur.unite === 'etat' ? 0 : (entry.capteur.valeur * 0.02 + 0.4);
        entry.capteur.valeur = Math.max(0, entry.capteur.valeur + (Math.random() - 0.5) * drift);
        entry.series.push(entry.capteur.valeur);
        entry.series.shift();
        entry.element.querySelector('[data-value]').textContent = formatValue(entry.capteur.valeur, entry.capteur.unite);
        entry.element.querySelector('[data-time]').textContent = 'Mis a jour (local)';
        drawSpark(entry.element.querySelector('[data-chart]'), entry.series);
    });
}

function wireModals() {
    const modalSupp = document.getElementById('modal-suppression');
    const modalShare = document.getElementById('modal-partage');
    document.getElementById('btn-modal-supp').onclick = () => modalSupp.style.display = 'flex';
    document.getElementById('btn-modal-share').onclick = () => modalShare.style.display = 'flex';
    document.querySelectorAll('.btn-annuler-modal').forEach(btn => {
        btn.onclick = () => {
            modalSupp.style.display = 'none';
            modalShare.style.display = 'none';
        };
    });
    document.getElementById('confirm-suppression').onclick = () => {
        const value = document.getElementById('select-projet-supp').value;
        sampleData.projets = sampleData.projets.filter(p => p.nom !== value);
        renderProjets();
        modalSupp.style.display = 'none';
    };
    document.getElementById('confirm-partage').onclick = () => {
        modalShare.style.display = 'none';
        alert('Projet partage en local (demo).');
    };
    window.addEventListener('click', (e) => {
        if (e.target === modalSupp) modalSupp.style.display = 'none';
        if (e.target === modalShare) modalShare.style.display = 'none';
    });
    document.getElementById('btn-add-project').onclick = () => {
        const name = prompt('Nom du projet ?');
        if (name) {
            sampleData.projets.push({ nom: name, info: 'Demo locale' });
            renderProjets();
        }
    };
}


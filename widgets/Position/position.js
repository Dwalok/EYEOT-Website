(function() {
    // --- Récupération robuste du wrapper du widget (id = widget-<type>-<sensorId>) ---
    let wrapper = (function() {
        const s = document.currentScript;
        if (s && s.closest) {
            const w = s.closest('[id^="widget-"]');
            if (w) return w;
        }
        // fallback standalone
        return document.querySelector('.widget.widget-position') || null;
    })();

    if (!wrapper) return;

    const widgetId = wrapper.id || 'widget-position-standalone';
    const sourceEl = wrapper.querySelector('#source-position-v2');
    const mapDiv   = wrapper.querySelector('#map-position-v2');

    if (!mapDiv) {
        console.error('Widget position : #map-position-v2 introuvable');
        return;
    }

    // --- init Leaflet ---
    const map = L.map(mapDiv).setView([46.5, 2.0], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    let marker = L.marker([46.5, 2.0]).addTo(map);

    // Important : après l'init, on invalide la taille
    // (surtout utile dans le dashboard où le DOM peut bouger au moment du chargement)
    setTimeout(() => {
        map.invalidateSize();
    }, 0);

    // --- API publique ---
    // valeur attendue = { latitude: Number, longitude: Number, source?: String }
    window[widgetId] = {
        updateValue: function(valeur, timestamp) {
            if (!valeur) return;

            const latitude  = typeof valeur.latitude  === 'number' ? valeur.latitude  : null;
            const longitude = typeof valeur.longitude === 'number' ? valeur.longitude : null;
            const sourceLbl = valeur.source || null;

            if (sourceLbl && sourceEl) {
                sourceEl.textContent = 'source : ' + sourceLbl;
            }

            if (latitude !== null && longitude !== null) {
                marker.setLatLng([latitude, longitude]);
                map.setView([latitude, longitude], map.getZoom());
            }
        }
    };

    // --- gestion des pastilles taille (w-size-2 / w-size-3) ---
    const dots = wrapper.querySelectorAll('.dot-position');

    const gridContainer = wrapper.closest('.contenu-droite');
    let gridItem = wrapper;
    if (gridContainer) {
        let el = wrapper;
        while (el && el.parentElement !== gridContainer) {
            el = el.parentElement;
        }
        if (el) gridItem = el;
    }
    const inDashboard = !!gridContainer;

    function applySize(idx) {
        gridItem.classList.remove('w-size-2', 'w-size-3');
        if (idx === 3) {
            gridItem.classList.add('w-size-3');
        } else {
            gridItem.classList.add('w-size-2'); // défaut
        }

        // après changement de taille CSS, on demande à Leaflet
        // de recalculer la taille de la carte
        setTimeout(() => {
            map.invalidateSize();
        }, 0);
    }

    // état initial : dot 2 active → w-size-2
    let activeDot = wrapper.querySelector('.dot-position.active-position');
    if (!activeDot && dots.length) {
        dots[0].classList.add('active-position');
        activeDot = dots[0];
    }
    if (inDashboard && activeDot) {
        applySize(Number(activeDot.dataset.index || '2'));
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            dots.forEach(d => d.classList.remove('active-position'));
            dot.classList.add('active-position');

            if (inDashboard) {
                applySize(Number(dot.dataset.index || '2'));
            }
        });
    });

    // --- Simulation uniquement en standalone ---
    if (!inDashboard) {
        setInterval(() => {
            const lat = 45 + Math.random() * 10;
            const lon = -5 + Math.random() * 10;
            window[widgetId].updateValue(
                { latitude: lat, longitude: lon, source: 'simulation' },
                new Date().toISOString()
            );
        }, 2000);
    }
})();

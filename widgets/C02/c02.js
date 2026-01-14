(function() {
    // --- Robust wrapper lookup ---
    let wrapper = (function() {
        const s = document.currentScript;
        if (s && s.closest) {
            const w = s.closest('[id^="widget-"]');
            if (w) return w;
        }
        let p = document.currentScript;
        while (p && (!p.id || !p.id.startsWith('widget-'))) {
            if (p.previousElementSibling) {
                p = p.previousElementSibling;
            } else {
                p = p.parentElement;
            }
            if (!p) break;
            if (p.id && p.id.startsWith('widget-')) break;
        }
        if (p && p.id && p.id.startsWith('widget-')) return p;

        return document.getElementById('widget-c02-standalone')
            || document.querySelector('.widget.widget-c02')
            || null;
    })();

    if (!wrapper) return;

    const widgetId = wrapper.id;
    const MAX_WINDOW_MS = 60_000;
    const points = [];

    // --- Key elements ---
    const viewCard = wrapper.querySelector('.view-card');
    const viewGraph = wrapper.querySelector('.view-graph');
    const toggleBtn = wrapper.querySelector('.view-toggle');
    const dotsContainer = wrapper.querySelector('.side-dots');
    const dotSlots = {
        card: wrapper.querySelector('.dots-slot-card'),
        graph: wrapper.querySelector('.dots-slot-graph')
    };
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
    const valeurEl = wrapper.querySelector('#valeur-c02');
    const gaugeFill = wrapper.querySelector('#gauge-fill-c02');
    const sourceEls = wrapper.querySelectorAll('.widget-source');
    const graphCanvas = wrapper.querySelector('.c02-graph');
    const emptyState = wrapper.querySelector('.graph-empty');

    // --- Source sync (card + graph) ---
    function syncSourceText(text) {
        if (!text) return;
        sourceEls.forEach(el => el.textContent = text);
    }
    setTimeout(() => {
        if (sourceEls.length) syncSourceText(sourceEls[0].textContent);
    }, 0);

    // --- Dots + grid sizing ---
    const gridContainer = wrapper.closest('.contenu-droite');
    let gridItem = wrapper;
    if (gridContainer) {
        let el = wrapper;
        while (el && el.parentElement !== gridContainer) {
            el = el.parentElement;
        }
        if (el && el.parentElement === gridContainer) {
            gridItem = el;
        }
    }
    const inDashboard = !!gridContainer;

    function attachDotsTo(slot) {
        if (slot && dotsContainer && dotsContainer.parentElement !== slot) {
            slot.appendChild(dotsContainer);
        }
    }
    attachDotsTo(dotSlots.card);

    function applySize(idx) {
        gridItem.classList.remove('w-size-1', 'w-size-2', 'w-size-3');
        if (idx === 2) gridItem.classList.add('w-size-2');
        else if (idx === 3) gridItem.classList.add('w-size-3');
        else gridItem.classList.add('w-size-1');
    }

    let activeDot = wrapper.querySelector('.dot.active');
    if (!activeDot && dots.length) {
        dots[0].classList.add('active');
        activeDot = dots[0];
    }
    if (inDashboard && activeDot) applySize(Number(activeDot.dataset.index || '1'));

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');

            if (inDashboard) applySize(Number(dot.dataset.index || '1'));
        });
    });

    // --- View handling ---
    let currentMode = 'card';
    function setMode(mode) {
        currentMode = (mode === 'graph') ? 'graph' : 'card';
        wrapper.classList.toggle('mode-graph', currentMode === 'graph');
        if (viewCard) viewCard.classList.toggle('active-view', currentMode === 'card');
        if (viewGraph) viewGraph.classList.toggle('active-view', currentMode === 'graph');
        attachDotsTo(currentMode === 'graph' ? dotSlots.graph : dotSlots.card);
        if (currentMode === 'graph') {
            drawGraph();
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            setMode(currentMode === 'graph' ? 'card' : 'graph');
        });
    }

    // --- Graph drawing ---
    function drawGraph() {
        if (!graphCanvas) return;
        const ctx = graphCanvas.getContext('2d');
        if (!ctx) return;

        const now = Date.now();
        const recent = points.filter(p => now - p.t <= MAX_WINDOW_MS);
        const rect = graphCanvas.getBoundingClientRect();
        const width = Math.max(rect.width, 1);
        const height = Math.max(rect.height, 1);
        const ratio = window.devicePixelRatio || 1;

        graphCanvas.width = width * ratio;
        graphCanvas.height = height * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);

        if (!recent.length) {
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';

        const values = recent.map(p => p.v);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const spread = Math.max(maxVal - minVal, 1);
        const min = minVal - spread * 0.1;
        const max = maxVal + spread * 0.1;
        const denom = (max - min) || 1;

        const pad = { top: 8, right: 10, bottom: 22, left: 44 };
        const innerW = Math.max(width - pad.left - pad.right, 1);
        const innerH = Math.max(height - pad.top - pad.bottom, 1);
        const baseY = pad.top + innerH;
        const xFromTime = (t) => pad.left + innerW * (1 - (now - t) / MAX_WINDOW_MS);
        const yFromValue = (v) => pad.top + innerH - ((v - min) / denom) * innerH;

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        [0, 15, 30, 45, 60].forEach(sec => {
            const x = pad.left + innerW * (1 - (sec * 1000) / MAX_WINDOW_MS);
            ctx.beginPath();
            ctx.moveTo(x, pad.top);
            ctx.lineTo(x, baseY);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '11px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`${sec}s`, x, baseY + 4);
        });

        const stepsY = 4;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= stepsY; i++) {
            const ratioY = i / stepsY;
            const y = pad.top + innerH * ratioY;
            const val = max - (max - min) * ratioY;
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + innerW, y);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillText(`${val.toFixed(1)}%`, pad.left - 6, y);
        }

        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top);
        ctx.lineTo(pad.left, baseY);
        ctx.lineTo(pad.left + innerW, baseY);
        ctx.stroke();

        // Curve
        const firstX = xFromTime(recent[0].t);
        const lastX = xFromTime(recent[recent.length - 1].t);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#4fa3ff';
        ctx.beginPath();
        recent.forEach((p, idx) => {
            const x = xFromTime(p.t);
            const y = yFromValue(p.v);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill
        const area = new Path2D();
        recent.forEach((p, idx) => {
            const x = xFromTime(p.t);
            const y = yFromValue(p.v);
            if (idx === 0) area.moveTo(x, y);
            else area.lineTo(x, y);
        });
        area.lineTo(lastX, baseY);
        area.lineTo(firstX, baseY);
        area.closePath();
        ctx.fillStyle = 'rgba(79, 163, 255, 0.12)';
        ctx.fill(area);
    }

    function addPoint(val, timestamp) {
        const numVal = Number(val);
        if (!Number.isFinite(numVal)) return;

        const t = timestamp ? new Date(timestamp).getTime() : Date.now();
        points.push({ t, v: numVal });

        const cutoff = Date.now() - MAX_WINDOW_MS;
        while (points.length && points[0].t < cutoff) {
            points.shift();
        }

        if (currentMode === 'graph') {
            drawGraph();
        }
    }

    window.addEventListener('resize', () => {
        if (currentMode === 'graph') drawGraph();
    });

    // --- Public API ---
    window[widgetId] = {
        updateValue: function(valeur, timestamp) {
            const numVal = Number(valeur);

            if (valeurEl) {
                valeurEl.innerHTML = `${valeur} <span class="unite">%</span>`;
            }

            if (gaugeFill && Number.isFinite(numVal)) {
                const percentage = Math.min(Math.max(numVal, 0), 100);
                gaugeFill.style.height = `${percentage}%`;

                if (numVal < 0) {
                    gaugeFill.style.backgroundColor = '#4A90E2';
                } else if (numVal < 20) {
                    gaugeFill.style.backgroundColor = '#7ED321';
                } else if (numVal < 30) {
                    gaugeFill.style.backgroundColor = '#F5A623';
                } else {
                    gaugeFill.style.backgroundColor = '#D0021B';
                }
            }

            addPoint(numVal, timestamp);
        }
    };

    setMode('card');

})();

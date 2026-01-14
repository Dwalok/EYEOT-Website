(function () {
    // Permet de gérer plusieurs widgets WLED sur la même page si besoin
    const widgets = document.querySelectorAll('.widget-wled');
    if (!widgets.length) return;

    widgets.forEach(initWledWidget);

    function initWledWidget(widget) {
        const dots = widget.querySelectorAll('.dot');
        const intensitySlider = widget.querySelector('#wled-intensity-slider');
        const intensityValue = widget.querySelector('#wled-intensity-value');

        const wheel = widget.querySelector('#wled-color-wheel');
        const cursor = widget.querySelector('#wled-color-cursor');
        const colorPreview = widget.querySelector('#wled-color-preview');
        const colorValue = widget.querySelector('#wled-color-value');

        if (!wheel || !cursor || !colorPreview || !colorValue || !intensitySlider || !intensityValue) {
            return;
        }

        const ctx = wheel.getContext('2d');
        // Lissage pour le redimensionnement CSS
        ctx.imageSmoothingEnabled = true;
        if ('imageSmoothingQuality' in ctx) {
            ctx.imageSmoothingQuality = 'high';
        }

        let width = wheel.width;   // 2000
        let height = wheel.height; // 2000
        let cx = width / 2;
        let cy = height / 2;
        let radius = Math.min(cx, cy) - 3;

        // État par profil : h,s,v + brightness
        // h,s,v dans [0,1], brightness dans [1..254]
        const state = {
            1: { h: 0.08, s: 0.9, v: 1.0, brightness: 128 },
            2: { h: 0.55, s: 0.9, v: 1.0, brightness: 180 },
            3: { h: 0.83, s: 0.9, v: 1.0, brightness: 80 }
        };

        let currentIndex = 1;
        let isDragging = false;

        /* ---------- Utilitaires couleur ---------- */

        function hsvToRgb(h, s, v) {
            let r, g, b;
            let i = Math.floor(h * 6);
            let f = h * 6 - i;
            let p = v * (1 - s);
            let q = v * (1 - f * s);
            let t = v * (1 - (1 - f) * s);

            switch (i % 6) {
                case 0: r = v; g = t; b = p; break;
                case 1: r = q; g = v; b = p; break;
                case 2: r = p; g = v; b = t; break;
                case 3: r = p; g = q; b = v; break;
                case 4: r = t; g = p; b = v; break;
                case 5: r = v; g = p; b = q; break;
            }

            return {
                r: Math.round(r * 255),
                g: Math.round(g * 255),
                b: Math.round(b * 255)
            };
        }

        function rgbToHex(r, g, b) {
            const toHex = (x) => x.toString(16).padStart(2, '0');
            return '#' + toHex(r) + toHex(g) + toHex(b);
        }

        function hexToRgb(hex) {
            const m = hex.match(/^#?([0-9a-fA-F]{6})$/);
            if (!m) return null;
            const intVal = parseInt(m[1], 16);
            const r = (intVal >> 16) & 0xff;
            const g = (intVal >> 8) & 0xff;
            const b = intVal & 0xff;
            return { r, g, b };
        }

        function rgbToHsv(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const d = max - min;

            let h = 0;
            let s = max === 0 ? 0 : d / max;
            let v = max;

            if (d !== 0) {
                switch (max) {
                    case r:
                        h = (g - b) / d + (g < b ? 6 : 0);
                        break;
                    case g:
                        h = (b - r) / d + 2;
                        break;
                    case b:
                        h = (r - g) / d + 4;
                        break;
                }
                h /= 6;
            }

            return { h, s, v };
        }

        /* ---------- Helpers coord -> canvas / affichage ---------- */

        function getScale() {
            const rect = wheel.getBoundingClientRect();
            const scaleX = wheel.width / rect.width;
            const scaleY = wheel.height / rect.height;
            return { rect, scaleX, scaleY };
        }

        function setCursorFromInternalCoords(xInt, yInt) {
            const { rect, scaleX, scaleY } = getScale();
            const xCss = xInt / scaleX;
            const yCss = yInt / scaleY;
            cursor.style.left = xCss + 'px';
            cursor.style.top = yCss + 'px';
        }

        /* ---------- Dessin roue type Hue ---------- */

        function drawColorWheel() {
            const imageData = ctx.createImageData(width, height);
            const data = imageData.data;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    const index = (y * width + x) * 4;

                    if (dist <= radius) {
                        let angle = Math.atan2(dy, dx); // [-PI, PI]
                        let h = (angle + Math.PI) / (2 * Math.PI); // [0, 1]
                        let s = dist / radius; // [0, 1]
                        const v = 1.0;

                        const { r, g, b } = hsvToRgb(h, s, v);

                        data[index] = r;
                        data[index + 1] = g;
                        data[index + 2] = b;
                        data[index + 3] = 255;
                    } else {
                        data[index + 3] = 0;
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
        }

        /* ---------- Mise à jour UI à partir de l'état ---------- */

        function updateUIFromState() {
            const s = state[currentIndex];

            // Couleur avec luminosité appliquée
            const vScaled = s.brightness / 254; // [0..1]
            const rgb = hsvToRgb(s.h, s.s, vScaled);
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

            // Pastille + champ hex
            colorPreview.style.backgroundColor = hex;
            colorValue.classList.remove('invalid');
            colorValue.value = hex.toUpperCase();

            // Slider luminosité
            intensitySlider.value = s.brightness;
            intensityValue.textContent = s.brightness.toString();

            // Position du curseur dans la roue (h,s) en coordonnées internes
            const r = s.s * radius;
            const angle = s.h * 2 * Math.PI - Math.PI;
            const xInt = cx + r * Math.cos(angle);
            const yInt = cy + r * Math.sin(angle);
            setCursorFromInternalCoords(xInt, yInt);
        }

        function setActiveDot(index) {
            dots.forEach(dot => {
                const dotIndex = Number(dot.dataset.index);
                dot.classList.toggle('active', dotIndex === index);
            });
        }

        /* ---------- Gestion cercle / drag ---------- */

        function updateColorFromPosition(clientX, clientY) {
            const { rect, scaleX, scaleY } = getScale();

            // Coordonnées internes (pixels canvas)
            let xInt = (clientX - rect.left) * scaleX;
            let yInt = (clientY - rect.top) * scaleY;

            const dx = xInt - cx;
            const dy = yInt - cy;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > radius) {
                const ratio = radius / dist;
                dist = radius;
                xInt = cx + dx * ratio;
                yInt = cy + dy * ratio;
            }

            const angle = Math.atan2(yInt - cy, xInt - cx); // [-PI, PI]
            let h = (angle + Math.PI) / (2 * Math.PI); // [0..1]
            let sVal = Math.min(dist / radius, 1);

            const profile = state[currentIndex];
            profile.h = h;
            profile.s = sVal;

            updateUIFromState();

            // Hook API WLED possible :
            // sendWledColor(currentIndex, profile.h, profile.s, profile.brightness);
        }

        wheel.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateColorFromPosition(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            updateColorFromPosition(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        /* ---------- Slider luminosité ---------- */

        intensitySlider.addEventListener('input', () => {
            const value = Number(intensitySlider.value);
            state[currentIndex].brightness = value;
            updateUIFromState();

            // Hook API WLED possible :
            // sendWledBrightness(currentIndex, value);
        });

        /* ---------- Champ HEX éditable ---------- */

        function applyHexFromInput() {
            let hex = colorValue.value.trim();

            const match = hex.match(/^#?([0-9a-fA-F]{6})$/);
            if (!match) {
                colorValue.classList.add('invalid');
                return;
            }

            hex = '#' + match[1].toUpperCase();
            const rgb = hexToRgb(hex);
            if (!rgb) {
                colorValue.classList.add('invalid');
                return;
            }

            const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
            const profile = state[currentIndex];

            if (hsv.v <= 0.0001) {
                profile.s = 0;
                profile.v = 0;
                profile.brightness = 1;
            } else {
                profile.h = hsv.h;
                profile.s = hsv.s;
                profile.v = hsv.v;
                profile.brightness = Math.max(1, Math.min(254, Math.round(hsv.v * 254)));
            }

            colorValue.classList.remove('invalid');
            updateUIFromState();

            // Hook API WLED possible :
            // sendWledColor(currentIndex, profile.h, profile.s, profile.brightness);
        }

        colorValue.addEventListener('change', applyHexFromInput);
        colorValue.addEventListener('blur', applyHexFromInput);
        colorValue.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                applyHexFromInput();
                colorValue.blur();
            }
        });

        /* ---------- Changement de profil ---------- */

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const idx = Number(dot.dataset.index);
                if (idx === currentIndex) return;
                currentIndex = idx;
                setActiveDot(idx);
                updateUIFromState();
            });
        });

        /* ---------- Init ---------- */
        drawColorWheel();
        setActiveDot(currentIndex);
        updateUIFromState();
    }
})();

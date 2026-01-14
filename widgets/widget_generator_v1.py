import sys
import re
from pathlib import Path

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget,
    QVBoxLayout, QHBoxLayout, QFormLayout,
    QLineEdit, QComboBox, QRadioButton, QButtonGroup,
    QCheckBox, QPushButton, QFileDialog,
    QLabel, QMessageBox
)


# ---------- Utilitaires ----------

def slugify(text: str) -> str:
    """Transforme un texte libre en slug simple : minuscule, [a-z0-9_-]."""
    text = text.strip().lower()
    # remplacements simples pour accents courants
    translations = str.maketrans(
        "àáâäãåçèéêëìíîïñòóôöõùúûüýÿ",
        "aaaaaaceeeeiiiinooooouuuuyy"
    )
    text = text.translate(translations)
    # remplace les espaces par des _
    text = re.sub(r"\s+", "_", text)
    # garde uniquement a-z0-9_- :
    text = re.sub(r"[^a-z0-9_-]", "", text)
    if not text:
        text = "capteur"
    return text


# CSS générique, inspiré de temperature_v2.css mais avec un nom de jauge générique.
CSS_TEMPLATE = """/* Style général du widget */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', sans-serif;
}

.widget {
    width: 300px;
    height: 200px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.18);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    text-align: center;
    flex-shrink: 0;
}

/* Conteneur principal divisé en deux */
.widget-split {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    gap: 10px;
}

/* Partie info à gauche */
.info-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 10px;
}

/* Titre */
.widget-titre {
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 10px;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
}

/* Valeur */
.widget-valeur {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 10px;
    text-align: center;
}

/* Unité dans la valeur */
.widget-valeur .unite {
    font-size: 18px;
    margin-left: 4px;
    opacity: 0.7;
}

/* Source */
.widget-source {
    font-size: 12px;
    opacity: 0.8;
    color: #ffffff;
    text-align: center;
}

/* Conteneur des pastilles (taille widget) */
.side-dots {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12px;
}

/* Pastille */
.dot {
    width: 14px;
    height: 14px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 20%;
    border: 1px solid black;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

/* Pastille sélectionnée */
.dot.active {
    background: #ffffff;
    box-shadow: 0 0 8px rgba(255,255,255,0.8);
    transform: scale(1.2);
}

/* Jauge générique */
.gauge-container {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
}

/* Jauge verticale (type thermomètre) */
.gauge-container.vertical {
    width: 30px;
    height: 95%;
    margin: auto 10px auto auto;
}

/* Jauge horizontale (type barre) */
.gauge-container.horizontal {
    width: 100%;
    height: 24px;
    margin: auto;
}

/* Remplissage de la jauge par défaut */
.gauge-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0%;
    background: linear-gradient(to top, #ff6600, #ff9900);
    transition: height 0.4s ease, width 0.4s ease, background-color 0.4s ease;
}

/* Cas horizontal : on remplit en largeur */
.gauge-container.horizontal .gauge-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(to right, #4A90E2, #7ED321);
}
"""


def build_html(display_name: str,
               slug: str,
               unit: str,
               widget_folder: str,
               base_name: str,
               orientation: str,
               has_dots: bool) -> str:
    """
    Construit le contenu HTML du widget à partir des choix utilisateur.
    - display_name : texte du titre
    - slug : identifiant technique sans espace, ex : "temperature_v2"
    - unit : ex : "°C", "%", "ppm"
    - widget_folder : dossier dans /static/widgets/, ex : "Temperature"
    - base_name : préfixe des fichiers, ex : "temperature_v2"
    - orientation : "vertical" ou "horizontal"
    - has_dots : True/False pour les pastilles
    """

    dots_html = ""
    if has_dots:
        dots_html = """    <div class="side-dots">
      <div class="dot active" data-index="1"></div>
      <div class="dot" data-index="2"></div>
      <div class="dot" data-index="3"></div>
    </div>
"""

    html = f"""<link rel="stylesheet" href="/static/widgets/{widget_folder}/{base_name}.css">

<div class="widget widget-{slug}">
  <div class="widget-split">
{dots_html if has_dots else ""}
    <div class="info-container">
      <div class="widget-titre">{display_name}</div>
      <div class="widget-valeur" id="valeur-{slug}">-- <span class="unite">{unit}</span></div>
      <div class="widget-source" id="source-{slug}">source : local</div>
    </div>

    <div class="gauge-container {orientation}">
      <div class="gauge-fill" id="gauge-fill-{slug}"></div>
    </div>

  </div>
</div>

<script src="/static/widgets/{widget_folder}/{base_name}.js"></script>
"""
    return html


def build_js(slug: str,
             unit: str,
             sensor_type: str,
             orientation: str) -> str:
    """
    Construit le JS du widget, compatible avec dashboard.js :
    - window[widgetId].updateValue(valeur, timestamp)
    - gestion des pastilles et des w-size-1/2/3.
    """

    # Choix de la logique jauge selon orientation
    if orientation == "vertical":
        gauge_code = f"""            const gaugeFill = wrapper.querySelector('#gauge-fill-{slug}');
            if (gaugeFill) {{
                // valeur supposée dans [0,100], clampée
                const percentage = Math.min(Math.max(valeur, 0), 100);
                gaugeFill.style.height = `${{percentage}}%`;

                // code couleur type température (exemple)
                if (valeur < 0) {{
                    gaugeFill.style.backgroundColor = '#4A90E2';
                }} else if (valeur < 20) {{
                    gaugeFill.style.backgroundColor = '#7ED321';
                }} else if (valeur < 30) {{
                    gaugeFill.style.backgroundColor = '#F5A623';
                }} else {{
                    gaugeFill.style.backgroundColor = '#D0021B';
                }}
            }}"""
    else:
        gauge_code = f"""            const gaugeFill = wrapper.querySelector('#gauge-fill-{slug}');
            if (gaugeFill) {{
                // valeur supposée dans [0,100], clampée
                const percentage = Math.min(Math.max(valeur, 0), 100);
                gaugeFill.style.width = `${{percentage}}%`;

                // code couleur type humidité (exemple)
                if (valeur < 30) {{
                    gaugeFill.style.backgroundColor = '#D0021B';
                }} else if (valeur < 60) {{
                    gaugeFill.style.backgroundColor = '#7ED321';
                }} else {{
                    gaugeFill.style.backgroundColor = '#4A90E2';
                }}
            }}"""

    js = f"""(function() {{
    // --- Récupération robuste du wrapper du widget (logique type température/humidité) ---
    let wrapper = (function() {{
        const s = document.currentScript;
        if (s && s.closest) {{
            const w = s.closest('[id^="widget-"]');
            if (w) return w;
        }}
        // si le script est placé juste après le widget
        let p = document.currentScript;
        while (p && (!p.id || !p.id.startsWith('widget-'))) {{
            if (p.previousElementSibling) {{
                p = p.previousElementSibling;
            }} else {{
                p = p.parentElement;
            }}
            if (!p) break;
            if (p.id && p.id.startsWith('widget-')) break;
        }}
        if (p && p.id && p.id.startsWith('widget-')) return p;

        // fallback : standalone ou premier widget de ce type trouvé
        return document.getElementById('widget-{slug}-standalone')
            || document.querySelector('.widget.widget-{slug}')
            || null;
    }})();

    if (!wrapper) return;

    const widgetId = wrapper.id;

    // --- API publique du widget (utilisée par dashboard.js) ---
    window[widgetId] = {{
        updateValue: function(valeur, timestamp) {{
            console.log('updateValue {slug}', valeur, timestamp, widgetId);

            // mise à jour de la valeur affichée
            const valeurEl = wrapper.querySelector('#valeur-{slug}');
            if (valeurEl) {{
                valeurEl.innerHTML = `${{valeur}} <span class="unite">{unit}</span>`;
            }}

{gauge_code}
        }}
    }};

    // --- Gestion des pastilles + tailles (1x1 / 2x2 / 3x3) ---
    const dots = wrapper.querySelectorAll('.dot');

    // Trouve le conteneur de grille (dashboard) et l'item de grille réel
    const gridContainer = wrapper.closest('.contenu-droite');
    let gridItem = wrapper; // par défaut, le wrapper
    if (gridContainer) {{
        // monte jusqu’au parent direct enfant de .contenu-droite
        let el = wrapper;
        while (el && el.parentElement !== gridContainer) {{
            el = el.parentElement;
        }}
        if (el && el.parentElement === gridContainer) {{
            gridItem = el; // c’est l’item de grille réel
        }}
    }}
    const inDashboard = !!gridContainer;

    function applySize(idx) {{
        // On applique les classes sur l’item de grille
        gridItem.classList.remove('w-size-1', 'w-size-2', 'w-size-3');
        if (idx === 2) gridItem.classList.add('w-size-2');      // 2×2
        else if (idx === 3) gridItem.classList.add('w-size-3'); // 3×3
        else gridItem.classList.add('w-size-1');                // 1×1 (base)
    }}

    // état initial
    let activeDot = wrapper.querySelector('.dot.active');
    if (!activeDot && dots.length) {{
        dots[0].classList.add('active');
        activeDot = dots[0];
    }}
    if (inDashboard && activeDot) applySize(Number(activeDot.dataset.index || '1'));

    // écouteurs de clic
    dots.forEach(dot => {{
        dot.addEventListener('click', () => {{
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');

            if (inDashboard) applySize(Number(dot.dataset.index || '1'));

            console.log('Pastille sélectionnée :', dot.dataset.index);
        }});
    }});

}})();
"""
    return js


# ---------- Fenêtre principale ----------

class WidgetGeneratorWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Générateur de widgets HTML/CSS/JS")
        self.resize(600, 400)

        central = QWidget(self)
        self.setCentralWidget(central)

        main_layout = QVBoxLayout(central)

        form = QFormLayout()

        # Nom technique (slug)
        self.slug_edit = QLineEdit()
        self.slug_edit.setPlaceholderText("ex : temperature_v2, humidite_salleA...")
        form.addRow("Nom technique (slug) :", self.slug_edit)

        # Nom affiché
        self.label_edit = QLineEdit()
        self.label_edit.setPlaceholderText("ex : Température, Humidité, CO₂ Salle A...")
        form.addRow("Nom affiché (titre) :", self.label_edit)

        # Type de capteur
        self.type_combo = QComboBox()
        self.type_combo.addItems([
            "Température",
            "Humidité",
            "CO₂",
            "Pression",
            "Luminosité",
            "Générique"
        ])
        form.addRow("Type de capteur :", self.type_combo)

        # Unité
        self.unit_edit = QLineEdit()
        self.unit_edit.setPlaceholderText("ex : °C, %, ppm, hPa, lux...")
        form.addRow("Unité :", self.unit_edit)

        # Orientation jauge
        orient_layout = QHBoxLayout()
        self.radio_vertical = QRadioButton("Verticale")
        self.radio_horizontal = QRadioButton("Horizontale")
        self.radio_vertical.setChecked(True)
        orient_group = QButtonGroup(self)
        orient_group.addButton(self.radio_vertical)
        orient_group.addButton(self.radio_horizontal)
        orient_layout.addWidget(self.radio_vertical)
        orient_layout.addWidget(self.radio_horizontal)
        form.addRow("Orientation jauge :", orient_layout)

        # Pastilles
        self.dots_check = QCheckBox("Ajouter les pastilles de taille (1×1 / 2×2 / 3×3)")
        self.dots_check.setChecked(True)
        form.addRow("", self.dots_check)

        # Dossier de sortie
        out_layout = QHBoxLayout()
        self.output_edit = QLineEdit()
        self.output_edit.setPlaceholderText("Dossier racine des widgets (ex : /.../static/widgets)")
        browse_btn = QPushButton("Parcourir...")
        browse_btn.clicked.connect(self.browse_output_dir)
        out_layout.addWidget(self.output_edit)
        out_layout.addWidget(browse_btn)
        form.addRow("Dossier racine widgets :", out_layout)

        # Nom du sous-dossier widget (dans /static/widgets/)
        self.folder_edit = QLineEdit()
        self.folder_edit.setPlaceholderText("ex : Temperature, Humidite, CO2...")
        form.addRow("Sous-dossier widget :", self.folder_edit)

        # Nom de base des fichiers
        self.base_edit = QLineEdit()
        self.base_edit.setPlaceholderText("Nom de base des fichiers (html/css/js)")
        form.addRow("Nom de base fichiers :", self.base_edit)

        main_layout.addLayout(form)

        # Boutons
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()
        self.generate_btn = QPushButton("Générer les fichiers")
        self.generate_btn.clicked.connect(self.generate_files)
        btn_layout.addWidget(self.generate_btn)
        main_layout.addLayout(btn_layout)

        # Label d'info
        self.info_label = QLabel(
            "L'appli génère un trio HTML/CSS/JS compatible avec ton dashboard.\n"
            "Tu pourras ensuite brancher manuellement la route API vers ce widget."
        )
        main_layout.addWidget(self.info_label)

    def browse_output_dir(self):
        directory = QFileDialog.getExistingDirectory(self, "Choisir le dossier racine des widgets")
        if directory:
            self.output_edit.setText(directory)

    def generate_files(self):
        try:
            # Récup des valeurs
            slug_input = self.slug_edit.text().strip()
            slug = slugify(slug_input) if slug_input else None

            if not slug:
                QMessageBox.warning(self, "Erreur", "Le nom technique (slug) est obligatoire.")
                return

            display_name = self.label_edit.text().strip() or slug.capitalize()

            sensor_type = self.type_combo.currentText()
            unit = self.unit_edit.text().strip()
            if not unit:
                # petit défaut : unité par type si rien saisi
                if "Température" in sensor_type:
                    unit = "°C"
                elif "Humidité" in sensor_type:
                    unit = "%"
                elif "CO₂" in sensor_type:
                    unit = "ppm"
                elif "Pression" in sensor_type:
                    unit = "hPa"
                elif "Luminosité" in sensor_type:
                    unit = "lux"
                else:
                    unit = "u."

            orientation = "vertical" if self.radio_vertical.isChecked() else "horizontal"
            has_dots = self.dots_check.isChecked()

            output_root = self.output_edit.text().strip()
            if not output_root:
                QMessageBox.warning(self, "Erreur", "Le dossier racine des widgets est obligatoire.")
                return

            output_root_path = Path(output_root).expanduser()

            widget_folder = self.folder_edit.text().strip()
            if not widget_folder:
                # par défaut, dossier = type de capteur sans espace
                widget_folder = sensor_type.replace(" ", "")
            base_name = self.base_edit.text().strip()
            if not base_name:
                base_name = slug

            widget_dir = output_root_path / widget_folder
            widget_dir.mkdir(parents=True, exist_ok=True)

            html_content = build_html(
                display_name=display_name,
                slug=slug,
                unit=unit,
                widget_folder=widget_folder,
                base_name=base_name,
                orientation=orientation,
                has_dots=has_dots
            )

            css_content = CSS_TEMPLATE

            js_content = build_js(
                slug=slug,
                unit=unit,
                sensor_type=sensor_type,
                orientation=orientation
            )

            (widget_dir / f"{base_name}.html").write_text(html_content, encoding="utf-8")
            (widget_dir / f"{base_name}.css").write_text(css_content, encoding="utf-8")
            (widget_dir / f"{base_name}.js").write_text(js_content, encoding="utf-8")

            QMessageBox.information(
                self,
                "Succès",
                f"Fichiers générés dans :\n{widget_dir}"
            )

        except Exception as e:
            QMessageBox.critical(self, "Erreur", f"Une erreur est survenue :\n{e}")


def main():
    app = QApplication(sys.argv)
    win = WidgetGeneratorWindow()
    win.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()

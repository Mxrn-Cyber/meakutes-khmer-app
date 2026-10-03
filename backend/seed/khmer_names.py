"""Fill in Khmer names for the starter places and festivals.

    cd ~/Desktop/meakutes-khmer-app/backend
    source venv/bin/activate
    python seed/khmer_names.py                    # local database (.env)
    ENV_FILE=.env.cloud python seed/khmer_names.py  # cloud database

Only empty Khmer fields are filled, so anything an admin already typed is kept.
Descriptions are not translated here: add them in Admin > Places / News.
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# ENV_FILE=.env.cloud points the script at another database (same as load_content.sh).
if os.environ.get("ENV_FILE"):
    env_path = ROOT / os.environ["ENV_FILE"]
    if not env_path.exists():
        sys.exit(f"No such file: {env_path}")
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ[key.strip()] = value.strip().strip('"').strip("'")

from app.database import SessionLocal  # noqa: E402
from app.models.destination import Destination  # noqa: E402
from app.models.news import NewsEvent  # noqa: E402

PLACES = {
    "Angkor Wat": "ប្រាសាទអង្គរវត្ត",
    "Bayon Temple": "ប្រាសាទបាយ័ន",
    "Ta Prohm": "ប្រាសាទតាព្រហ្ម",
    "Phnom Bakheng": "ភ្នំបាខែង",
    "Banteay Srei": "ប្រាសាទបន្ទាយស្រី",
    "Royal Palace": "ព្រះបរមរាជវាំង",
    "National Museum of Cambodia": "សារមន្ទីរជាតិកម្ពុជា",
    "Tuol Sleng Genocide Museum": "សារមន្ទីរឧក្រិដ្ឋកម្មប្រល័យពូជសាសន៍ទួលស្លែង",
    "Wat Phnom": "វត្តភ្នំ",
    "Central Market (Phsar Thmei)": "ផ្សារធំថ្មី",
    "Bokor Hill Station": "ភ្នំបូកគោ",
    "Kep Crab Market": "ផ្សារក្ដាមកែប",
    "Sambor Prei Kuk": "ប្រាសាទសំបូរព្រៃគុក",
    "Ratanakiri Crater Lakes": "បឹងយក្សឡោម រតនគិរី",
    "Mondulkiri Elephant Sanctuary": "ជម្រកដំរីមណ្ឌលគិរី",
    "Kratie Mekong Dolphins": "ផ្សោតទន្លេមេគង្គ ក្រចេះ",
    "Stung Treng Rapids": "ល្បាក់ទន្លេមេគង្គ ស្ទឹងត្រែង",
    "Preah Vihear Temple": "ប្រាសាទព្រះវិហារ",
    "Koh Kong Mangroves": "ព្រៃកោងកាងកោះកុង",
    "Banlung Red Earth Landscapes": "ទេសភាពដីក្រហមបានលុង",
}

EVENTS = {
    "Water Festival": "ព្រះរាជពិធីបុណ្យអុំទូក",
    "Khmer New Year": "ពិធីបុណ្យចូលឆ្នាំខ្មែរ",
    "Pchum Ben Festival": "ពិធីបុណ្យភ្ជុំបិណ្ឌ",
    "Royal Ploughing Ceremony": "ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល",
    "Visak Bochea": "ពិធីបុណ្យវិសាខបូជា",
    "Angkor Sankranta": "អង្គរសង្ក្រាន្ត",
}


def main() -> None:
    db = SessionLocal()
    filled = 0
    try:
        for row in db.query(Destination).all():
            if not row.name_km and row.name in PLACES:
                row.name_km = PLACES[row.name]
                filled += 1
        for row in db.query(NewsEvent).all():
            if not row.title_km and row.title in EVENTS:
                row.title_km = EVENTS[row.title]
                filled += 1
        db.commit()
    finally:
        db.close()
    print(f"Filled {filled} Khmer names.")


if __name__ == "__main__":
    main()

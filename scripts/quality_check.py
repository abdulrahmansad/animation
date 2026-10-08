from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"
CSS = ROOT / "styles.css"
JS = ROOT / "script.js"


class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.local_refs = []
        self.images_without_alt = []
        self.buttons_without_label = []

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if "id" in data:
            self.ids.append(data["id"])

        for attr in ("src", "href"):
            value = data.get(attr)
            if not value or value.startswith(("#", "mailto:", "tel:")):
                continue
            parsed = urlparse(value)
            if not parsed.scheme and not value.startswith("//"):
                self.local_refs.append(value.split("?")[0].split("#")[0])

        if tag == "img" and "alt" not in data:
            self.images_without_alt.append(data.get("src", "<unknown>"))

        if tag == "button" and not (data.get("aria-label") or data.get("aria-labelledby")):
            self.buttons_without_label.append(data.get("class", "<button>"))


def fail(message):
    raise SystemExit(f"QUALITY CHECK FAILED: {message}")


for required in (HTML, CSS, JS):
    if not required.exists():
        fail(f"missing required file: {required.name}")

parser = AuditParser()
parser.feed(HTML.read_text(encoding="utf-8"))

duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
if duplicates:
    fail(f"duplicate HTML id(s): {', '.join(duplicates)}")

missing_refs = []
for ref in parser.local_refs:
    target = (ROOT / ref).resolve()
    if ROOT not in target.parents and target != ROOT:
        continue
    if not target.exists():
        missing_refs.append(ref)
if missing_refs:
    fail(f"missing local reference(s): {', '.join(sorted(set(missing_refs)))}")

if parser.images_without_alt:
    fail(f"image(s) missing alt: {', '.join(parser.images_without_alt)}")

if parser.buttons_without_label:
    fail(f"button(s) missing accessible label: {', '.join(parser.buttons_without_label)}")

css = CSS.read_text(encoding="utf-8")
if css.count("{") != css.count("}"):
    fail("unbalanced CSS braces")

js = JS.read_text(encoding="utf-8")
if "prefers-reduced-motion" not in js or "prefers-reduced-motion" not in css:
    fail("reduced-motion support must exist in both CSS and JS")

html = HTML.read_text(encoding="utf-8")
for landmark in ("<header", "<main", "<section", "<footer"):
    if landmark not in html:
        fail(f"missing semantic landmark: {landmark}")

print("Static quality checks passed.")
print(f"IDs checked: {len(parser.ids)}")
print(f"Local references checked: {len(parser.local_refs)}")

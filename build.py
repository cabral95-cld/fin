import pathlib, base64, json, sys
here = pathlib.Path(__file__).parent
sys.path.insert(0, str(here))
import sync_fin
if len(sys.argv) >= 3:
    d, rs = sync_fin.parse(sys.argv[1], sys.argv[2])
    (here / "data.json").write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print({k: rs[k] for k in ("total", "n", "conc_ok", "real", "cur", "qi")})
src = (here / "index.src.html").read_text(encoding="utf-8")
data = (here / "data.json").read_text(encoding="utf-8").replace("</", "<\\/")
app = (here / "app.js").read_text(encoding="utf-8")
fdir = here / "libs/node_modules/@fontsource/outfit/files"
fonts = "".join(
    "@font-face{font-family:'Outfit';font-style:normal;font-weight:%d;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}"
    % (w, base64.b64encode((fdir / f"outfit-latin-{w}-normal.woff2").read_bytes()).decode())
    for w in (400, 500, 600, 700))
logo = "data:image/png;base64," + base64.b64encode((here / "assets/due-logo-branca.png").read_bytes()).decode()
app = app.replace("/*__LOGO__*/", logo)
out = src.replace("/*__FONTS__*/", fonts).replace("/*__DATA__*/", data).replace("/*__APP__*/", app)
assert "/*__" not in out, "placeholder sobrando"
(here / "index.html").write_text(out, encoding="utf-8")
print("index.html", len(out.encode()) // 1024, "KB")

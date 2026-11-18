#!/usr/bin/env python3
"""把 vite 构建产物内联成单个 HTML 文件，并生成 Widget 版本（顶部预留 40px 拖拽区）。"""
import re
import sys
from pathlib import Path

DIST = Path(__file__).parent / "dist"


def build_single(widget_mode: bool) -> str:
    html = (DIST / "index.html").read_text(encoding="utf-8")
    js_file = next((DIST / "assets").glob("index-*.js"))
    css_file = next((DIST / "assets").glob("index-*.css"))
    js = js_file.read_text(encoding="utf-8")
    css = css_file.read_text(encoding="utf-8")

    html = re.sub(r'<link rel="stylesheet"[^>]*>', f"<style>\n{css}\n</style>", html)
    html = re.sub(
        r'<script type="module"[^>]*></script>',
        lambda m: "<script type=\"module\">\n" + js + "\n</script>",
        html,
    )
    html = html.replace("crossorigin", "")

    if widget_mode:
        # Canvas 顶部有约 40px 的拖拽/悬浮操作区，整体下移避开；打印不受影响
        override = """<style>
@media screen {
  .h-screen { height: calc(100vh - 44px) !important; margin-top: 44px; }
}
</style>"""
        html = html.replace("</head>", override + "\n</head>")
    return html


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"
    single = build_single(widget_mode=False)
    out1 = Path(__file__).parent.parent / "简历排版助手.html"
    out1.write_text(single, encoding="utf-8")
    print(f"standalone -> {out1} ({out1.stat().st_size} bytes)")

    widget_html = build_single(widget_mode=True)
    out2 = Path(__file__).parent / "widget.html"
    out2.write_text(widget_html, encoding="utf-8")
    print(f"widget     -> {out2} ({out2.stat().st_size} bytes)")

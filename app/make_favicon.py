#!/usr/bin/env python3
"""生成浏览器页签图标，并写回 app/index.html。

单文件离线工具不能引外部图片，两个图标都得是内联 data URI：
  · SVG —— 尺寸任意，Chrome / Edge / Firefox 都认
  · PNG 32×32 —— Safari 26 之前不认 SVG 图标，靠它兜底

图形只在这里定义一次：SVG 是矢量版，PNG 是同一组矩形栅格化的结果。
改完图形跑一次 `python3 app/make_favicon.py` 重写 index.html；
`--check` 只比对不写，给 npm test 用。
"""
import base64
import re
import struct
import sys
import zlib
from pathlib import Path
from urllib.parse import quote

INDEX = Path(__file__).parent / "index.html"
SIZE = 32

# (x, y, w, h, 颜色)，坐标系就是 SVG 的 viewBox
NAVY = "#1c2644"
PAPER = "#fbfaf7"
GOLD = "#c8a870"
INK = "#232c42"
MUTED = "#7d8598"

BACKGROUND = (NAVY,)
RECTS = (
    (8, 4, 16, 24, PAPER),   # 白纸
    (8, 4, 16, 4, GOLD),     # 古金刊头
    (11, 12, 10, 2, INK),    # 标题行
    (11, 17, 10, 2, MUTED),  # 正文行
    (11, 22, 7, 2, MUTED),   # 短正文行
)


def render_svg() -> str:
    parts = [
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>",
        f"<rect width='{SIZE}' height='{SIZE}' fill='{NAVY}'/>",
    ]
    for x, y, w, h, color in RECTS:
        parts.append(f"<rect x='{x}' y='{y}' width='{w}' height='{h}' fill='{color}'/>")
    parts.append("</svg>")
    return "".join(parts)


def _rgb(color: str):
    return int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)


def render_rgba():
    """32×32 的 RGBA 像素，先铺底色再逐层盖矩形（后画的在上）"""
    rows = [[(*_rgb(NAVY), 255)] * SIZE for _ in range(SIZE)]
    for x, y, w, h, color in RECTS:
        pixel = (*_rgb(color), 255)
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                rows[yy][xx] = pixel
    return rows


def _chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def render_png() -> bytes:
    raw = bytearray()
    for row in render_rgba():
        raw.append(0)  # 每行滤波器固定 0（不过滤），PNG 最简单也最好核对
        for r, g, b, a in row:
            raw.extend((r, g, b, a))
    ihdr = struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + _chunk(b"IHDR", ihdr)
        + _chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + _chunk(b"IEND", b"")
    )


def svg_uri() -> str:
    return "data:image/svg+xml," + quote(render_svg(), safe="=/:;'.,-()")


def png_uri() -> str:
    return "data:image/png;base64," + base64.b64encode(render_png()).decode("ascii")


def rewrite(html: str, svg: str, png: str) -> str:
    html = re.sub(r"<svg [\s\S]*?</svg>", svg, html, count=1)
    html = re.sub(
        r'href="data:image/svg\+xml,[^"]*"', f'href="{svg_uri()}"', html, count=1
    )
    html = re.sub(
        r'href="data:image/png;base64,[^"]*"', f'href="{png_uri()}"', html, count=1
    )
    return html


def main(argv):
    check_only = "--check" in argv
    html = INDEX.read_text(encoding="utf-8")
    expected = rewrite(html, render_svg(), png_uri())
    if check_only:
        if html != expected:
            print("✗ app/index.html 里的页签图标与 make_favicon.py 不一致", file=sys.stderr)
            print("  跑 python3 app/make_favicon.py 重新生成", file=sys.stderr)
            return 1
        print(f"页签图标与图形定义一致（SVG {len(svg_uri())} B + PNG {len(render_png())} B）")
        return 0
    INDEX.write_text(expected, encoding="utf-8")
    print(f"index.html 已更新：SVG {len(svg_uri())} 字节，PNG {len(render_png())} 字节")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

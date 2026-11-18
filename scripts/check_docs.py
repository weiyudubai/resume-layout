#!/usr/bin/env python3
"""文档自检：代码围栏是否配对、站内相对链接是否都能解析。

用法：python3 scripts/check_docs.py
退出码：0 通过；1 发现问题（打印文件与行号）。

只检查仓库里的 Markdown，不联网、不依赖第三方库。
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
SKIP_DIRS = {".git", "node_modules", "dist"}


def markdown_files() -> list[Path]:
    files: list[Path] = []
    for p in ROOT.rglob("*.md"):
        if any(part in SKIP_DIRS for part in p.relative_to(ROOT).parts):
            continue
        files.append(p)
    return sorted(files)


def check_file(path: Path) -> list[str]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")
    rel = path.relative_to(ROOT)

    # 1. 代码围栏：以行首 ``` 或 ~~~ 计，必须成对
    fences = 0
    for lineno, line in enumerate(text.splitlines(), 1):
        if line.startswith("```") or line.startswith("~~~"):
            fences += 1
    if fences % 2 != 0:
        errors.append(f"{rel}: 代码围栏数量为奇数（{fences}），有未闭合的代码块")

    # 2. 站内相对链接
    for lineno, line in enumerate(text.splitlines(), 1):
        for target in LINK_RE.findall(line):
            target = target.strip()
            if not target or target.startswith(("http://", "https://", "#", "mailto:")):
                continue
            local = target.split("#", 1)[0]
            if not local:
                continue
            resolved = (path.parent / local).resolve()
            if not resolved.exists():
                errors.append(f"{rel}:{lineno}: 链接指向不存在的路径 -> {target}")
    return errors


def main() -> int:
    files = markdown_files()
    errors: list[str] = []
    for f in files:
        errors.extend(check_file(f))

    print(f"检查 {len(files)} 个 Markdown 文件")
    if errors:
        print("\n发现问题：")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("通过：围栏配对、相对链接全部可解析")
    return 0


if __name__ == "__main__":
    sys.exit(main())

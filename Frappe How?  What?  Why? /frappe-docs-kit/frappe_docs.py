#!/usr/bin/env python3
"""Download, refresh, and package official Frappe documentation.

Uses JSON + llms.txt only. No HTML nav scraping.

Examples:
  python3 frappe_docs.py
  python3 frappe_docs.py download --images local
  python3 frappe_docs.py download --images remote
  python3 frappe_docs.py images --mode remote
  python3 frappe_docs.py skill --target both
  python3 frappe_docs.py refresh --space framework
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlparse
from urllib.request import Request, urlopen

KIT = Path(__file__).resolve().parent
ROOT = KIT
USER_AGENT = "Mozilla/5.0 (compatible; FrappeDocsLocalMirror/1.0)"
DEFAULT_BASE = "https://docs.frappe.io"
DEFAULT_SPACE = "framework"
DEFAULT_OUT = "docs"
CATALOG_NAMES = ("catalog.json", "manifest.json")
SKIP_MD = {"INDEX.md", "SKILL.md"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico", ".mov"}
MD_IMAGE = re.compile(r"!\[([^\]]*)\]\((.*?)\)")
HTML_IMG = re.compile(r"""(<img\b[^>]*?\bsrc=)(["'])([^"']+)(\2)""", re.I)
GROUP_RE = re.compile(r"^(\s*)-\s+\*\*(.+?)\*\*\s*$")
PAGE_RE = re.compile(r"^(\s*)-\s+\[(.*?)\]\((https?://[^)]+)\)\s*$")
FAKE_IMAGES = {"tennismart.png", "/images/api-flow.png"}


class DocsApp:
    """Interactive and CLI front door."""

    def __init__(self, args: argparse.Namespace) -> None:
        self.args = args
        self.base = args.base.rstrip("/")
        self.space = args.space.strip("/")
        self.out = Path(args.out)
        if not self.out.is_absolute():
            self.out = ROOT / self.out
        self.workers = args.workers
        self.catalog = Catalog(self.out, self.base, self.space, kit=KIT)

    def menu(self) -> None:
        self.catalog.load(required=False)
        print(self.catalog.summary())
        print()
        print("1) Download / refresh documentation pages")
        print("2) Set image links (local files  or  full docs.frappe.io URLs)")
        print("3) Generate an AI skill from the official catalog order")
        print("4) Refresh catalog from official llms.txt")
        print("5) Quit")
        choice = ask_choice("Choose", ["1", "2", "3", "4", "5"], "1")
        if choice == "1":
            self.download()
        elif choice == "2":
            self.images()
        elif choice == "3":
            self.skill()
        elif choice == "4":
            self.refresh()

    def download(self) -> None:
        images = getattr(self.args, "images", None) or ask_choice(
            "Images",
            ["local", "remote", "skip"],
            "local",
            labels={
                "local": "download images, use ![x](../files/x.png)",
                "remote": "use ![x](https://docs.frappe.io/files/x.png)",
                "skip": "leave image links as the site wrote them",
            },
        )
        self.refresh(quiet=True)
        pages = self.catalog.filtered_pages(getattr(self.args, "group", None))
        print(f"Downloading {len(pages)} pages...")
        failed = []
        with ThreadPoolExecutor(max_workers=self.workers) as pool:
            jobs = {pool.submit(self._fetch_page, page): page for page in pages}
            done = 0
            for future in as_completed(jobs):
                page, error = future.result()
                done += 1
                mark = "FAIL" if error else "ok"
                print(f"[{done}/{len(pages)}] {mark} {page['file']}")
                if error:
                    failed.append({"url": page["url"], "error": error})
        self.catalog.save()
        self._write_index()
        if images != "skip":
            self.images(mode=images)
        print(f"Pages: {len(pages) - len(failed)} / {len(pages)}")
        for item in failed:
            print(f"  {item['url']}: {item['error']}")

    def images(self, mode: str | None = None) -> None:
        mode = mode or getattr(self.args, "mode", None) or ask_choice(
            "Image mode",
            ["local", "remote"],
            "local",
            labels={
                "local": "download and rewrite to relative files/ paths",
                "remote": "rewrite to https://docs.frappe.io/files/...",
            },
        )
        rewriter = ImageRewriter(self.out, self.base, self.workers)
        changed, failed = rewriter.apply(mode)
        print(f"Updated {changed} markdown files ({mode})")
        for item in failed:
            print(f"  {item['url']}: {item['error']}")

    def skill(self) -> None:
        self.catalog.load()
        target = getattr(self.args, "target", None) or ask_choice(
            "Skill should tell the AI to use",
            ["url", "local", "both"],
            "both",
            labels={
                "url": "official page URLs",
                "local": "local markdown files",
                "both": "both URL and local path",
            },
        )
        layout = getattr(self.args, "layout", None) or ask_choice(
            "Skill layout",
            ["one", "per-group"],
            "one",
            labels={
                "one": "one skill with every official group",
                "per-group": "one skill file per official group",
            },
        )
        dest = Path(getattr(self.args, "skill_out", "") or KIT / "frappe-framework-docs-skill.md")
        if not dest.is_absolute():
            dest = KIT / dest
        written = SkillBuilder(self.catalog, self.out).write(dest, target, layout)
        for path in written:
            print(f"Wrote {path}")

    def refresh(self, quiet: bool = False) -> None:
        count = self.catalog.refresh()
        if not quiet:
            print(f"Catalog refreshed: {count} pages from {self.catalog.llms_url}")

    def run(self) -> None:
        command = getattr(self.args, "command", None)
        if not command:
            self.menu()
            return
        getattr(self, command)()

    def _fetch_page(self, page: dict) -> tuple[dict, str | None]:
        dest = self.out / page["file"]
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            dest.write_text(http_text(page["md_url"]), encoding="utf-8")
            return page, None
        except Exception as exc:  # noqa: BLE001
            return page, str(exc)

    def _write_index(self) -> None:
        lines = [
            f"# {self.space.title()} documentation",
            "",
            f"Official order from {self.catalog.llms_url}",
            "",
        ]
        current = None
        for page in self.catalog.pages:
            group = " / ".join(page["group"]) or "(top level)"
            if group != current:
                lines.append(f"## {group}")
                lines.append("")
                current = group
            lines.append(f"- [{page['title']}]({page['file']}) — {page['url']}")
        (self.out / "INDEX.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


class Catalog:
    """Official page list. Kit JSON first, then the output folder, then llms.txt."""

    def __init__(self, out: Path, base: str, space: str, kit: Path = KIT) -> None:
        self.out = out
        self.base = base
        self.space = space
        self.kit = kit
        self.pages: list[dict] = []
        self.path = kit / "catalog.json"

    @property
    def llms_url(self) -> str:
        return f"{self.base}/{self.space}/llms.txt"

    def summary(self) -> str:
        groups = {tuple(p.get("group") or []) for p in self.pages}
        source = self.path if self.path.exists() else "not loaded"
        return f"Catalog: {len(self.pages)} pages, {len(groups)} groups ({source})"

    def load(self, required: bool = True) -> None:
        candidates = [self.kit / name for name in CATALOG_NAMES]
        candidates.extend(self.out / name for name in CATALOG_NAMES)
        seen: set[Path] = set()
        for path in candidates:
            if path in seen or not path.exists():
                continue
            seen.add(path)
            data = json.loads(path.read_text(encoding="utf-8"))
            self.pages = [normalize_page(item, self.base) for item in data.get("pages", [])]
            self.path = self.kit / "catalog.json"
            return
        if required:
            raise SystemExit("No catalog.json found. Run: python3 frappe_docs.py refresh")

    def save(self) -> None:
        self.out.mkdir(parents=True, exist_ok=True)
        payload = {
            "source": f"{self.base}/{self.space}",
            "llms": self.llms_url,
            "page_count": len(self.pages),
            "pages": self.pages,
        }
        body = json.dumps(payload, indent=2) + "\n"
        self.path = self.kit / "catalog.json"
        self.path.write_text(body, encoding="utf-8")
        (self.out / "catalog.json").write_text(body, encoding="utf-8")
        (self.out / "manifest.json").write_text(body, encoding="utf-8")

    def refresh(self) -> int:
        existing = {page["url"]: page for page in self.pages} if self.pages else {}
        if not existing:
            self.load(required=False)
            existing = {page["url"]: page for page in self.pages}
        text = http_text(self.llms_url)
        self.out.mkdir(parents=True, exist_ok=True)
        (self.out / "llms.txt").write_text(text, encoding="utf-8")
        fresh = parse_llms(text, self.base)
        for page in fresh:
            old = existing.get(page["url"])
            if old and old.get("file"):
                page["file"] = old["file"]
        self.pages = fresh
        self.save()
        return len(self.pages)

    def filtered_pages(self, group: str | None) -> list[dict]:
        if not group:
            return list(self.pages)
        needle = group.lower()
        return [page for page in self.pages if any(needle in part.lower() for part in page["group"])]


class ImageRewriter:
    def __init__(self, out: Path, base: str, workers: int) -> None:
        self.out = out
        self.base = base
        self.workers = workers

    def apply(self, mode: str) -> tuple[int, list[dict]]:
        files = [
            path
            for path in self.out.rglob("*.md")
            if path.name not in SKIP_MD and path.suffix == ".md"
        ]
        refs = []
        for path in files:
            refs.extend(extract_images(path.read_text(encoding="utf-8")))
        unique = sorted(set(refs))
        failed: list[dict] = []
        local_map: dict[str, Path] = {}
        if mode == "local":
            local_map, failed = self._download(unique)
        changed = 0
        for path in files:
            original = path.read_text(encoding="utf-8")
            updated = rewrite_images(original, path, mode, self.base, self.out, local_map)
            if updated != original:
                path.write_text(updated, encoding="utf-8")
                changed += 1
        return changed, failed

    def _download(self, urls: list[str]) -> tuple[dict[str, Path], list[dict]]:
        mapping: dict[str, Path] = {}
        failed: list[dict] = []
        jobs = []
        for url in urls:
            dest = local_image_path(url, self.out, self.base)
            remote = remote_image_url(url, self.base)
            if dest is None or remote is None:
                continue
            jobs.append((url, dest, remote))
        print(f"Downloading {len(jobs)} images...")
        with ThreadPoolExecutor(max_workers=self.workers) as pool:
            futures = {
                pool.submit(http_bytes, remote): (url, dest)
                for url, dest, remote in jobs
            }
            done = 0
            for future in as_completed(futures):
                url, dest = futures[future]
                done += 1
                try:
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    dest.write_bytes(future.result())
                    mapping[url] = dest
                    print(f"[{done}/{len(jobs)}] {dest.relative_to(self.out)}")
                except Exception as exc:  # noqa: BLE001
                    failed.append({"url": url, "error": str(exc)})
                    print(f"[{done}/{len(jobs)}] FAIL {url}")
        return mapping, failed


class SkillBuilder:
    def __init__(self, catalog: Catalog, out: Path) -> None:
        self.catalog = catalog
        self.out = out

    def write(self, dest: Path, target: str, layout: str) -> list[Path]:
        if layout == "per-group":
            folder = dest if dest.suffix != ".md" else dest.parent / "skills"
            folder.mkdir(parents=True, exist_ok=True)
            written = []
            for group, pages in group_pages(self.catalog.pages).items():
                name = slug(group or "other")
                path = folder / f"frappe-docs-{name}.md"
                path.write_text(
                    self._render(
                        group or "Other",
                        pages,
                        target,
                        slug(f"frappe-{self.catalog.space}-{group or 'other'}-docs"),
                    ),
                    encoding="utf-8",
                )
                written.append(path)
            return written
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(
            self._render(space_title(self.catalog.space), self.catalog.pages, target),
            encoding="utf-8",
        )
        return [dest]

    def _render(self, title: str, pages: list[dict], target: str, name: str | None = None) -> str:
        name = name or slug(f"frappe-{self.catalog.space}-docs")
        lines = [
            "---",
            f"name: {name}",
            "description: Use official Frappe documentation to answer implementation questions, verify APIs and DocTypes, and open the matching official URL or local markdown file before proposing framework-specific code.",
            "---",
            "",
            f"# {title} documentation skill",
            "",
            "Use this skill when implementing, debugging, reviewing, or explaining Frappe code.",
            "The catalog follows the official documentation order.",
            "",
            "## Instructions",
            "",
            "1. Identify the task area and open the narrowest matching page below.",
            "2. Read that page before relying on memory for APIs, hooks, or lifecycle behavior.",
            "3. Prefer documented framework patterns. Do not invent APIs.",
            "4. Cite the page you used.",
            "",
            f"**Pages in official order:** {len(pages)}",
            "",
        ]
        for group, group_pages_ in group_pages(pages).items():
            lines.append(f"## {group or 'Other'}")
            lines.append("")
            for page in group_pages_:
                hint = page["title"].lower()
                refs = []
                if target in {"url", "both"}:
                    refs.append(page["url"])
                if target in {"local", "both"}:
                    refs.append(f"`{display_path(self.out / page['file'])}`")
                joined = " — ".join(refs)
                lines.append(f"- **{page['title']}** — Browse when the task involves {hint}: {joined}")
            lines.append("")
        return "\n".join(lines)


def normalize_page(item: dict, base: str) -> dict:
    url = item.get("url") or item.get("md_url", "")
    url = url[:-3] if url.endswith(".md") else url.rstrip("/")
    title = clean_title(item.get("title") or url.rsplit("/", 1)[-1])
    group = item.get("group") or []
    if isinstance(group, str):
        group = [group]
    filename = item.get("file") or page_filename(group, title)
    return {
        "title": title,
        "url": url,
        "md_url": item.get("md_url") or f"{url}.md",
        "group": group,
        "file": filename,
    }


def parse_llms(text: str, base: str) -> list[dict]:
    stack: list[tuple[int, str]] = []
    pages: list[dict] = []
    for raw in text.splitlines():
        group_match = GROUP_RE.match(raw)
        page_match = PAGE_RE.match(raw)
        if group_match:
            indent = len(group_match.group(1))
            name = clean_title(group_match.group(2))
            while stack and stack[-1][0] >= indent:
                stack.pop()
            stack.append((indent, name))
            continue
        if not page_match:
            continue
        indent = len(page_match.group(1))
        title = clean_title(page_match.group(2))
        url = page_match.group(3)
        url = url[:-3] if url.endswith(".md") else url.rstrip("/")
        while stack and stack[-1][0] >= indent:
            stack.pop()
        group = [name for _indent, name in stack]
        pages.append(normalize_page({"title": title, "url": url, "group": group}, base))
    return pages


def extract_images(text: str) -> list[str]:
    urls = []
    for block in prose_blocks(text):
        for match in MD_IMAGE.finditer(block):
            url, _title = split_md_dest(match.group(2))
            urls.append(url)
        urls.extend(match.group(3) for match in HTML_IMG.finditer(block))
    return [url.strip() for url in urls if is_doc_image(url.strip())]


def rewrite_images(
    text: str,
    md_file: Path,
    mode: str,
    base: str,
    out: Path,
    local_map: dict[str, Path],
) -> str:
    def transform(block: str) -> str:
        def md(match: re.Match[str]) -> str:
            url, title = split_md_dest(match.group(2))
            new = convert_image(url.strip(), mode, md_file, base, out, local_map)
            if new is None:
                return match.group(0)
            return f"![{match.group(1)}]({new}{title})"

        def html(match: re.Match[str]) -> str:
            url = match.group(3).strip()
            new = convert_image(url, mode, md_file, base, out, local_map)
            if new is None:
                return match.group(0)
            return f"{match.group(1)}{match.group(2)}{new}{match.group(4)}"

        block = MD_IMAGE.sub(md, block)
        return HTML_IMG.sub(html, block)

    parts = re.split(r"(```.*?```)", text, flags=re.S)
    return "".join(part if part.startswith("```") else transform(part) for part in parts)


def convert_image(
    url: str,
    mode: str,
    md_file: Path,
    base: str,
    out: Path,
    local_map: dict[str, Path],
) -> str | None:
    if not is_doc_image(url):
        return None
    if mode == "remote":
        remote = remote_image_url(url, base)
        return remote
    dest = local_map.get(url) or local_image_path(url, out, base)
    if dest is None or not dest.exists():
        return None
    return markdown_relpath(md_file, dest)


def is_doc_image(url: str) -> bool:
    if not url or url in FAKE_IMAGES or url.startswith(("data:", "mailto:", "#")):
        return False
    path = unquote(urlparse(url).path).lower()
    if not any(path.endswith(ext) for ext in IMAGE_EXT):
        return "/files/" in url or "/private/files/" in url
    if url.startswith(("http://", "https://")):
        return True
    return True


def local_image_path(url: str, out: Path, base: str) -> Path | None:
    parsed = urlparse(url if "://" in url else urljoin_base(base, url))
    path = unquote(parsed.path.lstrip("/"))
    if not path:
        return None
    host = parsed.netloc.lower()
    if not host or host.endswith("frappe.io") or host.endswith("erpnext.com"):
        if path.startswith("files/") or path.startswith("private/files/"):
            return out / path
        if "/" not in path:
            return out / "files" / path
    if url.startswith(("../", "./")):
        candidate = (out / unquote(Path(url).name)).resolve()
        files_dir = (out / "files").resolve()
        if str(candidate).startswith(str(files_dir)):
            return candidate
        return out / "files" / Path(unquote(url)).name
    return out / "external" / host.replace(":", "_") / path


def remote_image_url(url: str, base: str) -> str | None:
    if url.startswith(("http://", "https://")):
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}{quote(unquote(parsed.path), safe='/')}"
    if url.startswith("/"):
        return f"{base}{quote(unquote(url), safe='/')}"
    name = Path(unquote(url)).name
    if url.startswith(("../", "./")) or "/" not in url.strip("./"):
        return f"{base}/files/{quote(name, safe='')}"
    return f"{base}/files/{quote(unquote(url), safe='')}"


def urljoin_base(base: str, url: str) -> str:
    if url.startswith("/"):
        return f"{base}{url}"
    return f"{base}/files/{Path(url).name}"


def prose_blocks(text: str) -> list[str]:
    return [part for part in re.split(r"(```.*?```)", text, flags=re.S) if not part.startswith("```")]


def split_md_dest(dest: str) -> tuple[str, str]:
    dest = dest.strip()
    if dest.startswith("<") and ">" in dest:
        url, rest = dest[1:].split(">", 1)
        return url.strip(), rest
    match = re.match(r'^(.*?)\s+(".*")\s*$', dest)
    if match:
        return match.group(1).strip(), f" {match.group(2)}"
    return dest, ""


def markdown_relpath(from_file: Path, to_file: Path) -> str:
    rel = Path(os.path.relpath(to_file, from_file.parent)).as_posix()
    return "/".join(".." if part == ".." else quote(part, safe="()!,.-_") for part in rel.split("/"))


def page_filename(group: list[str], title: str) -> str:
    parts = [sanitize(part) for part in group if part]
    parts.append(f"{sanitize(title)}.md")
    return "/".join(parts)


def group_pages(pages: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for page in pages:
        key = page["group"][0] if page.get("group") else ""
        grouped.setdefault(key, []).append(page)
    return grouped


def clean_title(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def sanitize(value: str) -> str:
    value = clean_title(value).replace("/", "-").replace(":", " -")
    value = re.sub(r'[<>:"|?*\\]', "", value).rstrip(" .")
    return value or "untitled"


def slug(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value or "docs"


def space_title(space: str) -> str:
    known = {"framework": "Frappe Framework", "erpnext": "ERPNext"}
    return known.get(space.lower(), space.replace("-", " ").title())


def display_path(path: Path) -> str:
    resolved = path.resolve()
    for base in (KIT, Path.cwd()):
        try:
            return resolved.relative_to(base.resolve()).as_posix()
        except ValueError:
            continue
    return path.as_posix()


def load_defaults() -> dict:
    path = KIT / "defaults.json"
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, dict) else {}


def http_text(url: str) -> str:
    return http_bytes(url).decode("utf-8")


def http_bytes(url: str) -> bytes:
    last: Exception | None = None
    for attempt in range(1, 5):
        try:
            req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
            with urlopen(req, timeout=60) as resp:
                data = resp.read()
                ctype = (resp.headers.get("Content-Type") or "").lower()
                if "text/html" in ctype and url.endswith((".png", ".jpg", ".gif", ".webp")):
                    raise RuntimeError("HTML instead of image")
                return data
        except (HTTPError, URLError, TimeoutError, OSError, RuntimeError) as exc:
            last = exc
            time.sleep(min(2 ** attempt, 8))
    raise RuntimeError(f"{url}: {last}")


def ask_choice(prompt: str, options: list[str], default: str, labels: dict[str, str] | None = None) -> str:
    print(f"\n{prompt}:")
    for index, option in enumerate(options, start=1):
        extra = f" — {labels[option]}" if labels and option in labels else ""
        star = " (default)" if option == default else ""
        print(f"  {index}) {option}{extra}{star}")
    raw = input(f"Enter 1-{len(options)} [{default}]: ").strip().lower()
    if not raw:
        return default
    if raw in options:
        return raw
    if raw.isdigit() and 1 <= int(raw) <= len(options):
        return options[int(raw) - 1]
    print(f"Unknown choice, using {default}")
    return default


def build_parser() -> argparse.ArgumentParser:
    defaults = load_defaults()
    parser = argparse.ArgumentParser(description="Download and package official Frappe docs")
    parser.add_argument("--base", default=defaults.get("base", DEFAULT_BASE))
    parser.add_argument("--space", default=defaults.get("space", DEFAULT_SPACE), help="framework, erpnext, ...")
    parser.add_argument("--out", default=defaults.get("out", DEFAULT_OUT))
    parser.add_argument("--workers", type=int, default=int(defaults.get("workers", 8)))
    parser.add_argument("--group", help="only pages whose official group contains this text")
    sub = parser.add_subparsers(dest="command")
    download = sub.add_parser("download", help="refresh catalog and download pages")
    download.add_argument("--images", choices=["local", "remote", "skip"], default=None)
    images = sub.add_parser("images", help="rewrite image links in existing pages")
    images.add_argument("--mode", choices=["local", "remote"], required=True)
    skill = sub.add_parser("skill", help="generate an AI skill in official docs order")
    skill.add_argument("--target", choices=["url", "local", "both"], default=defaults.get("skill_target", "both"))
    skill.add_argument("--layout", choices=["one", "per-group"], default=defaults.get("skill_layout", "one"))
    skill.add_argument(
        "--skill-out",
        default=str(defaults.get("skill_out", "frappe-framework-docs-skill.md")),
    )
    sub.add_parser("refresh", help="rebuild catalog.json from official llms.txt")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    try:
        DocsApp(args).run()
    except KeyboardInterrupt:
        print("\nStopped")
        sys.exit(1)


if __name__ == "__main__":
    main()

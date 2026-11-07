# Frappe docs kit

This folder is a complete toolkit to download official Frappe documentation and to build an AI skill.

## Folder contents

| File | Role |
| --- | --- |
| `frappe_docs.py` | The only script you run |
| `catalog.json` | Official page list in site order (265 Framework pages) |
| `defaults.json` | Base URL, space, output folder, and worker count |
| `README.md` | This guide |

After you download pages, the script creates a `docs` folder next to these files.

## What you need

1. Python 3.9 or newer.
2. Network access to `https://docs.frappe.io`.

You do not install extra Python packages.

## Start

1. Copy this folder to your computer.
2. Open a terminal.
3. Change to this folder.
4. Run:

```bash
python3 frappe_docs.py
```

The menu has four actions:

1. Download or refresh documentation pages.
2. Set image links to local files or to full site URLs.
3. Generate an AI skill in official documentation order.
4. Refresh `catalog.json` from the official `llms.txt` file.

## Download the documentation

Run this command from this folder:

```bash
python3 frappe_docs.py download --images local
```

The script refreshes the catalog, then writes each page into `docs/` in official group folders.

Choose one image mode:

| Mode | Result in markdown |
| --- | --- |
| `local` | Download images. Use `![Awesomebar](../files/awesomebar.png)` |
| `remote` | Do not download images. Use `![Awesomebar](https://docs.frappe.io/files/awesomebar.png)` |
| `skip` | Keep the image links as the site wrote them |

Example with full site image URLs:

```bash
python3 frappe_docs.py download --images remote
```

Download only one official group:

```bash
python3 frappe_docs.py download --images local --group "Python API"
```

## Change image links later

If the pages already exist, switch the image style without a full page download.

Use local files:

```bash
python3 frappe_docs.py images --mode local
```

Use full site URLs:

```bash
python3 frappe_docs.py images --mode remote
```

## Generate an AI skill

The skill tells an agent which official URL to browse, which local markdown file to read, or both. The groups follow official documentation order.

```bash
python3 frappe_docs.py skill --target both
```

Other options:

```bash
python3 frappe_docs.py skill --target url
python3 frappe_docs.py skill --target local
python3 frappe_docs.py skill --target both --layout per-group
```

| `--target` | The skill lists |
| --- | --- |
| `url` | Official page URLs |
| `local` | Paths such as `docs/Getting Started/Introduction.md` |
| `both` | URL and local path |

`--layout one` writes one skill file. `--layout per-group` writes one skill file for each official group.

The default skill file is `frappe-framework-docs-skill.md` in this folder.

## Refresh the catalog

Update `catalog.json` from the live official index:

```bash
python3 frappe_docs.py refresh
```

Use this when the official site adds or moves pages.

## Change defaults

Edit `defaults.json` in this folder.

```json
{
  "base": "https://docs.frappe.io",
  "space": "framework",
  "out": "docs",
  "workers": 8,
  "skill_target": "both",
  "skill_layout": "one",
  "skill_out": "frappe-framework-docs-skill.md"
}
```

| Key | Meaning |
| --- | --- |
| `base` | Documentation site |
| `space` | `framework`, `erpnext`, or another public space |
| `out` | Folder for downloaded pages |
| `workers` | Parallel downloads |

Command flags override `defaults.json`.

Download ERPNext docs into a separate folder:

```bash
python3 frappe_docs.py --space erpnext --out docs-erpnext refresh
python3 frappe_docs.py --space erpnext --out docs-erpnext download --images remote
```

## Share this kit

1. Keep `frappe_docs.py`, `catalog.json`, `defaults.json`, and `README.md` in the folder.
2. Zip the folder and send it.
3. Each teammate opens the folder and runs `python3 frappe_docs.py`.

Do not zip the `docs` folder if you only want to share the toolkit. That folder is large after a local image download. Each person can download pages on their own machine.

If you want to share the pages too, include the `docs` folder in the zip.

## Output layout

```
frappe-docs-kit/
  frappe_docs.py
  catalog.json
  defaults.json
  README.md
  frappe-framework-docs-skill.md
  docs/
    INDEX.md
    Getting Started/
      Introduction.md
    Tutorial/
    Python API/
    files/
```

`docs/INDEX.md` lists every page in official order.

## Common problems

If Python is not found, try `python` instead of `python3`.

If a download fails, run the same command again. The script retries failed HTTP requests.

If images stay as `/files/...` after `images --mode local`, the official file is missing or private. The live site has the same gap.

If the catalog is empty, run `python3 frappe_docs.py refresh` and try again.

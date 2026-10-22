#!/usr/bin/env python3
"""
Remove the data (INSERT / REPLACE statements) of huge Frappe tables such as
tabVersion and `tabError Log` from a MySQL/MariaDB dump.

The table structure (CREATE TABLE) is kept, so the cleaned file restores
normally, just with those tables empty.

Usage:
    python clean_sql.py                                  # uses DEFAULT_SRC below
    python clean_sql.py backup.sql
    python clean_sql.py backup.sql.gz out.sql.gz         # gzip is auto-detected
    python clean_sql.py backup.sql -t "tabActivity Log"  # add more tables

Convert backup.sql to backup.sql.gz:
    gzip -k backup.sql
"""
import argparse
import gzip
import os
import re
import sys
import time

DEFAULT_SRC = "database_backup_file.sql"
DEFAULT_TABLES = ["tabVersion", "tabError Log"]
BUFFER_SIZE = 16 * 1024 * 1024  # 16 MB read/write buffers


def build_regex(tables):
    names = b"|".join(re.escape(t.encode("utf-8")) for t in tables)
    # Keywords are case-insensitive; table names stay case-sensitive, like MySQL on Linux.
    # Handles: INSERT INTO, INSERT IGNORE INTO, REPLACE INTO, INTO-less forms,
    # LOW_PRIORITY/DELAYED/HIGH_PRIORITY, and `db`.`table` qualified names.
    return re.compile(
        rb"^\s*(?i:INSERT(?:\s+(?:LOW_PRIORITY|DELAYED|HIGH_PRIORITY))?(?:\s+IGNORE)?|REPLACE)"
        rb"\s+(?i:INTO\s+)?(?:`[^`]+`\.)?`(?:" + names + rb")`"
    )


def default_dst(src):
    for ext in (".sql.gz", ".sql"):
        if src.endswith(ext):
            return src[: -len(ext)] + "-clean" + ext
    return src + "-clean"


def open_in(path):
    if path.endswith(".gz"):
        return gzip.open(path, "rb")
    return open(path, "rb", buffering=BUFFER_SIZE)


def open_out(path, compress):
    # `compress` is decided from the final name, because the temp file name ends in .tmp.
    if compress:
        return gzip.open(path, "wb", compresslevel=6)
    return open(path, "wb", buffering=BUFFER_SIZE)


def ends_statement(line):
    # Only look at the last few bytes: lines can be hundreds of MB long.
    return line[-8:].rstrip().endswith(b";")


def clean(src, dst, tables):
    pattern = build_regex(tables)
    match = pattern.match
    removed = 0
    skipped_bytes = 0
    skipping = False  # True while inside a target statement that spans several lines

    tmp = dst + ".tmp"
    try:
        with open_in(src) as fin, open_out(tmp, dst.endswith(".gz")) as fout:
            write = fout.write
            for line in fin:
                if skipping:
                    skipped_bytes += len(line)
                    if ends_statement(line):
                        skipping = False
                    continue

                # Fast path: only lines that start like INSERT/REPLACE (or indented) hit the regex.
                if line[:1] in b"IiRr \t" and match(line):
                    removed += 1
                    skipped_bytes += len(line)
                    if not ends_statement(line):
                        skipping = True
                    continue

                write(line)
        os.replace(tmp, dst)  # the output only appears once it is complete
    except BaseException:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise

    return removed, skipped_bytes


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", nargs="?", default=DEFAULT_SRC, help="input .sql or .sql.gz file")
    ap.add_argument("dst", nargs="?", help="output file (default: <name>-clean.sql[.gz])")
    ap.add_argument("-t", "--table", action="append", default=[], help="extra table to strip (repeatable)")
    args = ap.parse_args()

    dst = args.dst or default_dst(args.src)
    tables = DEFAULT_TABLES + args.table

    if os.path.abspath(args.src) == os.path.abspath(dst):
        sys.exit("Error: input and output must be different files.")

    start = time.time()
    try:
        removed, skipped = clean(args.src, dst, tables)
    except OSError as exc:
        sys.exit(f"Error: {exc}")

    print(f"Created: {dst}")
    print(f"Tables cleaned: {', '.join(tables)}")
    print(f"Removed INSERT/REPLACE statements: {removed}")
    print(f"Removed data: {skipped / 1024 / 1024:.1f} MB (uncompressed)")
    print(f"Time: {time.time() - start:.1f}s")


if __name__ == "__main__":
    main()

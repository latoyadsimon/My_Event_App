#!/usr/bin/env python3
"""
QA audit tests for the Python generators and the Markdown documentation.

    python3 -B qa/test_generators.py -v

The generators run on COPIES in a temp folder, so project files are never modified.
Standard library only (unittest).
"""
import contextlib
import importlib.util
import io
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTLINE = ROOT / "app_outline"
ERD = OUTLINE / "erd"
PAGES = OUTLINE / "pages"


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ErdGenerator(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        shutil.copytree(ERD, self.tmp / "erd")
        self.erd = load_module(self.tmp / "erd" / "build_erd.py", "build_erd_copy")

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_generated_files_are_in_sync_with_schema(self):
        """erd_data.js and data_dictionary.md in the repo match a fresh build from schema.sql."""
        subprocess.run([sys.executable, "-B", str(self.tmp / "erd" / "build_erd.py")], check=True, capture_output=True)
        for name in ("erd_data.js", "data_dictionary.md"):
            self.assertEqual((self.tmp / "erd" / name).read_text(), (ERD / name).read_text(), f"{name} is stale")

    def test_parser_counts_match_live_database(self):
        """Parsed counts equal what Postgres created (live counts from qa/run_qa_db_probes.sh: 37 / 408 / 107)."""
        tables = self.erd.parse_schema((ERD / "schema.sql").read_text())
        self.assertEqual(len(tables), 37)
        self.assertEqual(sum(len(t["columns"]) for t in tables.values()), 408)
        self.assertEqual(sum(1 for t in tables.values() for c in t["columns"] if c["fk"]), 107)

    def test_malformed_table_header_gives_a_clear_error(self):
        """A '-- @table' header missing its 'stories'/'rls' parts should stop with a readable message, not a traceback."""
        sql = "-- @table widgets | sales\n-- A widget.\ncreate table public.widgets (\n  id uuid primary key  -- id\n);"
        try:
            self.erd.parse_schema(sql)
        except SystemExit:
            return  # friendly, expected
        except Exception as exc:  # noqa: BLE001 - we want to report the raw crash
            self.fail(f"crashed with {type(exc).__name__}: {exc}")
        self.fail("malformed header was accepted silently")


class PagesGenerator(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        shutil.copytree(OUTLINE, self.tmp / "app_outline")
        self.script = self.tmp / "app_outline" / "pages" / "build_pages.py"

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def run_script(self):
        return subprocess.run([sys.executable, "-B", str(self.script)], check=True, capture_output=True, text=True).stdout

    def test_generated_pages_are_in_sync_and_idempotent(self):
        """A fresh build changes nothing (repo is in sync), and so does a second build."""
        first = self.run_script()
        self.assertIn("Files written or updated: 0", first, f"repo copies were stale:\n{first}")
        self.assertIn("Phase 1 stories mapped: 76/76", first)
        second = self.run_script()
        self.assertIn("Files written or updated: 0", second)

    def test_story_counts(self):
        bp = load_module(self.script, "build_pages_copy")
        stories = bp.read_stories((OUTLINE / "user_stories.md").read_text().split("\n"))
        self.assertEqual(len(stories), 151)
        self.assertEqual(sum(1 for s in stories.values() if bp.is_phase1(s)), 76)


class Artifacts(unittest.TestCase):
    def test_every_wireframed_page_has_its_image(self):
        bp = load_module(PAGES / "build_pages.py", "build_pages_ro")
        missing = [f"{p['role']}/{p['folder']}" for p in bp.PAGES
                   if p["route"] and not (PAGES / p["role"] / p["folder"] / "wireframe.png").exists()]
        self.assertEqual(missing, [])

    def test_wireframe_routes_are_unique(self):
        routes = [s["route"] for s in json.loads((PAGES / "_wireframe_screens.json").read_text())]
        self.assertEqual(len(routes), len(set(routes)), "duplicate routes would map two screens to one folder")

    def test_markdown_links_resolve(self):
        """Every relative link/image in the project's Markdown points at a file or folder that exists."""
        files = [ROOT / "CLAUDE.md", *ROOT.glob("documentation/*.md"), *ROOT.glob("wireframes/*.md"), *OUTLINE.rglob("*.md")]
        link = re.compile(r"!?\[[^\]]*\]\(([^)\s]+)\)")
        broken = []
        for md in files:
            for target in link.findall(md.read_text(encoding="utf-8")):
                if re.match(r"^(https?:|mailto:|#)", target):
                    continue
                path = (md.parent / target.split("#")[0]).resolve()
                if not path.exists():
                    broken.append(f"{md.relative_to(ROOT)} → {target}")
        self.assertEqual(broken, [], "\n".join(broken))


if __name__ == "__main__":
    sys.dont_write_bytecode = True
    unittest.main()

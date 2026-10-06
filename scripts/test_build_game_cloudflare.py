"""Validate the separate game package and protect existing output directories."""
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

import build_game_cloudflare as game_build


class GamePackageTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory(prefix='tomo-game-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'source'
        self.game = self.root / 'TomoGame_V1.0'
        self.game.mkdir(parents=True)
        for name in ['style.css', 'tokens.css', 'manifest.json', 'sw.js', 'js/game.js', 'js/objects.js', 'assets/icon512.png']:
            target = self.game / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text('fixture', encoding='utf-8')
        (self.game / 'index.html').write_text('<a href="../index.html">Home</a><link href="/favicon.ico" type="image/x-icon"><link rel="canonical" href="' + game_build.OLD_URL + '">', encoding='utf-8')
        (self.game / 'js/game.js').write_text("const GAME_URL = '" + game_build.OLD_URL + "';", encoding='utf-8')
        (self.root / 'index.html').write_text('Do not publish the main site', encoding='utf-8')
        (self.game / '.hallmark').mkdir()
        (self.game / '.hallmark/log.json').write_text('Do not publish tooling', encoding='utf-8')
        self.output = Path(self.temp.name) / 'public'
        self.url = 'https://tomo-travel-game.pages.dev/'
        for item in [patch.object(game_build, 'ROOT', self.root), patch.object(game_build, 'GAME', self.game)]:
            item.start()
            self.addCleanup(item.stop)

    def build(self, output=None, url=None):
        with redirect_stdout(StringIO()):
            return game_build.build(output or self.output, url or self.url)

    def test_game_is_self_contained_and_urls_are_rewritten(self):
        self.build()
        html = (self.output / 'index.html').read_text(encoding='utf-8')
        self.assertIn('href="https://tomotravel-pm.com/"', html)
        self.assertIn('href="assets/icon512.png"', html)
        self.assertIn(self.url, html)
        self.assertNotIn(game_build.OLD_URL, html)
        self.assertIn(self.url, (self.output / 'js/game.js').read_text())
        self.assertTrue((self.output / '404.html').is_file())
        self.assertFalse((self.output / '.hallmark').exists())
        self.assertNotIn('main site', html)

    def test_existing_output_is_preserved(self):
        self.build()
        before = (self.output / 'index.html').read_bytes()
        with self.assertRaises(ValueError):
            self.build()
        self.assertEqual((self.output / 'index.html').read_bytes(), before)

    def test_source_and_ancestors_cannot_be_used_as_output(self):
        for folder in [self.root, self.game, self.game / 'nested', self.root.parent]:
            with self.subTest(folder=folder), self.assertRaises(ValueError):
                self.build(output=folder)

    def test_non_root_or_non_https_urls_are_rejected(self):
        for url in ['http://example.com/', 'https://example.com/path/', 'https://example.com/?token=x', 'https://user:password@example.com/']:
            with self.subTest(url=url), self.assertRaises(ValueError):
                self.build(url=url)

    def test_oversized_cloudflare_asset_fails(self):
        with (self.game / 'assets/oversize.mp4').open('wb') as handle:
            handle.truncate(25 * 1024 * 1024 + 1)
        with self.assertRaisesRegex(ValueError, '25 MiB'):
            self.build()


if __name__ == '__main__':
    unittest.main()

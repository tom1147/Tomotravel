"""Regression checks for repeated Netlify builds and protected local output."""
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
import os
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import build_production


class BuildProductionTests(unittest.TestCase):
    def setUp(self):
        # All fixture files, including mock media, stay outside the real clone.
        self.temp = tempfile.TemporaryDirectory(prefix='tomotravel-build-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'checkout'
        self.root.mkdir()
        (self.root / 'index.html').write_text('first version', encoding='utf-8')
        (self.root / 'scripts').mkdir()
        self.assets = Path(self.temp.name) / 'external-assets'
        self.assets.mkdir()
        (self.assets / 'hero.webp').write_bytes(b'verified asset fixture')
        self.data = {'directory': '_design-assets/test', 'files': {
            'hero': {'file': 'hero.webp', 'bytes': 22}}}
        self.output = self.root / 'dist'
        for mock in [patch.object(build_production, 'ROOT', self.root),
                     patch.object(build_production, 'ensure_assets', return_value=(self.assets, self.data)),
                     patch.dict(os.environ, {'NETLIFY': 'true'})]:
            mock.start()
            self.addCleanup(mock.stop)
        self.checks = patch.object(build_production.subprocess, 'run').start()
        self.addCleanup(patch.stopall)

    def build(self, output=None):
        with redirect_stdout(StringIO()):
            return build_production.build(output or self.output)

    def test_repeated_build_replaces_output_and_removes_stale_files(self):
        self.build()
        (self.output / 'removed-page.html').write_text('stale', encoding='utf-8')
        (self.root / 'index.html').write_text('second version', encoding='utf-8')
        self.build()
        self.assertEqual((self.output / 'index.html').read_text(), 'second version')
        self.assertFalse((self.output / 'removed-page.html').exists())
        self.assertFalse((self.output / 'dist').exists())
        self.assertEqual((self.output / '_design-assets/test/hero.webp').read_bytes(),
                         (self.assets / 'hero.webp').read_bytes())
        self.assertEqual((self.root / 'index.html').read_text(), 'second version')

    def test_failed_validation_preserves_existing_output(self):
        self.build()
        self.checks.side_effect = subprocess.CalledProcessError(1, 'verify_seo.py')
        with self.assertRaises(subprocess.CalledProcessError):
            self.build()
        self.assertEqual((self.output / 'index.html').read_text(), 'first version')

    def test_netlify_does_not_clear_other_directories(self):
        for output in [self.root, self.root / 'other', Path(self.temp.name) / 'local-output']:
            with self.subTest(output=output):
                output.mkdir(exist_ok=True)
                sentinel = output / 'keep.txt'
                sentinel.write_text('keep', encoding='utf-8')
                with self.assertRaises(ValueError):
                    self.build(output)
                self.assertEqual(sentinel.read_text(), 'keep')

    def test_local_nonempty_output_and_in_clone_builds_stay_protected(self):
        with patch.dict(os.environ, {'NETLIFY': 'false'}):
            output = Path(self.temp.name) / 'local-output'
            output.mkdir()
            sentinel = output / 'keep.txt'
            sentinel.write_text('keep', encoding='utf-8')
            for target in [output, self.output]:
                with self.subTest(target=target), self.assertRaises(ValueError):
                    self.build(target)
            self.assertEqual(sentinel.read_text(), 'keep')
            self.assertFalse(self.output.exists())


if __name__ == '__main__':
    unittest.main()

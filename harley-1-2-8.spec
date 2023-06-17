# -*- mode: python ; coding: utf-8 -*-


block_cipher = None


a = Analysis(['index.py'],
             pathex=['/Users/artifex/Documents/Uni 2.0/BuchanLab/Repos/harley'],
             binaries=[],
             datas=[('/Users/artifex/Documents/Uni 2.0/BuchanLab/Repos/harley/venv/lib/python3.8/site-packages/eel/eel.js', 'eel'), ('build', 'build')],
             hiddenimports=['bottle_websocket'],
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher,
             noarchive=False)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          [],
          name='harley-1-2-8',
          debug=False,
          bootloader_ignore_signals=False,
          strip=False,
          upx=True,
          upx_exclude=[],
          runtime_tmpdir=None,
          console=True , icon='icon.icns')

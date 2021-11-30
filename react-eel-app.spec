# -*- mode: python ; coding: utf-8 -*-


block_cipher = None


a = Analysis(['index.py'],
             pathex=['/Users/artifex/Documents/Uni 2.0/BuchanLab/Repos/yeast-profiler'],
             binaries=[],
             datas=[('/Users/artifex/Library/Python/3.8/lib/python/site-packages/eel/eel.js', 'eel'), ('build', 'build')],
             hiddenimports=['bottle_websocket'],
             hookspath=[],
             hooksconfig={},
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
          name='react-eel-app',
          debug=False,
          bootloader_ignore_signals=False,
          strip=False,
          upx=True,
          upx_exclude=[],
          runtime_tmpdir=None,
          console=False,
          disable_windowed_traceback=False,
          target_arch=None,
          codesign_identity=None,
          entitlements_file=None , icon='icon.icns')
app = BUNDLE(exe,
             name='react-eel-app.app',
             icon='icon.icns',
             bundle_identifier=None)

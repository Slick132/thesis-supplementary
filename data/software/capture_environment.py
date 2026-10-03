"""Run inside the research environment: python capture_environment.py > environment.json."""
from importlib import metadata
import json
import platform
import sys

packages = ['numpy', 'pandas', 'matplotlib', 'torch', 'scikit-learn', 'scipy',
            'tqdm', 'joblib', 'statsmodels', 'seaborn']
versions = {}
for name in packages:
    try:
        versions[name] = metadata.version(name)
    except metadata.PackageNotFoundError:
        versions[name] = None
print(json.dumps({'python': platform.python_version(), 'platform': platform.platform(),
                  'executable': sys.executable, 'packages': versions}, indent=2))

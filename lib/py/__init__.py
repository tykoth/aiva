# allow rel import to work when called from elsewhere
import os
import sys
import glob
from os.path import dirname, basename, isfile

file_path = os.path.normpath(os.path.join(os.path.dirname(__file__)))
sys.path.insert(0, file_path)

pattern = "/[!ai]*.py" if os.environ.get('TRAVIS') else "/*.py"
modules = glob.glob(dirname(__file__)+pattern)
__all__ = [basename(f)[:-3] for f in modules if isfile(f)]

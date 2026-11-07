"""Run both independent content validators and emit the combined report."""
from pathlib import Path
import contextlib,io,runpy

folder=Path(__file__).resolve().parent
with contextlib.redirect_stdout(io.StringIO()):
    runpy.run_path(str(folder/'validate.py'),run_name='__main__')
runpy.run_path(str(folder/'validate_newer.py'),run_name='__main__')
runpy.run_path(str(folder/'validate_figures.py'),run_name='__main__')

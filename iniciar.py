"""Abre a apresentação fluida local no navegador, sem servidor."""
from pathlib import Path
import webbrowser


def main():
    webbrowser.open(Path(__file__).with_name("apresentacao.html").resolve().as_uri())


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
EasyProxi Desktop Browser App

This app creates a desktop browser window using pywebview that loads the EasyProxi web interface.

Requirements:
- pip install pywebview

Build instructions:

Windows (.exe):
1. Install PyInstaller: pip install pyinstaller
2. Build: pyinstaller --onefile --windowed --name EasyProxi desktop_app.py
3. The executable will be in dist/EasyProxi.exe

macOS (.app):
1. Install PyInstaller: pip install pyinstaller
2. Build: pyinstaller --onefile --windowed --name EasyProxi desktop_app.py
3. The app bundle will be in dist/EasyProxi.app

Linux (binary):
1. Install PyInstaller: pip install pyinstaller
2. Build: pyinstaller --onefile --windowed --name EasyProxi desktop_app.py
3. The binary will be in dist/EasyProxi
"""

import webview
import sys
import os

class BrowserAPI:
    def __init__(self):
        self.window = None

    def go_back(self):
        if self.window:
            self.window.evaluate_js("history.back()")

    def go_forward(self):
        if self.window:
            self.window.evaluate_js("history.forward()")

    def reload(self):
        if self.window:
            self.window.evaluate_js("location.reload()")

def main():
    # URL to load (change to your deployed browser URL)
    browser_url = "https://browser.easyproxi.online"

    # Create API instance
    api = BrowserAPI()

    # Create window
    window = webview.create_window(
        title="EasyProxi Browser",
        url=browser_url,
        width=1200,
        height=800,
        resizable=True,
        frameless=False,
        easy_drag=False,
        text_select=True
    )

    # Store window reference in API
    api.window = window

    # Start the webview
    webview.start(api=api, debug=__name__ == '__main__')

if __name__ == '__main__':
    main()
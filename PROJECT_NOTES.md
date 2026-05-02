# EasyProxi Project Notes

## Overview
EasyProxi is a web-based proxy service with a neon-style interface. The project includes static HTML pages for landing, download, donation, and a browser-style proxy UI, plus serverless API endpoints under `api/`.

## Top-level files
- `README.md`
  - Minimal placeholder documentation: `just ok`.
- `index.html`
  - Main landing page for the web proxy service.
- `landing.html`
  - Alternate or second landing experience; likely used for marketing or home page variations.
- `browser.html`
  - Browser-style proxy interface with URL input, navigation buttons, and an embedded `iframe`.
- `download.html`
  - Download page for the service.
- `download-fixed.html`
  - Probably a fixed or updated version of the download page.
- `WinDownload.html`
  - Windows-specific download page.
- `linuxDownload.html`
  - Linux-specific download page.
- `macDownload.html`
  - macOS-specific download page.
- `donate.html`
  - Donation page with Cash App payment links and campaign messaging.
- `style.css`
  - Shared stylesheet for all pages and the embedded browser UI.
- `script.js`
  - Client-side logic for the browser UI, landing page proxy form, overlay panel, and UI updates.
- `desktop_app.py`
  - Python desktop application script, likely a wrapper or desktop launcher for the proxy service.
- `vercel.json`
  - Vercel deployment configuration.

## API folder
- `api/proxy.js`
  - Proxy endpoint implementation. Likely forwards requests to the target URL and returns proxied content.
- `api/status.js`
  - Status endpoint for health checks or service status.
- `api/usage.js`
  - Usage tracking endpoint; likely reports proxy usage and limits.
- `api/user.js`
  - User endpoint; likely returns user-related data such as API key or usage stats.

## Frontend behavior
- `script.js` contains logic for multiple pages:
  - `browser.html` includes a URL form, back/forward/reload buttons, frame navigation, and history management.
  - `index.html` or other landing pages may use proxy form submission to redirect through `SERVER_URL`.
  - An overlay control panel is injected into proxied pages to show data usage, uptime, requests served, and API key.
  - The script fetches server stats from `/api/me` and updates the UI.

## Styling
- `style.css` defines:
  - Global dark theme and neon gradients.
  - Browser toolbar and iframe styling.
  - Main page header, navigation, hero, cards, buttons, and responsive layout.
  - Donation page-specific styles under `/* Donation Page Styles */`.

## Deployment
- `vercel.json`
  - Configures deployment behavior for Vercel, likely routing API requests and static pages.

## Special files
- `Note:`
  - A project upgrade notes file summarizing the platform design, routing, frontend improvements, API endpoints, and desktop app.
  - Contains a high-level architecture overview, page responsibilities, and backend API details.

## Notes
- The project is currently primarily static HTML/CSS/JS plus lightweight API endpoints.
- `README.md` is very short and can be expanded with usage instructions, deployment details, and page descriptions.
- `desktop_app.py` should be inspected separately for how it integrates with the web files.
- The donation page was recently updated to new markup and links.

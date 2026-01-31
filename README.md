# Secret Santa App

A lightweight, private, ad-free Secret Santa assignment tool that runs entirely offline.

## Features

- **Fully Offline**: Works without internet access on any desktop/laptop
- **Privacy-Focused**: Organizer controls prevent accidental exposure of assignments
- **Smart Exclusions**: Set who can't give to whom (e.g., spouses, immediate family)
- **Constraint Validation**: Detects impossible configurations before generation
- **Multiple Distribution Methods**: Copy-to-clipboard messages or printable PDF slips
- **Future-Ready**: Designed for easy addition of SMS/email notifications later

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **Runtime**: Electron (cross-platform desktop app)
- **UI**: React 18 + TypeScript
- **State**: Zustand
- **Styling**: Tailwind CSS
- **PDF**: jsPDF + html2canvas

## Documentation

- [Technical Design Document](./docs/DESIGN.md) - Comprehensive MVP specification

## MVP Scope

This MVP focuses on:
- Offline-only operation (no network dependencies)
- Manual distribution (copy/paste or print)
- Local file persistence (.secretsanta JSON files)

Future versions will add:
- SMS notifications via Twilio/Plivo
- Hosted reveal links (unique URLs per participant)
- Email distribution

## License

MIT

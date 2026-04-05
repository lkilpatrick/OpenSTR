# OpenSTR Documentation

<p class="tagline">Open source short-term rental management for hosts who want a real system.</p>

<img src="https://openstr.dev/static/2fcbe84d2effb033e0dcc57fbc9d8aaf/a2e28/Outside.webp" alt="Luxury rental property exterior at golden hour" class="hero-image">

OpenSTR is a self-hosted platform that replaces the chaos of WhatsApp messages, spreadsheets, and Google Forms with a proper cleaning management system — scheduling, checklists, photo evidence, supply tracking, and monitoring, all in one place.

Built for Airbnb hosts. Works for any short-term rental platform.

---

## From Checkout to Guest-Ready

<div class="before-after">
  <figure>
    <img src="https://openstr.dev/static/5c9f86bc4945a62b711d7f9efaca4b93/a2e28/Cleaningb4.webp" alt="Property room before cleaning">
    <figcaption>Before</figcaption>
  </figure>
  <figure>
    <img src="https://openstr.dev/static/e962a6df22182adbd6be5357addb97dd/a2e28/cleaningafter.webp" alt="Property room after cleaning">
    <figcaption>Guest-Ready</figcaption>
  </figure>
</div>

OpenSTR coordinates the entire cleaning workflow — from the moment a guest checks out to the moment the next guest walks in.

---

## What It Does

<div class="feature-cards">
  <div class="feature-card">
    <h3>📅 Automatic Schedule</h3>
    <p>Imports your Airbnb booking calendar via iCal so cleaners always know what's coming.</p>
  </div>
  <div class="feature-card">
    <h3>📋 Structured Checklists</h3>
    <p>Room-by-room task lists with drag-and-drop reorder and mandatory items.</p>
  </div>
  <div class="feature-card">
    <h3>📸 Photo Evidence</h3>
    <p>Mandatory before/after photos per room for every clean — full accountability.</p>
  </div>
  <div class="feature-card">
    <h3>🏠 Multi-Property</h3>
    <p>Manage your STR, your home, and future properties from one dashboard.</p>
  </div>
  <div class="feature-card">
    <h3>👥 Multi-Cleaner</h3>
    <p>Assign cleaners per property, track performance, compare against your standards.</p>
  </div>
  <div class="feature-card">
    <h3>🔒 Network-Aware</h3>
    <p>Cleaning checklists and photos only activate when on your local WiFi.</p>
  </div>
</div>

---

## Your Properties, Under Your Control

<div class="img-grid">
  <img src="https://openstr.dev/static/5df23647643e45f110fe4b1bf8868631/a2e28/Insidepool.webp" alt="Indoor pool area of a luxury rental property">
  <img src="https://openstr.dev/static/81a9af08b34471ee2c99cc959364f416/a2e28/Daytime.webp" alt="Rental property during the day">
</div>

## Platform Components

| Component | Technology | Description |
|-----------|-----------|-------------|
| [API](api/overview.md) | Node.js + Express + TypeScript | REST API with PostgreSQL database |
| [Admin Panel](admin/overview.md) | React 19 + Vite + TypeScript | Web dashboard for property managers |
| [Mobile App](mobile/overview.md) | Flutter (Dart) | Cleaner app for iOS, Android, and Web |
| Shared Types | TypeScript | Common type definitions used by API and admin |

---

## Quick Links

- [Quick Start Guide](getting-started/quick-start.md) — get running locally in minutes
- [Production Deployment](getting-started/production-deployment.md) — deploy with Docker on your server
- [API Endpoints](api/endpoints.md) — full REST API reference
- [Database Schema](architecture/database-schema.md) — all tables and relationships
- [Contributing](contributing.md) — how to contribute to OpenSTR

---

## License

OpenSTR is licensed under the **GNU General Public License v3 (GPL-3.0)**.

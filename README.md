# JATBrowser

JATBrowser is a fast, lightweight, privacy-focused web browser built with Electron.
The project is fully open source and designed to give users transparency and control over their browsing experience.

Features

Privacy-focused browsing
Open source code
Lightweight Electron-based browser
Custom UI and controls
Built-in zoom support
Download manager support
Simple and clean interface

## Requirements

Before running JATBrowser from source, make sure you have the following installed:

Node.js (version 18 or newer recommended)
npm (comes with Node.js)
Git (optional but recommended)

You can download Node.js from:
https://nodejs.org/

## Installing JATBrowser (from source)
1. Clone the repository

Open a terminal or command prompt and run:

git clone https://github.com/JetArndtTech/JATBrowser.git

2. Install dependencies

This installs Electron and all required packages.
npm install

3. Start the browser
npm start

This will launch JATBrowser in development mode.

### Building the Desktop App

To package JATBrowser into an installable desktop application:
npm run dist

After building, the compiled application will appear inside the dist folder.
Example builds may include:

Windows installer (.exe)
macOS (.dmg)
Linux (.AppImage)

## Project Structure

Example structure of the project:

JATBrowser
│
├── main.js
├── package.json
├── index.html
├── preload.js
├── LICENSE
├── icon.ico

Disclaimer:
JATBrowser is an experimental open-source browser project. Use at your own discretion.

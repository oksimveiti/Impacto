# Impacto Setup Guide

## Security Setup (Required)

### Step 1: Regenerate Your API Keys

**IMPORTANT:** The API keys that were previously committed to GitHub have been exposed and should be regenerated immediately.

#### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Delete the old key: `AIzaSyCjD5D9MYiLHerfbG8pboypbl9SwCOqQc0`
4. Create a new API key
5. Add restrictions:
   - Application restrictions: HTTP referrers
   - Add your domain (e.g., `localhost:8000/*`, `yourdomain.com/*`)
   - API restrictions: Select "Maps JavaScript API", "Places API", "Geocoding API"

#### Firebase API Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `impacto-wmdd-project`
3. Go to Project Settings
4. Regenerate the Web API key or create a new web app
5. Copy the new configuration

#### TinyMCE API Key

1. Go to [TinyMCE Dashboard](https://www.tiny.cloud/my-account/dashboard/)
2. Create a new API key or use an existing one with domain restrictions

### Step 2: Configure Your Local Environment

1. Copy the template file:

   ```bash
   cp config/config.template.js config/config.js
   ```

2. Edit `config/config.js` and add your NEW API keys

3. The `config/config.js` file is now in `.gitignore` and won't be committed

## Installation

```bash
# Install dependencies
npm install
```

## Running the App

### Option 1: Python HTTP Server

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000

### Option 2: Firebase Hosting (for full deployment)

```bash
npm install -g firebase-tools
firebase login
firebase serve
```

## 🔒 Security Best Practices

- Never commit API keys to git
- Use domain restrictions on all API keys
- Regularly rotate sensitive credentials
- Keep `config/config.js` in `.gitignore`
- Only share `config.template.js` with the team

## Team Setup

When a new team member clones the repo:

1. They copy `config/config.template.js` to `config/config.js`
2. You share the API keys with them securely (not via git)
3. They paste the keys into their local `config/config.js`

# Trance Royale

First-person trading-floor battle royale. Anyone with the link can join the same live floor, with no account needed. Bots fill the lobby up to 6 fighters, so it's never empty.

## What's in here

| File | What it does |
|---|---|
| `server.js` | Hosts the game page and relays every player's position, shots and hits in real time (WebSockets). |
| `public/game.html` | The whole game (3D, controls, rules, HUD). |
| `package.json` | Tells the host to install the one dependency (`ws`) and run `server.js`. |
| `render.yaml` | One-click setup for Render. |

## Put it online (Render, free, about 5 minutes)

1. **Make a GitHub repo.** Go to github.com → **New repository** → name it `trance-royale` → **Create repository**.
2. **Upload the files.** On the new repo page, click **uploading an existing file**. Drag in everything from this folder: `server.js`, `package.json`, `render.yaml`, `README.md`, `.gitignore` and the `public` folder. Then click **Commit changes**.
3. **Create the server on Render.** Go to render.com and sign up with your GitHub account. Click **New +** → **Blueprint**, pick the `trance-royale` repo, then click **Apply**. Render reads `render.yaml` and sets everything up on the free plan.
   - If you'd rather click through manually, choose **New +** → **Web Service** and pick the repo. Set Runtime to **Node**, Build command to `npm install`, Start command to `npm start` and Instance type to **Free**.
4. **Wait for "Live"** (about 2 minutes). Your link appears at the top, something like `https://trance-royale.onrender.com`. That's the one link you share.

## Things to know

- **Free plan sleep:** Render's free plan puts the server to sleep after 15 minutes with no visitors. The next person to open the link waits about a minute while it wakes up. While anyone is playing, it stays awake.
- **Staying awake 24/7:**
  - Free option: set up a free uptime monitor (for example UptimeRobot) to visit `https://YOUR-LINK/health` every 5 minutes. One always-on service fits inside Render's 750 free hours a month.
  - Paid option: upgrade the service to Render's paid Starter instance.
- **Player limit:** up to 16 players at once. Change `MAX_PLAYERS` in Render → your service → **Environment** if you want more.
- **Updating the game:** edit `public/game.html` on GitHub (or upload a new copy). Render redeploys automatically.

## Run it on your own computer

You need Node.js 18 or newer.

```
npm install
npm start
```

Then open http://localhost:3000. Other devices on your Wi-Fi can join at `http://YOUR-COMPUTER-IP:3000`.

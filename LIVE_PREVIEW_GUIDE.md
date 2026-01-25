# LIVE PREVIEW & DEPLOYMENT GUIDE

**See Your Site Live While You Build**

---

## Current Setup

Your site has **automatic deployment** to GitHub Pages configured! Every time you push to `master`, it automatically deploys.

### Your Live Site URL

**GitHub Pages URL:**

```
https://4-b100m.github.io/etceter4/
```

**Custom Domain (if configured):**

```
https://etceter4.com
```

---

## How It Works

### Automatic Deployment Flow

```
1. You commit changes
    ↓
2. Push to master branch
    ↓
3. GitHub Actions runs CI/CD
    ↓
4. Lint check passes
    ↓
5. Security audit passes
    ↓
6. Site deploys to GitHub Pages
    ↓
7. Live in ~2-3 minutes!
```

---

## Accessing Your Live Site

### Method 1: Direct URL Access

1. Go to: `https://4-b100m.github.io/etceter4/`
2. Bookmark this URL for easy access
3. Refresh after each deploy to see changes

### Method 2: GitHub Repository

1. Go to your repo: `https://github.com/4-b100m/etceter4`
2. Click **Settings**
3. Scroll to **Pages** section (left sidebar)
4. Your live URL is displayed there
5. Click "Visit site" button

### Method 3: Check Deployment Status

1. Go to repo: `https://github.com/4-b100m/etceter4`
2. Click **Actions** tab
3. See latest deploy workflow
4. Green check ✅ = deployed successfully
5. Click workflow for details

---

## Local Development with Live Preview

### Option A: Browser-sync (Already Configured!)

**Start local development server:**

```bash
cd /path/to/etceter4
npm run dev
```

**What happens:**

- Server starts at `http://localhost:3000`
- **Auto-reload** on file changes
- **Live updates** as you edit
- Works exactly like the live site

**Features:**

- Hot reload (no manual refresh!)
- Synchronized browsing across devices
- Network access (test on phone)
- Console logging

---

### Option B: Simple Python Server

**Quick and simple:**

```bash
cd /path/to/etceter4
python3 -m http.server 8000
```

Then open: `http://localhost:8000`

**Note:** No auto-reload, must refresh manually

---

### Option C: VS Code Live Server Extension

1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"
4. Auto-reload on save!

---

## Workflow for Building While Previewing

### Recommended Workflow

```bash
# Terminal 1: Local development
npm run dev
# Opens at http://localhost:3000

# Terminal 2: Make changes
# Edit files, save, see instant updates locally

# When ready to deploy:
git add .
git commit -m "Your changes"
git push origin master

# Wait 2-3 minutes, then check:
# https://4-b100m.github.io/etceter4/
```

---

## Branch-Based Preview (Advanced)

### Problem

Currently, only `master` deploys. You can't preview branches live.

### Solution: Add Branch Previews

**Create new workflow:** `.github/workflows/preview.yml`

```yaml
name: Preview Deployment

on:
  push:
    branches-ignore:
      - master
      - main

jobs:
  preview:
    name: Deploy Preview
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Netlify/Vercel Preview
        # Use Netlify or Vercel for branch previews
        # (More configuration needed)
```

**Better Option:** Use **Vercel** or **Netlify** for automatic branch previews

---

## Alternative: Vercel for Branch Previews

### Why Vercel?

- **Automatic branch previews** (every branch gets a URL!)
- **Instant deployments** (<30 seconds)
- **Comments with preview links** on pull requests
- **Free for open source**
- **Custom domains** included

### Setup Vercel (5 minutes)

1. **Create Vercel account:** https://vercel.com
2. **Connect GitHub:** Allow Vercel to access your repo
3. **Import project:** `4-b100m/etceter4`
4. **Configure:**
   - Framework: None (static site)
   - Build command: (leave empty)
   - Output directory: `./`
5. **Deploy!**

**Result:**

- Master deploys to: `https://etceter4.vercel.app`
- Every branch gets preview: `https://etceter4-git-branch-name.vercel.app`
- Pull requests show preview link automatically

---

## Alternative: Netlify for Branch Previews

### Why Netlify?

- Similar to Vercel
- **Branch deploy previews**
- **Deploy previews for PRs**
- **Split testing** (A/B testing)
- Free tier generous

### Setup Netlify (5 minutes)

1. **Create Netlify account:** https://netlify.com
2. **Add new site:** "Import from Git"
3. **Connect GitHub repo:** `4-b100m/etceter4`
4. **Configure:**
   - Build command: (leave empty)
   - Publish directory: `./`
5. **Deploy!**

**Result:**

- Master deploys to: `https://etceter4.netlify.app`
- Branch deploys: `https://branch-name--etceter4.netlify.app`
- PR previews automatic

---

## Current Deployment Status Check

### Check if Master is Deployed

```bash
# In your terminal
curl -I https://4-b100m.github.io/etceter4/ | head -n 1

# If you see "HTTP/2 200" - it's live!
# If you see "404" - might need to enable GitHub Pages
```

### Enable GitHub Pages (if needed)

1. Go to: `https://github.com/4-b100m/etceter4/settings/pages`
2. **Source:** Select `gh-pages` branch
3. **Save**
4. Wait 1-2 minutes
5. Site will be live at `https://4-b100m.github.io/etceter4/`

---

## Recommended Setup for Your Workflow

### For Active Development

**Use:** Browser-sync locally (`npm run dev`)

**Advantages:**

- Instant updates as you type
- No waiting for deploys
- Perfect for CSS/HTML tweaking
- Test interactions immediately

### For Sharing/Testing

**Use:** Vercel or Netlify branch previews

**Advantages:**

- Real URLs to share
- Test on actual hosting environment
- See exactly how it will look live
- No need to merge to master

### For Production

**Use:** GitHub Pages (current setup)

**Advantages:**

- Free hosting
- Automatic from master
- Simple and reliable
- No extra accounts needed

---

## Quick Commands Reference

```bash
# Start local development server (auto-reload)
npm run dev

# Open in browser
open http://localhost:3000

# Check lint before committing
npm run lint

# Format code before committing
npm run format

# Commit and push (triggers deploy)
git add .
git commit -m "Update: description"
git push origin master

# Check deployment status
gh run list --limit 5  # (requires GitHub CLI)

# Or visit:
# https://github.com/4-b100m/etceter4/actions
```

---

## Mobile Testing

### Test on Your Phone While Developing

When running `npm run dev`:

1. Note your computer's IP address:

   ```bash
   # Mac/Linux
   ifconfig | grep "inet "

   # Example output: inet 192.168.1.100
   ```

2. On your phone (same WiFi network):
   - Open browser
   - Go to: `http://192.168.1.100:3000`
   - Site loads!
   - Changes sync in real-time

---

## Troubleshooting

### Site Not Updating After Push

**Check:**

1. Did GitHub Actions run? (Check Actions tab)
2. Did it pass? (Green check marks)
3. Cache issue? (Hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
4. Still old? Clear browser cache completely

**Force cache clear:**

```bash
# Add query parameter to URL
https://4-b100m.github.io/etceter4/?v=2
# Increment number each time
```

### Local Server Not Starting

**Fix:**

```bash
# Reinstall dependencies
npm install

# Try again
npm run dev

# If still failing, use Python server
python3 -m http.server 8000
```

### Can't Access on Phone

**Fix:**

1. Ensure phone on same WiFi
2. Check firewall isn't blocking
3. Use correct IP address
4. Try: `http://localhost:3000` → `http://YOUR-IP:3000`

---

## Monitoring Deployments

### Get Notified

**Option 1: GitHub Mobile App**

- Install GitHub mobile app
- Get push notifications for deployments
- See status immediately

**Option 2: Email Notifications**

- Go to: https://github.com/settings/notifications
- Enable "Actions" notifications
- Get email on deploy success/failure

**Option 3: Discord/Slack Integration**

- Add webhook to GitHub Actions
- Get deploy notifications in Discord/Slack

---

## Performance Monitoring

### Once Live, Monitor Performance

**Tools:**

- **Lighthouse:** Run in Chrome DevTools
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **WebPageTest:** https://webpagetest.org/

**Check:**

- Load time
- Mobile performance
- Accessibility score
- Best practices

---

## Next Steps

### Right Now

1. **Commit latest changes:**

   ```bash
   git add LIVING_PANTHEON_GENERATIVE.md LIVE_PREVIEW_GUIDE.md
   git commit -m "Add living Pantheon generative systems + live preview guide"
   git push origin claude/pantheon-expansion-011CUY6DYFS4hsQwwxY8Qp5B
   ```

2. **Merge to master** (to deploy):

   ```bash
   git checkout master
   git merge claude/pantheon-expansion-011CUY6DYFS4hsQwwxY8Qp5B
   git push origin master
   ```

3. **Visit your live site** (2-3 min after push):

   ```
   https://4-b100m.github.io/etceter4/
   ```

4. **Start local development:**
   ```bash
   npm run dev
   # Begin implementing generative systems!
   ```

### This Week

- [ ] Verify GitHub Pages is live
- [ ] Bookmark live URL
- [ ] Start using `npm run dev` for local work
- [ ] Consider adding Vercel/Netlify for branch previews
- [ ] Test site on mobile via local network
- [ ] Implement first generative animation

---

## Summary

### You Have Three Preview Methods:

1. **Local (Instant):** `npm run dev` at http://localhost:3000
2. **Staging (Branch):** Use Vercel/Netlify for branch URLs
3. **Production (Master):** https://4-b100m.github.io/etceter4/

### Recommended Workflow:

```
Edit locally → Preview at localhost:3000
     ↓
Commit to branch → Push → Get Vercel preview URL
     ↓
Ready? → Merge to master → Live in 2-3 minutes
     ↓
Share: https://4-b100m.github.io/etceter4/
```

**The Pantheon is ready to breathe—and you can watch it come alive in real-time!** 🏛️✨

---

_Guide by: Claude (Anthropic)_
_Date: October 27, 2025_

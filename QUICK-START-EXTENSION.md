# 🚀 Vizora GA4 Extension - Quick Start (2 Minutes!)

## Step 1: Install Extension (30 seconds)

1. Open Chrome
2. Go to: `chrome://extensions/`
3. Turn ON "Developer mode" (top right)
4. Click "Load unpacked"
5. Select folder: `vizora-dyad-draft/chrome-extension`

✅ Done! Extension installed!

## Step 2: Start Vizora App (30 seconds)

```bash
cd vizora-dyad-draft
npm run dev
```

✅ App running on http://localhost:5173

## Step 3: Test It! (1 minute)

### A. Test Extension Popup

1. Click the Vizora extension icon in Chrome toolbar
2. You should see the beautiful gradient popup!

### B. Test GA4 Detection

1. Go to: https://analytics.google.com
2. Sign in to your GA4 account
3. Click the Vizora extension icon
4. You should see: **"GA4 detected ✓"** (green dot)

### C. Test Sync (if you have GA4 funnels)

1. In GA4, go to **Explore** → Open a funnel
2. Click Vizora extension icon
3. Click **"Sync GA4 Funnels"**
4. Wait for success message
5. Open Vizora dashboard
6. Your funnel should appear!

## That's It! 🎉

Your Chrome extension is now:
- ✅ Installed
- ✅ Running
- ✅ Ready to sync GA4 funnels

## Common Questions

**Q: I don't see the extension icon?**
A: Click the puzzle icon (🧩) in Chrome toolbar, then pin Vizora

**Q: Extension says "Not on GA4 page"?**
A: Make sure you're on analytics.google.com, not console.cloud.google.com

**Q: How do I sign in?**
A: Click "Sign In with Vizora" → Vizora app opens → Sign in → Return to extension

**Q: Where do synced funnels go?**
A: Dashboard → Look for funnels with "GA4 Sync" badge

**Q: Can I create icons for the extension?**
A: Yes! See `chrome-extension/icons/README.md`

## Next Steps

- Read full docs: `chrome-extension/README.md`
- Installation guide: `chrome-extension/INSTALLATION.md`
- Technical details: `SOLUTION-3-COMPLETE.md`

---

**Need help?** Check the troubleshooting section in INSTALLATION.md

Happy syncing! 🚀

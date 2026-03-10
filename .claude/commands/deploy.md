Deploy the web build to leaguematrix.com (Firebase Hosting).

Run the following sequence:
```
npx expo export --platform web && firebase deploy --only hosting
```

**Before deploying, verify:**
- `firebase.json` hosting ignore uses `node_modules/**` (NOT `**/node_modules/**`) — the double-glob pattern blocks font assets and causes an infinite spinner on load
- No uncommitted secrets or `.env` files in the build output

**After deploying:**
- Live URL: https://moticoach-907ff.web.app
- Custom domain: https://leaguematrix.com (may take ~1 min to propagate)
- Hard refresh (`Cmd+Shift+R`) to bust browser cache on first check

**To deploy Cloud Functions too:**
```
cd functions && npm run build && cd .. && firebase deploy --only functions
```

**Common issues:**
- Font OTS parse error / infinite spinner → check `firebase.json` ignore glob (see above)
- React hook error #527 → `react` and `react-dom` versions must match exactly

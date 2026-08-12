# Deployment Guide

This guide covers deploying your Daggerheart Campaign Manager to various hosting platforms.

## Prerequisites

Before deploying, make sure your project builds successfully:

```bash
npm run build
```

This creates a `dist` folder with production-ready files.

## Option 1: Vercel (Recommended)

Vercel offers zero-config deployment for Vite projects.

### Method A: CLI Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts:
   - Login/signup when prompted
   - Link to existing project or create new
   - Accept default settings

4. Your app will be live at `your-project.vercel.app`

### Method B: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel auto-detects Vite settings
6. Click "Deploy"

**Custom Domain**: Add in Project Settings → Domains

## Option 2: Netlify

### Method A: Drag & Drop

1. Run `npm run build`
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist` folder onto the page
4. Your site is live!

### Method B: CLI Deployment

1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Build and deploy:
```bash
npm run build
netlify deploy --prod
```

3. Follow prompts to authorize and configure

### Method C: GitHub Integration

1. Push code to GitHub
2. Go to [app.netlify.com](https://app.netlify.com)
3. Click "New site from Git"
4. Connect GitHub and select repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

## Option 3: GitHub Pages

### Setup

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Update `package.json`:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Update `vite.config.js` with base path:
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/daggerheart-campaign-manager/' // Replace with your repo name
})
```

4. Deploy:
```bash
npm run deploy
```

5. Enable GitHub Pages:
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: `gh-pages`
   - Save

Your site will be at: `https://username.github.io/repo-name/`

## Option 4: Cloudflare Pages

1. Push code to GitHub
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
3. Pages → Create a project
4. Connect GitHub repository
5. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Deploy

## Option 5: Self-Hosted

### Using a Simple HTTP Server

1. Build the project:
```bash
npm run build
```

2. Serve the `dist` folder with any web server:

**Node.js**:
```bash
npx serve dist
```

**Python**:
```bash
cd dist
python -m http.server 8000
```

**Nginx** (nginx.conf):
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache** (.htaccess in dist):
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## Environment Configuration

Currently, the app uses no environment variables. If you add any in the future:

### Create `.env.local`:
```
VITE_API_URL=https://api.example.com
```

### Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL
```

### Platform-specific setup:

**Vercel**: Add in Project Settings → Environment Variables

**Netlify**: Add in Site Settings → Environment Variables

**GitHub Pages**: Environment variables not supported (use build-time config)

### Firebase security rules

A release lands in two halves. Vercel builds and serves the app, but it knows
nothing about `firestore.rules` and `storage.rules` — those are published by the
**Deploy Firebase rules** GitHub Action, which runs when either rules file
changes on `main` and can also be triggered manually from the Actions tab.

So a change that pairs app code with a rules change is only fully live once both
have gone out. If the app starts throwing permission errors right after a
deploy, check that the rules workflow ran and succeeded.

## Post-Deployment Checklist

- [ ] App loads correctly
- [ ] All navigation works
- [ ] Character creation saves data
- [ ] Lore entries persist
- [ ] Session logging works
- [ ] Dice roller functions
- [ ] Player/DM mode toggle works
- [ ] External links open correctly
- [ ] Mobile responsive layout works
- [ ] Browser localStorage is accessible

## Custom Domain Setup

### Vercel
1. Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed

### Netlify
1. Site Settings → Domain management
2. Add custom domain
3. Update DNS records

### Cloudflare Pages
1. Custom domains → Set up a domain
2. Add your domain (if on Cloudflare, auto-configures)

## Performance Optimization

### Already Optimized
✅ Minified JavaScript and CSS
✅ Tree-shaking for smaller bundles
✅ Code splitting ready
✅ Fast localStorage operations

### Additional Optimizations (Optional)

1. **Enable Compression**:
   - Vercel/Netlify: Automatic gzip/brotli
   - Self-hosted: Enable in nginx/apache

2. **Add Service Worker** (PWA):
```bash
npm install vite-plugin-pwa
```

3. **Image Optimization**:
   - When you add images, use WebP format
   - Lazy load images

4. **CDN**: Most platforms include CDN automatically

## Troubleshooting

### "Cannot GET /" Error
- Make sure your hosting platform redirects all routes to index.html
- For Netlify, create `_redirects` in public folder:
  ```
  /*    /index.html   200
  ```

### Blank Page After Deployment
- Check browser console for errors
- Verify `base` path in vite.config.js matches deployment URL
- Ensure build completed successfully

### localStorage Not Working
- Check if hosting platform blocks localStorage
- Verify site is served over HTTPS (required for some browsers)

### Fonts Not Loading
- Fonts load from Google Fonts CDN
- Check if Content Security Policy is blocking external fonts
- Verify internet connection

## Security Considerations

### Current Implementation
- ✅ No backend = no server vulnerabilities
- ✅ No user authentication = no password issues
- ✅ Client-side only = no data breaches
- ⚠️ localStorage is not encrypted
- ⚠️ Data visible in browser DevTools

### For Public Deployment
- Data is stored locally in each user's browser
- No data is transmitted to servers
- Each user has their own isolated campaign
- Perfect for small groups or personal use

### Future Backend Considerations
If you add authentication/database later:
- Use HTTPS (required)
- Implement proper auth (JWT, OAuth)
- Sanitize all user inputs
- Add CORS policies
- Use environment variables for secrets

## Monitoring

### Basic Analytics (Optional)

Add Google Analytics or similar to `index.html`:
```html
<!-- Add before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Cost Breakdown

- **Vercel**: Free tier (Hobby plan)
- **Netlify**: Free tier (100GB bandwidth/month)
- **GitHub Pages**: Free (public repos)
- **Cloudflare Pages**: Free tier (500 builds/month)
- **Self-hosted**: Server costs only

All major platforms offer free hosting for this type of static site!

## Recommended Choice

**For Most Users**: Vercel or Netlify
- Easiest setup
- Automatic deployments from Git
- Free SSL certificates
- Global CDN
- Zero configuration

**For Self-Hosting**: Nginx or Apache
- Full control
- No external dependencies
- Can run offline

## Support

Need deployment help?
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Netlify: [docs.netlify.com](https://docs.netlify.com)
- GitHub Pages: [pages.github.com](https://pages.github.com)

Happy deploying! 🚀

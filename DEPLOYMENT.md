# Deployment Guide

This guide covers different ways to deploy VectorSheets.

## Prerequisites

- Node.js 20+ installed
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Gemini API key to `.env.local`:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

## Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The built files will be in the `dist` directory.

## Deployment Platforms

### Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variable `VITE_GEMINI_API_KEY` in Vercel dashboard.

### Netlify

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Add environment variable `VITE_GEMINI_API_KEY` in Netlify dashboard.

### GitHub Pages

1. Update `vite.config.ts` to set `base: '/your-repo-name/'`

2. Build and deploy:
   ```bash
   npm run build
   # Use GitHub Actions or gh-pages to deploy dist folder
   ```

### AWS S3 + CloudFront

1. Build the app:
   ```bash
   npm run build
   ```

2. Upload `dist` folder to S3 bucket

3. Configure CloudFront distribution pointing to S3 bucket

## Environment Variables

- `VITE_GEMINI_API_KEY`: Your Google Gemini API key (required)

## Health Check

The application includes a health check endpoint at `/health` that returns `200 OK` when the app is running.

## Troubleshooting

### API Key Issues

- Ensure `VITE_GEMINI_API_KEY` is set correctly
- Check that the API key has proper permissions
- Verify the API key is not expired

### Build Issues

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist .vite`
- Check Node.js version: `node --version` (should be 20+)

## Performance Optimization

The build is optimized with:
- Code splitting for vendor libraries
- Minification and compression
- Tree shaking for unused code
- Optimized asset loading

## Security Notes

- Never commit `.env.local` or `.env` files
- Use environment variables for API keys in production
- Enable HTTPS in production
- Review and update dependencies regularly


# Deployment Instructions

## Vercel Deployment

### Environment Variables to Set in Vercel:

Go to your Vercel project → Settings → Environment Variables and add:

```
VITE_API_URL=https://gardina-backend.onrender.com/api
```

**Important:** Make sure to:
1. Set this for **Production** environment
2. Redeploy after adding the variable

### After Deployment:

The frontend will be available at: `https://gardina-web.vercel.app`

## Render Backend Configuration

Your backend is deployed at: `https://gardina-backend.onrender.com`

### Required Environment Variables on Render:

```
FRONTEND_URL=https://gardina-web.vercel.app
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=your-region
AWS_S3_BUCKET=your-bucket-name
NODE_ENV=production
PORT=3001
```

## Testing Production

1. Visit: https://gardina-web.vercel.app
2. Try to login
3. Check browser console for any CORS errors
4. Check Render logs for backend errors

## Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` is set correctly on Render
- Backend allows: `https://gardina-web.vercel.app`

### API Connection Issues
- Make sure `VITE_API_URL` is set in Vercel
- Check that Render backend is running
- Visit: https://gardina-backend.onrender.com/health

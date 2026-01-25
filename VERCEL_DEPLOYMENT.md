# Vercel Deployment Guide for ETCETER4

This guide explains how to deploy ETCETER4 to Vercel for preview deployments and production hosting.

## Why Vercel?

Vercel provides:

- **Automatic branch previews** - Every branch gets its own URL for sharing with stakeholders
- **Zero-config deployments** - Just push to GitHub and deploy
- **Fast global CDN** - Content delivered from edge locations worldwide
- **Free tier** - Generous free plan for personal projects
- **Custom domains** - Use your own domain name

## Initial Setup

### 1. Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. This automatically connects Vercel to your GitHub repos

### 2. Import Project

1. From Vercel dashboard, click **"Add New Project"**
2. Find and select `etceter4` repository
3. Configure project:
   - **Framework Preset:** Other (static site)
   - **Root Directory:** `./`
   - **Build Command:** Leave empty (we're serving static files)
   - **Output Directory:** `./`
4. Click **"Deploy"**

### 3. Configure Settings (Optional)

In Project Settings:

- **Domains:** Add custom domain if desired (e.g., `etceter4.com`)
- **Git:** Enable branch deployments for all branches
- **Environment Variables:** None needed for this static site

## Workflow for Sharing Work

### Scenario 1: Share Current Branch with Investor

1. **Push your current branch to GitHub:**

   ```bash
   git add .
   git commit -m "Update CV with new publications"
   git push origin your-branch-name
   ```

2. **Vercel automatically deploys:**
   - Within 30-60 seconds, your branch has a live preview URL
   - Format: `etceter4-git-your-branch-name.vercel.app`

3. **Share the URL:**
   - Go to Vercel dashboard > Deployments
   - Find your branch deployment
   - Copy the preview URL
   - Send to investor/reviewer with message like:
     > "Here's a preview of my updated portfolio: https://etceter4-git-feature-branch.vercel.app"

### Scenario 2: Share Specific CV View

The CV supports shareable URLs with specific facets, modes, and lenses:

**Example URLs:**

```
# Academic facet, professional mode, collector lens
https://etceter4.vercel.app/akademia/cv/#academic/professional/collector

# Artist facet, experimental mode, critique lens
https://etceter4.vercel.app/akademia/cv/#artist/experimental/critique

# Designer facet, professional mode, archaeologist lens
https://etceter4.vercel.app/akademia/cv/#designer/professional/archaeologist
```

**To share a specific view:**

1. Navigate to the CV page on your preview deployment
2. Select desired facet, mode, and lens
3. Copy the URL (it updates automatically)
4. Share with stakeholder

### Scenario 3: Preview Before Publishing

1. **Create a preview branch:**

   ```bash
   git checkout -b preview/investor-demo
   git push origin preview/investor-demo
   ```

2. **Make changes and push:**
   - Edit files as needed
   - Commit and push
   - Each push updates the preview URL

3. **Share for feedback:**
   - Send preview URL to reviewers
   - Get feedback
   - Make revisions if needed

4. **Merge when approved:**
   ```bash
   git checkout main
   git merge preview/investor-demo
   git push origin main
   ```

## Production Deployment

### Option 1: Deploy from Main Branch

1. **Configure production branch in Vercel:**
   - Project Settings > Git
   - Set "Production Branch" to `main` (or `master`)

2. **Deploy to production:**

   ```bash
   git checkout main
   git merge your-feature-branch
   git push origin main
   ```

3. **Production URL:**
   - Main deployment: `etceter4.vercel.app`
   - Or your custom domain: `etceter4.com`

### Option 2: GitHub Pages + Vercel

You can use both simultaneously:

- **GitHub Pages** - Official public site (`4-b100m.github.io/etceter4`)
- **Vercel** - Preview deployments and alternative production URL

No conflicts - they serve from different domains.

## Managing Deployments

### Viewing Deployments

1. Go to Vercel dashboard
2. Select `etceter4` project
3. View all deployments:
   - Production (from main branch)
   - Preview (from all other branches)
   - Commit messages and timestamps

### Rolling Back

If a production deployment has issues:

1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." menu > **"Promote to Production"**
4. Previous version is now live

### Deleting Old Previews

Vercel automatically keeps recent deployments, but you can manually delete old previews:

1. Deployments tab
2. Find old preview deployment
3. Click "..." menu > **"Delete"**

## Best Practices for Sharing with Stakeholders

### For Academic Reviewers

Share CV in **Professional Mode** with **Archaeologist Lens:**

```
https://etceter4.vercel.app/akademia/cv/#academic/professional/archaeologist
```

This shows research context, methodology, and scholarly impact.

### For Investors

Share CV in **Professional Mode** with **Collector Lens:**

```
https://etceter4.vercel.app/akademia/cv/#overview/professional/collector
```

This provides clean, high-level overview of accomplishments.

### For Creative Collaborators

Share in **Experimental Mode** with **Critique Lens:**

```
https://etceter4.vercel.app/akademia/cv/#artist/experimental/critique
```

This shows conceptual framework and artistic positioning.

### For Students/Mentees

Share full site with specific sections:

```
https://etceter4.vercel.app/#sound    (Music)
https://etceter4.vercel.app/#words    (Writing)
https://etceter4.vercel.app/loophole.html  (Interactive work)
```

## Monitoring Performance

Vercel provides analytics:

- **Analytics Tab:** Page views, visitors, top pages
- **Speed Insights:** Loading times, Core Web Vitals
- **Deployment Logs:** Build process, errors

Free tier includes basic analytics; paid tiers offer more detailed data.

## Cost

**Free Tier Includes:**

- 100 GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Basic analytics
- Preview deployments

Your static site will easily fit within free tier limits.

**Paid Tier ($20/month):**

- 1 TB bandwidth
- Advanced analytics
- Password protection for previews
- Team collaboration features

## Troubleshooting

### Deployment Failed

**Check build logs:**

1. Go to failed deployment
2. Click "View Build Logs"
3. Look for errors

**Common issues:**

- Missing files (check .gitignore)
- Case-sensitive paths
- Relative path errors

### Preview URL Not Updating

**Force redeploy:**

1. Go to Deployments
2. Click "..." on latest deployment
3. Select **"Redeploy"**

Or make an empty commit:

```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

### Wrong Files Being Served

**Check .vercelignore:**

- Make sure important files aren't being ignored
- Remove exclusions that shouldn't be there

## Custom Domain Setup (Optional)

### Add Your Domain

1. **In Vercel:**
   - Project Settings > Domains
   - Click "Add"
   - Enter your domain (e.g., `etceter4.com`)

2. **Configure DNS:**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel's nameservers

3. **Verify:**
   - Vercel checks DNS automatically
   - HTTPS certificate issued automatically
   - Domain becomes live

### Subdomain for CV

You might want:

- Main site: `etceter4.com`
- CV only: `cv.etceter4.com`

Set up separate projects in Vercel or use routing rules.

## Integration with GitHub Actions

You can keep GitHub Pages for official deployment while using Vercel for previews:

**.github/workflows/deploy.yml** (GitHub Pages)

- Triggers on push to main
- Deploys to GitHub Pages

**Vercel** (automatic)

- Triggers on push to any branch
- Creates preview URLs

Both can coexist peacefully!

## Next Steps

1. **Set up Vercel account** and import repository
2. **Push a feature branch** and test preview URL
3. **Share preview URL** with a trusted colleague for feedback
4. **Configure custom domain** (optional)
5. **Establish workflow** for when to use GitHub Pages vs Vercel

## Questions?

See [Vercel documentation](https://vercel.com/docs) or check your deployment logs in the Vercel dashboard.

---

**Summary:**

- Push branch → Vercel auto-deploys → Share preview URL
- Each branch gets unique URL for stakeholder review
- Production deploys from main branch
- Free tier is generous for static sites
- Perfect for showing work to "first readers" and investors

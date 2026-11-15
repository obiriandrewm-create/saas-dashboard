<#
.SYNOPSIS
    Complete deployment script for SaaS Dashboard to Vercel
.DESCRIPTION
    Automates: git init, Vercel CLI setup, environment variable configuration, external service guides
    Requires: Bun, Git, Vercel CLI (will install if missing)
.NOTES
    Run from: C:\Users\hp\OpenBot\Shared\saas-dashboard
    Prerequisites: GitHub account, Vercel account
#>

param(
    [switch]$SkipGitInit,
    [switch]$SkipVercelLogin,
    [switch]$SkipEnvVars,
    [switch]$SkipDbSetup,
    [switch]$NonInteractive
)

$ErrorActionPreference = "Stop"
$projectRoot = "C:\Users\hp\OpenBot\Shared\saas-dashboard"

function Write-Step { param([string]$msg) Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Success { param([string]$msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warning { param([string]$msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-ErrorMsg { param([string]$msg) Write-Host "  ✗ $msg" -ForegroundColor Red }
function Read-Input { param([string]$prompt, [string]$default = "") 
    if ($NonInteractive) { return $default }
    $result = Read-Host "$prompt $([string]::IsNullOrEmpty($default) ? '' : "[$default]")"
    return if ([string]::IsNullOrEmpty($result)) { $default } else { $result }
}

# ============================================
# 1. CHECK PREREQUISITES
# ============================================
Write-Step "Checking prerequisites..."

# Check Bun
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Warning "Bun not found. Installing..."
    irm bun.sh/install.ps1 | iex
    $env:PATH += ";$env:USERPROFILE\.bun\bin"
}
Write-Success "Bun: $(bun --version)"

# Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-ErrorMsg "Git not found. Install from git-scm.com"
    exit 1
}
Write-Success "Git: $(git --version)"

# Check Vercel CLI
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Warning "Vercel CLI not found. Installing..."
    bun add -g vercel
}
Write-Success "Vercel CLI: $(vercel --version)"

# ============================================
# 2. GIT INIT & PUSH
# ============================================
if (-not $SkipGitInit) {
    Write-Step "Initializing Git repository..."
    Set-Location $projectRoot
    
    if (-not (Test-Path ".git")) {
        git init
        Write-Success "Git initialized"
    } else {
        Write-Success "Git already initialized"
    }
    
    # Check remote
    $remote = git remote get-url origin 2>$null
    if (-not $remote) {
        $repoUrl = Read-Input "GitHub repo URL (https://github.com/user/repo.git):"
        if ($repoUrl) {
            git remote add origin $repoUrl
            Write-Success "Remote added: $repoUrl"
        }
    } else {
        Write-Success "Remote exists: $remote"
    }
    
    # Commit & push
    git add .
    $commitMsg = Read-Input "Commit message" "feat: production-ready SaaS dashboard"
    git commit -m $commitMsg 2>$null || Write-Warning "Nothing to commit (already committed)"
    git branch -M main
    git push -u origin main
    Write-Success "Pushed to GitHub"
}

# ============================================
# 3. VERCEL LOGIN & PROJECT LINK
# ============================================
if (-not $SkipVercelLogin) {
    Write-Step "Vercel authentication..."
    try {
        vercel whoami | Out-Null
        Write-Success "Already logged in to Vercel"
    } catch {
        Write-Host "Opening Vercel login..." -ForegroundColor Yellow
        vercel login
    }
    
    # Link project
    $linked = vercel inspect --project 2>$null
    if (-not $linked) {
        Write-Host "Linking Vercel project..." -ForegroundColor Yellow
        vercel link --yes
        Write-Success "Project linked"
    } else {
        Write-Success "Project already linked"
    }
}

# ============================================
# 4. ENVIRONMENT VARIABLES
# ============================================
if (-not $SkipEnvVars) {
    Write-Step "Configuring environment variables..."
    
    $envVars = @{
        # Required
        "DATABASE_URL" = "postgresql://..."
        "AUTH_SECRET" = ""
        "AUTH_URL" = ""
        "STRIPE_SECRET_KEY" = ""
        "STRIPE_PUBLISHABLE_KEY" = ""
        "STRIPE_WEBHOOK_SECRET" = ""
        "RESEND_API_KEY" = ""
        "EMAIL_FROM" = ""
        "ENCRYPTION_KEY" = ""
        "REDIS_URL" = ""
        
        # Optional
        "STRIPE_API_VERSION" = "2024-06-20"
        "STRIPE_PRICE_FREE" = ""
        "STRIPE_PRICE_PRO_MONTHLY" = ""
        "STRIPE_PRICE_TEAM_MONTHLY" = ""
        "STRIPE_PRICE_ENTERPRISE_MONTHLY" = ""
        "ENCRYPTION_KEY_VERSION" = "1"
        "TURNSTILE_SECRET_KEY" = ""
        "TURNSTILE_SITE_KEY" = ""
        "GOOGLE_CLIENT_ID" = ""
        "GOOGLE_CLIENT_SECRET" = ""
        "GITHUB_CLIENT_ID" = ""
        "GITHUB_CLIENT_SECRET" = ""
        "MICROSOFT_CLIENT_ID" = ""
        "MICROSOFT_CLIENT_SECRET" = ""
    }
    
    if (-not $NonInteractive) {
        Write-Host "`n=== Required Environment Variables ===" -ForegroundColor Magenta
        Write-Host "You'll need these ready. Press Enter to skip any optional ones.`n"
        
        foreach ($key in $envVars.Keys) {
            $isRequired = $key -in @("DATABASE_URL","AUTH_SECRET","AUTH_URL","STRIPE_SECRET_KEY","STRIPE_PUBLISHABLE_KEY","STRIPE_WEBHOOK_SECRET","RESEND_API_KEY","EMAIL_FROM","ENCRYPTION_KEY","REDIS_URL")
            $label = if ($isRequired) { "REQUIRED" } else { "OPTIONAL" }
            $current = $envVars[$key]
            $prompt = "$key [$label]"
            if ($current) { $prompt += " [$current]" }
            $value = Read-Input $prompt
            if ($value) { $envVars[$key] = $value }
        }
        
        # Generate AUTH_SECRET if empty
        if (-not $envVars["AUTH_SECRET"]) {
            $envVars["AUTH_SECRET"] = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
            Write-Success "Generated AUTH_SECRET"
        }
        
        # Generate ENCRYPTION_KEY if empty
        if (-not $envVars["ENCRYPTION_KEY"]) {
            $envVars["ENCRYPTION_KEY"] = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
            Write-Success "Generated ENCRYPTION_KEY"
        }
        
        # AUTH_URL from Vercel
        if (-not $envVars["AUTH_URL"]) {
            Write-Warning "Deploy first to get AUTH_URL, then run: vercel env add AUTH_URL production"
        }
    }
    
    # Push to Vercel
    Write-Host "`nPushing environment variables to Vercel..." -ForegroundColor Cyan
    foreach ($key in $envVars.Keys) {
        $value = $envVars[$key]
        if ($value -and $value -ne "postgresql://...") {
            try {
                echo $value | vercel env add $key production --force 2>$null
                echo $value | vercel env add $key preview --force 2>$null
                echo $value | vercel env add $key development --force 2>$null
                Write-Success "Added $key"
            } catch {
                Write-Warning "Failed to add $key (may already exist)"
            }
        }
    }
}

# ============================================
# 5. DATABASE SETUP GUIDE
# ============================================
if (-not $SkipDbSetup) {
    Write-Step "Database setup guide..."
    Write-Host "`n=== Choose Your PostgreSQL Provider ===" -ForegroundColor Magenta
    Write-Host "1) Neon (free, serverless) - neon.tech"
    Write-Host "2) Supabase - supabase.com"
    Write-Host "3) Railway - railway.app"
    Write-Host "4) Local Docker - docker-compose up -d postgres"
    Write-Host "5) Other (provide connection string)"
    
    if (-not $NonInteractive) {
        $choice = Read-Input "Choice (1-5)" "1"
        switch ($choice) {
            1 { Write-Host "Go to https://neon.tech → Create project → Copy connection string → Add as DATABASE_URL in Vercel" }
            2 { Write-Host "Go to https://supabase.com → New project → Settings → Database → Connection string → Add as DATABASE_URL" }
            3 { Write-Host "Go to https://railway.app → Add PostgreSQL → Variables → Copy DATABASE_URL" }
            4 { 
                Write-Host "Run: docker-compose up -d postgres"
                Write-Host "DATABASE_URL=postgresql://saas:saas@localhost:5432/saas_dashboard"
            }
            5 { $customDb = Read-Input "Custom DATABASE_URL:"; if ($customDb) { echo $customDb | vercel env add DATABASE_URL production --force } }
        }
    }
    
    Write-Host "`nAfter creating DB, run:" -ForegroundColor Yellow
    Write-Host "  vercel env add DATABASE_URL production"
    Write-Host "  vercel env add DATABASE_URL preview"
    Write-Host "  vercel env add DATABASE_URL development"
}

# ============================================
# 6. REDIS SETUP GUIDE
# ============================================
Write-Step "Redis setup guide..."
Write-Host "`n=== Choose Your Redis Provider ===" -ForegroundColor Magenta
Write-Host "1) Upstash (free) - upstash.com → Create Redis → Copy REDIS_URL"
Write-Host "2) Vercel KV - In Vercel project → Storage → Create KV (auto-adds env)"
Write-Host "3) Local Docker - docker-compose up -d redis"
Write-Host "4) Other"

if (-not $NonInteractive) {
    $choice = Read-Input "Choice (1-4)" "1"
    switch ($choice) {
        1 { Write-Host "Go to https://upstash.com → Create Redis database → Copy REDIS_URL → Add to Vercel" }
        2 { Write-Host "In Vercel dashboard: Project → Storage → Create KV → Auto-configures REDIS_URL" }
        3 { Write-Host "Run: docker-compose up -d redis → REDIS_URL=redis://localhost:6379" }
    }
}

# ============================================
# 7. STRIPE SETUP GUIDE
# ============================================
Write-Step "Stripe setup guide..."
Write-Host "`n=== Stripe Configuration ===" -ForegroundColor Magenta
Write-Host "1. Dashboard → Developers → API Keys → Copy Secret/Publishable"
Write-Host "2. Products → Create 4 prices: Free, Pro ($29), Team ($99), Enterprise"
Write-Host "3. Copy Price IDs → Add STRIPE_PRICE_* vars"
Write-Host "4. Developers → Webhooks → Add endpoint:"
Write-Host "   URL: https://YOUR_APP.vercel.app/api/webhooks/stripe"
Write-Host "   Events: customer.subscription.*, invoice.payment_*, checkout.session.completed"
Write-Host "5. Copy Signing Secret → STRIPE_WEBHOOK_SECRET"

# ============================================
# 8. RESEND SETUP GUIDE
# ============================================
Write-Step "Resend (Email) setup guide..."
Write-Host "`n=== Resend Configuration ===" -ForegroundColor Magenta
Write-Host "1. resend.com → API Keys → Create → RESEND_API_KEY"
Write-Host "2. Domains → Add/verify your domain"
Write-Host "3. Use verified domain as EMAIL_FROM (e.g., noreply@yourdomain.com)"

# ============================================
# 9. DEPLOY
# ============================================
Write-Step "Deploying to Vercel..."
if (-not $NonInteractive) {
    $doDeploy = Read-Input "Deploy now? (y/n)" "y"
    if ($doDeploy -eq "y") {
        Write-Host "Building and deploying..." -ForegroundColor Cyan
        vercel --prod
        Write-Success "Deployment complete!"
        
        # Get deployment URL
        $deploymentUrl = vercel inspect --json 2>$null | ConvertFrom-Json | Select-Object -ExpandProperty url
        if ($deploymentUrl) {
            Write-Host "`n🎉 Deployed to: $deploymentUrl" -ForegroundColor Green
            Write-Host "`nNext steps:" -ForegroundColor Yellow
            Write-Host "1. Add AUTH_URL: vercel env add AUTH_URL production"
            Write-Host "2. Update Stripe webhook URL to: $deploymentUrl/api/webhooks/stripe"
            Write-Host "3. Test: $deploymentUrl"
        }
    }
}

Write-Host "`n=== Deployment Script Complete ===" -ForegroundColor Cyan
Write-Host "Run 'vercel logs' to see build logs"
Write-Host "Run 'vercel env ls' to verify environment variables"
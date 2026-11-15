#!/usr/bin/env bash
# ============================================
# SaaS Dashboard - Complete Deployment Script
# ============================================
# Run from: C:\Users\hp\OpenBot\Shared\saas-dashboard (or /mnt/c/... in WSL)
# Prerequisites: bun, git, vercel CLI
# ============================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NON_INTERACTIVE=false
SKIP_GIT=false
SKIP_VERCEL=false
SKIP_ENV=false
SKIP_DB=false

# Parse args
for arg in "$@"; do
    case $arg in
        --non-interactive) NON_INTERACTIVE=true ;;
        --skip-git) SKIP_GIT=true ;;
        --skip-vercel) SKIP_VERCEL=true ;;
        --skip-env) SKIP_ENV=true ;;
        --skip-db) SKIP_DB=true ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

step() { echo -e "\n${CYAN}=== $1 ===${NC}"; }
success() { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
error() { echo -e "  ${RED}✗${NC} $1"; }

read_input() {
    local prompt="$1"
    local default="${2:-}"
    if $NON_INTERACTIVE; then
        echo "$default"
        return
    fi
    if [[ -n "$default" ]]; then
        read -p "$prompt [$default]: " input
        echo "${input:-$default}"
    else
        read -p "$prompt: " input
        echo "$input"
    fi
}

# ============================================
# 1. CHECK PREREQUISITES
# ============================================
step "Checking prerequisites..."

# Bun
if ! command -v bun &> /dev/null; then
    warn "Bun not found. Installing..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi
success "Bun: $(bun --version)"

# Git
if ! command -v git &> /dev/null; then
    error "Git not found. Install: https://git-scm.com"
    exit 1
fi
success "Git: $(git --version)"

# Vercel CLI
if ! command -v vercel &> /dev/null; then
    warn "Vercel CLI not found. Installing..."
    bun add -g vercel
fi
success "Vercel CLI: $(vercel --version)"

# ============================================
# 2. GIT INIT & PUSH
# ============================================
if ! $SKIP_GIT; then
    step "Initializing Git repository..."
    cd "$PROJECT_ROOT"
    
    if [[ ! -d .git ]]; then
        git init
        success "Git initialized"
    else
        success "Git already initialized"
    fi
    
    # Remote
    if ! git remote get-url origin &>/dev/null; then
        repo_url=$(read_input "GitHub repo URL (https://github.com/user/repo.git):")
        if [[ -n "$repo_url" ]]; then
            git remote add origin "$repo_url"
            success "Remote added: $repo_url"
        fi
    else
        success "Remote exists: $(git remote get-url origin)"
    fi
    
    # Commit & push
    git add .
    commit_msg=$(read_input "Commit message" "feat: production-ready SaaS dashboard")
    git commit -m "$commit_msg" 2>/dev/null || warn "Nothing to commit"
    git branch -M main
    git push -u origin main
    success "Pushed to GitHub"
fi

# ============================================
# 3. VERCEL LOGIN & LINK
# ============================================
if ! $SKIP_VERCEL; then
    step "Vercel authentication..."
    if vercel whoami &>/dev/null; then
        success "Already logged in to Vercel"
    else
        echo "Opening Vercel login..."
        vercel login
    fi
    
    # Link project
    if ! vercel inspect --project &>/dev/null; then
        echo "Linking Vercel project..."
        vercel link --yes
        success "Project linked"
    else
        success "Project already linked"
    fi
fi

# ============================================
# 4. ENVIRONMENT VARIABLES
# ============================================
if ! $SKIP_ENV; then
    step "Configuring environment variables..."
    
    # Define required and optional vars
    declare -A env_vars=(
        ["DATABASE_URL"]="postgresql://... (REQUIRED)"
        ["AUTH_SECRET"]="(auto-generated) REQUIRED"
        ["AUTH_URL"]="(after deploy) REQUIRED"
        ["STRIPE_SECRET_KEY"]="sk_... REQUIRED"
        ["STRIPE_PUBLISHABLE_KEY"]="pk_... REQUIRED"
        ["STRIPE_WEBHOOK_SECRET"]="whsec_... REQUIRED"
        ["RESEND_API_KEY"]="re_... REQUIRED"
        ["EMAIL_FROM"]="noreply@domain.com REQUIRED"
        ["ENCRYPTION_KEY"]="(auto-generated) REQUIRED"
        ["REDIS_URL"]="redis://... REQUIRED"
        
        ["STRIPE_API_VERSION"]="2024-06-20 (optional)"
        ["STRIPE_PRICE_FREE"]="price_... (optional)"
        ["STRIPE_PRICE_PRO_MONTHLY"]="price_... (optional)"
        ["STRIPE_PRICE_TEAM_MONTHLY"]="price_... (optional)"
        ["STRIPE_PRICE_ENTERPRISE_MONTHLY"]="price_... (optional)"
        ["ENCRYPTION_KEY_VERSION"]="1 (optional)"
        ["TURNSTILE_SECRET_KEY"]="0x... (optional)"
        ["TURNSTILE_SITE_KEY"]="0x... (optional)"
        ["GOOGLE_CLIENT_ID"]="... (optional)"
        ["GOOGLE_CLIENT_SECRET"]="... (optional)"
        ["GITHUB_CLIENT_ID"]="... (optional)"
        ["GITHUB_CLIENT_SECRET"]="... (optional)"
        ["MICROSOFT_CLIENT_ID"]="... (optional)"
        ["MICROSOFT_CLIENT_SECRET"]="... (optional)"
    )
    
    # Generate secrets
    AUTH_SECRET=$(openssl rand -base64 32)
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    
    if ! $NON_INTERACTIVE; then
        echo -e "\n${MAGENTA}=== Environment Variables ===${NC}"
        echo "Required vars will be prompted. Optional: press Enter to skip."
        echo ""
        
        # Required vars
        for key in DATABASE_URL AUTH_SECRET AUTH_URL STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET RESEND_API_KEY EMAIL_FROM ENCRYPTION_KEY REDIS_URL; do
            case $key in
                AUTH_SECRET) value=$AUTH_SECRET ;;
                ENCRYPTION_KEY) value=$ENCRYPTION_KEY ;;
                *) value="" ;;
            esac
            
            if [[ "$key" == "AUTH_SECRET" ]]; then
                value=$AUTH_SECRET
                echo -e "${GREEN}Generated AUTH_SECRET${NC}"
            elif [[ "$key" == "ENCRYPTION_KEY" ]]; then
                value=$ENCRYPTION_KEY
                echo -e "${GREEN}Generated ENCRYPTION_KEY${NC}"
            elif [[ "$key" == "AUTH_URL" ]]; then
                value=""
                warn "Deploy first, then: vercel env add AUTH_URL production"
                continue
            else
                value=$(read_input "$key [REQUIRED]" "")
            fi
            
            if [[ -n "$value" ]]; then
                env_vars[$key]=$value
            fi
        done
        
        # Optional vars
        echo -e "\n${YELLOW}Optional variables (press Enter to skip):${NC}"
        for key in STRIPE_API_VERSION STRIPE_PRICE_FREE STRIPE_PRICE_PRO_MONTHLY STRIPE_PRICE_TEAM_MONTHLY STRIPE_PRICE_ENTERPRISE_MONTHLY ENCRYPTION_KEY_VERSION TURNSTILE_SECRET_KEY TURNSTILE_SITE_KEY GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET MICROSOFT_CLIENT_ID MICROSOFT_CLIENT_SECRET; do
            value=$(read_input "$key [OPTIONAL]" "")
            if [[ -n "$value" ]]; then
                env_vars[$key]=$value
            fi
        done
    fi
    
    # Push to Vercel
    echo -e "\n${CYAN}Pushing environment variables to Vercel...${NC}"
    for key in "${!env_vars[@]}"; do
        value="${env_vars[$key]}"
        if [[ -n "$value" && "$value" != "postgresql://..." ]]; then
            echo "$value" | vercel env add "$key" production --force 2>/dev/null && success "Added $key" || warn "Failed $key (may exist)"
            echo "$value" | vercel env add "$key" preview --force 2>/dev/null
            echo "$value" | vercel env add "$key" development --force 2>/dev/null
        fi
    done
fi

# ============================================
# 5. DATABASE GUIDE
# ============================================
if ! $SKIP_DB; then
    step "Database setup"
    echo -e "\n${MAGENTA}=== Choose PostgreSQL Provider ===${NC}"
    echo "1) Neon (free) - neon.tech"
    echo "2) Supabase - supabase.com"
    echo "3) Railway - railway.app"
    echo "4) Local Docker - docker-compose up -d postgres"
    echo "5) Other"
    
    if ! $NON_INTERACTIVE; then
        choice=$(read_input "Choice (1-5)" "1")
        case $choice in
            1) echo "Go to https://neon.tech → Create project → Copy connection string" ;;
            2) echo "Go to https://supabase.com → New project → Settings → Database → Connection string" ;;
            3) echo "Go to https://railway.app → Add PostgreSQL → Variables → Copy DATABASE_URL" ;;
            4) echo "Run: docker-compose up -d postgres" ;;
            5) custom=$(read_input "Custom DATABASE_URL:"); [[ -n "$custom" ]] && echo "$custom" | vercel env add DATABASE_URL production --force ;;
        esac
    fi
    
    echo -e "\n${YELLOW}After creating DB:${NC}"
    echo "  vercel env add DATABASE_URL production"
    echo "  vercel env add DATABASE_URL preview"
    echo "  vercel env add DATABASE_URL development"
fi

# ============================================
# 6. REDIS GUIDE
# ============================================
step "Redis setup"
echo -e "\n${MAGENTA}=== Choose Redis Provider ===${NC}"
echo "1) Upstash (free) - upstash.com"
echo "2) Vercel KV - Project → Storage → Create KV"
echo "3) Local Docker - docker-compose up -d redis"
echo "4) Other"

# ============================================
# 7. STRIPE GUIDE
# ============================================
step "Stripe setup"
echo -e "\n${MAGENTA}=== Stripe Configuration ===${NC}"
echo "1. Dashboard → Developers → API Keys → Copy Secret/Publishable"
echo "2. Products → Create 4 prices: Free, Pro (\$29), Team (\$99), Enterprise"
echo "3. Copy Price IDs → Add STRIPE_PRICE_* vars"
echo "4. Developers → Webhooks → Add endpoint:"
echo "   URL: https://YOUR_APP.vercel.app/api/webhooks/stripe"
echo "   Events: customer.subscription.*, invoice.payment_*, checkout.session.completed"
echo "5. Copy Signing Secret → STRIPE_WEBHOOK_SECRET"

# ============================================
# 8. RESEND GUIDE
# ============================================
step "Resend (Email) setup"
echo -e "\n${MAGENTA}=== Resend Configuration ===${NC}"
echo "1. resend.com → API Keys → Create → RESEND_API_KEY"
echo "2. Domains → Add/verify your domain"
echo "3. Use verified domain as EMAIL_FROM"

# ============================================
# 9. DEPLOY
# ============================================
step "Deploying to Vercel"
if ! $NON_INTERACTIVE; then
    deploy=$(read_input "Deploy now? (y/n)" "y")
    if [[ "$deploy" == "y" ]]; then
        echo -e "${CYAN}Building and deploying...${NC}"
        vercel --prod
        success "Deployment complete!"
        
        # Get URL
        deployment_url=$(vercel inspect --json 2>/dev/null | jq -r '.url' 2>/dev/null || echo "")
        if [[ -n "$deployment_url" && "$deployment_url" != "null" ]]; then
            echo -e "\n${GREEN}🎉 Deployed to: $deployment_url${NC}"
            echo -e "\n${YELLOW}Next steps:${NC}"
            echo "1. Add AUTH_URL: vercel env add AUTH_URL production"
            echo "2. Update Stripe webhook to: $deployment_url/api/webhooks/stripe"
            echo "3. Test: $deployment_url"
        fi
    fi
fi

echo -e "\n${CYAN}=== Deployment Script Complete ===${NC}"
echo "Run 'vercel logs' to see build logs"
echo "Run 'vercel env ls' to verify environment variables"
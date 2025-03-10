#!/bin/bash

# Configuration
PROJECT_PATH="/Users/brijesh/projects/ongoing/orchestrator"
# Client is using plain JS, server and agent-service are using TS
JS_COMPONENTS=("client")
TS_COMPONENTS=("server" "agent-service")

# Track if any errors are found
ERRORS_FOUND=0

# Get current date and time in UTC with the requested format
CURRENT_DATE=$(date -u '+%Y-%m-%d %H:%M:%S')
CURRENT_USER=$(whoami)

echo "Running pre-commit checks..."
echo "Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): $CURRENT_DATE"
echo "Current User's Login: $CURRENT_USER"

# Check JavaScript components (client - Next.js)
for component in "${JS_COMPONENTS[@]}"; do
    echo "Checking $component (JavaScript/Next.js)..."
    cd "$PROJECT_PATH/$component" || continue
    
    # Check if next lint is available in package.json
    if grep -q '"lint"' package.json; then
        echo "  Running Next.js lint..."
        if command -v pnpm &> /dev/null; then
            pnpm lint
        else
            npm run lint
        fi
        
        if [ $? -ne 0 ]; then
            echo "  ❌ Next.js lint errors found in $component"
            ERRORS_FOUND=1
        else
            echo "  ✅ Next.js lint check passed"
        fi
    else
        echo "  ⚠️ No lint script found in package.json, skipping lint check"
    fi
    
    # Check for syntax errors in JavaScript files (excluding node_modules, .next)
    echo "  Checking JavaScript syntax..."
    find . -name "*.js" -not -path "./node_modules/*" -not -path "./.next/*" -exec node -c {} \; 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo "  ❌ JavaScript syntax errors found in $component"
        ERRORS_FOUND=1
    else
        echo "  ✅ JavaScript syntax check passed"
    fi
done

# Check TypeScript components
for component in "${TS_COMPONENTS[@]}"; do
    echo "Checking $component (TypeScript)..."
    cd "$PROJECT_PATH/$component" || continue
    
    # TypeScript type checking
    if [ -f "tsconfig.json" ]; then
        echo "  Running TypeScript type check..."
        
        if [ "$component" = "agent-service" ]; then
            # Use bun for agent-service
            bun tsc --noEmit --skipLibCheck
        else
            # Use pnpm for server
            pnpm tsc --noEmit --skipLibCheck
        fi
        
        if [ $? -ne 0 ]; then
            echo "  ❌ TypeScript errors found in $component"
            ERRORS_FOUND=1
        else
            echo "  ✅ TypeScript check passed"
        fi
    fi
    
    # ESLint for TypeScript
    if grep -q '"lint"' package.json 2>/dev/null; then
        echo "  Running ESLint via lint script..."
        if [ "$component" = "agent-service" ]; then
            # Use bun for agent-service
            bun run lint
        else
            # Use pnpm for server
            pnpm lint
        fi
        
        if [ $? -ne 0 ]; then
            echo "  ❌ ESLint errors found in $component"
            ERRORS_FOUND=1
        else
            echo "  ✅ ESLint check passed"
        fi
    elif [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        echo "  Running ESLint..."
        if [ "$component" = "agent-service" ]; then
            # Use bun for agent-service
            bun eslint . --ext .ts,.tsx --ignore-pattern "node_modules/" --max-warnings=0
        else
            # Use pnpm for server
            pnpm eslint . --ext .ts,.tsx --ignore-pattern "node_modules/" --max-warnings=0
        fi
        
        if [ $? -ne 0 ]; then
            echo "  ❌ ESLint errors found in $component"
            ERRORS_FOUND=1
        else
            echo "  ✅ ESLint check passed"
        fi
    else
        echo "  ⚠️ No ESLint configuration found, skipping ESLint check"
    fi
done

# Final output
if [ $ERRORS_FOUND -ne 0 ]; then
    echo "❌ Errors found. Please fix them before committing."
    exit 1
else
    echo "✅ All checks passed. Ready to commit!"
    exit 0
fi
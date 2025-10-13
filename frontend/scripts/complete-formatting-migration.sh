#!/bin/bash

# Script to complete the i18n.language to locale migration
# This handles the remaining formatDate and formatNumber calls

echo "🚀 Starting batch migration of formatting functions..."

# Files to process
FILES=(
  "frontend/src/app/[locale]/listings/[id]/ListingDetailClient.tsx"
  "frontend/src/app/[locale]/(protected)/favorites/page.tsx"
  "frontend/src/app/[locale]/(protected)/dashboard/page.tsx"
  "frontend/src/components/listings/ListingsView.tsx"
  "frontend/src/components/listings/CarListingCard.tsx"
  "frontend/src/components/messaging/ConversationList.tsx"
  "frontend/src/components/messaging/MessageList.tsx"
)

# Counter
count=0

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Processing: $file"
    
    # Add import if not present
    if ! grep -q "useLanguageSwitching" "$file"; then
      # Add import after useTranslation import
      sed -i '' '/import.*useTranslation.*react-i18next/a\
import { useLanguageSwitching } from '\''@/hooks/useLanguageSwitching'\'';
' "$file"
    fi
    
    # Replace i18n usage in component
    sed -i '' 's/const { t, i18n } = useTranslation/const { t } = useTranslation/g' "$file"
    
    # Add locale destructuring after useTranslation
    sed -i '' '/const { t } = useTranslation/a\
  const { locale } = useLanguageSwitching();
' "$file"
    
    # Replace formatDate and formatNumber calls
    sed -i '' 's/formatDate([^,]*, i18n\.language,/formatDate(&, locale,/g' "$file"
    sed -i '' 's/formatNumber([^,]*, i18n\.language,/formatNumber(&, locale,/g' "$file"
    
    # Fix the replacement (remove the extra parameter)
    sed -i '' 's/formatDate(\([^,]*\), i18n\.language, locale,/formatDate(\1, locale,/g' "$file"
    sed -i '' 's/formatNumber(\([^,]*\), i18n\.language, locale,/formatNumber(\1, locale,/g' "$file"
    
    ((count++))
    echo "✅ Completed: $file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "🎉 Batch migration completed! Processed $count files."
echo "🔍 Next: Manual verification and cleanup needed."

#!/bin/sh
file="components/ui/button.tsx"
cp "$file" "$file.bak"
perl -0777 -pe "s/export interface ButtonProps[\\s\\S]*?\\{\\n/export interface ButtonProps\\n  extends React.ButtonHTMLAttributes<HTMLButtonElement>,\\n    ButtonVariantProps {\\n/" -i "$file"
echo "Patched $file (backup at $file.bak)"

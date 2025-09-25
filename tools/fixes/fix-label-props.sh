#!/bin/sh
file="components/ui/label.tsx"
cp "$file" "$file.bak"
perl -0777 -pe "s/export interface LabelProps[\\s\\S]*?\\{\\n/export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement>, LabelVariantProps {\\n/" -i "$file"
echo "Patched $file (backup at $file.bak)"

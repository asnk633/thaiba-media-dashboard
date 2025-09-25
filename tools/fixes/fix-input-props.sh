#!/bin/sh
file="components/ui/input.tsx"
cp "$file" "$file.bak"
perl -0777 -pe "s/export type InputProps[\\s\\S]*?;\\n/export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;\\n/" -i "$file"
echo "Patched $file (backup at $file.bak)"

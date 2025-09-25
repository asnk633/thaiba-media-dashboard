#!/bin/sh
file="components/ui/textarea.tsx"
cp "$file" "$file.bak"
perl -0777 -pe "s/export interface TextareaProps[\\s\\S]*?\\{\\}/export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}\\n/" -i "$file"
echo "Patched $file (backup at $file.bak)"

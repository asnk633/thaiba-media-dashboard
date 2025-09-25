#!/usr/bin/env bash
set -euo pipefail

CFG=".eslintrc.cjs"
TS=$(date +%s)
BACKUP="${CFG}.bak.${TS}"

# canonical override block to insert (edit globs/rules if you prefer)
read -r -d '' OVERRIDE_BLOCK <<'OV'
  overrides: [
    {
      files: ['app/api/**/*.{js,ts,tsx}', 'utils/**/*.{js,ts}'],
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['.next/**/*', '.next/**'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-console': 'off'
      }
    }
  ]
OV

# Create file if missing (simple starter config)
if [ ! -f "$CFG" ]; then
  echo "No $CFG found — creating a starter .eslintrc.cjs and adding overrides."
  cp /dev/null "$CFG"
  cat > "$CFG" <<'CJS'
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2024, sourceType: 'module', project: './tsconfig.json' },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react/recommended', 'prettier'],
  settings: { react: { version: 'detect' } },
  rules: { '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], 'no-console': ['warn', { allow: ['warn','error','info'] }] },
};
CJS
fi

# backup
cp "$CFG" "$BACKUP"
echo "Backup saved: $BACKUP"

# quick sanity: ensure file ends with closing "};" (module.exports)
if ! tail -c 3 "$CFG" | grep -q '};'; then
  echo "ERROR: $CFG does not appear to end with '};' — please fix structure and re-run"
  exit 2
fi

# if overrides already present, do nothing
if grep -q "overrides\s*:" "$CFG"; then
  echo "overrides already present in $CFG — no change made."
  exit 0
fi

# insert override block BEFORE final closing "};"
# - we use awk to print everything up to last line match "};" then the block then the trailing "};"
awk -v block="$OVERRIDE_BLOCK" '
  BEGIN { inserted=0 }
  { lines[NR] = $0 }
  END {
    # find last line that is "};" possibly with trailing spaces
    idx = -1
    for (i=1;i<=NR;i++) {
      if (lines[i] ~ /^[[:space:]]*};[[:space:]]*$/) idx = i
    }
    if (idx == -1) {
      print "ERROR: could not find trailing };"
      exit 1
    }
    for (i=1;i<idx;i++) print lines[i]
    # print the override block with proper indentation/newlines
    print block
    # print the trailing closing lines
    for (i=idx;i<=NR;i++) print lines[i]
  }
' "$CFG" > "${CFG}.tmp" && mv "${CFG}.tmp" "$CFG"

echo "Inserted overrides into $CFG (backup at $BACKUP)."
echo "Run: npm run lint -- --no-cache --fix to re-lint with the new config."

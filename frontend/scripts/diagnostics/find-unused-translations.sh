#!/bin/bash

# Script to find unused translation keys
cd "$(dirname "$0")/../.."
node --experimental-modules ./scripts/diagnostics/find-unused-translations.js

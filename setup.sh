#!/usr/bin/env bash
set -euo pipefail
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

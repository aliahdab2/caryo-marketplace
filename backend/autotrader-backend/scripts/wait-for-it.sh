#!/bin/bash
# Use this script to wait for a service to be ready before starting dependent services
# Based on https://github.com/vishnubob/wait-for-it

# Set colors for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

TIMEOUT=15
QUIET=0

usage() {
  cat << EOF
Usage: $0 host:port [-t timeout] [-- command]
  -q | --quiet                   Don't output any status messages
  -t TIMEOUT | --timeout=TIMEOUT Timeout in seconds, zero for no timeout
  -- COMMAND                      Command to execute after the test finishes
EOF
  exit 1
}

wait_for() {
  if [[ $QUIET -eq 1 ]]; then
    timeout $TIMEOUT bash -c "until printf '' 2>/dev/null >/dev/tcp/$HOST/$PORT; do sleep 0.5; done" >/dev/null 2>&1
  else
    echo -e "${YELLOW}Waiting for $HOST:$PORT...${NC}"
    timeout $TIMEOUT bash -c "until printf '' 2>/dev/null >/dev/tcp/$HOST/$PORT; do sleep 0.5; done"
  fi
  RESULT=$?
  
  if [[ $RESULT -eq 0 ]]; then
    echo -e "${GREEN}$HOST:$PORT is available${NC}"
  else
    echo -e "${RED}$HOST:$PORT is not available after $TIMEOUT seconds${NC}"
  fi
  return $RESULT
}

parse_arguments() {
  while [ $# -gt 0 ]
  do
    case "$1" in
      *:* )
        HOST=$(printf "%s\n" "$1" | cut -d : -f 1)
        PORT=$(printf "%s\n" "$1" | cut -d : -f 2)
        shift 1
        ;;
      -q | --quiet)
        QUIET=1
        shift 1
        ;;
      -t)
        TIMEOUT="$2"
        if [ -z "$TIMEOUT" ]; then usage; fi
        shift 2
        ;;
      --timeout=*)
        TIMEOUT="${1#*=}"
        shift 1
        ;;
      --)
        shift
        CLI=("$@")
        break
        ;;
      --help)
        usage
        ;;
      *)
        echo "Unknown argument: $1"
        usage
        ;;
    esac
  done

  if [ "$HOST" = "" ] || [ "$PORT" = "" ]; then
    usage
  fi
}

parse_arguments "$@"
wait_for
WAITFORIT_RESULT=$?

if [[ $WAITFORIT_RESULT -ne 0 ]]; then
  exit $WAITFORIT_RESULT
fi

if [[ ${#CLI[@]} -gt 0 ]]; then
  exec "${CLI[@]}"
fi

exit 0

#!/usr/bin/env bash

# Define colors
NC='\033[0m' # No Color
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'

# --- Configuration ---
# Determine PROJECT_ROOT: assumes script is in <PROJECT_ROOT>/scripts/postman/
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)" # Corrected path

COLLECTIONS_DIR="${PROJECT_ROOT}/src/test/resources/postman/collections"
REPORTS_DIR="${PROJECT_ROOT}/build/reports/postman"
ENV_FILE_TEMPLATE="${PROJECT_ROOT}/src/test/resources/postman/environment.json"
ENV_FILE_CI="${PROJECT_ROOT}/build/postman/environment.ci.json"

# Set to "htmlextra" to enable the HTML reporter, "" to disable
REPORTERS_EXTRA="" 
# Example: HTML_EXTRA_REPORTER_OPTIONS="--reporter-htmlextra-export \"${REPORTS_DIR}/full_report.html\" --reporter-htmlextra-darkTheme"
HTML_EXTRA_REPORTER_OPTIONS="--reporter-htmlextra-export \"${REPORTS_DIR}/report.html\""


# --- Helper Functions ---
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}! $1${NC}"
}

print_info() {
  echo -e "${CYAN}ℹ $1${NC}"
}

print_header() {
  echo
  echo -e "${CYAN}=======================================================================${NC}"
  echo -e "${CYAN} $1${NC}"
  echo -e "${CYAN}=======================================================================${NC}"
  echo
}

# --- Script Functions ---
show_usage() {
  print_header "AutoTrader Postman Tests Runner"
  echo "Usage: ./run-tests.sh [OPTIONS] [COLLECTION_NAME]"
  echo
  echo "If COLLECTION_NAME is provided, only that collection will be run."
  echo "Otherwise, all collections in '${COLLECTIONS_DIR}' will be run."
  echo
  echo "Options:"
  echo "  --collection COLLECTION  Explicitly specify collection to run."
  echo "  --env-only               Only set up environment, don\'t run tests."
  echo "  --start-env              Ensure dev environment is started before tests."
  echo "  --stop-env               Stop dev environment after tests complete (if started by script)."
  echo "  --help                   Display this help message."
  echo
  echo "Examples:"
  echo "  ./run-tests.sh                          # Run all tests"
  echo "  ./run-tests.sh auth                     # Run only 'auth' collection"
  echo "  ./run-tests.sh --collection auth        # Also runs only 'auth' collection"
  echo "  ./run-tests.sh --start-env --stop-env   # Start env, run all tests, stop env"
  echo
}

parse_args() {
  # Default values
  START_ENV=false
  STOP_ENV=false
  ENV_ONLY=false
  SPECIFIED_COLLECTION=""

  # Iterate over all arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --collection)
        if [[ -n "$2" && ! "$2" =~ ^-- ]]; then
          SPECIFIED_COLLECTION="$2"
          shift 2
        else
          print_error "Error: --collection option requires a collection name."
          show_usage
          exit 1
        fi
        ;;
      --env-only)
        ENV_ONLY=true
        shift
        ;;
      --start-env)
        START_ENV=true
        shift
        ;;
      --stop-env)
        STOP_ENV=true
        shift
        ;;
      --help)
        show_usage
        exit 0
        ;;
      -*)
        # Unknown option
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
      *)
        # Argument without a flag; assume it's the collection name
        if [[ -z "$SPECIFIED_COLLECTION" ]]; then
          SPECIFIED_COLLECTION="$1"
        else
          # If SPECIFIED_COLLECTION is already set (e.g. by --collection), this is an extra arg
          print_error "Error: Too many arguments. Collection already specified as '$SPECIFIED_COLLECTION'."
          show_usage
          exit 1
        fi
        shift
        ;;
    esac
  done
}

check_newman() {
  if ! command -v newman &> /dev/null; then
    print_warning "Newman is not installed. Attempting to install globally..."
    if npm install -g newman newman-reporter-htmlextra; then
      print_success "Newman and htmlextra reporter installed successfully."
    else
      print_error "Failed to install Newman. Please install it manually: npm install -g newman newman-reporter-htmlextra"
      exit 1
    fi
  else
    print_success "Newman is already installed."
  fi
}

ensure_dev_env() {
  if [ "$START_ENV" = true ]; then
    print_info "Checking if development environment is running..."
    # Using /actuator/health for Spring Boot, adjust if your health endpoint is different
    if ! curl -s --head --fail http://localhost:8080/actuator/health &> /dev/null; then
      print_warning "Development environment not responding at http://localhost:8080/actuator/health. Attempting to start..."
      
      local dev_env_script="${PROJECT_ROOT}/.devenv/dev-env.sh"
      if [ ! -f "$dev_env_script" ]; then
        print_error "Development environment script not found at: $dev_env_script"
        exit 1
      fi
      if [ ! -x "$dev_env_script" ]; then
        chmod +x "$dev_env_script"
      fi
      
      # Start the environment
      "$dev_env_script" start
      ENV_STARTED_BY_SCRIPT=true # Flag that this script started the environment
      
      print_info "Waiting for environment to become healthy (max 30s)..."
      for i in {1..15}; do
        if curl -s --head --fail http://localhost:8080/actuator/health &> /dev/null; then
          print_success "Development environment started and is healthy."
          return 0
        fi
        sleep 2
      done
      print_error "Development environment did not become healthy after 30 seconds."
      exit 1
    else
      print_success "Development environment is already running and healthy."
    fi
  fi
}

stop_dev_env() {
  if [ "$STOP_ENV" = true ] && [ "$ENV_STARTED_BY_SCRIPT" = true ]; then
    print_info "Stopping development environment (because it was started by this script)..."
    local dev_env_script="${PROJECT_ROOT}/.devenv/dev-env.sh"
    if [ -f "$dev_env_script" ]; then
      "$dev_env_script" stop
      print_success "Development environment stop command issued."
    else
      print_warning "Development environment script not found at: $dev_env_script. Cannot stop."
    fi
  elif [ "$STOP_ENV" = true ]; then
    print_info "--stop-env was specified, but the environment was not started by this script. Skipping stop."
  fi
}

setup_report_dir() {
  mkdir -p "$REPORTS_DIR"
  print_info "Test reports will be saved in: $REPORTS_DIR"
}

setup_environment() {
  print_info "Setting up Postman environment..."
  if [ ! -f "$ENV_FILE_TEMPLATE" ]; then
    print_error "Environment template file not found: $ENV_FILE_TEMPLATE"
    exit 1
  fi
  
  mkdir -p "$(dirname "$ENV_FILE_CI")"
  
  # If CI environment file doesn't exist, copy from template
  if [ ! -f "$ENV_FILE_CI" ]; then
    print_warning "CI Environment file not found at $ENV_FILE_CI. Creating from template: $ENV_FILE_TEMPLATE"
    cp "$ENV_FILE_TEMPLATE" "$ENV_FILE_CI"
    print_success "Created CI Environment file from template."
  else
    print_success "Using existing CI Environment file: $ENV_FILE_CI"
  fi
  
  local base_url="http://localhost:8080" # Default, can be overridden
  
  # Use jq to update/add baseUrl. This handles cases where 'values' might be null or baseUrl key doesn't exist.
  local tmp_env_file
  tmp_env_file=$(mktemp)

  jq \
    --arg keyToUpdate "baseUrl" \
    --arg valueToUpdate "$base_url" \
    '.values = (if .values == null then [] else .values end |
      if (. | map(select(.key == $keyToUpdate)) | length) == 0 then
        . + [{"key": $keyToUpdate, "value": $valueToUpdate, "enabled": true, "type": "default"}]
      else
        map(if .key == $keyToUpdate then .value = $valueToUpdate else . end)
      end)' \
    "$ENV_FILE_CI" > "$tmp_env_file" && mv "$tmp_env_file" "$ENV_FILE_CI"

  if [ $? -eq 0 ]; then
    print_success "Ensured baseUrl in CI Environment file ('$ENV_FILE_CI') is set to: $base_url"
  else
    print_error "Failed to update baseUrl in CI Environment file using jq. Check jq installation and file permissions."
    # rm -f "$tmp_env_file" # Clean up temp file on error
    # exit 1 # Optionally exit
  fi
}

run_single_collection() {
  local collection_file="$1"
  local collection_name="$2"
  local report_name="${collection_name}-report" # For JSON report

  print_info "Executing tests in: '$collection_name' from file: '$collection_file'"
  
  local cmd_array=("newman" "run" "$collection_file")
  cmd_array+=("--environment" "$ENV_FILE_CI")
  cmd_array+=("--export-environment" "$ENV_FILE_CI")
  
  local reporters_to_enable=("cli" "json") # Array of reporter names
  
  # Add options for json reporter
  cmd_array+=("--reporter-json-export" "$REPORTS_DIR/$report_name.json")

  if [[ -n "$REPORTERS_EXTRA" && "$REPORTERS_EXTRA" == *"htmlextra"* ]]; then
    print_info "Including htmlextra reporter. Output will be in $REPORTS_DIR."
    reporters_to_enable+=("htmlextra")
    cmd_array+=("--reporter-htmlextra-export" "${REPORTS_DIR}/report.html")
    # Add other htmlextra options if needed, e.g.
    # if [[ "$HTML_EXTRA_REPORTER_OPTIONS" == *"--reporter-htmlextra-darkTheme"* ]]; then
    #   cmd_array+=("--reporter-htmlextra-darkTheme")
    # fi
  fi
  
  # Join reporter names with comma for the --reporters flag
  local reporters_arg
  reporters_arg=$(IFS=,; echo "${reporters_to_enable[*]}")
  unset IFS # Reset IFS 
  
  cmd_array+=("--reporters" "$reporters_arg")

  print_info "Newman command: ${cmd_array[*]}" # Print the command array elements
  
  # Execute Newman
  "${cmd_array[@]}"

  if [ $? -ne 0 ]; then
    print_error "'$collection_name' tests failed."
    return 1 # Failure
  else
    print_success "'$collection_name' tests passed."
    return 0 # Success
  fi
}

run_tests() {
  if [ "$ENV_ONLY" = true ]; then
    print_info "Environment setup complete. Skipping test execution as requested."
    return 0
  fi

  if [ ! -d "$COLLECTIONS_DIR" ]; then
    print_error "Collections directory not found: $COLLECTIONS_DIR"
    return 1
  fi

  local overall_status=0 # 0 for success, 1 for failure

  if [ -n "$SPECIFIED_COLLECTION" ]; then
    local collection_file="$COLLECTIONS_DIR/${SPECIFIED_COLLECTION}-tests.json"
    if [ ! -f "$collection_file" ]; then
      # Try with just the name if -tests.json was already appended by user
      collection_file="$COLLECTIONS_DIR/${SPECIFIED_COLLECTION}.json"
       if [ ! -f "$collection_file" ]; then
        print_error "Collection file not found for '$SPECIFIED_COLLECTION' at expected paths:"
        print_error "  ${COLLECTIONS_DIR}/${SPECIFIED_COLLECTION}-tests.json"
        print_error "  ${COLLECTIONS_DIR}/${SPECIFIED_COLLECTION}.json"
        return 1
      fi
    fi
    print_header "Running specified collection: $SPECIFIED_COLLECTION"
    if ! run_single_collection "$collection_file" "$SPECIFIED_COLLECTION"; then
      overall_status=1
    fi
  else
    print_header "Running all Postman collections in $COLLECTIONS_DIR"
    local total_collections=0
    local failed_collections=0
    
    # Find files ending with -tests.json or .postman_collection.json
    find "$COLLECTIONS_DIR" -maxdepth 1 -type f \( -name "*-tests.json" -o -name "*.postman_collection.json" \) -print0 | while IFS= read -r -d $'\0' collection_file; do
      local collection_name
      # Derive collection name: remove path and known suffixes
      collection_name=$(basename "$collection_file")
      collection_name=${collection_name%-tests.json}
      collection_name=${collection_name%.postman_collection.json}
      
      total_collections=$((total_collections + 1))
      print_info "--- Running collection: $collection_name ---"
      if ! run_single_collection "$collection_file" "$collection_name"; then
        failed_collections=$((failed_collections + 1))
      fi
      echo # Add newline between collections
    done

    print_header "Test Summary"
    print_info "Total collections found: $total_collections"
    if [ "$total_collections" -eq 0 ]; then
        print_warning "No collections found to run."
    elif [ "$failed_collections" -eq 0 ]; then
      print_success "All $total_collections collections passed."
    else
      print_error "$failed_collections out of $total_collections collections failed."
      overall_status=1
    fi
  fi
  return $overall_status
}

# --- Main Execution ---
# Ensure script exits if any command fails (safer script)
set -e 

# Trap to ensure cleanup function is called on exit
# ENV_STARTED_BY_SCRIPT must be global or accessible for stop_dev_env
ENV_STARTED_BY_SCRIPT=false 
trap stop_dev_env EXIT

# Parse command-line arguments
parse_args "$@"

# Perform setup tasks
check_newman
ensure_dev_env # Start environment if --start-env is used
setup_report_dir
setup_environment

# Run tests
if ! run_tests; then
  print_error "One or more Postman collections failed."
  # stop_dev_env will be called by EXIT trap
  exit 1
fi

print_success "All specified Postman tests completed successfully."
# stop_dev_env will be called by EXIT trap
exit 0
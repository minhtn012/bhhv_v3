#!/bin/bash
# OCR Service using Claude Code
# Usage: ./ocr.sh <service-name> <image-path> [--output <file>]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/ocr-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Show usage
usage() {
    echo "Usage: $0 <service-name> <image-path> [--output <file>]"
    echo ""
    echo "Available services:"
    jq -r '.services | to_entries[] | "  \(.key): \(.value.name)"' "$CONFIG_FILE"
    echo ""
    echo "Examples:"
    echo "  $0 dang-ky-xe /path/to/image.jpg"
    echo "  $0 cmnd /path/to/cccd.png --output result.json"
    exit 1
}

# Check dependencies
check_deps() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is required. Install with: apt install jq${NC}"
        exit 1
    fi
    if ! command -v claude &> /dev/null; then
        echo -e "${RED}Error: claude CLI is required${NC}"
        exit 1
    fi
}

# List available services
list_services() {
    echo "Available OCR services:"
    jq -r '.services | to_entries[] | "  \(.key): \(.value.name) - \(.value.description)"' "$CONFIG_FILE"
}

# Main
check_deps

# Parse arguments
SERVICE=""
IMAGE_PATH=""
OUTPUT_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --list|-l)
            list_services
            exit 0
            ;;
        --output|-o)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --help|-h)
            usage
            ;;
        *)
            if [[ -z "$SERVICE" ]]; then
                SERVICE="$1"
            elif [[ -z "$IMAGE_PATH" ]]; then
                IMAGE_PATH="$1"
            fi
            shift
            ;;
    esac
done

# Validate arguments
if [[ -z "$SERVICE" ]] || [[ -z "$IMAGE_PATH" ]]; then
    usage
fi

# Check image exists
if [[ ! -f "$IMAGE_PATH" ]]; then
    echo -e "${RED}Error: Image file not found: $IMAGE_PATH${NC}"
    exit 1
fi

# Check service exists in config
if ! jq -e ".services[\"$SERVICE\"]" "$CONFIG_FILE" > /dev/null 2>&1; then
    echo -e "${RED}Error: Unknown service: $SERVICE${NC}"
    echo ""
    list_services
    exit 1
fi

# Build prompt from config
SERVICE_CONFIG=$(jq -r ".services[\"$SERVICE\"]" "$CONFIG_FILE")
BASE_PROMPT=$(echo "$SERVICE_CONFIG" | jq -r '.prompt')
FIELDS=$(echo "$SERVICE_CONFIG" | jq -r '.fields | join("\n- ")')

FULL_PROMPT="$BASE_PROMPT

Các trường cần trích xuất:
- $FIELDS

Nếu không tìm thấy thông tin, để giá trị là null.
Chỉ trả về JSON object, không markdown code block, không giải thích.

Ảnh cần phân tích: $IMAGE_PATH"

# Run Claude OCR
echo -e "${YELLOW}Processing: $IMAGE_PATH${NC}" >&2
echo -e "${YELLOW}Service: $SERVICE${NC}" >&2

RESULT=$(claude -p "$FULL_PROMPT" --output-format text 2>/dev/null)

# Clean result (remove markdown code blocks if any)
CLEAN_RESULT=$(echo "$RESULT" | sed 's/```json//g' | sed 's/```//g' | tr -d '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

# Validate JSON
if echo "$CLEAN_RESULT" | jq . > /dev/null 2>&1; then
    if [[ -n "$OUTPUT_FILE" ]]; then
        echo "$CLEAN_RESULT" | jq . > "$OUTPUT_FILE"
        echo -e "${GREEN}Result saved to: $OUTPUT_FILE${NC}" >&2
    else
        echo "$CLEAN_RESULT" | jq .
    fi
else
    echo -e "${RED}Warning: Output is not valid JSON${NC}" >&2
    echo "$RESULT"
fi

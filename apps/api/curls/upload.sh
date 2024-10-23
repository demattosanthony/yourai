

#!/bin/bash

# Check if a file path is provided as an argument
if [ $# -eq 0 ]; then
    echo "Please provide a file path as an argument."
    echo "Usage: ./upload.sh <file_path>"
    exit 1
fi

# Get the file path from the first argument
file_path="$1"

# Check if the file exists
if [ ! -f "$file_path" ]; then
    echo "File not found: $file_path"
    exit 1
fi

# Upload the file
curl -X POST http://localhost:4000/upload \
     -H "Content-Type: multipart/form-data" \
     -F "file=@$file_path"

# Instructions on how to run
# echo ""
# echo "To run this script, use the following command:"
# echo "./upload.sh <path_to_your_file>"
# echo "For example: ./upload.sh /path/to/your/document.pdf"

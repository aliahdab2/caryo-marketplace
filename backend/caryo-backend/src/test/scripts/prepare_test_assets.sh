#!/bin/bash

# Script to prepare test assets for Postman tests

# Create directory for test assets if it doesn't exist
ASSETS_DIR="./src/test/resources/postman/assets"
mkdir -p "$ASSETS_DIR"

echo "Creating test image for car listing..."
# Create a simple test JPEG image (1x1 pixel, minimum valid JPEG)
echo -n -e '\xff\xd8\xff\xe0\x00\x10\x4a\x46\x49\x46\x00\x01\x01\x01\x00\x48\x00\x48\x00\x00\xff\xdb\x00\x43\x00\x03\x02\x02\x03\x02\x02\x03\x03\x03\x03\x04\x03\x03\x04\x05\x08\x05\x05\x04\x04\x05\x0a\x07\x07\x06\x08\x0c\x0a\x0c\x0c\x0b\x0a\x0b\x0b\x0d\x0e\x12\x10\x0d\x0e\x11\x0e\x0b\x0b\x10\x16\x10\x11\x13\x14\x15\x15\x15\x0c\x0f\x17\x18\x16\x14\x18\x12\x14\x15\x14\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x09\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\xd2\xcf\x20\xff\xd9' > "$ASSETS_DIR/test-car.jpg"

echo "Creating test PDF file..."
# Create a simple PDF file
echo '%PDF-1.1
1 0 obj
<< /Type /Catalog
/Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages
/Kids [3 0 R]
/Count 1 >>
endobj
3 0 obj
<< /Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources << >>
/Contents 4 0 R >>
endobj
4 0 obj
<< /Length 41 >>
stream
BT
/F1 24 Tf
100 700 Td
(Test PDF File) Tj
ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF' > "$ASSETS_DIR/test-file.pdf"

echo "Test assets created in $ASSETS_DIR"
echo "Now update your Postman collection to use these files:"
echo "- For car listing image test: Select '$ASSETS_DIR/test-car.jpg'"
echo "- For file upload test: Select '$ASSETS_DIR/test-file.pdf'"

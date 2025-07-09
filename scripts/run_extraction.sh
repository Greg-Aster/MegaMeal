#!/bin/bash
# Script to extract 3D models from the pine forest blend file

echo "🌲 Extracting 3D models from pine forest blend file..."

# Check if Blender is installed
if ! command -v blender &> /dev/null; then
    echo "❌ Blender is not installed. Please install Blender to extract 3D models."
    echo "   On Ubuntu/Debian: sudo apt install blender"
    echo "   On macOS: brew install blender"
    exit 1
fi

# Path to the blend file
BLEND_FILE="/home/greggles/Merkin/MEGAMEAL/public/assets/game/pine_forest/polyhaven_pine_fir_forest.blend"
SCRIPT_FILE="/home/greggles/Merkin/MEGAMEAL/scripts/extract_forest_models.py"

# Check if blend file exists
if [ ! -f "$BLEND_FILE" ]; then
    echo "❌ Blend file not found: $BLEND_FILE"
    exit 1
fi

# Check if extraction script exists
if [ ! -f "$SCRIPT_FILE" ]; then
    echo "❌ Extraction script not found: $SCRIPT_FILE"
    exit 1
fi

# Run Blender in background mode with the extraction script
echo "🔄 Running Blender extraction..."
blender -b "$BLEND_FILE" -P "$SCRIPT_FILE"

# Check if extraction was successful
if [ $? -eq 0 ]; then
    echo "✅ Model extraction completed successfully!"
    echo "📁 Check /public/assets/game/shared/models/ for exported models"
else
    echo "❌ Model extraction failed"
    exit 1
fi
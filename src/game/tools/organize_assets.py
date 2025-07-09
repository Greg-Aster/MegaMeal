#!/usr/bin/env python3
"""
MEGAMEAL Asset Organization Script
Organizes existing 3D assets and extracts from Blender files
"""

import os
import shutil
import json
import sys
from pathlib import Path

def categorize_scifi_model(filename):
    """Categorize SciFi models based on filename patterns"""
    name_lower = filename.lower()
    
    # Aliens go to decorative
    if 'alien_' in name_lower:
        return 'decorative'
    
    # Columns and walls to structures  
    if any(keyword in name_lower for keyword in ['column_', 'wall', 'bottom', 'top', 'short']):
        return 'structures'
    
    # Platforms and doors to structures
    if any(keyword in name_lower for keyword in ['platform_', 'door_']):
        return 'structures'
    
    # Props stay as decorative
    if 'prop_' in name_lower:
        return 'decorative'
    
    # Decals to decorative
    if 'decal_' in name_lower:
        return 'decorative'
    
    # Default to structures for SciFi kit
    return 'structures'

def categorize_nature_model(filename):
    """Categorize nature models based on filename patterns"""
    name_lower = filename.lower()
    
    if any(keyword in name_lower for keyword in ['tree', 'pine', 'fir', 'oak', 'trunk', 'branch']):
        return 'trees'
    elif any(keyword in name_lower for keyword in ['rock', 'stone', 'boulder', 'cliff']):
        return 'rocks'
    elif any(keyword in name_lower for keyword in ['grass', 'fern', 'bush', 'plant', 'flower', 'leaf']):
        return 'vegetation'
    elif any(keyword in name_lower for keyword in ['log', 'stump', 'mushroom', 'debris']):
        return 'decorative'
    else:
        return 'vegetation'  # Default for nature assets

def copy_fbx_assets():
    """Copy and organize existing FBX assets"""
    project_root = "/home/greggles/Merkin/MEGAMEAL"
    scifi_source = os.path.join(project_root, "public/assets/game/Modular SciFi MegaKit[Standard]/FBX")
    output_dir = os.path.join(project_root, "public/assets/game/shared/models")
    
    print("🚀 Organizing FBX assets from SciFi MegaKit...")
    
    models_data = {"models": {}}
    copied_count = 0
    
    # Walk through SciFi FBX directories
    for root, dirs, files in os.walk(scifi_source):
        for file in files:
            if file.endswith('.fbx'):
                source_path = os.path.join(root, file)
                
                # Get relative path for organization
                rel_path = os.path.relpath(root, scifi_source)
                
                # Categorize the model
                category = categorize_scifi_model(file)
                
                # Ensure category directory exists
                category_dir = os.path.join(output_dir, category)
                os.makedirs(category_dir, exist_ok=True)
                
                # Create clean filename
                clean_name = file.replace('.fbx', '').lower().replace(' ', '_')
                dest_filename = f"scifi_{clean_name}.fbx"
                dest_path = os.path.join(category_dir, dest_filename)
                
                try:
                    # Copy the file
                    shutil.copy2(source_path, dest_path)
                    print(f"✅ Copied: {file} → {category}/{dest_filename}")
                    
                    # Add to models data
                    if category not in models_data["models"]:
                        models_data["models"][category] = {}
                    
                    models_data["models"][category][f"scifi_{clean_name}"] = {
                        "file": f"/assets/game/shared/models/{category}/{dest_filename}",
                        "format": "fbx",
                        "scale": 1.0,
                        "materials": ["scifi_metal", "scifi_trim"],
                        "tags": ["scifi", "modular", rel_path.replace('/', '_').lower()],
                        "description": f"SciFi {rel_path} asset: {file}",
                        "source": "Modular SciFi MegaKit"
                    }
                    
                    copied_count += 1
                    
                except Exception as e:
                    print(f"❌ Failed to copy {file}: {e}")
    
    print(f"✅ Copied {copied_count} FBX models from SciFi MegaKit")
    return models_data

def extract_from_blender():
    """Extract models from Blender files using Blender 4.4.3"""
    project_root = "/home/greggles/Merkin/MEGAMEAL"
    blender_path = os.path.join(project_root, "blender-4.4.3-linux-x64/blender")
    
    # Files to process
    blend_files = [
        {
            "path": os.path.join(project_root, "public/assets/game/pine_forest/polyhaven_pine_fir_forest.blend"),
            "name": "pine_forest",
            "categorizer": categorize_nature_model
        },
        {
            "path": os.path.join(project_root, "public/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/AllModels.blend"),
            "name": "nature_pack", 
            "categorizer": categorize_nature_model
        }
    ]
    
    models_data = {"models": {}}
    
    for blend_info in blend_files:
        if not os.path.exists(blend_info["path"]):
            print(f"⚠️  Blend file not found: {blend_info['path']}")
            continue
            
        print(f"🔄 Extracting from {blend_info['name']}...")
        
        # Create temporary extraction script
        extract_script = f"""
import bpy
import os

# Open the blend file
bpy.ops.wm.open_mainfile(filepath="{blend_info['path']}")

# Get output directory
output_dir = "{project_root}/public/assets/game/shared/models"

# Extract each mesh object
for obj in bpy.data.objects:
    if obj.type == 'MESH' and len(obj.data.vertices) > 10:
        # Clear selection and select only this object
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        
        # Clean the name for filename
        clean_name = "".join(c for c in obj.name if c.isalnum() or c in (' ', '-', '_')).strip()
        clean_name = clean_name.replace(' ', '_').lower()
        clean_name = f"{blend_info['name']}_{clean_name}"
        
        # Determine category (simplified in script)
        category = "vegetation"  # Default, will be corrected later
        if any(keyword in clean_name.lower() for keyword in ['tree', 'pine', 'fir', 'trunk']):
            category = "trees"
        elif any(keyword in clean_name.lower() for keyword in ['rock', 'stone', 'boulder']):
            category = "rocks"
        elif any(keyword in clean_name.lower() for keyword in ['grass', 'fern', 'bush']):
            category = "vegetation"
        
        # Ensure category directory exists
        category_dir = os.path.join(output_dir, category)
        os.makedirs(category_dir, exist_ok=True)
        
        # Export path
        export_path = os.path.join(category_dir, f"{{clean_name}}.glb")
        
        try:
            # Export as GLB
            bpy.ops.export_scene.gltf(
                filepath=export_path,
                use_selection=True,
                export_format='GLB',
                export_yup=True,
                export_apply=True,
                export_texcoords=True,
                export_normals=True,
                export_materials='EXPORT',
                export_colors=True,
                export_cameras=False,
                export_lights=False
            )
            print(f"✅ Exported: {{clean_name}}.glb to {{category}}/")
            
        except Exception as e:
            print(f"❌ Failed to export {{obj.name}}: {{e}}")

print("✅ Blender extraction complete")
"""
        
        # Write temporary script
        temp_script = os.path.join(project_root, f"temp_extract_{blend_info['name']}.py")
        with open(temp_script, 'w') as f:
            f.write(extract_script)
        
        try:
            # Run Blender extraction
            import subprocess
            result = subprocess.run([
                blender_path, "--background", "--python", temp_script
            ], capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                print(f"✅ Successfully extracted from {blend_info['name']}")
            else:
                print(f"⚠️  Blender extraction had issues for {blend_info['name']}")
                print(result.stderr)
                
        except subprocess.TimeoutExpired:
            print(f"⚠️  Blender extraction timed out for {blend_info['name']}")
        except Exception as e:
            print(f"❌ Failed to run Blender extraction for {blend_info['name']}: {e}")
        finally:
            # Clean up temp script
            if os.path.exists(temp_script):
                os.remove(temp_script)
    
    return models_data

def update_library_manifest():
    """Update the library.json manifest with all organized models"""
    project_root = "/home/greggles/Merkin/MEGAMEAL"
    output_dir = os.path.join(project_root, "public/assets/game/shared/models")
    library_path = os.path.join(output_dir, "library.json")
    
    print("📋 Updating library manifest...")
    
    # Scan for all models in the directory
    models_data = {
        "description": "MEGAMEAL 3D Model Library - Complete asset collection",
        "version": "1.0.0",
        "last_updated": "2025-01-08",
        "status": "populated",
        "models": {}
    }
    
    categories = ['trees', 'rocks', 'vegetation', 'structures', 'decorative']
    
    for category in categories:
        category_dir = os.path.join(output_dir, category)
        if os.path.exists(category_dir):
            models_data["models"][category] = {}
            
            for file in os.listdir(category_dir):
                if file.endswith(('.glb', '.fbx', '.obj')):
                    # Get file info
                    file_path = os.path.join(category_dir, file)
                    file_stats = os.stat(file_path)
                    
                    # Create model entry
                    model_name = os.path.splitext(file)[0]
                    file_format = os.path.splitext(file)[1][1:]  # Remove the dot
                    
                    models_data["models"][category][model_name] = {
                        "file": f"/assets/game/shared/models/{category}/{file}",
                        "format": file_format,
                        "scale": 1.0,
                        "materials": ["auto_detect"],
                        "tags": [category, "organized"],
                        "description": f"Organized {category} asset: {model_name}",
                        "file_size": file_stats.st_size,
                        "status": "ready"
                    }
    
    # Write updated manifest
    with open(library_path, 'w') as f:
        json.dump(models_data, f, indent=2)
    
    # Count totals
    total_models = sum(len(models) for models in models_data["models"].values())
    print(f"✅ Library manifest updated with {total_models} models")
    
    for category, models in models_data["models"].items():
        if models:
            print(f"  - {category}: {len(models)} models")
    
    return models_data

def main():
    print("🎨 MEGAMEAL Asset Organization Tool")
    print("=" * 50)
    
    # Step 1: Copy and organize existing FBX assets
    print("\n📦 Step 1: Organizing existing FBX assets...")
    fbx_data = copy_fbx_assets()
    
    # Step 2: Extract from Blender files (if available)
    print("\n🔧 Step 2: Extracting from Blender files...")
    try:
        blender_data = extract_from_blender()
    except Exception as e:
        print(f"⚠️  Blender extraction failed: {e}")
        blender_data = {"models": {}}
    
    # Step 3: Update the master library manifest
    print("\n📋 Step 3: Updating library manifest...")
    final_data = update_library_manifest()
    
    print(f"\n🎯 Asset Organization Complete!")
    print(f"✅ Ready to use in game - restart dev server to see changes")

if __name__ == "__main__":
    main()
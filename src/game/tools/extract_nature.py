#!/usr/bin/env python3
"""
Extract nature models from Blender files using the correct Blender path
"""

import bpy
import os

def categorize_object(obj_name):
    """Categorize objects based on naming patterns"""
    name_lower = obj_name.lower()
    
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

def main():
    # Get command line arguments for which file to process
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: blender --background --python extract_nature.py -- <blend_file_name>")
        return
    
    blend_file_name = sys.argv[-1]  # Get the last argument
    
    project_root = "/home/greggles/Merkin/MEGAMEAL"
    
    if blend_file_name == "pine_forest":
        blend_path = os.path.join(project_root, "public/assets/game/pine_forest/polyhaven_pine_fir_forest.blend")
        prefix = "pine_forest"
    elif blend_file_name == "nature_pack":
        blend_path = os.path.join(project_root, "public/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/AllModels.blend")
        prefix = "nature_pack"
    else:
        print(f"Unknown blend file: {blend_file_name}")
        return
    
    if not os.path.exists(blend_path):
        print(f"Blend file not found: {blend_path}")
        return
    
    output_dir = os.path.join(project_root, "public/assets/game/shared/models")
    
    print(f"🔄 Extracting from {blend_file_name}: {blend_path}")
    
    # Open the blend file
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    # Extract each mesh object
    exported_count = 0
    
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and len(obj.data.vertices) > 10:
            print(f"🔄 Processing: {obj.name} ({len(obj.data.vertices)} vertices)")
            
            # Clear selection and select only this object
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            
            # Clean the name for filename
            clean_name = "".join(c for c in obj.name if c.isalnum() or c in (' ', '-', '_')).strip()
            clean_name = clean_name.replace(' ', '_').lower()
            clean_name = f"{prefix}_{clean_name}"
            
            # Determine category
            category = categorize_object(obj.name)
            
            # Ensure category directory exists
            category_dir = os.path.join(output_dir, category)
            os.makedirs(category_dir, exist_ok=True)
            
            # Export path
            export_path = os.path.join(category_dir, f"{clean_name}.glb")
            
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
                    export_cameras=False,
                    export_lights=False
                )
                print(f"✅ Exported: {clean_name}.glb to {category}/")
                exported_count += 1
                
            except Exception as e:
                print(f"❌ Failed to export {obj.name}: {e}")
    
    print(f"✅ Extraction complete! Exported {exported_count} models from {blend_file_name}")

if __name__ == "__main__":
    main()
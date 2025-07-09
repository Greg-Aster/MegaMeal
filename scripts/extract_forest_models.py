#!/usr/bin/env python3
"""
Script to extract individual 3D models from the pine forest blend file
Run this in Blender: blender -b polyhaven_pine_fir_forest.blend -P extract_forest_models.py
"""

import bpy
import os
import bmesh
from mathutils import Vector

def setup_output_directories():
    """Create output directories for organized assets"""
    base_path = "/home/greggles/Merkin/MEGAMEAL/public/assets/game/shared"
    
    directories = [
        f"{base_path}/models/trees",
        f"{base_path}/models/rocks", 
        f"{base_path}/models/vegetation",
        f"{base_path}/models/ground",
        f"{base_path}/textures/trees",
        f"{base_path}/textures/rocks",
        f"{base_path}/textures/vegetation",
        f"{base_path}/textures/ground"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
    
    return base_path

def classify_object(obj):
    """Classify objects based on name and properties"""
    name = obj.name.lower()
    
    if any(keyword in name for keyword in ['pine', 'fir', 'tree', 'trunk', 'branch']):
        return 'trees'
    elif any(keyword in name for keyword in ['rock', 'stone', 'boulder']):
        return 'rocks'
    elif any(keyword in name for keyword in ['grass', 'fern', 'plant', 'leaf']):
        return 'vegetation'
    elif any(keyword in name for keyword in ['ground', 'terrain', 'soil']):
        return 'ground'
    else:
        return 'other'

def clean_object_name(name):
    """Clean object names for file export"""
    # Remove numbers and special characters, keep descriptive part
    import re
    cleaned = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    cleaned = re.sub(r'_+', '_', cleaned)
    return cleaned.strip('_').lower()

def export_object_as_glb(obj, output_path, category):
    """Export a single object as GLB file"""
    # Deselect all objects
    bpy.ops.object.select_all(action='DESELECT')
    
    # Select only the target object
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    
    # Clean the name for filename
    clean_name = clean_object_name(obj.name)
    filename = f"{clean_name}.glb"
    full_path = os.path.join(output_path, "models", category, filename)
    
    # Export as GLB
    try:
        bpy.ops.export_scene.gltf(
            filepath=full_path,
            use_selection=True,
            export_format='GLB',
            export_materials='EXPORT',
            export_textures=True,
            export_normals=True,
            export_tangents=True,
            export_apply=True
        )
        print(f"✅ Exported: {obj.name} -> {filename}")
        return True
    except Exception as e:
        print(f"❌ Failed to export {obj.name}: {e}")
        return False

def get_object_bounds(obj):
    """Get object bounding box dimensions"""
    if obj.type == 'MESH':
        bbox = obj.bound_box
        # Calculate dimensions
        min_x = min([v[0] for v in bbox])
        max_x = max([v[0] for v in bbox])
        min_y = min([v[1] for v in bbox])
        max_y = max([v[1] for v in bbox])
        min_z = min([v[2] for v in bbox])
        max_z = max([v[2] for v in bbox])
        
        return {
            'width': max_x - min_x,
            'height': max_y - min_y,
            'depth': max_z - min_z
        }
    return None

def main():
    """Main extraction process"""
    print("🌲 Starting pine forest model extraction...")
    
    # Setup directories
    base_path = setup_output_directories()
    
    # Get all mesh objects in the scene
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    
    print(f"Found {len(mesh_objects)} mesh objects in scene")
    
    # Track extracted models for manifest
    extracted_models = {
        'trees': [],
        'rocks': [],
        'vegetation': [],
        'ground': [],
        'other': []
    }
    
    # Process each object
    for obj in mesh_objects:
        print(f"Processing: {obj.name}")
        
        # Classify the object
        category = classify_object(obj)
        
        # Get object properties
        bounds = get_object_bounds(obj)
        
        # Export the object
        success = export_object_as_glb(obj, base_path, category)
        
        if success:
            model_info = {
                'name': obj.name,
                'file': f"{clean_object_name(obj.name)}.glb",
                'category': category,
                'bounds': bounds,
                'materials': [mat.name for mat in obj.data.materials] if obj.data.materials else []
            }
            extracted_models[category].append(model_info)
    
    # Create manifest file
    manifest_path = os.path.join(base_path, "models", "forest_models.json")
    import json
    
    with open(manifest_path, 'w') as f:
        json.dump(extracted_models, f, indent=2)
    
    print(f"✅ Extraction complete! Manifest saved to: {manifest_path}")
    
    # Summary
    total_exported = sum(len(models) for models in extracted_models.values())
    print(f"\n📊 Summary:")
    for category, models in extracted_models.items():
        if models:
            print(f"  {category}: {len(models)} models")
    print(f"  Total: {total_exported} models exported")

if __name__ == "__main__":
    main()
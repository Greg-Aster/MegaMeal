#!/usr/bin/env python3
"""
Blender Model Extraction Script for MEGAMEAL
Analyzes the pine forest .blend file and extracts individual models
"""

import bpy
import os
import sys
import json

def clear_scene():
    """Clear the default scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def analyze_blend_file(blend_path):
    """Analyze the structure of the blend file"""
    print(f"🔍 Analyzing blend file: {blend_path}")
    
    # Open the blend file
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    # Get scene information
    scene_info = {
        "objects": [],
        "collections": [],
        "materials": [],
        "meshes": []
    }
    
    # Analyze objects
    for obj in bpy.data.objects:
        obj_info = {
            "name": obj.name,
            "type": obj.type,
            "location": list(obj.location),
            "rotation": list(obj.rotation_euler),
            "scale": list(obj.scale)
        }
        
        if obj.type == 'MESH':
            obj_info["vertex_count"] = len(obj.data.vertices)
            obj_info["polygon_count"] = len(obj.data.polygons)
            obj_info["materials"] = [mat.name for mat in obj.data.materials if mat]
        
        scene_info["objects"].append(obj_info)
    
    # Analyze collections
    for collection in bpy.data.collections:
        coll_info = {
            "name": collection.name,
            "objects": [obj.name for obj in collection.objects]
        }
        scene_info["collections"].append(coll_info)
    
    # Analyze materials
    for material in bpy.data.materials:
        mat_info = {
            "name": material.name,
            "use_nodes": material.use_nodes,
            "node_tree": None
        }
        
        if material.use_nodes and material.node_tree:
            nodes = []
            for node in material.node_tree.nodes:
                node_info = {
                    "type": node.type,
                    "name": node.name
                }
                if hasattr(node, 'image') and node.image:
                    node_info["image"] = node.image.name
                nodes.append(node_info)
            mat_info["node_tree"] = nodes
        
        scene_info["materials"].append(mat_info)
    
    # Analyze meshes
    for mesh in bpy.data.meshes:
        mesh_info = {
            "name": mesh.name,
            "vertex_count": len(mesh.vertices),
            "polygon_count": len(mesh.polygons),
            "materials": [mat.name for mat in mesh.materials if mat]
        }
        scene_info["meshes"].append(mesh_info)
    
    return scene_info

def categorize_object(obj_name, obj_type):
    """Categorize objects based on naming conventions"""
    name_lower = obj_name.lower()
    
    if any(keyword in name_lower for keyword in ['pine', 'fir', 'tree', 'trunk', 'branch']):
        return 'trees'
    elif any(keyword in name_lower for keyword in ['rock', 'stone', 'boulder', 'cliff']):
        return 'rocks'
    elif any(keyword in name_lower for keyword in ['grass', 'fern', 'bush', 'plant', 'vegetation']):
        return 'vegetation'
    elif any(keyword in name_lower for keyword in ['ruin', 'wall', 'structure', 'building']):
        return 'structures'
    elif any(keyword in name_lower for keyword in ['log', 'stump', 'mushroom', 'debris']):
        return 'decorative'
    else:
        return 'misc'

def extract_models(blend_path, output_dir):
    """Extract individual models from the blend file"""
    print(f"🚀 Extracting models from: {blend_path}")
    print(f"📁 Output directory: {output_dir}")
    
    # Open the blend file
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    # Create output directories
    categories = ['trees', 'rocks', 'vegetation', 'structures', 'decorative', 'misc']
    for category in categories:
        category_dir = os.path.join(output_dir, category)
        os.makedirs(category_dir, exist_ok=True)
    
    # Track extracted models
    extracted_models = {
        "models": {}
    }
    
    # Extract each mesh object
    mesh_objects = [obj for obj in bpy.data.objects if obj.type == 'MESH']
    
    for obj in mesh_objects:
        # Skip objects that are too simple (likely helper objects)
        if len(obj.data.vertices) < 10:
            continue
            
        print(f"🔄 Processing: {obj.name}")
        
        # Categorize the object
        category = categorize_object(obj.name, obj.type)
        
        # Clear selection and select only this object
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        
        # Clean the name for filename
        clean_name = "".join(c for c in obj.name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        clean_name = clean_name.replace(' ', '_').lower()
        
        # Export path
        export_path = os.path.join(output_dir, category, f"{clean_name}.glb")
        
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
            
            # Add to manifest
            if category not in extracted_models["models"]:
                extracted_models["models"][category] = {}
                
            extracted_models["models"][category][clean_name] = {
                "file": f"/assets/game/shared/models/{category}/{clean_name}.glb",
                "format": "glb",
                "scale": 1.0,
                "materials": [mat.name for mat in obj.data.materials if mat],
                "tags": [category],
                "description": f"Extracted from pine forest scene: {obj.name}",
                "vertex_count": len(obj.data.vertices),
                "polygon_count": len(obj.data.polygons)
            }
            
            print(f"✅ Exported: {clean_name}.glb to {category}/")
            
        except Exception as e:
            print(f"❌ Failed to export {obj.name}: {e}")
    
    return extracted_models

def main():
    # File paths
    project_root = "/home/greggles/Merkin/MEGAMEAL"
    blend_file = os.path.join(project_root, "public/assets/game/pine_forest/polyhaven_pine_fir_forest.blend")
    nature_blend_file = os.path.join(project_root, "public/assets/game/nature_pack/drive-download-20250708T221847Z-1-001/AllModels.blend")
    output_dir = os.path.join(project_root, "public/assets/game/shared/models")
    analysis_output = os.path.join(project_root, "src/game/tools/blend_analysis.json")
    library_manifest = os.path.join(output_dir, "library.json")
    
    # Ensure output directories exist
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.dirname(analysis_output), exist_ok=True)
    
    print("🎨 MEGAMEAL Model Extraction Tool")
    print("=" * 50)
    
    # Step 1: Analyze the blend file structure
    print("\n📊 Step 1: Analyzing blend file structure...")
    scene_info = analyze_blend_file(blend_file)
    
    # Save analysis
    with open(analysis_output, 'w') as f:
        json.dump(scene_info, f, indent=2)
    print(f"✅ Analysis saved to: {analysis_output}")
    
    # Print summary
    print(f"\n📈 Scene Summary:")
    print(f"  - Objects: {len(scene_info['objects'])}")
    print(f"  - Collections: {len(scene_info['collections'])}")
    print(f"  - Materials: {len(scene_info['materials'])}")
    print(f"  - Meshes: {len(scene_info['meshes'])}")
    
    mesh_objects = [obj for obj in scene_info['objects'] if obj['type'] == 'MESH']
    print(f"  - Mesh Objects: {len(mesh_objects)}")
    
    # Step 2: Extract models
    print("\n🔧 Step 2: Extracting individual models...")
    extracted_models = extract_models(blend_file, output_dir)
    
    # Save model library manifest
    with open(library_manifest, 'w') as f:
        json.dump(extracted_models, f, indent=2)
    print(f"✅ Model library manifest saved to: {library_manifest}")
    
    # Print extraction summary
    total_models = sum(len(models) for models in extracted_models["models"].values())
    print(f"\n🎯 Extraction Summary:")
    print(f"  - Total models extracted: {total_models}")
    for category, models in extracted_models["models"].items():
        if models:
            print(f"  - {category}: {len(models)} models")
    
    print(f"\n✅ Model extraction complete!")
    print(f"📁 Models saved to: {output_dir}")
    print(f"📋 Library manifest: {library_manifest}")

if __name__ == "__main__":
    main()
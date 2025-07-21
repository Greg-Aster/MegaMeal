import bpy
import bmesh
import mathutils
from mathutils import Vector
import math
import random

# Clear existing mesh objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

class ObservatoryIslandGenerator:
    """
    Recreates the Observatory island terrain from ObservatoryEnvironmentSystem.ts
    Matches the exact terrain generation algorithm from your legacy code
    """
    
    def __init__(self):
        # Terrain parameters from ObservatoryEnvironmentSystem.ts
        self.terrain_params = {
            'hill_height': 15,
            'hill_radius': 100, 
            'island_radius': 220,
            'edge_height': 8,
            'edge_falloff': 30,
            'waterfall_start': 210,  # island_radius - 10
            'base_ground_level': -5,
        }
        
        # Mesh resolution - adjust for detail level
        self.segments = 128  # Higher = more detail, lower = better performance
        self.total_size = 500  # Total terrain size (matches original)
        
    def create_island_terrain(self):
        """Create the main island terrain mesh"""
        print("🏔️ Creating Observatory Island Terrain...")
        
        # Create plane geometry
        bpy.ops.mesh.primitive_plane_add(size=self.total_size, location=(0, 0, 0))
        terrain_obj = bpy.context.active_object
        terrain_obj.name = "Observatory_Island_Terrain"
        
        # Enter edit mode and subdivide
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        
        # Subdivide to create segments (matches original 64x64 or higher)
        subdivisions = int(math.log2(self.segments)) - 1
        for i in range(subdivisions):
            bpy.ops.mesh.subdivide()
        
        # Get mesh data (FIXED for current Blender API)
        bm = bmesh.new()
        bm.from_mesh(terrain_obj.data)
        bm.faces.ensure_lookup_table()
        bm.verts.ensure_lookup_table()
        
        # Apply height algorithm from ObservatoryEnvironmentSystem.ts
        for vert in bm.verts:
            x, y = vert.co.x, vert.co.y  # Blender Y = Three.js Z
            height = self.calculate_terrain_height(x, y)
            vert.co.z = height
            
        # Update mesh
        bm.to_mesh(terrain_obj.data)
        bm.free()
        
        # Recalculate normals
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.normals_make_consistent(inside=False)
        bpy.ops.object.mode_set(mode='OBJECT')
        
        # Add subdivision surface for smooth terrain
        bpy.ops.object.modifier_add(type='SUBSURF')
        terrain_obj.modifiers["Subdivision Surface"].levels = 1
        
        print("✅ Island terrain mesh created")
        return terrain_obj
        
    def calculate_terrain_height(self, x, z):
        """
        EXACT recreation of the height calculation from ObservatoryEnvironmentSystem.ts
        This matches lines 440-466 of your original code
        """
        distance_from_center = math.sqrt(x * x + z * z)
        height = 0
        
        # Central hill (exact same calculation as original)
        if distance_from_center < self.terrain_params['hill_radius']:
            height_multiplier = math.cos(
                (distance_from_center / self.terrain_params['hill_radius']) * math.pi * 0.5
            )
            height = (
                self.terrain_params['base_ground_level'] + 
                self.terrain_params['hill_height'] * height_multiplier * height_multiplier
            )
        else:
            height = self.terrain_params['base_ground_level']
        
        # Void drop-off (exact same calculation as original)  
        if distance_from_center >= self.terrain_params['island_radius']:
            void_distance = distance_from_center - self.terrain_params['island_radius']
            height = self.terrain_params['base_ground_level'] - pow(void_distance * 0.1, 2)
            
        # Add surface noise (recreation of getSurfaceNoise function)
        height += self.get_surface_noise(x, z)
        
        return height
        
    def get_surface_noise(self, x, z):
        """
        Recreation of getSurfaceNoise from lines 518-577 of ObservatoryEnvironmentSystem.ts
        Uses the exact same octave parameters for authentic terrain detail
        """
        octaves = [
            {
                'freq': 0.08, 'amp': 0.25,
                'angle_x': math.pi / 7.3, 'angle_z': math.pi / 3.7,
                'phase_x': 2.1, 'phase_z': 5.8,
            },
            {
                'freq': 0.15, 'amp': 0.15,
                'angle_x': math.pi / 2.8, 'angle_z': math.pi / 5.2,
                'phase_x': 1.7, 'phase_z': 3.4,
            },
            {
                'freq': 0.32, 'amp': 0.08,
                'angle_x': math.pi / 4.1, 'angle_z': math.pi / 6.9,
                'phase_x': 4.2, 'phase_z': 1.9,
            },
            {
                'freq': 0.67, 'amp': 0.04,
                'angle_x': math.pi / 1.9, 'angle_z': math.pi / 8.3,
                'phase_x': 0.9, 'phase_z': 6.1,
            },
            {
                'freq': 1.23, 'amp': 0.02,
                'angle_x': math.pi / 3.4, 'angle_z': math.pi / 2.1,
                'phase_x': 3.8, 'phase_z': 2.7,
            },
        ]
        
        noise = 0
        for octave in octaves:
            # Rotate coordinates to break grid alignment (exact same as original)
            x1 = x * math.cos(octave['angle_x']) - z * math.sin(octave['angle_x'])
            z1 = x * math.sin(octave['angle_z']) + z * math.cos(octave['angle_z'])
            
            # Add phase offset and calculate noise (exact same as original)
            noise_value = (
                math.sin((x1 + octave['phase_x']) * octave['freq']) *
                math.cos((z1 + octave['phase_z']) * octave['freq'])
            )
            noise += noise_value * octave['amp']
            
        return noise
        
    def create_terrain_material(self):
        """Create realistic terrain material matching the original"""
        print("🎨 Creating terrain materials...")
        
        # Create material
        mat = bpy.data.materials.new(name="Observatory_Terrain")
        mat.use_nodes = True
        
        # Get the material node tree
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        
        # Clear default nodes
        nodes.clear()
        
        # Create nodes
        output = nodes.new(type='ShaderNodeOutputMaterial')
        principled = nodes.new(type='ShaderNodeBsdfPrincipled')
        
        # Create ColorRamp for terrain zones (grass center to sand edge)
        gradient = nodes.new(type='ShaderNodeValToRGB')
        gradient.color_ramp.elements[0].color = (0.24, 0.38, 0.09, 1)  # Grass center (#3d6017)
        gradient.color_ramp.elements[1].color = (0.76, 0.70, 0.50, 1)  # Sandy edge (#c2b280)
        
        # Add middle colors
        gradient.color_ramp.elements.new(0.4)
        gradient.color_ramp.elements[2].color = (0.18, 0.31, 0.09, 1)  # Medium green (#2d5016)
        gradient.color_ramp.elements.new(0.85)
        gradient.color_ramp.elements[3].color = (0.63, 0.56, 0.38, 1)  # Darker sand (#a19060)
        
        # Create texture coordinate and mapping for radial gradient
        tex_coord = nodes.new(type='ShaderNodeTexCoord')
        mapping = nodes.new(type='ShaderNodeMapping')
        
        # Create noise texture for surface detail
        noise = nodes.new(type='ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 50.0
        noise.inputs['Detail'].default_value = 8.0
        
        # Position nodes
        output.location = (400, 0)
        principled.location = (200, 0)
        gradient.location = (0, 0)
        tex_coord.location = (-400, 200)
        mapping.location = (-200, 200)
        noise.location = (-200, -200)
        
        # Link nodes
        links.new(tex_coord.outputs['Object'], mapping.inputs['Vector'])
        links.new(mapping.outputs['Vector'], gradient.inputs['Fac'])
        links.new(gradient.outputs['Color'], principled.inputs['Base Color'])
        links.new(noise.outputs['Color'], principled.inputs['Normal'])
        links.new(principled.outputs['BSDF'], output.inputs['Surface'])
        
        # Set material properties
        principled.inputs['Roughness'].default_value = 0.9
        principled.inputs['Specular'].default_value = 0.1
        
        return mat
        
    def add_spawn_point_marker(self):
        """Add a visual marker for the player spawn point"""
        print("🎯 Adding spawn point marker...")
        
        # Calculate spawn point (from calculateSpawnPoint function)
        spawn_x = 0
        spawn_z = 50
        spawn_y = self.calculate_terrain_height(spawn_x, spawn_z) + 1.6  # Add player height
        
        # Create spawn marker
        bpy.ops.mesh.primitive_cube_add(size=2, location=(spawn_x, spawn_z, spawn_y))
        spawn_marker = bpy.context.active_object
        spawn_marker.name = "Player_Spawn_Point"
        
        # Create bright material for visibility
        spawn_mat = bpy.data.materials.new(name="Spawn_Marker")
        spawn_mat.use_nodes = True
        
        # Access the Principled BSDF node properly
        principled_node = spawn_mat.node_tree.nodes["Principled BSDF"]
        principled_node.inputs['Base Color'].default_value = (1, 0, 0, 1)  # Red
        
        # For emission in newer Blender versions
        if 'Emission' in principled_node.inputs:
            principled_node.inputs['Emission'].default_value = (2, 0, 0, 1)
        elif 'Emission Strength' in principled_node.inputs:
            principled_node.inputs['Emission Strength'].default_value = 2.0
            
        spawn_marker.data.materials.append(spawn_mat)
        
        print(f"✅ Spawn point: [{spawn_x}, {spawn_y:.2f}, {spawn_z}]")
        
    def generate_complete_island(self):
        """Generate the complete observatory island"""
        print("🌍 Generating Complete Observatory Island...")
        print("=" * 50)
        
        # Create main terrain
        terrain = self.create_island_terrain()
        
        # Apply material
        material = self.create_terrain_material()
        terrain.data.materials.append(material)
        
        # Add spawn point marker
        self.add_spawn_point_marker()
        
        # Set up scene
        bpy.context.scene.cursor.location = (0, 0, 0)
        
        # Try to center view (may not work in all Blender versions)
        try:
            bpy.ops.view3d.view_all()
        except:
            pass
        
        print("=" * 50)
        print("✅ Observatory Island Generated Successfully!")
        print("")
        print("EXPORT INSTRUCTIONS:")
        print("1. Select the 'Observatory_Island_Terrain' object")
        print("2. File > Export > glTF 2.0 (.glb/.gltf)")
        print("3. Choose 'Selected Objects' in export options")
        print("4. Set Scale to 1.0")
        print("5. Enable 'Apply Modifiers'")
        print("6. Export as 'observatory-environment.glb'")
        print("")
        print("TERRAIN STATS:")
        print(f"- Island Radius: {self.terrain_params['island_radius']} units")
        print(f"- Hill Height: {self.terrain_params['hill_height']} units")
        print(f"- Base Level: {self.terrain_params['base_ground_level']} units")
        print(f"- Mesh Resolution: {self.segments}x{self.segments}")

# Create and run the generator
generator = ObservatoryIslandGenerator()
generator.generate_complete_island()
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
        self.segments = 64  # Reduced for better compatibility
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
        
        # Subdivide to create segments
        subdivisions = 6  # This will create 64x64 segments
        for i in range(subdivisions):
            bpy.ops.mesh.subdivide()
        
        # EXIT EDIT MODE BEFORE bmesh operations
        bpy.ops.object.mode_set(mode='OBJECT')
        
        # Get mesh data (FIXED - now in object mode)
        bm = bmesh.new()
        bm.from_mesh(terrain_obj.data)
        
        # Apply height algorithm from ObservatoryEnvironmentSystem.ts
        for vert in bm.verts:
            x, y = vert.co.x, vert.co.y  # Blender Y = Three.js Z
            height = self.calculate_terrain_height(x, y)
            vert.co.z = height
            
        # Update mesh
        bm.to_mesh(terrain_obj.data)
        bm.free()
        
        # Update the object
        terrain_obj.data.update()
        
        # Enter edit mode to recalculate normals
        bpy.context.view_layer.objects.active = terrain_obj
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.normals_make_consistent(inside=False)
        bpy.ops.object.mode_set(mode='OBJECT')
        
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
        
    def create_basic_material(self):
        """Create a simple but effective terrain material"""
        print("🎨 Creating terrain materials...")
        
        # Create material
        mat = bpy.data.materials.new(name="Observatory_Terrain")
        mat.use_nodes = True
        
        # Get the principled BSDF node
        principled = mat.node_tree.nodes["Principled BSDF"]
        
        # Set basic terrain colors (grass green)
        principled.inputs['Base Color'].default_value = (0.2, 0.4, 0.1, 1.0)  # Dark green
        principled.inputs['Roughness'].default_value = 0.9
        
        # Try to set specular (different names in different Blender versions)
        try:
            principled.inputs['Specular'].default_value = 0.1
        except:
            try:
                principled.inputs['Specular IOR Level'].default_value = 0.1
            except:
                pass
        
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
        
        # Access the Principled BSDF node
        principled_node = spawn_mat.node_tree.nodes["Principled BSDF"]
        principled_node.inputs['Base Color'].default_value = (1, 0, 0, 1)  # Red
        
        # Add emission for visibility (try different methods for compatibility)
        try:
            principled_node.inputs['Emission Color'].default_value = (2, 0, 0, 1)
            principled_node.inputs['Emission Strength'].default_value = 2.0
        except:
            try:
                principled_node.inputs['Emission'].default_value = (2, 0, 0, 1)
            except:
                pass
            
        spawn_marker.data.materials.append(spawn_mat)
        
        print(f"✅ Spawn point: [{spawn_x}, {spawn_y:.2f}, {spawn_z}]")
        
    def generate_complete_island(self):
        """Generate the complete observatory island"""
        print("🌍 Generating Complete Observatory Island...")
        print("=" * 50)
        
        # Create main terrain
        terrain = self.create_island_terrain()
        
        # Apply material
        material = self.create_basic_material()
        terrain.data.materials.append(material)
        
        # Add spawn point marker
        self.add_spawn_point_marker()
        
        # Set up scene
        bpy.context.scene.cursor.location = (0, 0, 0)
        
        # Try to center view (may not work in all contexts)
        try:
            # Select terrain for better view
            bpy.context.view_layer.objects.active = terrain
            terrain.select_set(True)
            bpy.ops.view3d.view_selected()
        except:
            pass
        
        print("=" * 50)
        print("✅ Observatory Island Generated Successfully!")
        print("")
        print("EXPORT INSTRUCTIONS:")
        print("1. Select the 'Observatory_Island_Terrain' object")
        print("2. File > Export > glTF 2.0 (.glb/.gltf)")
        print("3. In export dialog:")
        print("   - Set 'Include' to 'Selected Objects'")
        print("   - Set Transform > Scale to 1.0")
        print("   - Enable Geometry > Apply Modifiers")
        print("   - Enable Geometry > UVs and Normals")
        print("4. Save as 'observatory-environment.glb'")
        print("")
        print("TERRAIN STATS:")
        print(f"- Island Radius: {self.terrain_params['island_radius']} units")
        print(f"- Hill Height: {self.terrain_params['hill_height']} units")
        print(f"- Base Level: {self.terrain_params['base_ground_level']} units")
        print(f"- Mesh Resolution: {self.segments}x{self.segments}")
        print("")
        print("NEXT STEPS:")
        print("- You can now sculpt/modify the terrain in Blender")
        print("- Paint vertex colors for different terrain zones")
        print("- Add rocks, vegetation as separate objects")
        print("- Keep your existing ocean system in the game code!")

# Create and run the generator
generator = ObservatoryIslandGenerator()
generator.generate_complete_island()
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
    Enhanced Observatory island with proper texturing, circular shape, and sandy shores
    Recreates the visual quality from ObservatoryEnvironmentSystem.ts
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
        
        # Enhanced mesh resolution for better detail
        self.segments = 128  # Higher resolution for smooth curves
        self.total_size = 500  # Total terrain size (matches original)
        
    def create_island_terrain(self):
        """Create the main island terrain mesh with circular shape"""
        print("🏔️ Creating Enhanced Observatory Island Terrain...")
        
        # Create UV sphere and flatten it for better circular shape
        bpy.ops.mesh.primitive_uv_sphere_add(radius=self.total_size/2, location=(0, 0, 0))
        terrain_obj = bpy.context.active_object
        terrain_obj.name = "Observatory_Island_Terrain"
        
        # Enter edit mode and flatten the sphere
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        
        # Scale Z to flatten the sphere into a disc
        bpy.ops.transform.resize(value=(1, 1, 0.1))
        
        # Subdivide for more detail
        subdivisions = 4  # More conservative subdivisions
        for i in range(subdivisions):
            bpy.ops.mesh.subdivide()
        
        # EXIT EDIT MODE BEFORE bmesh operations
        bpy.ops.object.mode_set(mode='OBJECT')
        
        # Get mesh data
        bm = bmesh.new()
        bm.from_mesh(terrain_obj.data)
        
        # Apply height algorithm and create vertex colors for zones
        for vert in bm.verts:
            x, y = vert.co.x, vert.co.y  # Blender Y = Three.js Z
            height = self.calculate_terrain_height(x, y)
            vert.co.z = height
            
        # Update mesh
        bm.to_mesh(terrain_obj.data)
        bm.free()
        
        # Update the object
        terrain_obj.data.update()
        
        # Enter edit mode to recalculate normals and add vertex colors
        bpy.context.view_layer.objects.active = terrain_obj
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.normals_make_consistent(inside=False)
        
        # Add vertex colors for terrain zones
        self.add_vertex_colors(terrain_obj)
        
        bpy.ops.object.mode_set(mode='OBJECT')
        
        # Add subdivision surface for smooth terrain
        bpy.ops.object.modifier_add(type='SUBSURF')
        terrain_obj.modifiers["Subdivision Surface"].levels = 1
        terrain_obj.modifiers["Subdivision Surface"].render_levels = 2
        
        print("✅ Enhanced island terrain mesh created")
        return terrain_obj
        
    def add_vertex_colors(self, terrain_obj):
        """Add vertex colors to create grass center and sandy shores"""
        print("🎨 Adding vertex colors for terrain zones...")
        
        # Create vertex color attribute
        bpy.ops.geometry.color_attribute_add()
        
        # Get the mesh data
        mesh = terrain_obj.data
        color_layer = mesh.color_attributes.active_color
        
        # Apply colors based on distance from center
        bm = bmesh.new()
        bm.from_mesh(mesh)
        
        for i, vert in enumerate(bm.verts):
            x, y = vert.co.x, vert.co.y
            distance_from_center = math.sqrt(x * x + y * y)
            
            # Calculate color zones (matching original createTerrainTexture)
            if distance_from_center < 80:  # Grass center
                color = (0.24, 0.38, 0.09, 1)  # Grass green (#3d6017)
            elif distance_from_center < 140:  # Medium green
                color = (0.18, 0.31, 0.09, 1)  # Medium green (#2d5016)  
            elif distance_from_center < 180:  # Sandy beach
                color = (0.76, 0.70, 0.50, 1)  # Sandy color (#c2b280)
            elif distance_from_center < 200:  # Darker sand
                color = (0.63, 0.56, 0.38, 1)  # Darker sand (#a19060)
            else:  # Wet sand at edge
                color = (0.55, 0.45, 0.33, 1)  # Wet sand (#8b7355)
            
            # Set vertex color (loop through all face loops that use this vertex)
            for loop in vert.link_loops:
                color_layer.data[loop.index].color = color
        
        bm.free()
        
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
        
    def create_advanced_material(self):
        """Create advanced material with proper grass-to-sand gradient"""
        print("🎨 Creating advanced terrain materials...")
        
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
        
        # Create vertex color input
        vertex_color = nodes.new(type='ShaderNodeVertexColor')
        vertex_color.layer_name = "Col"  # Default vertex color layer name
        
        # Create noise texture for surface detail
        noise = nodes.new(type='ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 25.0
        noise.inputs['Detail'].default_value = 6.0
        noise.inputs['Roughness'].default_value = 0.7
        
        # Create texture coordinate
        tex_coord = nodes.new(type='ShaderNodeTexCoord')
        
        # Create mix node to blend vertex colors with noise
        try:
            # Blender 3.4+
            mix_color = nodes.new(type='ShaderNodeMix')
            mix_color.data_type = 'RGBA'
            mix_color.inputs['Fac'].default_value = 0.2  # Subtle noise overlay
        except:
            # Older Blender versions
            mix_color = nodes.new(type='ShaderNodeMixRGB')
            mix_color.inputs['Fac'].default_value = 0.2
        
        # Create bump node for surface detail
        bump = nodes.new(type='ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.3
        
        # Position nodes
        output.location = (600, 0)
        principled.location = (400, 0)
        mix_color.location = (200, 100)
        vertex_color.location = (0, 200)
        noise.location = (0, -100)
        tex_coord.location = (-200, -100)
        bump.location = (200, -200)
        
        # Link nodes
        links.new(tex_coord.outputs['Generated'], noise.inputs['Vector'])
        links.new(vertex_color.outputs['Color'], mix_color.inputs['Color1'])
        links.new(noise.outputs['Color'], mix_color.inputs['Color2'])
        links.new(mix_color.outputs['Color'], principled.inputs['Base Color'])
        links.new(noise.outputs['Fac'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], principled.inputs['Normal'])
        links.new(principled.outputs['BSDF'], output.inputs['Surface'])
        
        # Set material properties
        principled.inputs['Roughness'].default_value = 0.8
        
        # Try to set specular (different names in different Blender versions)
        try:
            principled.inputs['Specular'].default_value = 0.3
        except:
            try:
                principled.inputs['Specular IOR Level'].default_value = 0.3
            except:
                pass
        
        return mat
        
    def add_rocks_and_details(self):
        """Add procedural rocks for natural detail"""
        print("🪨 Adding procedural rocks and details...")
        
        # Create rocks scattered around the island
        for i in range(15):
            # Random position on the island
            angle = random.random() * 2 * math.pi
            radius = 50 + random.random() * 150  # Between hill and edge
            x = math.cos(angle) * radius
            y = math.sin(angle) * radius
            z = self.calculate_terrain_height(x, y) + 0.5
            
            # Create rock
            bpy.ops.mesh.primitive_ico_sphere_add(
                subdivisions=1, 
                radius=1 + random.random() * 2,
                location=(x, y, z)
            )
            rock = bpy.context.active_object
            rock.name = f"Rock_{i}"
            
            # Deform rock for natural shape
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.transform.resize(
                value=(
                    0.7 + random.random() * 0.6,
                    0.7 + random.random() * 0.6,
                    0.5 + random.random() * 0.3
                )
            )
            bpy.ops.object.mode_set(mode='OBJECT')
            
            # Random rotation
            rock.rotation_euler = (
                random.random() * 0.5,
                random.random() * 0.5,
                random.random() * 2 * math.pi
            )
            
            # Create rock material
            rock_mat = bpy.data.materials.new(name=f"Rock_Material_{i}")
            rock_mat.use_nodes = True
            principled = rock_mat.node_tree.nodes["Principled BSDF"]
            
            # Random rock color (brownish)
            hue = 0.1 + random.random() * 0.1
            sat = 0.2 + random.random() * 0.3
            val = 0.3 + random.random() * 0.4
            color = mathutils.Color()
            color.hsv = (hue, sat, val)
            principled.inputs['Base Color'].default_value = (*color, 1.0)
            principled.inputs['Roughness'].default_value = 0.9
            
            rock.data.materials.append(rock_mat)
        
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
        
        # Add emission for visibility
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
        """Generate the complete enhanced observatory island"""
        print("🌍 Generating Enhanced Observatory Island...")
        print("=" * 50)
        
        # Create main terrain with circular shape
        terrain = self.create_island_terrain()
        
        # Apply advanced material with vertex colors
        material = self.create_advanced_material()
        terrain.data.materials.append(material)
        
        # Add natural details
        self.add_rocks_and_details()
        
        # Add spawn point marker
        self.add_spawn_point_marker()
        
        # Set up scene
        bpy.context.scene.cursor.location = (0, 0, 0)
        
        # Try to center view
        try:
            bpy.context.view_layer.objects.active = terrain
            terrain.select_set(True)
            bpy.ops.view3d.view_selected()
        except:
            pass
        
        print("=" * 50)
        print("✅ Enhanced Observatory Island Generated Successfully!")
        print("")
        print("FEATURES ADDED:")
        print("✅ Circular island shape (not square)")
        print("✅ Grass center to sandy shore gradient") 
        print("✅ Surface noise and bumps for realism")
        print("✅ Procedural rocks for natural detail")
        print("✅ Smooth subdivision surface")
        print("✅ Vertex colors for terrain zones")
        print("")
        print("EXPORT INSTRUCTIONS:")
        print("1. Select ALL objects (terrain + rocks + spawn marker)")
        print("2. File > Export > glTF 2.0 (.glb/.gltf)")
        print("3. In export dialog:")
        print("   - Set 'Include' to 'Selected Objects'")
        print("   - Set Transform > Scale to 1.0")
        print("   - Enable Geometry > Apply Modifiers")
        print("   - Enable Geometry > Vertex Colors")
        print("   - Enable Geometry > UVs and Normals")
        print("4. Save as 'observatory-environment.glb'")
        print("")
        print("The result will be a beautiful circular island with:")
        print("🌱 Green grass center → 🏖️ Sandy beaches → 🌊 Ocean edge")

# Create and run the generator
generator = ObservatoryIslandGenerator()
generator.generate_complete_island()
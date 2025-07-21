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
    Enhanced Observatory island - simplified version that works reliably
    Creates circular island with proper materials and details
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
        self.segments = 64  # Good balance of detail and performance
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
        bpy.ops.transform.resize(value=(1, 1, 0.05))
        
        # Subdivide for more detail
        subdivisions = 3  # More conservative subdivisions
        for i in range(subdivisions):
            bpy.ops.mesh.subdivide()
        
        # EXIT EDIT MODE BEFORE bmesh operations
        bpy.ops.object.mode_set(mode='OBJECT')
        
        # Get mesh data
        bm = bmesh.new()
        bm.from_mesh(terrain_obj.data)
        
        # Apply height algorithm
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
        
        # Add subdivision surface for smooth terrain
        bpy.ops.object.modifier_add(type='SUBSURF')
        # Get the modifier (name varies by Blender version)
        subsurf_modifier = terrain_obj.modifiers[-1]  # Get the last added modifier
        subsurf_modifier.levels = 1
        subsurf_modifier.render_levels = 2
        
        print("✅ Enhanced island terrain mesh created")
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
        
    def create_grass_to_sand_material(self):
        """Create material with grass center to sandy shore gradient using procedural textures"""
        print("🎨 Creating grass-to-sand gradient material...")
        
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
        
        # Create gradient texture based on distance from center
        tex_coord = nodes.new(type='ShaderNodeTexCoord')
        mapping = nodes.new(type='ShaderNodeMapping')
        gradient = nodes.new(type='ShaderNodeTexGradient')
        gradient.gradient_type = 'RADIAL'
        
        # Create color ramp for terrain zones (grass center to sand edge)
        color_ramp = nodes.new(type='ShaderNodeValToRGB')
        
        # Set up gradient colors (matching original createTerrainTexture)
        color_ramp.color_ramp.elements[0].position = 0.0
        color_ramp.color_ramp.elements[0].color = (0.24, 0.38, 0.09, 1)  # Grass center (#3d6017)
        
        color_ramp.color_ramp.elements[1].position = 1.0
        color_ramp.color_ramp.elements[1].color = (0.55, 0.45, 0.33, 1)  # Wet sand edge (#8b7355)
        
        # Add intermediate colors
        elem1 = color_ramp.color_ramp.elements.new(0.4)
        elem1.color = (0.18, 0.31, 0.09, 1)  # Medium green (#2d5016)
        
        elem2 = color_ramp.color_ramp.elements.new(0.7)
        elem2.color = (0.76, 0.70, 0.50, 1)  # Sandy beach (#c2b280)
        
        elem3 = color_ramp.color_ramp.elements.new(0.85)
        elem3.color = (0.63, 0.56, 0.38, 1)  # Darker sand (#a19060)
        
        # Create noise texture for surface detail
        noise = nodes.new(type='ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 15.0
        noise.inputs['Detail'].default_value = 8.0
        noise.inputs['Roughness'].default_value = 0.6
        
        # Create bump map for surface texture
        bump = nodes.new(type='ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.2
        
        # Position nodes
        output.location = (800, 0)
        principled.location = (600, 0)
        color_ramp.location = (400, 100)
        gradient.location = (200, 100)
        mapping.location = (0, 100)
        tex_coord.location = (-200, 100)
        noise.location = (200, -100)
        bump.location = (400, -200)
        
        # Link nodes
        links.new(tex_coord.outputs['Object'], mapping.inputs['Vector'])
        links.new(mapping.outputs['Vector'], gradient.inputs['Vector'])
        links.new(gradient.outputs['Fac'], color_ramp.inputs['Fac'])
        links.new(color_ramp.outputs['Color'], principled.inputs['Base Color'])
        
        # Add surface detail
        links.new(tex_coord.outputs['Object'], noise.inputs['Vector'])
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
        
        # Scale the gradient to match island size
        mapping.inputs['Scale'].default_value = (0.004, 0.004, 1)  # Scale down to fit island
        
        return mat
        
    def add_rocks_and_details(self):
        """Add procedural rocks for natural detail"""
        print("🪨 Adding procedural rocks and details...")
        
        # Create rocks scattered around the island
        for i in range(12):
            # Random position on the island
            angle = random.random() * 2 * math.pi
            radius = 50 + random.random() * 140  # Between hill and edge
            x = math.cos(angle) * radius
            y = math.sin(angle) * radius
            z = self.calculate_terrain_height(x, y) + 0.3
            
            # Create rock
            bpy.ops.mesh.primitive_ico_sphere_add(
                subdivisions=1, 
                radius=0.8 + random.random() * 1.5,
                location=(x, y, z)
            )
            rock = bpy.context.active_object
            rock.name = f"Rock_{i}"
            
            # Deform rock for natural shape
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.transform.resize(
                value=(
                    0.8 + random.random() * 0.4,
                    0.8 + random.random() * 0.4,
                    0.6 + random.random() * 0.3
                )
            )
            bpy.ops.object.mode_set(mode='OBJECT')
            
            # Random rotation
            rock.rotation_euler = (
                random.random() * 0.4,
                random.random() * 0.4,
                random.random() * 2 * math.pi
            )
            
            # Create rock material
            rock_mat = bpy.data.materials.new(name=f"Rock_Material_{i}")
            rock_mat.use_nodes = True
            principled = rock_mat.node_tree.nodes["Principled BSDF"]
            
            # Random rock color (brownish)
            hue = 0.08 + random.random() * 0.08
            sat = 0.3 + random.random() * 0.4
            val = 0.25 + random.random() * 0.35
            color = mathutils.Color()
            color.hsv = (hue, sat, val)
            principled.inputs['Base Color'].default_value = (*color, 1.0)
            principled.inputs['Roughness'].default_value = 0.95
            
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
        
        # Apply grass-to-sand gradient material
        material = self.create_grass_to_sand_material()
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
        print("FEATURES:")
        print("🔵 Circular island shape (not square)")
        print("🌱 Grass center → 🏖️ Sandy shore gradient") 
        print("🌊 Surface noise and bumps for realism")
        print("🪨 Natural rocks scattered around")
        print("✨ Smooth subdivision surface")
        print("🎨 Procedural grass-to-sand material")
        print("")
        print("EXPORT INSTRUCTIONS:")
        print("1. Select ALL objects (A key to select all)")
        print("2. File > Export > glTF 2.0 (.glb/.gltf)")
        print("3. In export dialog:")
        print("   - Set 'Include' to 'Selected Objects'")
        print("   - Set Transform > Scale to 1.0")
        print("   - Enable Geometry > Apply Modifiers")
        print("   - Enable Geometry > UVs and Normals")
        print("   - Enable Materials > Export Materials")
        print("4. Save as 'observatory-environment.glb'")
        print("")
        print("🎉 You now have a beautiful circular island that matches")
        print("   your original procedural terrain with proper texturing!")

# Create and run the generator
generator = ObservatoryIslandGenerator()
generator.generate_complete_island()
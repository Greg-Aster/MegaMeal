<!--
  Isolated GLTF Test Component
  Tests if the GLTF loader works with known-good models
-->
<script lang="ts">
import { Canvas, T } from '@threlte/core'
import { GLTF } from '@threlte/extras'

let testResults = {
  officialModel: 'Not tested',
  yourModel: 'Not tested'
}

function onOfficialModelLoad(event: any) {
  console.log('✅ Official test model loaded successfully:', event.detail)
  testResults.officialModel = 'Success'
}

function onOfficialModelError(event: any) {
  console.error('❌ Official test model failed:', event.detail)
  testResults.officialModel = 'Failed'
}

function onYourModelLoad(event: any) {
  console.log('✅ Your observatory model loaded successfully:', event.detail)
  testResults.yourModel = 'Success'
}

function onYourModelError(event: any) {
  console.error('❌ Your observatory model failed:', event.detail)
  testResults.yourModel = 'Failed'
}
</script>

<div class="test-container">
  <h2>GLTF Loader Test</h2>
  
  <div class="test-results">
    <p>Official Test Model: <span class="status">{testResults.officialModel}</span></p>
    <p>Your Observatory Model: <span class="status">{testResults.yourModel}</span></p>
  </div>

  <div class="canvas-container">
    <Canvas>
      <!-- Test 1: Known-good official model -->
      <GLTF 
        url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb"
        on:load={onOfficialModelLoad}
        on:error={onOfficialModelError}
      />
      
      <!-- Test 2: Your observatory model -->
      <GLTF 
        url="/models/levels/observatory-environment.glb"
        on:load={onYourModelLoad}
        on:error={onYourModelError}
      />
      
      <!-- Basic lighting -->
      <T.DirectionalLight position={[10, 10, 5]} />
      <T.AmbientLight intensity={0.4} />
      
      <!-- Camera positioned to see both models -->
      <T.PerspectiveCamera position={[0, 0, 5]} fov={75} />
    </Canvas>
  </div>
</div>

<style>
.test-container {
  padding: 20px;
  background: #1a1a1a;
  color: white;
  font-family: monospace;
}

.test-results {
  margin: 20px 0;
  padding: 10px;
  background: #2a2a2a;
  border-radius: 5px;
}

.status {
  font-weight: bold;
  color: #00ff00;
}

.canvas-container {
  width: 400px;
  height: 300px;
  border: 1px solid #444;
  background: #000;
}
</style>
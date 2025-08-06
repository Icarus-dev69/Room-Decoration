import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { ARPerspectiveCamera } from 'three.ar.js'
import Renderer from './components/Renderer' // your previously refactored renderer

export default function App() {
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const animationId = useRef(null)

  useEffect(() => {
    let isMounted = true

    async function setup() {
      const renderer = createRenderer()
      const ready = await renderer.initRenderer()
      if (!ready || !isMounted) return

      rendererRef.current = renderer

      // Scene
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // AR Perspective Camera
      const vrDisplay = renderer.vrDisplay
      const camera = new ARPerspectiveCamera(
        vrDisplay,
        60,
        window.innerWidth / window.innerHeight,
        vrDisplay.depthNear,
        vrDisplay.depthFar
      )
      camera.position.set(0, 1.6, 0)
      cameraRef.current = camera

      // Add sample box
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
      const material = new THREE.MeshNormalMaterial()
      const box = new THREE.Mesh(geometry, material)
      box.position.set(0, 0, -1)
      scene.add(box)

      // Start AR render loop
      function animate() {
        if (!isMounted) return
        renderer.update(scene, camera, animate)
      }

      animate()
    }

    setup()

    return () => {
      isMounted = false
      if (animationId.current) {
        cancelAnimationFrame(animationId.current)
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [])

  return null // Canvas is appended to <body> directly by renderer.js
}

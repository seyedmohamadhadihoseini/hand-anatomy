import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const UP_VECTOR = new THREE.Vector3(0, 1, 0);

const createXrayShaderMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRimColor: { value: new THREE.Color('#38bdf8') },
      uCoreColor: { value: new THREE.Color('#041326') },
      uFresnelPower: { value: 2.1 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uRimColor;
      uniform vec3 uCoreColor;
      uniform float uFresnelPower;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - abs(dot(normal, viewDir)), uFresnelPower);
        float scanline = 0.9 + 0.1 * sin(vWorldPosition.x * 35.0 - uTime * 3.0);
        vec3 finalColor = mix(uCoreColor, uRimColor * 1.4, fresnel) * scanline;
        float alpha = clamp(fresnel * 0.92 + 0.08, 0.08, 0.95);
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

export default function HandModel({
  renderMode,
  points,
  activePointId,
  onSelectPoint,
  onSurfaceSnap,
  calibrateMode,
  showLabels,
  showNeedle,
  onModelReady,
}) {
  const { scene } = useGLTF('/hand.glb');
  const modelGroupRef = useRef();
  const pulseRingsRef = useRef([]);
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const [hoverHit, setHoverHit] = useState(null);
  const xrayMatRef = useRef(null);

  useEffect(() => {
    if (!scene || !modelGroupRef.current) return;

    scene.position.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);

    const rawBox = new THREE.Box3().setFromObject(scene);
    const rawCenter = new THREE.Vector3();
    const rawSize = new THREE.Vector3();
    rawBox.getCenter(rawCenter);
    rawBox.getSize(rawSize);

    const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
    const targetScale = 2.4 / maxDim;

    scene.scale.setScalar(targetScale);
    scene.position.copy(rawCenter).multiplyScalar(-targetScale);
    scene.updateMatrixWorld(true);

    const finalBox = new THREE.Box3().setFromObject(scene);
    const finalSize = new THREE.Vector3();
    finalBox.getSize(finalSize);

    const meshes = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        meshes.push(child);
      }
    });

    if (onModelReady) {
      onModelReady({
        box: finalBox,
        size: finalSize,
        meshes,
      });
    }
  }, [scene, onModelReady]);

  useEffect(() => {
    if (!scene) return;

    if (!xrayMatRef.current) {
      xrayMatRef.current = createXrayShaderMaterial();
    }

    scene.traverse((child) => {
      if (!child.isMesh) return;

      if (!child.userData.origNormalMap && child.material?.normalMap) {
        child.userData.origNormalMap = child.material.normalMap;
      }

      if (renderMode === 'xray') {
        child.material = xrayMatRef.current;
      } else if (renderMode === 'wireframe') {
        child.material = new THREE.MeshBasicMaterial({
          color: '#38bdf8',
          wireframe: true,
          transparent: true,
          opacity: 0.25,
          depthWrite: false,
        });
      } else if (renderMode === 'sculpt') {
        child.material = new THREE.MeshStandardMaterial({
          color: '#cbd5e1',
          roughness: 0.5,
          metalness: 0.08,
          normalMap: child.userData.origNormalMap || null,
        });
      } else {
        child.material = new THREE.MeshPhysicalMaterial({
          color: '#eab69f',
          roughness: 0.42,
          metalness: 0.02,
          clearcoat: 0.12,
          clearcoatRoughness: 0.4,
          sheen: 0.45,
          sheenColor: new THREE.Color('#ff8a65'),
          sheenRoughness: 0.5,
          normalMap: child.userData.origNormalMap || null,
        });
      }
    });
  }, [scene, renderMode]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (xrayMatRef.current) {
      xrayMatRef.current.uniforms.uTime.value = t;
    }

    pulseRingsRef.current.forEach((ring, idx) => {
      if (!ring) return;
      const phase = (t * 1.4 + idx * 0.35) % 1;
      const scale = 1 + phase * 2.1;
      ring.scale.set(scale, scale, 1);
      if (ring.material) {
        ring.material.opacity = (1 - phase) * 0.85;
      }
    });
  });

  const computeSurfaceData = (e) => {
    if (!e.point) return null;
    const normal = e.face
      ? e.face.normal.clone().transformDirection(e.object.matrixWorld).normalize()
      : new THREE.Vector3(0, 1, 0);

    const snappedPoint = e.point.clone().add(normal.clone().multiplyScalar(0.01));
    const idealCameraPos = snappedPoint
      .clone()
      .add(normal.clone().multiplyScalar(0.85));

    return {
      coords: [
        Number(snappedPoint.x.toFixed(4)),
        Number(snappedPoint.y.toFixed(4)),
        Number(snappedPoint.z.toFixed(4)),
      ],
      normal: [
        Number(normal.x.toFixed(4)),
        Number(normal.y.toFixed(4)),
        Number(normal.z.toFixed(4)),
      ],
      camCoords: [
        Number(idealCameraPos.x.toFixed(4)),
        Number(idealCameraPos.y.toFixed(4)),
        Number(idealCameraPos.z.toFixed(4)),
      ],
    };
  };

  const hoverQuaternion = useMemo(() => {
    if (!hoverHit) return new THREE.Quaternion();
    const normVec = new THREE.Vector3(...hoverHit.normal).normalize();
    return new THREE.Quaternion().setFromUnitVectors(UP_VECTOR, normVec);
  }, [hoverHit]);

  return (
    <group ref={modelGroupRef} position={[0, 0, 0]}>
      <primitive
        object={scene}
        onPointerMove={(e) => {
          if (!calibrateMode) {
            if (hoverHit) setHoverHit(null);
            return;
          }
          e.stopPropagation();
          const hit = computeSurfaceData(e);
          if (hit) setHoverHit(hit);
        }}
        onPointerOut={() => {
          if (hoverHit) setHoverHit(null);
        }}
        onPointerDown={(e) => {
          pointerDownPos.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          if (!calibrateMode) return;
          const dx = Math.abs(e.clientX - pointerDownPos.current.x);
          const dy = Math.abs(e.clientY - pointerDownPos.current.y);
          if (dx > 5 || dy > 5) return;

          e.stopPropagation();
          const hit = computeSurfaceData(e);
          if (hit) {
            onSurfaceSnap(hit.coords, hit.normal, hit.camCoords);
          }
        }}
      />

      {calibrateMode && hoverHit && (
        <group position={hoverHit.coords} quaternion={hoverQuaternion}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.02, 0.03, 32]} />
            <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.002, 0.002, 0.1, 12]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}

      {points.map((point, index) => {
        const isSelected = activePointId === point.id;
        const normArray = point.normal || [0, 1, 0];
        const normVec = new THREE.Vector3(...normArray).normalize();
        const alignQuat = new THREE.Quaternion().setFromUnitVectors(UP_VECTOR, normVec);

        return (
          <group key={point.id} position={point.position} quaternion={alignQuat}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.02, 0.026, 32]} />
              <meshBasicMaterial
                color={isSelected ? '#f43f5e' : '#38bdf8'}
                side={THREE.DoubleSide}
                transparent
                opacity={0.95}
              />
            </mesh>

            <mesh
              ref={(el) => (pulseRingsRef.current[index] = el)}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.022, 0.03, 32]} />
              <meshBasicMaterial
                color={isSelected ? '#f43f5e' : '#38bdf8'}
                side={THREE.DoubleSide}
                transparent
                opacity={0.75}
                depthWrite={false}
              />
            </mesh>

            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelectPoint(point);
              }}
            >
              <sphereGeometry args={[isSelected ? 0.017 : 0.013, 24, 24]} />
              <meshStandardMaterial
                color={isSelected ? '#fb7185' : '#38bdf8'}
                emissive={isSelected ? '#e11d48' : '#0284c7'}
                emissiveIntensity={isSelected ? 3.2 : 2.0}
                roughness={0.2}
              />
            </mesh>

            {isSelected && showNeedle && (
              <group>
                <mesh position={[0, 0.08, 0]}>
                  <cylinderGeometry args={[0.002, 0.0006, 0.16, 16]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
                </mesh>
                <mesh position={[0, 0.19, 0]}>
                  <cylinderGeometry args={[0.005, 0.004, 0.06, 16]} />
                  <meshStandardMaterial
                    color="#f59e0b"
                    emissive="#d97706"
                    emissiveIntensity={0.4}
                    metalness={0.8}
                    roughness={0.25}
                  />
                </mesh>
              </group>
            )}

            {showLabels && (
              <Html center distanceFactor={2.1} zIndexRange={[10, 0]}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPoint(point);
                  }}
                  className={`acupoint-label-3d ${isSelected ? 'selected' : ''}`}
                >
                  <span>{point.code}</span>
                  <span style={{ opacity: 0.85, fontWeight: 400 }}>| {point.shortName || point.name}</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

useGLTF.preload('/hand.glb');
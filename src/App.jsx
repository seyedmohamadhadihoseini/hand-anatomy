import React, { Suspense, useState, useRef, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import HandModel from './HandModel';

const STORAGE_KEY = 'acu_enterprise_points_v4';
const CUSTOM_VIEW_KEY = 'acu_custom_overview_v1';

const DEFAULT_POINTS = [
  {
    id: 'LI4',
    code: 'LI4',
    shortName: 'Hegu',
    name: 'Hegu (LI4)',
    side: 'dorsal',
    uvHint: [0.44, 0.28],
    meridian: 'Large Intestine Meridian',
    depth: '0.5 – 1.0 Cun',
    angle: 'Perpendicular (90°)',
    anatomical: 'On the dorsum of the hand, between the 1st and 2nd metacarpal bones, approximately at the midpoint of the 2nd metacarpal bone on the radial side.',
    indication: 'Relieves headache, migraine, toothache, facial pain, sinus congestion; reinforces immunity and reduces inflammation.',
    position: [-0.15, 0.12, -0.22],
    normal: [0, 1, 0],
    calibrated: false,
  },
  {
    id: 'PC8',
    code: 'PC8',
    shortName: 'Laogong',
    name: 'Laogong (PC8)',
    side: 'palmar',
    uvHint: [0.48, 0.52],
    meridian: 'Pericardium Meridian',
    depth: '0.3 – 0.5 Cun',
    angle: 'Perpendicular (90°)',
    anatomical: 'In the center of the palm, between the 2nd and 3rd metacarpal bones, proximal to the metacarpophalangeal joint (where the tip of the middle finger touches when making a fist).',
    indication: 'Alleviates severe anxiety and emotional distress, soothes palpitations, mitigates insomnia, and clears internal heat.',
    position: [-0.05, -0.12, 0.02],
    normal: [0, -1, 0],
    calibrated: false,
  },
  {
    id: 'SI3',
    code: 'SI3',
    shortName: 'Houxi',
    name: 'Houxi (SI3)',
    side: 'dorsal',
    uvHint: [0.52, 0.85],
    meridian: 'Small Intestine Meridian',
    depth: '0.5 – 0.8 Cun',
    angle: 'Perpendicular to ulnar border',
    anatomical: 'On the ulnar border of the hand, in the depression proximal to the 5th metacarpophalangeal joint, at the junction of the red and white skin.',
    indication: 'Treats neck rigidity, occipital headaches, acute lumbar sprain, tinnitus, night sweats, and upper back spasms.',
    position: [0.05, 0.08, 0.35],
    normal: [0, 0.6, 0.8],
    calibrated: false,
  },
  {
    id: 'TE5',
    code: 'TE5',
    shortName: 'Waiguan',
    name: 'Waiguan (TE5)',
    side: 'dorsal',
    uvHint: [0.18, 0.52],
    meridian: 'Triple Energizer Meridian',
    depth: '0.5 – 1.0 Cun',
    angle: 'Perpendicular to posterior forearm',
    anatomical: 'On the dorsal aspect of the forearm, 2 Cun superior to the dorsal wrist crease, between the radius and ulna.',
    indication: 'Relieves wrist pain, hand tremors, temporal headaches, febrile conditions, and upper limb rheumatic pain.',
    position: [-0.65, 0.14, 0.02],
    normal: [0, 1, 0],
    calibrated: false,
  },
  {
    id: 'LU10',
    code: 'LU10',
    shortName: 'Yuji',
    name: 'Yuji (LU10)',
    side: 'palmar',
    uvHint: [0.36, 0.22],
    meridian: 'Lung Meridian',
    depth: '0.5 – 0.8 Cun',
    angle: 'Perpendicular to thenar eminence',
    anatomical: 'On the thenar eminence of the hand, near the midpoint of the first metacarpal bone, at the border of the red and white skin.',
    indication: 'Soothes sore throat, cough, hoarseness, asthma symptoms, and clears excess lung heat.',
    position: [-0.28, -0.1, -0.25],
    normal: [0, -1, 0],
    calibrated: false,
  },
];

export default function App() {
  const cameraControlRef = useRef();

  const [renderMode, setRenderMode] = useState('skin');
  const [activePointId, setActivePointId] = useState('LI4');
  const [calibrateMode, setCalibrateMode] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showNeedle, setShowNeedle] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 860);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId;

    const updateFps = (now) => {
      frameCount++;
      if (now - lastTime >= 600) {
        setFps(Math.min(60, Math.round((frameCount * 1000) / (now - lastTime))));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(updateFps);
    };
    animId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  const [pointsData, setPointsData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_POINTS;
  });

  const selectedPoint = useMemo(
    () => pointsData.find((p) => p.id === activePointId) || pointsData[0],
    [pointsData, activePointId]
  );

  const filteredPoints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pointsData;
    return pointsData.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.indication.toLowerCase().includes(q) ||
        p.meridian.toLowerCase().includes(q)
    );
  }, [pointsData, searchQuery]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const setCameraPreset = (preset) => {
    if (!cameraControlRef.current) return;

    if (preset === 'dorsal') {
      cameraControlRef.current.setLookAt(0, 2.15, 0.01, 0, 0, 0, true);
    } else if (preset === 'palmar') {
      cameraControlRef.current.setLookAt(0, -2.15, 0.01, 0, 0, 0, true);
    } else {
      const savedView = localStorage.getItem(CUSTOM_VIEW_KEY);
      if (savedView) {
        try {
          const { pos, target } = JSON.parse(savedView);
          cameraControlRef.current.setLookAt(
            pos[0], pos[1], pos[2],
            target[0], target[1], target[2],
            true
          );
          return;
        } catch (e) {}
      }
      cameraControlRef.current.setLookAt(0.15, 1.55, 1.65, 0, 0, 0, true);
    }
  };

  const handleSaveCurrentView = () => {
    if (!cameraControlRef.current) return;
    const pos = new THREE.Vector3();
    const target = new THREE.Vector3();
    cameraControlRef.current.getPosition(pos);
    cameraControlRef.current.getTarget(target);

    localStorage.setItem(
      CUSTOM_VIEW_KEY,
      JSON.stringify({
        pos: [Number(pos.x.toFixed(3)), Number(pos.y.toFixed(3)), Number(pos.z.toFixed(3))],
        target: [Number(target.x.toFixed(3)), Number(target.y.toFixed(3)), Number(target.z.toFixed(3))],
      })
    );
    showToast('Current camera angle saved as default overview!');
  };

  const handleModelReady = ({ box, meshes }) => {
    setCameraPreset('overview');

    if (!meshes || meshes.length === 0) return;
    const raycaster = new THREE.Raycaster();
    const normalMatrix = new THREE.Matrix3();

    setPointsData((prev) => {
      let updatedAny = false;
      const updated = prev.map((pt) => {
        if (pt.calibrated) return pt;

        const [u, v] = pt.uvHint || [0.5, 0.5];
        const x = THREE.MathUtils.lerp(box.min.x, box.max.x, u);
        const z = THREE.MathUtils.lerp(box.min.z, box.max.z, v);

        const isPalmar = pt.side === 'palmar';
        const rayOrigin = new THREE.Vector3(x, isPalmar ? -3.0 : 3.0, z);
        const rayDir = new THREE.Vector3(0, isPalmar ? 1 : -1, 0);

        raycaster.set(rayOrigin, rayDir);
        const hits = raycaster.intersectObjects(meshes, true);

        if (hits.length > 0) {
          updatedAny = true;
          const hit = hits[0];
          const worldNormal = hit.face
            ? hit.face.normal.clone().applyMatrix3(normalMatrix.getNormalMatrix(hit.object.matrixWorld)).normalize()
            : rayDir.clone().negate();

          const snapped = hit.point.clone().add(worldNormal.clone().multiplyScalar(0.01));
          return {
            ...pt,
            position: [
              Number(snapped.x.toFixed(4)),
              Number(snapped.y.toFixed(4)),
              Number(snapped.z.toFixed(4)),
            ],
            normal: [
              Number(worldNormal.x.toFixed(4)),
              Number(worldNormal.y.toFixed(4)),
              Number(worldNormal.z.toFixed(4)),
            ],
          };
        }
        return pt;
      });

      if (updatedAny) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const focusOnPoint = (point, customDistance = 0.85) => {
    if (!point) return;
    setActivePointId(point.id);
    setInspectorOpen(true);

    if (window.innerWidth <= 860) {
      setSidebarOpen(false);
    }

    if (!cameraControlRef.current) return;

    const target = new THREE.Vector3(...point.position);
    let dirVec = point.normal
      ? new THREE.Vector3(...point.normal).normalize()
      : new THREE.Vector3(0, point.side === 'palmar' ? -1 : 1, 0);

    const camPos = target
      .clone()
      .add(dirVec.multiplyScalar(customDistance))
      .add(new THREE.Vector3(0, 0, 0.08));

    cameraControlRef.current.setLookAt(
      camPos.x,
      camPos.y,
      camPos.z,
      target.x,
      target.y,
      target.z,
      true
    );
  };

  const handleSurfaceSnap = (newCoords, newNormal, newCamCoords) => {
    const targetId = activePointId || pointsData[0]?.id;
    if (!targetId) return;

    setPointsData((prev) => {
      const updated = prev.map((pt) =>
        pt.id === targetId
          ? {
              ...pt,
              position: newCoords,
              normal: newNormal,
              cameraPos: newCamCoords,
              calibrated: true,
            }
          : pt
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    showToast(`Point ${targetId} position saved successfully to surface`);
  };

  const handleZoomStep = (delta) => {
    if (!cameraControlRef.current) return;
    cameraControlRef.current.dolly(delta, true);
  };

  const handleResetStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUSTOM_VIEW_KEY);
    window.location.reload();
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(pointsData, null, 2));
    showToast('Acupuncture points JSON copied to clipboard!');
  };

  return (
    <div className="app-shell">
      <header className="top-header glass-panel">
        <div className="brand-group">
          <div className="brand-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2">
              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </svg>
          </div>
          <div>
            <div className="brand-title">
              <span>3D Clinical Acupuncture Atlas</span>
              <span className="status-badge">
                <span className="status-dot" />
                {fps} FPS • WebGL 2.0
              </span>
            </div>
            <p className="brand-subtitle">
              Spatial acupuncture navigation platform with surface normal vector calibration
            </p>
          </div>
        </div>

        <div className="header-actions custom-scroll">
          <button
            className={`btn ${showNeedle ? 'active-cyan' : ''}`}
            onClick={() => setShowNeedle(!showNeedle)}
          >
            {showNeedle ? 'Needle: ON' : 'Needle: OFF'}
          </button>

          <button
            className={`btn ${showLabels ? 'active-cyan' : ''}`}
            onClick={() => setShowLabels(!showLabels)}
          >
            {showLabels ? 'Labels: ON' : 'Labels: OFF'}
          </button>

          <button className="btn" onClick={handleSaveCurrentView} title="Save current camera angle as default overview">
            📌 Lock Angle
          </button>

          <button className="btn" onClick={handleCopyJson}>
            Copy JSON
          </button>

          <button className="btn" onClick={handleResetStorage}>
            Reset
          </button>

          <button
            className={`btn ${sidebarOpen ? 'active-purple' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? 'Close Points' : 'Point List'}
          </button>
        </div>
      </header>

      {calibrateMode && (
        <div className="calibrate-banner">
          <span>🎯</span>
          <span>
            Click on the skin surface to position point <b>{selectedPoint?.name}</b>.
          </span>
          <button
            className="btn active-amber"
            style={{ padding: '2px 10px', fontSize: '11px' }}
            onClick={() => setCalibrateMode(false)}
          >
            Exit
          </button>
        </div>
      )}

      {toastMsg && <div className="toast-notification">{toastMsg}</div>}

      <aside className={`right-sidebar glass-panel ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <input
            type="text"
            className="search-box"
            placeholder="Search point name, code (e.g. LI4), or indication..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="icon-close-btn"
            onClick={() => setSidebarOpen(false)}
            title="Close list"
          >
            ✕
          </button>
        </div>

        <div className="points-list custom-scroll">
          {filteredPoints.map((pt) => {
            const isActive = pt.id === activePointId;
            return (
              <button
                key={pt.id}
                className={`point-item ${isActive ? 'active' : ''}`}
                onClick={() => focusOnPoint(pt)}
              >
                <div className="point-item-top">
                  <span className="point-name">{pt.name}</span>
                  <span className="point-code-badge">{pt.code}</span>
                </div>
                <div className="point-meridian">{pt.meridian}</div>
                <div className="point-desc-short">{pt.indication}</div>
              </button>
            );
          })}
        </div>
      </aside>

      {selectedPoint && inspectorOpen ? (
        <article className="inspector-card glass-panel custom-scroll">
          <div className="inspector-header">
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                {selectedPoint.name}
              </h2>
              <span style={{ fontSize: '11px', color: '#38bdf8' }}>
                {selectedPoint.meridian}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="point-code-badge">{selectedPoint.code}</span>
              <button
                className="icon-close-btn"
                onClick={() => setInspectorOpen(false)}
                title="Close Inspector"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="inspector-meta-grid">
            <div className="meta-box">
              <span className="meta-label">Needling Depth</span>
              <span className="meta-value">{selectedPoint.depth || '0.5 – 1.0 Cun'}</span>
            </div>
            <div className="meta-box">
              <span className="meta-label">Insertion Angle</span>
              <span className="meta-value">{selectedPoint.angle || 'Perpendicular'}</span>
            </div>
          </div>

          {selectedPoint.anatomical && (
            <div className="inspector-section">
              <div className="inspector-section-title">Anatomical Landmark</div>
              <p className="inspector-section-body">{selectedPoint.anatomical}</p>
            </div>
          )}

          <div className="inspector-section">
            <div className="inspector-section-title">Clinical Indications</div>
            <p className="inspector-section-body">{selectedPoint.indication}</p>
          </div>

          <div className="inspector-actions">
            <button
              className="btn active-cyan"
              style={{ flex: 1 }}
              onClick={() => focusOnPoint(selectedPoint, 0.55)}
            >
              🔍 Macro Focus
            </button>
            <button
              className={`btn ${calibrateMode ? 'active-amber' : ''}`}
              onClick={() => setCalibrateMode(!calibrateMode)}
            >
              {calibrateMode ? 'Finish Calibration' : '📍 Reposition Point'}
            </button>
          </div>
        </article>
      ) : (
        selectedPoint && (
          <div className="reopen-inspector-pill">
            <button
              className="btn glass-panel active-cyan"
              onClick={() => setInspectorOpen(true)}
            >
              ℹ️ Details: {selectedPoint.code} ({selectedPoint.shortName})
            </button>
          </div>
        )
      )}

      <nav className="bottom-dock glass-panel custom-scroll">
        <button
          className={`btn ${renderMode === 'skin' ? 'active-cyan' : ''}`}
          onClick={() => setRenderMode('skin')}
        >
          Clinical Skin
        </button>
        <button
          className={`btn ${renderMode === 'xray' ? 'active-cyan' : ''}`}
          onClick={() => setRenderMode('xray')}
        >
          X-Ray
        </button>
        <button
          className={`btn ${renderMode === 'sculpt' ? 'active-cyan' : ''}`}
          onClick={() => setRenderMode('sculpt')}
        >
          Matte Clay
        </button>
        <button
          className={`btn ${renderMode === 'wireframe' ? 'active-cyan' : ''}`}
          onClick={() => setRenderMode('wireframe')}
        >
          Wireframe Mesh
        </button>

        <div className="dock-divider" />

        <button className="btn" onClick={() => setCameraPreset('overview')}>
          Overview
        </button>
        <button className="btn" onClick={() => setCameraPreset('dorsal')}>
          Dorsum
        </button>
        <button className="btn" onClick={() => setCameraPreset('palmar')}>
          Palm
        </button>

        <div className="dock-divider" />

        <button className="btn" onClick={() => handleZoomStep(0.35)}>
          ➕ Zoom In
        </button>
        <button className="btn" onClick={() => handleZoomStep(-0.35)}>
          ➖ Zoom Out
        </button>
      </nav>

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0.15, 1.55, 1.65], fov: 40, near: 0.05, far: 50 }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-5, -4, -4]} intensity={0.85} color="#38bdf8" />
        <directionalLight position={[0, -6, 3]} intensity={0.55} color="#c084fc" />
        <Environment preset="city" />

        <CameraControls
          ref={cameraControlRef}
          smoothTime={0.32}
          minDistance={0.25}
          maxDistance={5.0}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          dollySpeed={1.1}
          truckSpeed={0.8}
        />

        <Suspense
          fallback={
            <Html center>
              <div
                className="glass-panel"
                style={{
                  padding: '12px 24px',
                  borderRadius: '99px',
                  color: '#38bdf8',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                Loading 3D model & calibrating surface...
              </div>
            </Html>
          }
        >
          <HandModel
            renderMode={renderMode}
            points={pointsData}
            activePointId={activePointId}
            onSelectPoint={(pt) => focusOnPoint(pt, 0.82)}
            onSurfaceSnap={handleSurfaceSnap}
            calibrateMode={calibrateMode}
            showLabels={showLabels}
            showNeedle={showNeedle}
            onModelReady={handleModelReady}
          />
          <ContactShadows
            position={[0, -0.55, 0]}
            opacity={0.4}
            scale={3.5}
            blur={2.4}
            far={2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const MESH_EXT = ['stl', 'obj', '3mf'];

/** Parse a model file in the browser into one geometry (mm units, Z up). STEP can't be read client-side → null. */
export async function loadGeometry(file: File): Promise<THREE.BufferGeometry | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!MESH_EXT.includes(ext) || file.size > 120 * 1048576) return null;
  const buf = await file.arrayBuffer();
  try {
    if (ext === 'stl') return new STLLoader().parse(buf);
    const obj = ext === 'obj'
      ? new OBJLoader().parse(new TextDecoder().decode(buf))
      : new ThreeMFLoader().parse(buf);
    obj.updateMatrixWorld(true);
    const parts: THREE.BufferGeometry[] = [];
    obj.traverse((o: any) => {
      if (o.isMesh) {
        const g = (o.geometry as THREE.BufferGeometry).clone().applyMatrix4(o.matrixWorld);
        const ng = g.index ? g.toNonIndexed() : g;
        for (const k of Object.keys(ng.attributes)) if (k !== 'position') ng.deleteAttribute(k);
        parts.push(ng);
      }
    });
    if (!parts.length) return null;
    const merged = mergeGeometries(parts, false);
    // OBJ is commonly Y-up; rotate to Z-up like slicers do.
    if (ext === 'obj') merged.rotateX(Math.PI / 2);
    return merged;
  } catch {
    return null;
  }
}

/** Signed-volume of a closed mesh in mm³ (accurate for watertight meshes). */
export function meshVolume(geo: THREE.BufferGeometry): number {
  const pos = geo.attributes.position;
  const idx = geo.index;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let vol = 0;
  const n = idx ? idx.count : pos.count;
  for (let i = 0; i < n; i += 3) {
    const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    vol += a.dot(b.cross(c)) / 6;
  }
  return Math.abs(vol);
}

let thumbRenderer: THREE.WebGLRenderer | null = null;
/** Small product-shot style render of a geometry, returned as a data URL. */
export function renderThumb(geo: THREE.BufferGeometry, size = 112): string | null {
  try {
    if (!thumbRenderer) {
      thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    }
    thumbRenderer.setSize(size, size);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 2.2));
    const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(1, -1.5, 2); scene.add(dl);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.55, metalness: 0.05 }));
    geo.computeBoundingBox(); geo.computeVertexNormals();
    const box = geo.boundingBox!; const center = box.getCenter(new THREE.Vector3()); const s = box.getSize(new THREE.Vector3()).length();
    mesh.position.sub(center);
    scene.add(mesh);
    const cam = new THREE.PerspectiveCamera(30, 1, s / 100, s * 10);
    cam.up.set(0, 0, 1);
    cam.position.set(s * 1.25, -s * 1.5, s * 1.1);
    cam.lookAt(0, 0, 0);
    thumbRenderer.render(scene, cam);
    return thumbRenderer.domElement.toDataURL('image/png');
  } catch {
    return null;
  }
}

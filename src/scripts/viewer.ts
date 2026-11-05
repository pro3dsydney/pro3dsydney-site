import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { COLOURS } from './colours';


/** 3D preview of a part sitting on the build plate (size comes from the API catalog). */
export class Viewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private mesh: THREE.Mesh | null = null;
  private material = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5, metalness: 0.05 });
  private ro: ResizeObserver;
  private frame = 0;

  constructor(private host: HTMLElement, private bed = { x: 256, y: 256 }) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(35, 1, 1, 5000);
    this.camera.up.set(0, 0, 1);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI * 0.95;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa8bd, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(150, -200, 300); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfd4ff, 0.8); rim.position.set(-200, 200, 100); this.scene.add(rim);

    // Build plate
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(bed.x, bed.y),
      new THREE.MeshStandardMaterial({ color: 0xd5dce6, roughness: 0.95, metalness: 0 }),
    );
    plate.position.z = -0.6;
    this.scene.add(plate);
    const grid = new THREE.GridHelper(bed.x, Math.round(bed.x / 16), 0x94a3b8, 0xb8c2cf);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.4;
    this.scene.add(grid);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.frameAll(120);
    const loop = () => { this.frame = requestAnimationFrame(loop); this.controls.update(); this.renderer.render(this.scene, this.camera); };
    loop();
  }

  private resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight || w * 0.75;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private frameAll(size: number, target = new THREE.Vector3(0, 0, size * 0.25)) {
    const d = Math.max(size, 40) * 2.1;
    this.camera.position.set(target.x + d * 0.8, target.y - d * 1.1, target.z + d * 0.8);
    this.controls.target.copy(target);
    this.controls.update();
  }

  show(geo: THREE.BufferGeometry | null) {
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh = null; }
    if (!geo) { this.frameAll(120); return; }
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const c = box.getCenter(new THREE.Vector3());
    const mesh = new THREE.Mesh(geo, this.material);
    // Centre on the plate and sit on z = 0, like the slicer does.
    mesh.position.set(-c.x, -c.y, -box.min.z);
    this.scene.add(mesh);
    this.mesh = mesh;
    const size = box.getSize(new THREE.Vector3());
    this.frameAll(Math.max(size.x, size.y, size.z), new THREE.Vector3(0, 0, size.z / 2));
  }

  setColour(name: string) { this.material.color.setHex(COLOURS[name] ?? 0x3b82f6); }

  reset() { if (this.mesh) { const b = new THREE.Box3().setFromObject(this.mesh); const s = b.getSize(new THREE.Vector3()); this.frameAll(Math.max(s.x, s.y, s.z), new THREE.Vector3(0, 0, s.z / 2)); } else this.frameAll(120); }

  dispose() { cancelAnimationFrame(this.frame); this.ro.disconnect(); this.renderer.dispose(); }
}

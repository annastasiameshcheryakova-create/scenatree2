import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

document.addEventListener("DOMContentLoaded", async () => {
  const mindarThree = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc: "./targets/marker.mind"
  });

  const { renderer, scene, camera } = mindarThree;

  const anchor = mindarThree.addAnchor(0);

  // 1. Куб
  const boxGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xff4d6d });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.set(-0.5, 0, 0);
  anchor.group.add(box);

  // 2. Сфера
  const sphereGeometry = new THREE.SphereGeometry(0.25, 32, 32);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00c2ff });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(0, 0.3, 0);
  anchor.group.add(sphere);

  // 3. Конус
  const coneGeometry = new THREE.ConeGeometry(0.22, 0.5, 32);
  const coneMaterial = new THREE.MeshBasicMaterial({ color: 0x7bff00 });
  const cone = new THREE.Mesh(coneGeometry, coneMaterial);
  cone.position.set(0.5, -0.1, 0);
  anchor.group.add(cone);

  // Анімація
  const clock = new THREE.Clock();

  await mindarThree.start();

  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();

    box.rotation.x = t;
    box.rotation.y = t;

    sphere.position.y = 0.3 + Math.sin(t * 2) * 0.08;
    sphere.rotation.y += 0.03;

    cone.rotation.z += 0.02;
    cone.rotation.y += 0.03;

    renderer.render(scene, camera);
  });
});

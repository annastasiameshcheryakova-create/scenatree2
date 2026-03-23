import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

document.addEventListener("DOMContentLoaded", async () => {

  // --------------------
  // MINDAR
  // --------------------
  const mindarThree = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc: "./targets/marker.mind"
  });

  const { renderer, scene, camera } = mindarThree;

  const anchor = mindarThree.addAnchor(0);

  // --------------------
  // ВИДЕО
  // --------------------
  const video = document.createElement("video");
  video.src = "./kitty.mp4";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";

  const videoTexture = new THREE.VideoTexture(video);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.8),
    new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide
    })
  );

  plane.position.set(0, 0, 0);
  anchor.group.add(plane);

  // --------------------
  // 3 ФИГУРЫ (ЗАДАНИЕ)
  // --------------------

  // 1. Куб
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  cube.position.set(-0.6, 0, 0);
  anchor.group.add(cube);

  // 2. Сфера
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  sphere.position.set(0, 0.6, 0);
  anchor.group.add(sphere);

  // 3. Конус
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.4, 32),
    new THREE.MeshBasicMaterial({ color: 0x0000ff })
  );
  cone.position.set(0.6, 0, 0);
  anchor.group.add(cone);

  // --------------------
  // СОБЫТИЯ МАРКЕРА
  // --------------------
  anchor.onTargetFound = async () => {
    console.log("Маркер найден");

    try {
      await video.play();
    } catch (e) {
      console.log("Нужно нажать на экран");
    }
  };

  anchor.onTargetLost = () => {
    console.log("Маркер потерян");
    video.pause();
  };

  // --------------------
  // FIX для телефонов (клик)
  // --------------------
  window.addEventListener("click", async () => {
    try {
      await video.play();
    } catch {}
  });

  // --------------------
  // СТАРТ КАМЕРЫ
  // --------------------
  await mindarThree.start();

  renderer.setAnimationLoop(() => {

    cube.rotation.x += 0.02;
    cube.rotation.y += 0.02;

    sphere.rotation.y += 0.03;

    cone.rotation.x += 0.02;

    renderer.render(scene, camera);
  });

});

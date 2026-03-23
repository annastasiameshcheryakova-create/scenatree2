import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const container = document.querySelector("#container");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const statusEl = document.querySelector("#status");
const markerStatusEl = document.querySelector("#markerStatus");

let mindarThree = null;
let renderer = null;
let scene = null;
let camera = null;
let anchor = null;
let started = false;
let video = null;

let cube = null;
let sphere = null;
let cone = null;
let plane = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function setMarkerStatus(text) {
  markerStatusEl.textContent = text;
}

async function checkFile(url) {
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Файл не знайдено: ${url}`);
  }
  return true;
}

async function initAR() {
  setStatus("перевірка файлів...");

  await checkFile("./targets/marker.mind");
  await checkFile("./kitty.mp4");

  setStatus("створення AR-сцени...");

  mindarThree = new MindARThree({
    container: container,
    imageTargetSrc: "./targets/marker.mind",
    uiScanning: true,
    uiLoading: true,
    uiError: true,
  });

  const result = mindarThree;
  renderer = result.renderer;
  scene = result.scene;
  camera = result.camera;

  anchor = mindarThree.addAnchor(0);

  video = document.createElement("video");
  video.src = "./kitty.mp4";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;

  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.8),
    new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
      transparent: true
    })
  );
  plane.position.set(0, 0, 0);
  anchor.group.add(plane);

  cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.22, 0.22),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  cube.position.set(-0.75, 0, 0);
  anchor.group.add(cube);

  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  sphere.position.set(0, 0.55, 0);
  anchor.group.add(sphere);

  cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.17, 0.35, 32),
    new THREE.MeshBasicMaterial({ color: 0x0000ff })
  );
  cone.position.set(0.75, 0, 0);
  anchor.group.add(cone);

  // ВАЖНО: чтобы видеть, вообще ли работает якорь
  anchor.group.visible = false;

  anchor.onTargetFound = async () => {
    setMarkerStatus("знайдено ✅");
    anchor.group.visible = true;

    try {
      await video.play();
    } catch (e) {
      console.warn("video.play blocked", e);
    }
  };

  anchor.onTargetLost = () => {
    setMarkerStatus("втрачено");
    anchor.group.visible = false;
    video.pause();
    video.currentTime = 0;
  };
}

async function startAR() {
  if (started) return;

  try {
    startButton.disabled = true;
    setStatus("ініціалізація...");
    setMarkerStatus("не знайдено");

    if (!mindarThree) {
      await initAR();
    }

    setStatus("запуск камери...");
    await mindarThree.start();

    started = true;
    stopButton.disabled = false;
    setStatus("камера запущена, наведи на marker.png");

    renderer.setAnimationLoop(() => {
      if (cube) {
        cube.rotation.x += 0.02;
        cube.rotation.y += 0.02;
      }

      if (sphere) {
        sphere.rotation.y += 0.03;
      }

      if (cone) {
        cone.rotation.x += 0.02;
        cone.rotation.z += 0.02;
      }

      renderer.render(scene, camera);
    });
  } catch (error) {
    console.error(error);
    startButton.disabled = false;
    setStatus(`помилка: ${error.message}`);
  }
}

function stopAR() {
  if (!mindarThree || !started) return;

  mindarThree.stop();
  renderer.setAnimationLoop(null);

  if (video) {
    video.pause();
    video.currentTime = 0;
  }

  started = false;
  startButton.disabled = false;
  stopButton.disabled = true;
  setStatus("зупинено");
  setMarkerStatus("не знайдено");
}

startButton.addEventListener("click", startAR);
stopButton.addEventListener("click", stopAR);

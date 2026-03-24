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
let assetVideo = null;
let cube = null;
let sphere = null;
let cone = null;
let plane = null;
let previewStream = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function setMarkerStatus(text) {
  markerStatusEl.textContent = text;
}

async function requestCameraLikeMeet() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Браузер не підтримує getUserMedia.");
  }

  const constraints = {
    audio: false,
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  previewStream = stream;

  const videoElement = document.createElement("video");
  videoElement.srcObject = stream;
  videoElement.autoplay = true;
  videoElement.muted = true;
  videoElement.playsInline = true;

  videoElement.setAttribute("playsinline", "");
  videoElement.setAttribute("webkit-playsinline", "");

  container.appendChild(videoElement);

  try {
    await videoElement.play();
  } catch (e) {
    console.warn("Preview video play warning:", e);
  }

  return stream;
}

async function initAR() {
  setStatus("перевірка файлів...");

  await checkFile("./targets/marker.mind");
  await checkFile("./kitty.mp4");

  setStatus("створення AR-сцени...");

  mindarThree = new MindARThree({
    container: container,
    imageTargetSrc: "./targets/marker.mind",
    uiScanning: false,
    uiLoading: false,
    uiError: false,
  });

  const result = mindarThree;
  renderer = result.renderer;
  scene = result.scene;
  camera = result.camera;

  anchor = mindarThree.addAnchor(0);

  assetVideo = document.createElement("video");
  assetVideo.src = "./kitty.mp4";
  assetVideo.loop = true;
  assetVideo.muted = true;
  assetVideo.playsInline = true;
  assetVideo.crossOrigin = "anonymous";
  assetVideo.setAttribute("playsinline", "");
  assetVideo.setAttribute("webkit-playsinline", "");

  const videoTexture = new THREE.VideoTexture(assetVideo);
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
    new THREE.BoxGeometry(0.25, 0.25, 0.25),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  cube.position.set(-0.72, 0, 0);
  anchor.group.add(cube);

  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 32, 32),
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

  anchor.onTargetFound = async () => {
    setMarkerStatus("знайдено ✅");
    anchor.group.visible = true;

    try {
      await assetVideo.play();
    } catch (e) {
      console.warn("video.play blocked", e);
    }
  };

  anchor.onTargetLost = () => {
    setMarkerStatus("втрачено");
    anchor.group.visible = false;
    assetVideo.pause();
    assetVideo.currentTime = 0;
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

  if (assetVideo) {
    assetVideo.pause();
    assetVideo.currentTime = 0;
  }

  started = false;
  startButton.disabled = false;
  stopButton.disabled = true;
  setStatus("зупинено");
  setMarkerStatus("не знайдено");
}

startButton.addEventListener("click", startAR);
stopButton.addEventListener("click", stopAR);

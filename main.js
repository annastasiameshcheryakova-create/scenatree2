import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const container = document.getElementById("container");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");
const errorText = document.getElementById("errorText");
const statusText = document.getElementById("status");
const markerStatusText = document.getElementById("markerStatus");
const cameraPreview = document.getElementById("cameraPreview");

let previewStream = null;
let mindarThree = null;
let renderer = null;
let scene = null;
let camera = null;
let anchor = null;
let assetVideo = null;

let cube = null;
let sphere = null;
let cone = null;

function setStatus(text) {
  statusText.textContent = text;
}

function setMarkerStatus(text) {
  markerStatusText.textContent = text;
}

async function checkFile(url) {
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Не знайдено файл: ${url}`);
  }
}

async function openCameraPreview() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  });

  previewStream = stream;
  cameraPreview.srcObject = stream;
  cameraPreview.style.display = "block";
  await cameraPreview.play();
}

function stopCameraPreview() {
  if (previewStream) {
    previewStream.getTracks().forEach(track => track.stop());
    previewStream = null;
  }
  cameraPreview.pause();
  cameraPreview.srcObject = null;
  cameraPreview.style.display = "none";
}

async function initMindAR() {
  await checkFile("./targets/marker.mind");
  await checkFile("./kitty.mp4");

  mindarThree = new MindARThree({
    container: container,
    imageTargetSrc: "./targets/marker.mind",
    uiScanning: false,
    uiLoading: false,
    uiError: false
  });

  ({ renderer, scene, camera } = mindarThree);
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

  const videoPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.8),
    new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
      transparent: true
    })
  );
  videoPlane.position.set(0, 0, 0);
  anchor.group.add(videoPlane);

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

  anchor.group.visible = false;

  anchor.onTargetFound = async () => {
    setMarkerStatus("знайдено ✅");
    anchor.group.visible = true;

    try {
      await assetVideo.play();
    } catch (e) {
      console.warn("video play blocked", e);
    }
  };

  anchor.onTargetLost = () => {
    setMarkerStatus("втрачено");
    anchor.group.visible = false;
    assetVideo.pause();
    assetVideo.currentTime = 0;
  };
}

async function startARFlow() {
  try {
    startBtn.disabled = true;
    errorText.textContent = "";
    setStatus("запит доступу до камери...");

    // 1. Явно открываем камеру
    await openCameraPreview();
    setStatus("камера відкрита");

    // 2. Небольшая пауза
    await new Promise(resolve => setTimeout(resolve, 800));

    // 3. Останавливаем превью
    stopCameraPreview();

    // 4. Стартуем MindAR
    setStatus("запуск AR...");
    await initMindAR();
    await mindarThree.start();

    overlay.classList.add("hidden");
    setStatus("AR активний, наведи на marker.png");

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
    startBtn.disabled = false;

    const msg = String(error.message || error);

    if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
      errorText.textContent = "Доступ до камери заборонено браузером.";
    } else if (msg.includes("marker.mind")) {
      errorText.textContent = "Файл marker.mind не знайдено у папці targets.";
    } else if (msg.includes("kitty.mp4")) {
      errorText.textContent = "Файл kitty.mp4 не знайдено в корені проєкту.";
    } else {
      errorText.textContent = "Не вдалося запустити камеру або AR.";
    }

    setStatus("помилка запуску");
  }
}

startBtn.addEventListener("click", startARFlow);

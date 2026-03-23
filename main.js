import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const container = document.querySelector("#container");
const startButton = document.querySelector("#startButton");
const startScreen = document.querySelector("#startScreen");
const errorText = document.querySelector("#errorText");
const previewVideo = document.querySelector("#camera-test-video");

let started = false;
let previewStream = null;
let mindarThree = null;

const assetVideo = document.createElement("video");
assetVideo.src = "./kitty.mp4";
assetVideo.loop = true;
assetVideo.muted = true;
assetVideo.playsInline = true;
assetVideo.setAttribute("playsinline", "");
assetVideo.setAttribute("webkit-playsinline", "");
assetVideo.crossOrigin = "anonymous";

function showError(message) {
  errorText.textContent = message;
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
  previewVideo.srcObject = stream;
  previewVideo.style.display = "block";

  try {
    await previewVideo.play();
  } catch (e) {
    console.warn("Preview video play warning:", e);
  }

  return stream;
}

function stopPreviewStream() {
  if (previewStream) {
    previewStream.getTracks().forEach((track) => track.stop());
    previewStream = null;
  }
  previewVideo.pause();
  previewVideo.srcObject = null;
  previewVideo.style.display = "none";
}

async function buildARScene() {
  mindarThree = new MindARThree({
    container,
    imageTargetSrc: "./targets/marker.mind",
    uiScanning: false,
    uiLoading: false,
    uiError: false,
  });

  const { renderer, scene, camera } = mindarThree;
  const anchor = mindarThree.addAnchor(0);

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

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.25, 0.25),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  cube.position.set(-0.72, 0, 0);
  anchor.group.add(cube);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  sphere.position.set(0, 0.55, 0);
  anchor.group.add(sphere);

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.17, 0.35, 32),
    new THREE.MeshBasicMaterial({ color: 0x0000ff })
  );
  cone.position.set(0.72, 0, 0);
  anchor.group.add(cone);

  anchor.onTargetFound = async () => {
    try {
      await assetVideo.play();
    } catch (e) {
      console.warn("Asset video autoplay blocked:", e);
    }
  };

  anchor.onTargetLost = () => {
    assetVideo.pause();
    assetVideo.currentTime = 0;
  };

  await mindarThree.start();

  renderer.setAnimationLoop(() => {
    cube.rotation.x += 0.02;
    cube.rotation.y += 0.02;

    sphere.rotation.y += 0.03;

    cone.rotation.x += 0.02;
    cone.rotation.z += 0.02;

    renderer.render(scene, camera);
  });
}

async function startAll() {
  if (started) return;
  started = true;
  startButton.disabled = true;
  showError("");

  try {
    await requestCameraLikeMeet();

    await new Promise((resolve) => setTimeout(resolve, 600));

    stopPreviewStream();

    await buildARScene();

    startScreen.classList.add("hidden");
  } catch (error) {
    started = false;
    startButton.disabled = false;
    console.error(error);

    let message = "Не вдалося запустити камеру.";
    const text = String(error?.message || error);

    if (text.includes("Permission denied") || text.includes("NotAllowedError")) {
      message = "Доступ до камери заборонено. Дозволь камеру в браузері.";
    } else if (text.includes("NotFoundError")) {
      message = "Камеру не знайдено на пристрої.";
    } else if (text.includes("getUserMedia")) {
      message = "Браузер не підтримує доступ до камери.";
    } else if (text.includes("marker.mind")) {
      message = "Не знайдено файл marker.mind у папці targets.";
    } else {
      message = "Не вдалося запустити камеру або AR. Перевір GitHub Pages, доступ до камери і файл marker.mind.";
    }

    showError(message);
  }
}

startButton.addEventListener("click", startAll);

import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const statusBox = document.querySelector("#status");
const container = document.querySelector("#container");

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

function setStatus(text) {
  statusBox.textContent = text;
}

function createSceneObjects() {
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
  cone.position.set(0.72, 0, 0);
  anchor.group.add(cone);

  anchor.onTargetFound = async () => {
    setStatus("Маркер знайдено");
    try {
      await assetVideo.play();
    } catch (e) {
      console.warn("Video play blocked:", e);
    }
  };

  anchor.onTargetLost = () => {
    setStatus("Маркер втрачено");
    assetVideo.pause();
    assetVideo.currentTime = 0;
  };
}

async function initAR() {
  mindarThree = new MindARThree({
    container,
    imageTargetSrc: "./targets/marker.mind"
  });

  ({ renderer, scene, camera } = mindarThree);
  anchor = mindarThree.addAnchor(0);

  createSceneObjects();
}

async function startAR() {
  if (started) return;

  try {
    startButton.disabled = true;
    setStatus("Запуск камери...");

    if (!mindarThree) {
      await initAR();
    }

    await mindarThree.start();
    started = true;

    stopButton.disabled = false;
    setStatus("Камера увімкнена. Наведи на маркер.");

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
    setStatus("Не вдалося запустити камеру або AR");
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
  setStatus("AR зупинено");
}

startButton.addEventListener("click", startAR);
stopButton.addEventListener("click", stopAR);

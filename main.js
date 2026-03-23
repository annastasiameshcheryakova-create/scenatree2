import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const container = document.querySelector("#container");
const startButton = document.querySelector("#startButton");
const startScreen = document.querySelector("#startScreen");
const errorText = document.querySelector("#errorText");

let started = false;

const video = document.createElement("video");
video.src = "./kitty.mp4";
video.loop = true;
video.muted = true;
video.playsInline = true;
video.setAttribute("playsinline", "");
video.setAttribute("webkit-playsinline", "");
video.crossOrigin = "anonymous";

const startAR = async () => {
  if (started) return;
  started = true;
  errorText.textContent = "";

  try {
    const mindarThree = new MindARThree({
      container,
      imageTargetSrc: "./targets/marker.mind",
      uiScanning: false,
      uiLoading: false,
      uiError: false,
    });

    const { renderer, scene, camera } = mindarThree;
    const anchor = mindarThree.addAnchor(0);

    // Відео на площині
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.8),
      new THREE.MeshBasicMaterial({
        map: videoTexture,
        side: THREE.DoubleSide,
      })
    );
    plane.position.set(0, 0, 0);
    anchor.group.add(plane);

    // 1. Куб
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.25, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    cube.position.set(-0.7, 0, 0);
    anchor.group.add(cube);

    // 2. Сфера
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    sphere.position.set(0, 0.55, 0);
    anchor.group.add(sphere);

    // 3. Конус
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.17, 0.35, 32),
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
    cone.position.set(0.7, 0, 0);
    anchor.group.add(cone);

    anchor.onTargetFound = async () => {
      try {
        await video.play();
      } catch (e) {
        console.log("Відео не стартувало автоматично:", e);
      }
    };

    anchor.onTargetLost = () => {
      video.pause();
      video.currentTime = 0;
    };

    await mindarThree.start();

    startScreen.classList.add("hidden");

    renderer.setAnimationLoop(() => {
      cube.rotation.x += 0.02;
      cube.rotation.y += 0.02;

      sphere.rotation.y += 0.03;

      cone.rotation.x += 0.02;
      cone.rotation.z += 0.02;

      renderer.render(scene, camera);
    });
  } catch (error) {
    started = false;
    console.error(error);
    errorText.textContent =
      "Не вдалося запустити камеру. Перевір доступ до камери, HTTPS і файл marker.mind.";
  }
};

startButton.addEventListener("click", startAR);

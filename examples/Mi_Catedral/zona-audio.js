var CONFIG_ZONA_AUDIO = {
  audioId: "audio-zona",
  camaraId: "camara",
  esferaId: "esfera-zona",

  x: 0,
  y: 2,
  z: -40,

  radio: 5,
  volumenMaximo: 1,
  reiniciarAlEntrar: true,
  pausarAlSalir: true
};

window.addEventListener("DOMContentLoaded", function () {
  var audio = document.getElementById(CONFIG_ZONA_AUDIO.audioId);
  var camara = document.getElementById(CONFIG_ZONA_AUDIO.camaraId);
  var esfera = document.getElementById(CONFIG_ZONA_AUDIO.esferaId);
  var escena = document.querySelector("a-scene");

  var posicionCamara = new THREE.Vector3();
  var dentroAntes = false;
  var audioPreparado = false;

  if (!audio || !camara || !esfera) {
    console.error("Falta #audio-zona, #camara o #esfera-zona.");
    return;
  }

  audio.loop = true;
  audio.volume = 0;

  function prepararAudio() {
    if (audioPreparado) {
      return;
    }

    var volumenAnterior = audio.volume;
    audio.volume = 0;

    audio.play()
      .then(function () {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = volumenAnterior;
        audioPreparado = true;
      })
      .catch(function () {
        audio.volume = volumenAnterior;
      });
  }

  function calcularDistancia() {
    camara.object3D.getWorldPosition(posicionCamara);

    var dx = posicionCamara.x - CONFIG_ZONA_AUDIO.x;
    var dy = posicionCamara.y - CONFIG_ZONA_AUDIO.y;
    var dz = posicionCamara.z - CONFIG_ZONA_AUDIO.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function calcularVolumen(distancia) {
    if (distancia >= CONFIG_ZONA_AUDIO.radio) {
      return 0;
    }

    var porcentaje = 1 - distancia / CONFIG_ZONA_AUDIO.radio;
    var volumen = porcentaje * CONFIG_ZONA_AUDIO.volumenMaximo;

    return Math.max(0, Math.min(1, volumen));
  }

  function reproducirSiHaceFalta() {
    if (!audio.paused) {
      return;
    }

    audio.play()
      .then(function () {
        audioPreparado = true;
      })
      .catch(function (error) {
        console.warn("El navegador bloqueo el audio.", error);
      });
  }

  function actualizarZonaAudio() {
    if (!camara.object3D) {
      return;
    }

    var distancia = calcularDistancia();
    var dentro = distancia <= CONFIG_ZONA_AUDIO.radio;
    var volumen = calcularVolumen(distancia);

    esfera.setAttribute("color", dentro ? "#ef4444" : "#22c55e");
    audio.volume = volumen;

    if (dentro) {
      if (!dentroAntes && CONFIG_ZONA_AUDIO.reiniciarAlEntrar) {
        audio.currentTime = 0;
      }

      reproducirSiHaceFalta();
    }

    if (!dentro && dentroAntes && CONFIG_ZONA_AUDIO.pausarAlSalir) {
      audio.pause();
      audio.currentTime = 0;
    }

    dentroAntes = dentro;
  }

  prepararAudio();
  document.addEventListener("click", prepararAudio);
  document.addEventListener("keydown", prepararAudio);
  document.addEventListener("touchstart", prepararAudio);
  document.addEventListener("pointerdown", prepararAudio);

  if (escena) {
    escena.addEventListener("enter-vr", prepararAudio);
  }

  setInterval(actualizarZonaAudio, 100);
});

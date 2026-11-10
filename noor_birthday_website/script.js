const scenes = [...document.querySelectorAll(".scene")];
const audio = document.getElementById("backgroundMusic");
const musicToggle = document.getElementById("musicToggle");
let musicStarted = false;
function showScene(number) {
  scenes.forEach(scene => scene.classList.toggle("active", scene.id === `scene-${number}`));
  window.scrollTo({top: 0, behavior: "smooth"});
  if (window.LoveRose) { if (String(number) === "6") window.LoveRose.start(); else window.LoveRose.stop(); }
}
async function startMusic() {
  if (musicStarted && !audio.paused) return;
  try { audio.volume = 0.38; await audio.play(); musicStarted = true; musicToggle.innerHTML = "♫ <span>Music on</span>"; musicToggle.setAttribute("aria-label", "Pause background music"); }
  catch (error) { musicToggle.innerHTML = "♫ <span>Tap for music</span>"; }
}
document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click", async () => { await startMusic(); showScene(button.dataset.next); }));
musicToggle.addEventListener("click", async () => { if (audio.paused) await startMusic(); else { audio.pause(); musicToggle.innerHTML = "♫ <span>Music off</span>"; musicToggle.setAttribute("aria-label", "Play background music"); } });

// A fuller, continuous shower of tiny, medium and large hearts on every scene.
const rain = document.getElementById("heartRain");
const heartSymbols = ["♥", "♡", "❤", "❥"];
function makeFallingHeart() {
  const heart = document.createElement("span"); heart.className = "falling-heart";
  heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.fontSize = `${8 + Math.random() * 22}px`;
  heart.style.opacity = `${0.38 + Math.random() * 0.48}`;
  heart.style.setProperty("--drift", `${-65 + Math.random() * 130}px`);
  heart.style.animationDuration = `${6 + Math.random() * 6}s`;
  rain.appendChild(heart); setTimeout(() => heart.remove(), 13000);
}
for (let i = 0; i < 58; i++) setTimeout(makeFallingHeart, i * 75);
setInterval(makeFallingHeart, 145);

// Birthday cake: candles go out and a neat slice slides forward.
document.getElementById("wishButton").addEventListener("click", () => {
  document.getElementById("cakeScene").classList.add("cake-cut");
  document.getElementById("cakeCandles").classList.add("off");
  document.getElementById("wishMessage").classList.remove("hidden");
  document.getElementById("afterWish").classList.remove("hidden");
  document.getElementById("wishButton").textContent = "Your wish is on its way ✨";
  confettiHearts();
});

// Envelope opens, then reveals the complete personal letter.
const envelope = document.getElementById("envelope");
envelope.addEventListener("click", () => { envelope.classList.add("open"); envelope.disabled = true; setTimeout(() => document.getElementById("letter").classList.remove("hidden"), 650); });

document.getElementById("heartButton").addEventListener("click", () => {
  document.querySelector(".big-heart").classList.add("heart-burst");
  document.getElementById("afterHeart").classList.remove("hidden"); confettiHearts();
});
function confettiHearts() {
  for (let i = 0; i < 36; i++) { const el = document.createElement("span"); el.className = "falling-heart burst-heart"; el.textContent = "♥"; el.style.left = `${10 + Math.random() * 80}%`; el.style.top = `${8 + Math.random() * 34}%`; el.style.fontSize = `${12 + Math.random() * 18}px`; el.style.animationDuration = `${2.5 + Math.random() * 2}s`; rain.appendChild(el); setTimeout(() => el.remove(), 5000); }
}

// The multilingual rose lives in rose.js (canvas port of rose.py).
function replay(){ showScene(1); }
document.getElementById("replayButton").addEventListener("click", replay);

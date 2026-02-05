let packets = [];
let pendingPackets = []; // Buffer para Slotted ALOHA
let nodeTimers = [0, 0, 0, 0, 0]; 
let stats = { success: 0, collision: 0, totalSent: 0 };

let sliderN, sliderP, btnMode;
let isSlotted = false;

const LANES = 5;
const LANE_HEIGHT = 50;
const PACKET_WIDTH = 60;
const SLOT_DURATION = 1000; // 1 segundo por slot

function setup() {
  let canvas = createCanvas(800, 550);
  canvas.parent('canvas-parent');

  sliderN = createSlider(1, 5, 5, 1);
  sliderP = createSlider(0.01, 0.1, 0.03, 0.005);
  
  btnMode = createButton('Cambiar a SLOTTED');
  btnMode.mousePressed(() => {
    isSlotted = !isSlotted;
    btnMode.html(isSlotted ? 'Cambiar a PURE' : 'Cambiar a SLOTTED');
    resetStats();
  });
}

function draw() {
  background(245);
  drawInterface();

  let N = sliderN.value();
  let P = sliderP.value();
  
  // LÓGICA DE GENERACIÓN
  for (let i = 0; i < N; i++) {
    if (millis() > nodeTimers[i] && random() < P) {
      let newP = new Packet(i, width, PACKET_WIDTH);
      if (isSlotted) {
        pendingPackets.push(newP); // Espera al inicio del slot
      } else {
        packets.push(newP); // Sale inmediatamente
      }
      nodeTimers[i] = millis() + random(1500, 4000); // Backoff aleatorio
    }
  }

  // SINCRONIZACIÓN SLOTTED (Cada vez que el tiempo cumple un slot)
  if (isSlotted && frameCount % floor(SLOT_DURATION / 16.6) === 0) {
    while(pendingPackets.length > 0) {
      packets.push(pendingPackets.pop());
    }
  }

  checkCollisions();
  updatePackets();
  drawMetrics();
}

function checkCollisions() {
  for (let i = 0; i < packets.length; i++) {
    for (let j = i + 1; j < packets.length; j++) {
      let p1 = packets[i];
      let p2 = packets[j];

      // Detección de traslape en eje X (Tiempo de vulnerabilidad)
      if (p1.x < p2.x + p2.w && p1.x + p1.w > p2.x) {
        p1.isCorrupt = true;
        p2.isCorrupt = true;
        
        // Líneas punteadas de "Botsing"
        stroke(255, 0, 0, 80);
        drawingContext.setLineDash([5, 5]);
        line(max(p1.x, p2.x), 100, max(p1.x, p2.x), 380);
        drawingContext.setLineDash([]);
      }
    }
  }
}

function updatePackets() {
  for (let i = packets.length - 1; i >= 0; i--) {
    let p = packets[i];
    p.update(2);
    p.draw(120 + p.nodeId * LANE_HEIGHT);
    
    if (p.finished) {
      stats.totalSent++;
      if (p.isCorrupt) stats.collision++;
      else stats.success++;
      packets.splice(i, 1);
    }
  }
}

function drawInterface() {
  // Carriles
  stroke(200);
  for (let i = 0; i <= LANES; i++) {
    let y = 110 + i * LANE_HEIGHT;
    line(50, y, width, y);
    if (i < LANES) {
      fill(100); noStroke();
      text("Nodo " + char(65 + i), 10, y + 30);
    }
  }

  // Rejilla de Slots (Si es Slotted)
  if (isSlotted) {
    stroke(180, 180, 255, 100);
    for (let x = width; x > 0; x -= PACKET_WIDTH + 10) {
      line(x, 110, x, 360);
    }
  }

  fill(0); textSize(18); textAlign(CENTER);
  text(isSlotted ? "MODO: SLOTTED ALOHA (Sincronizado)" : "MODO: PURE ALOHA (Asíncrono)", width/2, 40);
  
  stroke(0); line(50, 400, width-20, 400);
  fill(0); textSize(12); text("Tiempo", width - 80, 415);
}

function drawMetrics() {
  let y = 460;
  fill(255); stroke(200); rect(40, y, 720, 70, 10);
  
  let eff = stats.totalSent > 0 ? (stats.success / stats.totalSent) : 0;
  let G = sliderN.value() * sliderP.value() * 5; // Carga normalizada

  noStroke(); fill(0); textAlign(LEFT);
  text(`Paquetes Procesados: ${stats.totalSent}`, 60, y + 25);
  text(`Éxitos: ${stats.success} | Colisiones: ${stats.collision}`, 60, y + 50);
  
  text(`Carga (G): ${G.toFixed(2)}`, 300, y + 25);
  text(`Eficiencia Real (S): ${(eff * 100).toFixed(1)}%`, 300, y + 50);

  // Gráfico de barra de eficiencia
  fill(230); rect(500, y + 35, 200, 15);
  fill(eff > 0.18 ? (isSlotted ? '#4CAF50' : '#FF9800') : '#F44336');
  rect(500, y + 35, min(200 * (eff / 0.4), 200), 15);
}

function resetStats() {
  stats = { success: 0, collision: 0, totalSent: 0 };
  packets = [];
  pendingPackets = [];
}
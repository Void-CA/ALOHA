let packets = [];
let nodeTimers = [0, 0, 0, 0, 0]; // Tiempos para el siguiente intento
let lastTransmittedSlot = [0, 0, 0, 0, 0]; // Último slot transmitido para SLOTTED
let sliderN, sliderP, btnMode;
let isSlotted = false;
let stats = {
  success: 0,
  collision: 0,
  totalSent: 0,
  efficiencyHistory: []
};
const LANES = 5;
const LANE_HEIGHT = 50;
const PACKET_WIDTH = 60;
const SLOT_DURATION = 1000; // Duración de cada slot en ms

function setup() {
  let canvas = createCanvas(800, 500);
  canvas.parent('canvas-parent');

  // Sliders
  sliderN = createSlider(1, 5, 5, 1); // Número de nodos activos
  sliderP = createSlider(0.005, 0.05, 0.02, 0.005); // Probabilidad de envío

  btnMode = createButton('Cambiar a SLOTTED');
  btnMode.mousePressed(() => {
    isSlotted = !isSlotted;
    btnMode.html(isSlotted ? 'Cambiar a PURE' : 'Cambiar a SLOTTED');
    packets = []; // Reiniciar para ver el cambio
  });
}

function draw() {
  background(245);
  drawInterface();

  let activeNodes = sliderN.value();
  let prob = sliderP.value();

  // 1. Intentar generar paquetes
  for (let i = 0; i < activeNodes; i++) {
    if (isSlotted) {
      let currentSlot = floor(millis() / SLOT_DURATION);
      if (currentSlot > lastTransmittedSlot[i] && random() < prob) {
        let spawnX = width;
        packets.push(new Packet(i, spawnX, PACKET_WIDTH));
        lastTransmittedSlot[i] = currentSlot;
        // Backoff: esperar algunos slots aleatorios
        let backoffSlots = floor(random(1, 4));
        nodeTimers[i] = (currentSlot + backoffSlots + 1) * SLOT_DURATION;
      }
    } else {
      if (millis() > nodeTimers[i] && random() < prob) {
        let spawnX = width;
        packets.push(new Packet(i, spawnX, PACKET_WIDTH));
        nodeTimers[i] = millis() + random(1000, 3000);
      }
    }
  }

  // 2. Detección de Colisiones
  checkCollisions();

  for (let i = packets.length - 1; i >= 0; i--) {
    let p = packets[i];
    p.update(2);
    p.draw(120 + p.nodeId * LANE_HEIGHT);
    
    if (p.finished) {
      stats.totalSent++;
      if (p.isCorrupt) {
        stats.collision++;
      } else {
        stats.success++;
      }
      packets.splice(i, 1);
    }
  }
  
  drawMetrics(); // Llamar a la función de métricas

  // 3. Actualizar y Dibujar
  for (let i = packets.length - 1; i >= 0; i--) {
    let p = packets[i];
    p.update(2); // Velocidad de la animación
    p.draw(120 + p.nodeId * LANE_HEIGHT);
    
    if (p.finished) packets.splice(i, 1);
  }
  
}

function checkCollisions() {
  for (let i = 0; i < packets.length; i++) {
    for (let j = i + 1; j < packets.length; j++) {
      let p1 = packets[i];
      let p2 = packets[j];

      // Si hay traslape en el eje X (tiempo)
      if (p1.x < p2.x + p2.w && p1.x + p1.w > p2.x) {
        p1.isCorrupt = true;
        p2.isCorrupt = true;
        
        // Dibujar línea de "Botsing" como en tu imagen
        stroke(255, 0, 0, 100);
        drawingContext.setLineDash([5, 5]);
        line(p1.x, 100, p1.x, 400);
        drawingContext.setLineDash([]);
      }
    }
  }
}

function drawInterface() {
  // Dibujar carriles
  stroke(200);
  for (let i = 0; i <= LANES; i++) {
    let y = 110 + i * LANE_HEIGHT;
    line(50, y, width, y);
    if (i < LANES) {
      fill(80);
      noStroke();
      textSize(14);
      text("Nodo " + char(65 + i), 10, y + 30);
    }
  }

  // Dibujar slots verticales si es SLOTTED
  if (isSlotted) {
    let slotSize = PACKET_WIDTH + 20;
    stroke(150, 150, 150, 100);
    drawingContext.setLineDash([2, 2]);
    for (let x = 50; x < width; x += slotSize) {
      line(x, 110, x, 110 + LANES * LANE_HEIGHT);
    }
    drawingContext.setLineDash([]);
  }

  // Títulos y estado
  fill(0);
  textSize(20);
  text(isSlotted ? "Protocolo: SLOTTED ALOHA" : "Protocolo: PURE ALOHA", 250, 40);
  
  textSize(12);
  text("Tiempo —>", width - 80, 420);
  stroke(0);
  line(50, 410, width - 20, 410);
}

function drawMetrics() {
  let x = 50;
  let y = 440;
  let barWidth = 150;

  // Fondo del panel de métricas
  fill(255);
  stroke(200);
  rect(x - 10, y - 20, 710, 70, 5);

  // Calcular eficiencia actual
  let efficiency = stats.totalSent > 0 ? (stats.success / stats.totalSent) : 0;
  
  // Métrica 1: Éxitos vs Colisiones
  noStroke();
  fill(0);
  textAlign(LEFT);
  textSize(12);
  text(`Éxitos: ${stats.success}`, x, y);
  text(`Colisiones: ${stats.collision}`, x, y + 20);

  // Métrica 2: Barra de Eficiencia
  text(`Eficiencia Real: ${(efficiency * 100).toFixed(1)}%`, x + 120, y);
  fill(200);
  rect(x + 120, y + 8, barWidth, 10);
  fill(efficiency > 0.3 ? '#4CAF50' : '#FF9800'); // Verde si es alta, naranja si es baja
  rect(x + 120, y + 8, barWidth * (efficiency / 0.4), 10); // Normalizado a 40% max

  // Métrica 3: Carga del sistema (G)
  let G = sliderN.value() * sliderP.value() * 10; // G relativo a la ventana de tiempo
  text(`Carga del Canal (G): ${G.toFixed(2)}`, x + 300, y);
  
  // Métrica 4: Consejo dinámico
  fill(80);
}
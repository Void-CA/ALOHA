class Packet {
  constructor(nodeId, x, duration) {
    this.nodeId = nodeId;
    this.x = x;
    this.w = duration;
    this.isCorrupt = false;
    this.finished = false;
  }

  update(speed) {
    this.x -= speed;
    if (this.x + this.w < 0) this.finished = true;
  }

  draw(laneY) {
    stroke(0);
    strokeWeight(1);
    
    if (this.isCorrupt) {
      fill(200, 50, 50); // Rojo de colisión
      rect(this.x, laneY, this.w, 25);
      // Sombreado interno gris (como en tu imagen)
      fill(100, 100, 100, 180);
      rect(this.x + 5, laneY + 5, this.w - 10, 15);
    } else {
      fill(255);
      rect(this.x, laneY, this.w, 25);
    }
  }
}
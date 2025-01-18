let topImage, bottomImage; // Top and bottom images
let maskLayer; // Graphics for the mask
let isSwapped = false; // To track if images are swapped
let walls = []; // Obstacles
let particle; // The particle emitting rays

function preload() {
  // Load the images
  topImage = loadImage('whitecat.png'); // Replace with your actual file path
  bottomImage = loadImage('blackcat.png'); // Replace with your actual file path
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Create a graphics layer for the mask
  maskLayer = createGraphics(width, height);

  // Create walls (obstacles)
  walls.push(new Boundary(width * 0.1, height * 0.1, width * 0.2, height * 0.2));
  walls.push(new Boundary(width * 0.4, height * 0.1, width * 0.5, height * 0.2));
  walls.push(new Boundary(width * 0.7, height * 0.15, width * 0.85, height * 0.25));
  walls.push(new Boundary(width * 0.2, height * 0.3, width * 0.4, height * 0.35));
  walls.push(new Boundary(width * 0.6, height * 0.4, width * 0.7, height * 0.5));
  walls.push(new Boundary(width * 0.8, height * 0.3, width * 0.9, height * 0.4));

  // Initialize the particle
  particle = new Particle();
  noCursor();
}

function draw() {
  // Clear the mask and draw a transparent background
  maskLayer.clear();

  // The particle casts rays and creates a mask
  particle.update(mouseX, mouseY);
  particle.look(walls, maskLayer);

  // Apply the mask to the top image
  let maskedTop = topImage.get(); // Clone the top image
  maskedTop.mask(maskLayer); // Apply the mask

  // Draw the bottom image (always visible)
  drawAdaptedImage(bottomImage, 0, 0, width, height);

  // Draw the masked top image (revealing the rays)
  drawAdaptedImage(maskedTop, 0, 0, width, height);

  // Draw the obstacles for visualization
  for (let wall of walls) {
    wall.show();
  }
}

function drawAdaptedImage(img, x, y, w, h) {
  const imgAspect = img.width / img.height;
  const canvasAspect = w / h;

  let sx, sy, sw, sh;

  if (canvasAspect > imgAspect) {
    // Wider canvas
    sw = img.width;
    sh = img.width / canvasAspect;
    sx = 0;
    sy = (img.height - sh) / 2;
  } else {
    // Taller canvas
    sw = img.height * canvasAspect;
    sh = img.height;
    sx = (img.width - sw) / 2;
    sy = 0;
  }

  image(img, x, y, w, h, sx, sy, sw, sh);
}

function mousePressed() {
  for (let wall of walls) {
    if (mouseX >= wall.x1 && mouseX <= wall.x2 && mouseY >= wall.y1 && mouseY <= wall.y2) {
      // Swap the top and bottom images
      isSwapped = !isSwapped;
      if (isSwapped) {
        [topImage, bottomImage] = [bottomImage, topImage];
      } else {
        [topImage, bottomImage] = [bottomImage, topImage];
      }
      break; // Stop checking further once a match is found
    }
  }
}

// Boundary class for obstacles
class Boundary {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

    // Define edges of the rectangle as line segments
    this.edges = [
      { a: createVector(x1, y1), b: createVector(x2, y1) },
      { a: createVector(x2, y1), b: createVector(x2, y2) },
      { a: createVector(x2, y2), b: createVector(x1, y2) },
      { a: createVector(x1, y2), b: createVector(x1, y1) }
    ];
  }

  show() {
    stroke(255); // White outline
    noFill();
    rect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1); // Draw hollow rectangle
  }
}

// Ray class for casting
class Ray {
  constructor(pos, angle) {
    this.pos = pos;
    this.dir = p5.Vector.fromAngle(angle);
  }

  lookAt(x, y) {
    this.dir.x = x - this.pos.x;
    this.dir.y = y - this.pos.y;
    this.dir.normalize();
  }

  cast(edge) {
    const x1 = edge.a.x;
    const y1 = edge.a.y;
    const x2 = edge.b.x;
    const y2 = edge.b.y;

    const x3 = this.pos.x;
    const y3 = this.pos.y;
    const x4 = this.pos.x + this.dir.x;
    const y4 = this.pos.y + this.dir.y;

    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den == 0) {
      return;
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t > 0 && t < 1 && u > 0) {
      const pt = createVector();
      pt.x = x1 + t * (x2 - x1);
      pt.y = y1 + t * (y2 - y1);
      return pt;
    }
  }
}

// Particle class that emits rays
class Particle {
  constructor() {
    this.pos = createVector(width / 2, height / 2);
    this.rays = [];
    for (let a = 0; a < 360; a += 0.1) { // Super dense rays
      this.rays.push(new Ray(this.pos, radians(a)));
    }
  }

  update(x, y) {
    this.pos.set(x, y);
  }

  look(walls, maskLayer) {
    for (let i = 0; i < this.rays.length; i++) {
      const ray = this.rays[i];
      let closest = null;
      let record = Infinity;

      for (let wall of walls) {
        for (let edge of wall.edges) {
          const pt = ray.cast(edge);
          if (pt) {
            const d = p5.Vector.dist(this.pos, pt);
            if (d < record) {
              record = d;
              closest = pt;
            }
          }
        }
      }

      if (closest) {
        // Draw the rays on the maskLayer
        maskLayer.stroke(255, 150); // Transparent white stroke
        maskLayer.strokeWeight(5); // Thin rays
        maskLayer.line(this.pos.x, this.pos.y, closest.x, closest.y);
      }
    }
  }
}
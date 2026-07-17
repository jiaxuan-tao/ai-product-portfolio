const BASE_PALETTE = ["#0c4b3f", "#cf432f", "#dfa91f", "#fff8e8", "#2f748b", "#88a88f"];

function hashText(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededValue(seed, offset) {
  const value = Math.sin(seed * 0.0001 + offset * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function familyFor(visual = "dish", name = "") {
  if (["noodles", "pasta"].includes(visual)) return "noodles";
  if (["rice", "bowl", "curry"].includes(visual)) return "rice";
  if (["hotpot", "soup"].includes(visual)) return "hotpot";
  if (["sushi", "sashimi", "roll"].includes(visual)) return "sushi";
  if (["skewers", "grill"].includes(visual)) return "skewers";
  if (["burger", "sandwich", "hotdog", "taco", "crepe"].includes(visual)) return "stack";
  if (["pizza", "pie", "tart"].includes(visual)) return "slice";
  if (["cake", "dessert"].includes(visual)) return "dessert";
  if (["salad", "fruit"].includes(visual)) return "fresh";
  if (["dumplings", "snack", "snails", "fries"].includes(visual)) return "snack";
  if (["fish", "wings", "steak", "cutlet", "chicken", "beef"].includes(visual)) return "protein";
  if (/面|粉|米线/.test(name)) return "noodles";
  if (/饭|粥/.test(name)) return "rice";
  if (/锅|汤/.test(name)) return "hotpot";
  if (/鱼|虾|鸡|鸭|鹅|肉|排/.test(name)) return "protein";
  if (/豆腐|蔬|鲜|瓜|茄/.test(name)) return "fresh";
  return "dish";
}

export function getFoodArtDescriptor(food = {}) {
  const id = food.id || food.name || "today-special";
  const seed = hashText(id);
  const shift = seed % BASE_PALETTE.length;
  const palette = BASE_PALETTE.map((_, index) => BASE_PALETTE[(index + shift) % BASE_PALETTE.length]);
  const name = food.name || "今日推荐";
  const group = food.group || (food.type === "cuisine" ? "菜系" : "今日菜单");
  const visual = food.visual || food.type || "dish";

  return {
    signature: `${id}:${seed.toString(16)}`,
    name,
    group,
    visual,
    family: familyFor(visual, name),
    seed,
    palette,
    alt: `${name}的复古食堂风格菜品插画`,
  };
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function circle(context, x, y, radius, fill, stroke = null, lineWidth = 4) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }
}

function drawPaper(context, width, height, descriptor) {
  const [ink, red, yellow, paper, blue] = descriptor.palette;
  context.fillStyle = paper;
  context.fillRect(0, 0, width, height);
  context.save();
  context.globalAlpha = 0.15;
  context.strokeStyle = ink;
  context.lineWidth = 1;
  for (let x = 20; x < width; x += 26) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 20; y < height; y += 26) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.restore();

  context.fillStyle = red;
  context.fillRect(0, 0, width, 16);
  context.fillStyle = yellow;
  context.fillRect(0, height - 16, width, 16);
  context.strokeStyle = ink;
  context.lineWidth = 8;
  context.strokeRect(18, 18, width - 36, height - 36);

  context.fillStyle = blue;
  context.save();
  context.globalAlpha = 0.12;
  for (let index = 0; index < 10; index += 1) {
    circle(
      context,
      seededValue(descriptor.seed, index) * width,
      seededValue(descriptor.seed, index + 30) * height,
      2 + seededValue(descriptor.seed, index + 60) * 5,
      blue,
    );
  }
  context.restore();
}

function drawPlate(context, descriptor) {
  const [ink, red, yellow, paper, blue] = descriptor.palette;
  circle(context, 480, 320, 228, ink);
  circle(context, 480, 320, 216, paper);
  circle(context, 480, 320, 192, yellow, ink, 5);
  circle(context, 480, 320, 175, paper, red, 4);
  circle(context, 480, 320, 158, blue);
}

function drawNoodles(context, descriptor) {
  const [ink, red, yellow, paper, blue, green] = descriptor.palette;
  circle(context, 480, 330, 170, ink);
  circle(context, 480, 330, 159, red);
  circle(context, 480, 330, 144, yellow);
  context.lineCap = "round";
  for (let index = 0; index < 14; index += 1) {
    context.beginPath();
    context.moveTo(355, 275 + index * 8);
    context.bezierCurveTo(
      420,
      220 + seededValue(descriptor.seed, index) * 150,
      535,
      400 - seededValue(descriptor.seed, index + 2) * 150,
      610,
      270 + index * 7,
    );
    context.strokeStyle = index % 3 === 0 ? paper : green;
    context.lineWidth = 8;
    context.stroke();
  }
  [red, blue, green].forEach((color, index) => circle(context, 415 + index * 66, 300 + index * 16, 20, color, ink, 3));
}

function drawRice(context, descriptor) {
  const [ink, red, yellow, paper, blue, green] = descriptor.palette;
  context.fillStyle = ink;
  roundedRect(context, 300, 220, 360, 245, 48);
  context.fill();
  context.fillStyle = paper;
  roundedRect(context, 310, 230, 340, 225, 42);
  context.fill();
  context.fillStyle = yellow;
  roundedRect(context, 326, 246, 308, 190, 34);
  context.fill();
  for (let index = 0; index < 48; index += 1) {
    context.save();
    context.translate(
      350 + seededValue(descriptor.seed, index) * 260,
      270 + seededValue(descriptor.seed, index + 51) * 130,
    );
    context.rotate(seededValue(descriptor.seed, index + 90) * Math.PI);
    context.fillStyle = paper;
    roundedRect(context, -8, -3, 16, 6, 3);
    context.fill();
    context.restore();
  }
  [red, blue, green].forEach((color, index) => {
    context.fillStyle = color;
    roundedRect(context, 350 + index * 92, 300 + (index % 2) * 55, 58, 48, 12);
    context.fill();
    context.strokeStyle = ink;
    context.lineWidth = 4;
    context.stroke();
  });
}

function drawHotpot(context, descriptor) {
  const [ink, red, yellow, paper, blue, green] = descriptor.palette;
  context.fillStyle = ink;
  roundedRect(context, 264, 238, 432, 238, 78);
  context.fill();
  context.fillStyle = red;
  roundedRect(context, 278, 250, 404, 202, 65);
  context.fill();
  context.fillStyle = yellow;
  roundedRect(context, 298, 270, 364, 162, 54);
  context.fill();
  context.strokeStyle = ink;
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(480, 270);
  context.lineTo(480, 432);
  context.stroke();
  [paper, blue, green, red, paper, green].forEach((color, index) => (
    circle(context, 338 + (index % 3) * 142, 310 + Math.floor(index / 3) * 78, 28, color, ink, 4)
  ));
  context.fillStyle = ink;
  context.fillRect(300, 454, 360, 28);
}

function drawSushi(context, descriptor) {
  const [ink, red, yellow, paper, blue, green] = descriptor.palette;
  drawPlate(context, descriptor);
  const colors = [red, yellow, green, blue, red, yellow];
  colors.forEach((color, index) => {
    const x = 360 + (index % 3) * 120;
    const y = 270 + Math.floor(index / 3) * 112;
    context.fillStyle = paper;
    roundedRect(context, x, y, 90, 62, 22);
    context.fill();
    context.strokeStyle = ink;
    context.lineWidth = 5;
    context.stroke();
    context.fillStyle = color;
    roundedRect(context, x + 4, y - 12, 82, 30, 14);
    context.fill();
    context.stroke();
  });
}

function drawSkewers(context, descriptor) {
  const [ink, red, yellow, paper, blue, green] = descriptor.palette;
  drawPlate(context, descriptor);
  [red, yellow, green, blue].forEach((color, row) => {
    context.save();
    context.translate(360, 245 + row * 58);
    context.rotate(-0.12 + row * 0.04);
    context.strokeStyle = ink;
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(-35, 0);
    context.lineTo(300, 0);
    context.stroke();
    for (let index = 0; index < 5; index += 1) {
      context.fillStyle = (index + row) % 2 ? color : paper;
      roundedRect(context, index * 52, -22, 42, 44, 9);
      context.fill();
      context.strokeStyle = ink;
      context.lineWidth = 4;
      context.stroke();
    }
    context.restore();
  });
}

function drawStack(context, descriptor) {
  const [ink, red, yellow, paper, blue, green] = descriptor.palette;
  drawPlate(context, descriptor);
  const layers = [
    [330, 390, 300, 56, yellow],
    [345, 350, 270, 54, green],
    [326, 310, 308, 54, red],
    [350, 270, 260, 50, blue],
    [330, 220, 300, 70, yellow],
  ];
  layers.forEach(([x, y, width, height, color]) => {
    context.fillStyle = color;
    roundedRect(context, x, y, width, height, 28);
    context.fill();
    context.strokeStyle = ink;
    context.lineWidth = 5;
    context.stroke();
  });
  circle(context, 415, 238, 8, paper);
  circle(context, 505, 240, 8, paper);
  circle(context, 565, 252, 8, paper);
}

function drawSlice(context, descriptor) {
  const [ink, red, yellow, paper, blue, green] = descriptor.palette;
  drawPlate(context, descriptor);
  context.beginPath();
  context.moveTo(480, 210);
  context.lineTo(645, 420);
  context.quadraticCurveTo(480, 490, 315, 420);
  context.closePath();
  context.fillStyle = yellow;
  context.fill();
  context.strokeStyle = ink;
  context.lineWidth = 7;
  context.stroke();
  context.beginPath();
  context.moveTo(325, 411);
  context.quadraticCurveTo(480, 472, 635, 411);
  context.strokeStyle = red;
  context.lineWidth = 28;
  context.stroke();
  [red, blue, green, red, blue].forEach((color, index) => (
    circle(
      context,
      400 + seededValue(descriptor.seed, index) * 165,
      288 + seededValue(descriptor.seed, index + 20) * 105,
      18,
      color,
      ink,
      3,
    )
  ));
}

function drawFresh(context, descriptor) {
  const [ink, red, yellow, paper, blue, green] = descriptor.palette;
  drawPlate(context, descriptor);
  for (let index = 0; index < 18; index += 1) {
    const x = 350 + seededValue(descriptor.seed, index) * 260;
    const y = 235 + seededValue(descriptor.seed, index + 21) * 190;
    context.save();
    context.translate(x, y);
    context.rotate(seededValue(descriptor.seed, index + 42) * Math.PI);
    context.fillStyle = [green, red, yellow, blue][index % 4];
    context.beginPath();
    context.ellipse(0, 0, 31, 15, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = ink;
    context.lineWidth = 3;
    context.stroke();
    context.restore();
  }
}

function drawSnack(context, descriptor) {
  const [ink, red, yellow, paper, blue, green] = descriptor.palette;
  drawPlate(context, descriptor);
  for (let index = 0; index < 9; index += 1) {
    const angle = (index / 9) * Math.PI * 2;
    const x = 480 + Math.cos(angle) * 100;
    const y = 320 + Math.sin(angle) * 100;
    context.save();
    context.translate(x, y);
    context.rotate(angle + Math.PI / 2);
    context.fillStyle = [yellow, paper, red, green, blue][index % 5];
    context.beginPath();
    context.arc(0, 0, 38, Math.PI, 0);
    context.quadraticCurveTo(0, 28, -38, 0);
    context.closePath();
    context.fill();
    context.strokeStyle = ink;
    context.lineWidth = 4;
    context.stroke();
    context.restore();
  }
}

function drawProtein(context, descriptor) {
  const [ink, red, yellow, paper, blue, green] = descriptor.palette;
  drawPlate(context, descriptor);
  context.save();
  context.translate(480, 320);
  context.rotate(-0.12);
  context.fillStyle = red;
  context.beginPath();
  context.ellipse(0, 0, 145, 104, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = ink;
  context.lineWidth = 8;
  context.stroke();
  context.lineWidth = 6;
  context.strokeStyle = yellow;
  [-70, -25, 20, 65].forEach((offset) => {
    context.beginPath();
    context.moveTo(offset - 30, -70);
    context.lineTo(offset + 30, 70);
    context.stroke();
  });
  context.restore();
  [green, blue, paper].forEach((color, index) => circle(context, 345 + index * 135, 435, 26, color, ink, 4));
}

function drawDessert(context, descriptor) {
  const [ink, red, yellow, paper, blue, green] = descriptor.palette;
  drawPlate(context, descriptor);
  const layers = [
    [345, 378, 270, 68, red],
    [360, 318, 240, 70, paper],
    [380, 258, 200, 70, yellow],
  ];
  layers.forEach(([x, y, width, height, color]) => {
    context.fillStyle = color;
    roundedRect(context, x, y, width, height, 12);
    context.fill();
    context.strokeStyle = ink;
    context.lineWidth = 5;
    context.stroke();
  });
  circle(context, 480, 244, 30, blue, ink, 5);
  circle(context, 455, 225, 15, green, ink, 3);
}

function drawDish(context, descriptor) {
  const [ink, red, yellow, paper, blue, green] = descriptor.palette;
  drawPlate(context, descriptor);
  [red, yellow, green, blue, paper].forEach((color, index) => (
    circle(
      context,
      400 + seededValue(descriptor.seed, index) * 160,
      250 + seededValue(descriptor.seed, index + 15) * 150,
      34 + seededValue(descriptor.seed, index + 30) * 18,
      color,
      ink,
      5,
    )
  ));
}

const FAMILY_DRAWERS = {
  noodles: drawNoodles,
  rice: drawRice,
  hotpot: drawHotpot,
  sushi: drawSushi,
  skewers: drawSkewers,
  stack: drawStack,
  slice: drawSlice,
  dessert: drawDessert,
  fresh: drawFresh,
  snack: drawSnack,
  protein: drawProtein,
  dish: drawDish,
};

export function renderFoodArtwork(canvas, food) {
  if (!canvas?.getContext) return null;
  const descriptor = getFoodArtDescriptor(food);
  const context = canvas.getContext("2d");
  const width = 960;
  const height = 640;
  canvas.width = width;
  canvas.height = height;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", descriptor.alt);

  drawPaper(context, width, height, descriptor);
  (FAMILY_DRAWERS[descriptor.family] || drawDish)(context, descriptor);

  const [ink, red, yellow, paper] = descriptor.palette;
  context.fillStyle = ink;
  roundedRect(context, 52, 48, 270, 58, 4);
  context.fill();
  context.fillStyle = paper;
  context.font = '900 25px "Microsoft YaHei", sans-serif';
  context.textBaseline = "middle";
  context.fillText(descriptor.group, 72, 77);

  context.fillStyle = red;
  roundedRect(context, 638, 520, 270, 72, 4);
  context.fill();
  context.strokeStyle = ink;
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = paper;
  context.font = '900 32px "Microsoft YaHei", sans-serif';
  context.textAlign = "center";
  context.fillText(descriptor.name, 773, 556);
  context.textAlign = "left";

  context.fillStyle = yellow;
  circle(context, 892, 78, 34, yellow, ink, 5);
  context.fillStyle = ink;
  context.font = '900 19px "Microsoft YaHei", sans-serif';
  context.textAlign = "center";
  context.fillText("今日", 892, 78);
  context.textAlign = "left";
  return descriptor;
}

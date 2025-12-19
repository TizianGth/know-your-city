const path = require("path");
const { Player } = require("../shared/Player.js");
const { Room } = require(path.join("../shared/Room.js"));

const fs = require("fs");
const tokenPath = path.join(__dirname, "mapilary_api.token");
const apiToken = fs.readFileSync(tokenPath, "utf-8").trim();

console.log(apiToken);

const MAX_CODE_LENGTH = 6;
const MAX_PLAYERS = 6;
const MAX_SCORE = 5000;

class RoomManager {
  constructor() {
    this.rooms = new Map(); // key = roomCode, value = room object
  }

  generateCode() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < MAX_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  generateValidCode() {
    let code = this.generateCode();
    while (this.rooms.has(code)) {
      code = this.generateCode();
    }
    return code;
  }

  createRoom(code, hostSocketId, name) {
    this.rooms.set(code, new Room(new Player(hostSocketId, name), code));
  }

  isHost(code, socketId) {
    console.log(socketId);
    const room = this.getRoom(code);
    if (room) {
      return room.host.id == socketId;
    }
    return false;
  }

  joinRoom(code, socketId, name) {
    const room = this.getRoom(code);
    if (room && Object.keys(room.players).length < MAX_PLAYERS) {
      room.players[socketId] = new Player(socketId, name);
      return;
    }
    throw "Room full or does not exist!";
  }

  changeBounds(code, socketId, bounds) {
    const room = this.getRoom(code);
    if (!this.isHost(code, socketId)) throw "You are not the host!";
    room.bounds = bounds;
  }

  async start(code) {
    const room = this.getRoom(code);
    room.state = "started";
    return await this.fetchImageData(code, room.maxRounds);
  }

  changeState(code, socketId, state) {
    const room = this.getRoom(code);
    if (!room) return false;
    if (!this.isHost(code, socketId)) return false;
    room.state = state;
    return true;
  }

  getRoom(code) {
    return this.rooms.get(code);
  }

  getPlayers(code) {
    const room = this.getRoom(code);
    if (!room) return null;
    return room.players;
  }

  reset(code) {
    const room = this.getRoom(code);
    if (!room) return;
    room.reset();
  }

  calculateScore(imageCoords, coords) {
    const distance = this.calculateDistance(imageCoords, coords);
    const a = 500; // Distance at/after which you will not get any further points function f_b(500)=0
    const b = 100; // Max Distance at which you still get max points function f_a(100)=MAX_SCORE
    const score = (MAX_SCORE / (b - a)) * (distance - a);
    if (score >= MAX_SCORE) return MAX_SCORE;
    if (score <= 0) return 0;
    return Math.ceil(score);
  }

  calculateDistance(imageCoords, coords) {
    const lat1 = imageCoords[0];
    const lat2 = coords[0];
    const lon1 = imageCoords[1];
    const lon2 = coords[1];

    const R = 6371000; // Earth radius in km
    const toRad = (angle) => angle * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  getPlayer(code, playerId) {
    const room = this.getRoom(code);
    if (!room) return false;
    if (!room.players.hasOwnProperty(playerId)) return false;
    return room.players[playerId];
  }

  getRound(code, playerId) {
    const s = this.getPlayer(code, playerId);
    if (!s) return false;
    return s.round;
  }

  getAvgCoords(code, round) {
    const room = this.getRoom(code);
    if (!room) return;
    const p = room.imagesPerRound;
    let a = 0;
    let b = 0;
    for (let i = 0; i < p; i++) {
      a += room.coords[round * p + i][0];
      b += room.coords[round * p + i][1];
    }
    a /= p;
    b /= p;
    return [a, b];
  }

  guess(code, playerId, coords) {
    const room = this.getRoom(code);
    if (!room) return false;
    const players = this.getPlayers(code);
    if (!players.hasOwnProperty(playerId)) return false;
    const round = players[playerId].round;
    if (round >= room.maxRounds) return false;

    const imageCoords = this.getAvgCoords(code, round);
    const score = this.calculateScore(imageCoords, coords);

    console.log("Score: " + score);
    players[playerId].score += score;
    players[playerId].round += 1;
    return true;
  }

  async getMapillary(bounds, fields, limit) {
    const limitPerRequiest = limit * 50; // Mapilary api is bugged since last update!!! Issue is know. Lower limit = No or less results => WAY greater limit needed
    const url = `https://graph.mapillary.com/images?access_token=${apiToken}&fields=${fields}&bbox=${bounds.minLon},${bounds.minLat},${bounds.maxLon},${bounds.maxLat}&limit=${limitPerRequiest}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.data.length < limit) throw new Error("Not enough images");
    const _data = [];
    for (let i = 0; i < limit; i++) {
      _data.push(data.data[i]);
    }
    return _data;
  }

  async getMapillaryRetry(bounds, fields, limit) {
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      const rndCenter = getRandomCenter(bounds);
      const smallerBounds = getBoundingBoxMeters(
        rndCenter.lat,
        rndCenter.lon,
        70 // 70m*70m box
      );
      try {
        const data = await this.getMapillary(smallerBounds, fields, limit);
        return data;
      } catch (err) {
        console.log("Try: ", i + 1, "/", maxRetries, err);
      }
    }
    throw "Could not fetch images after multiple attempts";
  }

  async fetchImageData(code, amount) {
    const room = this.getRoom(code);
    if (!room) return;
    const bounds = room.bounds;
    const tasks = Array.from({ length: amount }, async () => {
      return await this.getMapillaryRetry(
        bounds,
        "id,thumb_1024_url,geometry",
        room.imagesPerRound
      );
    });
    const results = await Promise.all(tasks);
    const coords = [];
    const imgs = [];
    for (const data of results) {
      if (data == null || data.length != room.imagesPerRound)
        throw "Error fetching images";
      console.log("correct length:", data.length === room.imagesPerRound);
      data.forEach((img) => {
        coords.push([img.geometry.coordinates[1], img.geometry.coordinates[0]]);
        imgs.push(img.thumb_1024_url);
      });
    }
    room.coords = coords;
    room.images = imgs;
    return true;
  }

  removePlayer(socketId) {
    let lobbys = [];
    for (const [code, room] of this.rooms) {
      delete room.players[socketId];
      lobbys.push(code);
      if (Object.keys(room.players).length === 0) this.rooms.delete(code);
    }
    return lobbys;
  }
}

function getRandomCenter(bounds) {
  const randLat =
    bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
  const randLon =
    bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon);
  return { lat: randLat, lon: randLon };
}

function randomSmallBounds(originalBounds, maxArea = 0.01) {
  maxArea *= 0.99; // 1% margin
  const sideLength = Math.sqrt(maxArea);
  const halfSL = sideLength / 2;

  const oMaxLat = originalBounds.maxLat;
  const oMaxLon = originalBounds.maxLon;
  const oMinLat = originalBounds.minLat;
  const oMinLon = originalBounds.minLon;

  const oDegree = (oMaxLat - oMinLat) * (oMaxLon - oMinLon);
  console.log("old", oDegree);
  if (oDegree <= maxArea) return originalBounds;

  // Pick a random middle
  const randLat = oMinLat + Math.random() * (oMaxLat - oMinLat);
  const randLon = oMinLon + Math.random() * (oMaxLon - oMinLon);

  let maxLat = oMaxLat;
  let maxLon = oMaxLon;
  let minLat = oMinLat;
  let minLon = oMinLon;

  const deltaMaxLat = oMaxLat - (randLat + halfSL);
  if (deltaMaxLat >= 0) {
    maxLat = randLat + halfSL;
  }

  const deltaMinLat = oMinLat - (randLat - halfSL);
  if (deltaMinLat <= 0) {
    minLat = randLat - halfSL;
  }

  const deltaMaxLon = oMaxLon - (randLon + halfSL);
  if (deltaMaxLon >= 0) {
    maxLon = randLon + halfSL;
  }

  const deltaMinLon = oMinLon - (randLon - halfSL);
  if (deltaMinLon <= 0) {
    minLon = randLon - halfSL;
  }

  const squareDegr = (maxLat - minLat) * (maxLon - minLon);
  console.log(squareDegr);
  return {
    minLat: minLat,
    minLon: minLon,
    maxLat: maxLat,
    maxLon: maxLon,
  };
}

function getBoundingBox(lat, lon, sqDegrees) {
  const sideLength = Math.sqrt(sqDegrees);
  const halfSl = sideLength / 2;
  return {
    minLat: lat - halfSl,
    minLon: lon - halfSl,
    maxLat: lat + halfSl,
    maxLon: lon + halfSl,
  };
}

function getBoundingBoxMeters(lat, lon, sizeInMeters) {
  const R = 6378137; // Earth radius in meters
  const half = sizeInMeters / 2;

  const dLat = (half / R) * (180 / Math.PI);
  const dLon = (half / (R * Math.cos((Math.PI * lat) / 180))) * (180 / Math.PI);

  return {
    minLat: lat - dLat,
    minLon: lon - dLon, // south, west
    maxLat: lat + dLat,
    maxLon: lon + dLon, // north, east
  };
}
module.exports = new RoomManager();

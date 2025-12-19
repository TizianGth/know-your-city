

class Room {
    constructor(hostPlayer, code) {
        this.host = hostPlayer
        const id = hostPlayer.id
        this.players = {}
        this.players[id] = hostPlayer
        this.state = "waiting" // or "playing"
        this.data = {}
        this.images = []
        this.coords = []
        this.code = code
        this.bounds = null
        this.maxRounds = 5
        this.imagesPerRound = 3
    }

    reset() {
        this.state = "waiting" // or "playing"
        this.data = {}
        this.images = []
        this.coords = []
        for (const key in this.players) {
            this.players[key].reset()
        }
    }

    parse(obj) {
        //this.host = obj.host
        //this.players = obj.players
        for (const key in obj) {
            if (Object.hasOwn(obj, key)) {
                this[key] = obj[key];
            }
        }
        console.log(this)
    }
}

module.exports = { Room };
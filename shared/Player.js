class Player {
    constructor(id, name) {
        this.id = id
        this.name = name
        this.score = 0
        this.round = 0
    }
    reset() {
        this.score = 0
        this.round = 0
    }
}

module.exports = { Player };
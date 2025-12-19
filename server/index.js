const express = require("express");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// Replace with your actual certificate file paths
const options = {
    key: fs.readFileSync("selfsigned.key"),
    cert: fs.readFileSync("selfsigned.crt"),
};

const server = https.createServer(options, app);
const io = new Server(server, { cors: { origin: "*" } });

const RoomManager = require("./RoomManager");
const { Console } = require("console");

io.on("connection", (socket) => {
    socket.on("create-game", (name) => {
        console.log("create-game")
        const code = RoomManager.generateValidCode()
        try {
            RoomManager.createRoom(code, socket.id, name);
            socket.join(code);
            io.to(socket.id).emit("game-created", code, name);
        } catch (err) {
            io.to(socket.id).emit("error", "Failed to create game. Please try again");
            console.log(err);
        }
    });

    socket.on("join-game", (code, name) => {
        console.log("join-game")
        try {
            RoomManager.joinRoom(code, socket.id, name);
            socket.join(code);
            io.to(code).emit("players-changed", RoomManager.getPlayers(code));
            io.to(socket.id).emit("game-joined", code, name)
        } catch (err){
            io.to(socket.id).emit("error", "Error joining lobby. It may have been closed.");
            console.log(err);
        }

    });

    socket.on("change-bounds", (code, bounds) => {
        console.log("change-bounds")
        try {
            RoomManager.changeBounds(code, socket.id, bounds)
        } catch (err){
            io.to(code).emit("bounds-changed", bounds);
            console.log(err);
        }
    })

    function sendAllData(code) {
        const room = RoomManager.getRoom(code)
        if (!room) return
        if (room.bounds != null) {
            io.to(socket.id).emit("bounds-changed", room.bounds);
        }
        io.to(socket.id).emit("is-host", RoomManager.isHost(code, socket.id))
        const players = RoomManager.getPlayers(code)
        io.to(socket.id).emit("players-changed", players)
        console.log(players)
        io.to(socket.id).emit("state-changed", room.state);
        if (room.images)
            io.to(code).emit("images-changed", RoomManager.getRoom(code).images);
        io.to(code).emit("max-rounds", RoomManager.getRoom(code).maxRounds);
    }

    socket.on("request-all-data", (code) => {
        sendAllData(code)
    })


    socket.on("change-state", async (code, state) => {
        console.log("change-state")
        const room = RoomManager.getRoom(code)
        if (!room) return
        const success = RoomManager.changeState(code, socket.id, state)
        if (state == "started") {
            console.log(success)
            if (!success) {
                RoomManager.changeState(code, socket.id, "waiting")
                if (room.bounds == undefined) {
                    io.to(code).emit("error", "Missing bounds. Set area limits to start.");
                    return;
                }
            }
            try {
                await RoomManager.start(code)
                console.log(RoomManager.getRoom(code).images)
                io.to(code).emit("images-changed", RoomManager.getRoom(code).images);
                        io.to(code).emit("state-changed", room.state);
                return;
            } catch (err) {}
            io.to(code).emit("error", "Error fetching images. Please try again.");
            room.state = "waiting"
                    io.to(code).emit("state-changed", room.state);
        }


        io.to(code).emit("state-changed", room.state);
    })


    socket.on("guess-player", (code, coords) => {
        const success = RoomManager.guess(code, socket.id, coords)
        if (!success) return
        const round = RoomManager.getRound(code, socket.id) - 1
        //io.to(socket.id).emit("player-next", round);
        const imgCoords = RoomManager.getAvgCoords(code, round)
        if (!coords) return
        io.to(socket.id).emit("image-coords", imgCoords)
        io.to(code).emit("players-changed", RoomManager.getPlayers(code));
    })

    socket.on("next-player", (code) => {
        const round = RoomManager.getRound(code, socket.id)
        io.to(socket.id).emit("player-next", round);
    })
    socket.on("reset-game", (code) => {
        RoomManager.reset(code)
        sendAllData(code)
    })

    socket.on("disconnect", () => {
        console.log("disconnect")
        lobbys = RoomManager.removePlayer(socket.id);
        lobbys.forEach(lobby => {
            io.to(lobby).emit("players-changed", RoomManager.getPlayers(lobby));
        })
    });
});
const port = 443
server.listen(port, () => console.log("Server on http://localhost:" + port));

import React, { useState, useEffect } from "react";
import "./Home.css";
import logo from '../kyc-logo.avif'
import Blank from './Blank'
import { useNavigate } from "react-router-dom";

import { socket } from '../components/Socket';
import ErrorPopup from '../components/ErrorPopup';
export default function Home() {
    const navigate = useNavigate();
    const [code, setCode] = useState("");
    const [username, setUsername] = useState("");
    const [joined, setJoined] = useState(false)
    const [isHost, setIsHost] = useState(false)

    const [error, setError] = useState("")

    const handleJoin = () => {
        console.log("Joining lobby:", code, username);
        socket.emit("join-game", code, username)

    };

    const handleCreate = () => {
        console.log("Creating lobby for:", username);
        socket.emit("create-game", username)
    };

    useEffect(() => {


        socket.on("game-created", (code, name) => {
            setJoined(true)
            setIsHost(true)
            navigate("/lobby",
                {
                    state: { name: name, host: true, action: "create", code: code }
                });

        })
        socket.on("error", (error) => {
            setError(error)
        })


        socket.on("game-joined", (code, name) => {
            setJoined(true)
            navigate("/lobby",
                {
                    state: { name: name, host: isHost, action: "join", code: code }
                });
        })



        socket.on("is-host", (data) => {
            setIsHost(data)
        })


        return () => {
            socket.off('game-created');
            socket.off('error')
            socket.off('game-joined');
            socket.off('is-host');
        };
        

    }, []);

    return (
        <Blank>
            {
                error != "" && <ErrorPopup message={error} onClose={() => { console.log("closed"); setError("") }} />
            }
            <div className="container">
                <div className="card">
                    <img src={logo} alt="Logo" className="logo-img unselectable" />
                    <p className="subtitle">Explore. Guess. Win.</p>

                    <div className="form">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Lobby Code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <div className="buttons">
                            <button className="join" onClick={handleJoin} disabled={!username || code.length < 4}>
                                Join Lobby
                            </button>
                            <button className="create" onClick={handleCreate} disabled={!username || code.length > 0}>
                                Create Lobby
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Blank >
    );
}

import { useLocation } from "react-router-dom";

import React, { useEffect, useState, useRef } from "react";

import Blank from './Blank'
import LobbySidebar from "../components/LobbySidebar";
import MapSelectBox from '../components/Map'
import ImagesContainer from "../components/ImagesContainer"
import { useNavigate } from "react-router-dom";

import { socket } from '../components/Socket';
import ErrorPopup from '../components/ErrorPopup';
export default function Lobby() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state

    const [code, setCode] = useState()
    const [isHost, setIsHost] = useState()
    const [bounds, setBounds] = useState()
    const [images, setImages] = useState()
    const [curState, setCurState] = useState("waiting")
    const [players, setPlayers] = useState()
    const [markerCoords, setMarkerCoords] = useState()
    const [round, setRound] = useState(0)
    const [imgCoords, setImgCoords] = useState()
    const [startFailed, setStartFailed] = useState(false)
    const [maxRounds, setMaxRounds] = useState(0)



    const [error, setError] = useState("")

    useEffect(() => {
        if (!state) {
            navigate("/", { replace: true })
            return
        }
        setCode(state.code)
        setIsHost(state.host)
        socket.emit("request-all-data", state.code)


        socket.on("bounds-changed", (data) => {
            console.log("Recieved bounds: " + data)
            setBounds(data)

        })

        socket.on("state-changed", (state) => {
            setCurState(state)
            if (state == "waiting") {
                setStartFailed(true)
            } else {
                setStartFailed(false)
            }
        })
        socket.on("max-rounds", (max) => {
            setMaxRounds(max)
        })

        socket.on("players-changed", (players) => {
            setPlayers(players)
        })

        socket.on("images-changed", (images) => {
            setImages(images)
        })

        socket.on("player-next", (round) => {
            setRound(round)
        })

        socket.on("image-coords", (coords) => {
            setImgCoords(coords)
        })

        socket.on("error", (coords) => {
            setError(coords)
        })


        return () => {
            socket.off('bounds-changed');
            socket.off('state-changed')
            socket.off('players-changed')
            socket.off('images-changed')
            socket.off('player-guessed')
            socket.off('error')
        };


    }, []);


    function boundsSelected(bounds) {
        setBounds(bounds)
        console.log(state.code, bounds)
        socket.emit("change-bounds", code, bounds)
    }


    function setMarkerPosition(position) {
        if (!position) return
        console.log(position)
        setMarkerCoords([position.lat, position.lng])
    }



    function onStart() {
        console.log("Start pressed")
        console.log(curState)
        socket.emit("change-state", code, "started")
        setStartFailed(false)
    }
    function onGuess() {
        console.log("guess: " + round)
        if (!markerCoords) return
        console.log("Code: " + code)
        socket.emit("guess-player", code, markerCoords)
        setMarkerCoords(null)
        setCurState("next")
    }
    function onNext() {
        socket.emit("next-player", code)
        setCurState("started")
    }

    function setDefaults() {
        setBounds(undefined)
        setImages(undefined)
        setCurState("waiting")
        setMarkerCoords(undefined)
        setRound(0)
        setImgCoords(undefined)
        setStartFailed(false)
        setMaxRounds(0)

    }

    function onReset() {
        setDefaults()
        socket.emit("reset-game", code)
    }

    return (<Blank>
        {
            error != "" && <ErrorPopup message={error} onClose={() => { console.log("closed"); setError("") }} />
        }
        <MapSelectBox onBoundsSelected={boundsSelected} boundsRecieved={bounds} isHost={isHost}
            started={curState != "waiting"} setMarkerCoords={(setMarkerPosition)} imgCoords={imgCoords} />
        <ImagesContainer started={curState != "waiting"} images={images} round={round} />
        <LobbySidebar state={curState} isHost={isHost} players={players} startFailed={startFailed}
            onNext={onNext} onGuess={onGuess} onStart={onStart} onReset={onReset} code={code} maxRounds={maxRounds} id={socket.id} />
    </Blank>)
}
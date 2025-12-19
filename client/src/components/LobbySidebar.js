import React, { useEffect, useState, useRef } from "react";

import "./LobbySidebar.css"

export default function LobbySidebar({ state, isHost, players, onNext, onGuess, onStart, onReset, code, startFailed, maxRounds, id }) {
    const [stillWaiting, setStillWaiting] = useState(false)
    const [finished, setFinished] = useState(false)
    const [playersSorted, setPlayersSorted] = useState([])
    const playerSorted = []
    for (var key in players) {
        if (players.hasOwnProperty(key)) {
            playerSorted.push(players[key])
        }
    }

    useEffect(() => {
        if (startFailed && stillWaiting) {
            setStillWaiting(false)
        }
    }, [startFailed])

    useEffect(() => {
        isFinished()
        sortPlayersByScore()
    }, [players])

    const sortPlayersByScore = () => {
        if (!players) return
        console.log(players)
        const sorted = Object.entries(players)
            .map(([key, player]) => ({ key, ...player }))
            .sort((a, b) => b.score - a.score);
        console.log("Sorted")
        console.log(sorted)
        setPlayersSorted(sorted)
    }

    const isFinished = () => {
        if (!players || !players[id].round) return
        setFinished(players[id].round >= maxRounds)
    }
    console.log(state)
    return (

        <div className="lobby-container">
            <div className="lobby-el" style={{ 'height': 'unset' }}>
                <h2 className="lobby-text">Lobby ID: {
                    code
                }</h2>
            </div>
            <div className="lobby-el">
                <h2 className="lobby-text">Players:</h2>
                {
                    playersSorted &&

                    playersSorted.map((player, index) => (
                        // console.log(player)
                        <p style={{ margin: '0px', padding: '0.5rem', textAlign: 'left', fontWeight: '300' }}>
                            {(player ? (index + 1) + ". " + player.name + ": " + player.score + " (" + player.round + "/" + maxRounds + ")" : "")}
                        </p>
                    ))

                }
            </div >
            {false &&
                <>
                    <div className="lobby-el" style={{
                        'margin': '7.5%', 'max-height': 'fit-content', 'height': state == "waiting" ? '100%' : '0%', 'overflow': 'hidden'
                    }}>
                        <h2 className="lobby-text" style={{ 'margin': '2%' }}>Rounds:</h2>
                        <div className="lobby-btn-container">
                            <input type="range" style={{ 'margin': '0 7.5% 5% 7.5%', 'width': '100%', 'height': '1rem' }} />
                        </div>
                    </div>

                    <div className="lobby-el" style={{
                        'margin': '7.5%', 'max-height': 'fit-content', 'height': state == "waiting" ? '100%' : '0%', 'overflow': 'hidden'
                    }}>
                        <h2 className="lobby-text" style={{ 'margin': '2%' }}>Player limit:</h2>
                        <div className="lobby-btn-container">
                            <input type="range" style={{ 'margin': '0 7.5% 5% 7.5%', 'width': '100%', 'height': '1rem' }} />
                        </div>
                    </div>

                </>
            }
            <div className="lobby-btn-container" >

                {
                    finished &&
                    <button className={"lobby-el lobby-btn btn-start"} onClick={() => { onReset(); setStillWaiting(false); setFinished(false); }} disabled={!isHost}>
                        {isHost ? "Return to lobby" : "Waiting"}
                    </button>

                }

                {
                    state == "waiting" && !finished &&
                    <button className={"lobby-el lobby-btn btn-start" + (stillWaiting ? " btn-wait" : "")} onClick={() => { onStart(); setStillWaiting(true) }} disabled={!isHost}>
                        {isHost ? "Start" : "Waiting"}
                    </button>

                }
                {
                    state == "started" && !finished &&
                    <button className={"lobby-el lobby-btn btn-guess"} onClick={onGuess}>
                        {"Guess"}
                    </button>

                }

                {
                    state != "waiting" && state != "started" && !finished &&
                    <button className={"lobby-el lobby-btn btn-next"} onClick={onNext}>
                        {"Next"}
                    </button>

                }

            </div>
        </div >

    )
}
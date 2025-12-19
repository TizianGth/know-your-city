import React, { useState } from "react";
import "./Blank.css";
import background from '../background_2k.avif'



export default function Blank({ children }) {

    return (
        <div className="App">
            <div
                className="background"
                style={{   backgroundImage: `radial-gradient(circle, rgba(91,113,113,0.15) 50%, rgba(0,0,5,0.6) 100%), url(${background})`}}
            />
            <header className="App-header">
                <div style={{
                    display: 'flex', width: '80%', height: '90%', justifyContent: "center"
                }}>

                    {children}

                </div>
            </header>
        </div>
    );
}

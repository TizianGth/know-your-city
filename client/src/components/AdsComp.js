import React, { useEffect } from 'react';

const AdsComponent = (props) => {
    const { dataAdSlot } = props;



    useEffect(() => {

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        }

        catch (e) {

        }

    }, []);



    return (
        <>
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2816991215418418"
                crossorigin="anonymous"></script>
            <ins className="adsbygoogle"
                style={{ display: "block", width: '30%', height: '100vh' }}
                data-ad-client="ca-pub-2816991215418418"
                data-ad-slot={1027439346}
                data-ad-format="auto"
                data-full-width-responsive="true"
            >
            </ins>
        </>
    );
};

export default AdsComponent;
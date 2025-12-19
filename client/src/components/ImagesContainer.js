import './ImagesContainer.css'

export default function ImagesContainer({ images, started, round }) {



    //console.log(images)
    function closeModal() {
        const modal = document.getElementById('img-modal');
        modal.classList.remove('show');
    }

    function expandImage(e) {
        const modal = document.getElementById('img-modal');
        const modalImg = document.getElementById('modal-img');
        modalImg.src = e.target.src;
        modal.classList.add('show');
    }
    console.log(images)
    const displayImages = started && images && round * 2 < images.length
    const imgPerRound = 3
    return (
        <>
            <div className="img-container lobby-container" style={{ width: displayImages ? '35%' : '0%' }}>
                {[...Array(imgPerRound)].map((x, i) =>
                    <div className="img-wraper">
                        <img draggable="false" className='img border unselectable' src={displayImages ? images[i + round * imgPerRound] : ""} onClick={expandImage} />
                    </div>
                )}
            </div>

            <div id="img-modal" className="modal" onClick={closeModal}>
                <img draggable="false" id="modal-img" className="modal-content border unselectable" />
            </div>
        </>

    )
}

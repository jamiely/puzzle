const fileInput = document.getElementById('file-input');
const droppedImage = document.getElementById('dropped-image');

document.addEventListener('click', () => {
    fileInput.click();
});

// Page-wide drag and drop events
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    document.body.classList.add('dragover');
});

document.addEventListener('dragleave', (e) => {
    if (e.clientX === 0 && e.clientY === 0) {
        document.body.classList.remove('dragover');
    }
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    document.body.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            createPuzzle(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please select an image file.');
    }
}

function createPuzzle(imageSrc) {
    const img = new Image();
    img.onload = () => {
        const pieces = splitImageIntoPieces(img);
        displayPuzzle(pieces);
    };
    img.src = imageSrc;
}

function splitImageIntoPieces(img) {
    const pieceWidth = img.width / 2;
    const pieceHeight = img.height / 2;
    const pieces = [];
    
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = pieceWidth;
            canvas.height = pieceHeight;
            
            ctx.drawImage(
                img,
                col * pieceWidth, row * pieceHeight, pieceWidth, pieceHeight,
                0, 0, pieceWidth, pieceHeight
            );
            
            pieces.push({
                canvas: canvas,
                originalPosition: row * 2 + col,
                currentPosition: row * 2 + col
            });
        }
    }
    
    return pieces;
}

function displayPuzzle(pieces) {
    const puzzleContainer = document.getElementById('puzzle-container');
    puzzleContainer.innerHTML = '';
    puzzleContainer.style.display = 'grid';
    
    pieces.forEach((piece, index) => {
        const pieceContainer = document.createElement('div');
        pieceContainer.className = 'puzzle-piece';
        pieceContainer.appendChild(piece.canvas);
        puzzleContainer.appendChild(pieceContainer);
    });
}
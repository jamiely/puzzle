const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const droppedImage = document.getElementById('dropped-image');

dropArea.addEventListener('click', () => {
    fileInput.click();
});

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    
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
            droppedImage.src = e.target.result;
            droppedImage.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please select an image file.');
    }
}
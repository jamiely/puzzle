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
            droppedImage.src = e.target.result;
            droppedImage.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please select an image file.');
    }
}
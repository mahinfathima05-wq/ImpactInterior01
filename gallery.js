const galleryContainer = document.querySelector('.gallery-grid');
const defaultGalleryMarkup = galleryContainer.innerHTML;

function renderGalleryPage(items) {
    if (!items.length) {
        return;
    }

    galleryContainer.innerHTML = '';

    items.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'gallery-card';

        if (item.type === 'video') {
            card.innerHTML = `
                <video controls>
                    <source src="${item.url}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div class="gallery-label">${item.title}</div>
            `;
        } else {
            card.innerHTML = `
                <img src="${item.url}" alt="${item.title}">
                <div class="gallery-label">${item.title}</div>
            `;
        }

        galleryContainer.appendChild(card);
    });
}

window.firebaseAuthReady
    .then(() => db.collection('gallery').orderBy('createdAt', 'desc').get())
    .then((snapshot) => {
        const galleryItems = [];
        snapshot.forEach((doc) => {
            galleryItems.push(doc.data());
        });
        renderGalleryPage(galleryItems);
    })
    .catch((error) => {
        console.error('Unable to load gallery items:', error);
        galleryContainer.innerHTML = defaultGalleryMarkup;
    });

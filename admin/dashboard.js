const today = document.getElementById('today');

if (today) {
    const now = new Date();
    today.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        document.querySelectorAll('.sidebar-nav a').forEach(item => item.classList.remove('active'));
        link.classList.add('active');
        const ds = document.querySelector('.dashboard-shell');
        if (ds && ds.classList.contains('sidebar-open')) ds.classList.remove('sidebar-open');
    });
});

const projectForm = document.getElementById('project-form');
const serviceForm = document.getElementById('service-form');
const blogForm = document.getElementById('blog-form');
const galleryForm = document.getElementById('gallery-form');
const galleryFile = document.getElementById('gallery-file');
const projectList = document.getElementById('project-list');
const serviceList = document.getElementById('service-list');
const blogList = document.getElementById('blog-list');
const galleryList = document.getElementById('gallery-list');
const consultationList = document.getElementById('consultation-list');
const inquiryCountEl = document.getElementById('inquiry-count');
const subscriberList = document.getElementById('subscriber-list');
const subscriberCountEl = document.getElementById('subscriber-count');

let galleryCollection = null;
let consultationCollection = null;
let newsletterCollection = null;

const projects = JSON.parse(localStorage.getItem('impactProjects') || '[]');
const services = JSON.parse(localStorage.getItem('impactServices') || '[]');
const posts = JSON.parse(localStorage.getItem('impactPosts') || '[]');
const galleryItems = [];
const consultations = [];
const newsletterSubscribers = [];
const localConsultationsKey = 'impactConsultations';
const localSubscribersKey = 'impactNewsletterSubscribers';
let editingGalleryIndex = null;

window.firebaseAuthReady
    .then((user) => {
        if (!user) {
            throw new Error('Firebase authentication failed.');
        }
        galleryCollection = db.collection('gallery');
        consultationCollection = db.collection('consultations');
        newsletterCollection = db.collection('newsletterSubscribers');
        loadGalleryItems();
        loadConsultations();
        loadNewsletterSubscribers();
    })
    .catch((error) => {
        console.error('Firebase initialization failed:', error);
        galleryList.innerHTML = '<li><em>Firebase initialization failed. Check console and rules.</em></li>';
        if (consultationList) {
            consultationList.innerHTML = '<tr><td colspan="7"><em>Firebase initialization failed. Check console and rules.</em></td></tr>';
        }
    });

function saveData() {
    localStorage.setItem('impactProjects', JSON.stringify(projects));
    localStorage.setItem('impactServices', JSON.stringify(services));
    localStorage.setItem('impactPosts', JSON.stringify(posts));
}

function renderLists() {
    projectList.innerHTML = '';
    projects.forEach((item) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.title}</strong><span>${item.category} • ${item.location}</span>`;
        projectList.appendChild(li);
    });

    serviceList.innerHTML = '';
    services.forEach((item) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.name}</strong><span>${item.desc}</span>`;
        serviceList.appendChild(li);
    });

    blogList.innerHTML = '';
    posts.forEach((item) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.title}</strong><span>${item.desc}</span>`;
        blogList.appendChild(li);
    });

    renderGalleryList();
}

function renderGalleryList() {
    galleryList.innerHTML = '';

    if (!galleryItems.length) {
        const li = document.createElement('li');
        li.innerHTML = '<em>No gallery items yet.</em>';
        galleryList.appendChild(li);
        return;
    }

    galleryItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="list-item-content">
                <strong>${item.title}</strong>
                <span>${item.type.toUpperCase()} • ${item.url}</span>
                <span>${item.desc || ''}</span>
            </div>
            <div class="list-item-actions">
                <button type="button" class="edit-btn" data-index="${index}">Edit</button>
                <button type="button" class="delete-btn" data-index="${index}">Delete</button>
            </div>
        `;
        galleryList.appendChild(li);
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => editGalleryItem(Number(button.dataset.index)));
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => deleteGalleryItem(Number(button.dataset.index)));
    });
}

projectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('project-title').value.trim();
    const category = document.getElementById('project-category').value.trim();
    const location = document.getElementById('project-location').value.trim();

    if (title && category && location) {
        projects.unshift({ title, category, location });
        saveData();
        renderLists();
        projectForm.reset();
    }
});

serviceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('service-name').value.trim();
    const desc = document.getElementById('service-desc').value.trim();

    if (name && desc) {
        services.unshift({ name, desc });
        saveData();
        renderLists();
        serviceForm.reset();
    }
});

blogForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('blog-title').value.trim();
    const desc = document.getElementById('blog-desc').value.trim();

    if (title && desc) {
        posts.unshift({ title, desc });
        saveData();
        renderLists();
        blogForm.reset();
    }
});

galleryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('gallery-title').value.trim();
    const type = document.getElementById('gallery-type').value;
    const url = document.getElementById('gallery-url').value.trim();
    const desc = document.getElementById('gallery-desc').value.trim();
    const file = galleryFile.files[0];

    if (!title || !type || (!url && !file)) return;

    const saveGalleryItem = (itemUrl) => {
        if (!galleryCollection) {
            alert('Firebase is not ready yet. Please try again in a moment.');
            return;
        }

        const galleryItem = { title, type, url: itemUrl, desc, createdAt: firebase.firestore.FieldValue.serverTimestamp() };

        const saveToFirestore = editingGalleryIndex !== null
            ? galleryCollection.doc(galleryItems[editingGalleryIndex].id).update({ title, type, url: itemUrl, desc, updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
            : galleryCollection.add(galleryItem);

        saveToFirestore.then(() => {
            editingGalleryIndex = null;
            galleryForm.querySelector('button[type="submit"]').textContent = 'Save Gallery Item';
            galleryForm.reset();
            galleryFile.value = '';
            loadGalleryItems();
        }).catch((error) => {
            console.error('Firebase save error:', error);
            alert('Unable to save gallery item. Check your Firebase configuration and rules.');
        });
    };

    if (file) {
        const uploadPath = `gallery/${Date.now()}_${file.name}`;
        const storageRef = storage.ref(uploadPath);
        storageRef.put(file)
            .then(() => storageRef.getDownloadURL())
            .then((downloadUrl) => saveGalleryItem(downloadUrl))
            .catch((error) => {
                console.error('Upload failed:', error);
                alert('File upload failed.');
            });
    } else {
        saveGalleryItem(url);
    }
});

function editGalleryItem(index) {
    const item = galleryItems[index];
    document.getElementById('gallery-title').value = item.title;
    document.getElementById('gallery-type').value = item.type;
    document.getElementById('gallery-url').value = item.url;
    document.getElementById('gallery-desc').value = item.desc;
    editingGalleryIndex = index;
    galleryForm.querySelector('button[type="submit"]').textContent = 'Update Gallery Item';
    document.getElementById('gallery-title').focus();
}

function deleteGalleryItem(index) {
    if (!confirm('Delete this gallery item?')) return;
    const item = galleryItems[index];
    if (!item || !item.id) return;

    galleryCollection.doc(item.id).delete().then(() => {
        loadGalleryItems();
    }).catch((error) => {
        console.error('Delete failed:', error);
        alert('Unable to delete item.');
    });
}

function loadGalleryItems() {
    galleryCollection.orderBy('createdAt', 'desc').get()
        .then((snapshot) => {
            galleryItems.length = 0;
            snapshot.forEach((doc) => {
                galleryItems.push({ id: doc.id, ...doc.data() });
            });
            renderGalleryList();
        })
        .catch((error) => {
            console.error('Failed to load gallery:', error);
            galleryList.innerHTML = '<li><em>Unable to load gallery items.</em></li>';
        });
}

function renderConsultations() {
    if (!consultationList) return;

    consultationList.innerHTML = '';

    if (!consultations.length) {
        consultationList.innerHTML = '<tr><td colspan="7"><em>No consultation requests yet.</em></td></tr>';
        if (inquiryCountEl) inquiryCountEl.textContent = '0';
        return;
    }

    consultations.forEach((item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name || ''}</td>
            <td>${item.email || ''}</td>
            <td>${item.phone || ''}</td>
            <td>${item.projectType || ''}</td>
            <td>${item.budget || ''}</td>
            <td>${item.requirements || ''}</td>
            <td>${item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-IN') : ''}</td>
        `;
        consultationList.appendChild(row);
    });

    if (inquiryCountEl) inquiryCountEl.textContent = String(consultations.length);
}

function loadConsultations() {
    if (!consultationList) return;

    if (consultationCollection) {
        consultationCollection.orderBy('createdAt', 'desc').get()
            .then((snapshot) => {
                consultations.length = 0;
                snapshot.forEach((doc) => {
                    consultations.push({ id: doc.id, ...doc.data() });
                });
                renderConsultations();
            })
            .catch((error) => {
                console.error('Failed to load consultations:', error);
                loadLocalConsultations();
            });
    } else {
        loadLocalConsultations();
    }
}

function loadLocalConsultations() {
    if (!consultationList) return;

    const saved = JSON.parse(localStorage.getItem(localConsultationsKey) || '[]');
    consultations.length = 0;
    saved.forEach((item) => consultations.push(item));
    renderConsultations();
}

function saveLocalNewsletterSubscribers() {
    localStorage.setItem(localSubscribersKey, JSON.stringify(newsletterSubscribers));
}

function renderNewsletterSubscribers() {
    if (!subscriberList) return;

    subscriberList.innerHTML = '';

    if (!newsletterSubscribers.length) {
        subscriberList.innerHTML = '<li><em>No newsletter subscribers yet.</em></li>';
        if (subscriberCountEl) subscriberCountEl.textContent = '0';
        saveLocalNewsletterSubscribers();
        return;
    }

    newsletterSubscribers.forEach((item) => {
        const email = typeof item === 'string' ? item : item.email || '';
        const subscribedAt = item && item.subscribedAt ? item.subscribedAt : null;
        const dateText = subscribedAt
            ? new Date(subscribedAt.seconds ? subscribedAt.seconds * 1000 : subscribedAt).toLocaleDateString('en-IN')
            : '';
        const li = document.createElement('li');
        li.className = 'subscriber-item';
        li.innerHTML = `
            <div class="subscriber-meta">
                <strong>${email}</strong>
                <span>${dateText}</span>
            </div>
            <div class="list-item-actions">
                <button type="button" class="delete-btn subscriber-delete-btn" data-id="${item.id || email}">Delete</button>
            </div>
        `;
        subscriberList.appendChild(li);
    });

    document.querySelectorAll('.subscriber-delete-btn').forEach((button) => {
        button.addEventListener('click', () => deleteSubscriber(button.dataset.id));
    });

    if (subscriberCountEl) subscriberCountEl.textContent = String(newsletterSubscribers.length);
    saveLocalNewsletterSubscribers();
}

function loadNewsletterSubscribers() {
    if (!subscriberList) return;

    if (newsletterCollection) {
        newsletterCollection.orderBy('subscribedAt', 'desc').get()
            .then((snapshot) => {
                newsletterSubscribers.length = 0;
                snapshot.forEach((doc) => {
                    newsletterSubscribers.push({ id: doc.id, ...doc.data() });
                });
                renderNewsletterSubscribers();
            })
            .catch((error) => {
                console.error('Failed to load newsletter subscribers:', error);
                loadLocalNewsletterSubscribers();
            });
    } else {
        loadLocalNewsletterSubscribers();
    }
}

function loadLocalNewsletterSubscribers() {
    if (!subscriberList) return;

    const saved = JSON.parse(localStorage.getItem(localSubscribersKey) || '[]');
    newsletterSubscribers.length = 0;
    saved.forEach((item) => {
        if (typeof item === 'string') {
            newsletterSubscribers.push({ email: item, subscribedAt: new Date().toISOString() });
        } else {
            newsletterSubscribers.push(item);
        }
    });
    renderNewsletterSubscribers();
}

function deleteSubscriber(id) {
    if (!id) return;

    if (!confirm('Delete this subscriber?')) return;

    if (newsletterCollection) {
        newsletterCollection.doc(id).delete()
            .then(() => {
                const index = newsletterSubscribers.findIndex((item) => (item.id || item.email) === id);
                if (index !== -1) {
                    newsletterSubscribers.splice(index, 1);
                }
                renderNewsletterSubscribers();
            })
            .catch((error) => {
                console.error('Failed to delete subscriber:', error);
                alert('Unable to delete subscriber.');
            });
    } else {
        const index = newsletterSubscribers.findIndex((item) => (item.id || item.email) === id);
        if (index !== -1) {
            newsletterSubscribers.splice(index, 1);
        }
        renderNewsletterSubscribers();
    }
}

/* Mobile sidebar toggle handling */
const menuToggle = document.getElementById('menu-toggle');
const dashboardShellEl = document.querySelector('.dashboard-shell');
let sidebarOverlayEl = document.getElementById('sidebar-overlay');
if (!sidebarOverlayEl) {
    sidebarOverlayEl = document.createElement('div');
    sidebarOverlayEl.className = 'sidebar-overlay';
    sidebarOverlayEl.id = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlayEl);
}

function closeSidebar() { if (dashboardShellEl) dashboardShellEl.classList.remove('sidebar-open'); }
function openSidebar() { if (dashboardShellEl) dashboardShellEl.classList.add('sidebar-open'); }

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        if (!dashboardShellEl) return;
        dashboardShellEl.classList.toggle('sidebar-open');
    });
}

sidebarOverlayEl.addEventListener('click', closeSidebar);

window.addEventListener('resize', () => {
    if (window.innerWidth > 980) closeSidebar();
});

loadGalleryItems();
renderLists();

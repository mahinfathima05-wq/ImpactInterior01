const consultationForm = document.querySelector('.contact-form');
let consultationDbReady = false;
const localConsultationsKey = 'impactConsultations';

if (window.firebaseAuthReady) {
    window.firebaseAuthReady
        .then((user) => {
            consultationDbReady = !!user && (typeof db !== 'undefined');
        })
        .catch((error) => {
            console.error('Firebase authentication failed on consultation page:', error);
            consultationDbReady = false;
        });
}

function saveConsultationLocally(consultationData) {
    const saved = JSON.parse(localStorage.getItem(localConsultationsKey) || '[]');
    saved.unshift(consultationData);
    localStorage.setItem(localConsultationsKey, JSON.stringify(saved));
}

if (consultationForm) {
    consultationForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = consultationForm.querySelector('input[name="name"]').value.trim();
        const email = consultationForm.querySelector('input[name="email"]').value.trim();
        const phone = consultationForm.querySelector('input[name="phone"]').value.trim();
        const projectType = consultationForm.querySelector('input[name="projectType"]').value.trim();
        const budget = consultationForm.querySelector('input[name="budget"]').value.trim();
        const requirements = consultationForm.querySelector('textarea[name="requirements"]').value.trim();

        if (!name || !email || !phone || !projectType || !budget || !requirements) {
            alert('Please fill in all fields before submitting.');
            return;
        }

        const consultationData = {
            name,
            email,
            phone,
            projectType,
            budget,
            requirements,
            createdAt: new Date().toISOString()
        };

        const saveSuccess = () => {
            alert('Your consultation request has been submitted successfully. We will contact you soon.');
            consultationForm.reset();
        };

        if (!consultationDbReady) {
            saveConsultationLocally(consultationData);
            saveSuccess();
            return;
        }

        db.collection('consultations').add({
            ...consultationData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
            .then(() => {
                saveSuccess();
            })
            .catch((error) => {
                console.error('Failed to save consultation request to Firestore:', error);
                saveConsultationLocally(consultationData);
                alert('Saved locally because server save failed. Your request is still available in the dashboard on this browser.');
            });
    });
}

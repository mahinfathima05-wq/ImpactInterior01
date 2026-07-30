// ==========================
// Counter Animation
// ==========================

const counters = document.querySelectorAll(".counter");

const speed = 100;

counters.forEach(counter => {

    const updateCounter = () => {

        const target = +counter.getAttribute("data-target");

        const count = +counter.innerText;

        const increment = Math.ceil(target / speed);

        if(count < target){

            counter.innerText = count + increment;

            setTimeout(updateCounter,20);

        }else{

            counter.innerText = target + "+";

        }

    };

    updateCounter();

});
// ==========================
// FAQ Accordion
// ==========================

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {

    const question = item.querySelector(".faq-question");

    question.addEventListener("click", () => {

        faqItems.forEach(faq => {

            if(faq !== item){

                faq.classList.remove("active");

                faq.querySelector("i").className = "fa-solid fa-plus";

            }

        });

        item.classList.toggle("active");

        const icon = item.querySelector("i");

        if(item.classList.contains("active")){

            icon.className = "fa-solid fa-minus";

        }else{

            icon.className = "fa-solid fa-plus";
        }

    });

});

const newsletterForm = document.getElementById("newsletter-form");
const newsletterEmailInput = document.getElementById("newsletter-email");
const newsletterMessage = document.getElementById("newsletter-message");
const newsletterLocalKey = 'impactNewsletterSubscribers';

function saveNewsletterLocally(email) {
    const pending = JSON.parse(localStorage.getItem(newsletterLocalKey) || '[]');
    const subscriber = {
        email,
        subscribedAt: new Date().toISOString(),
        status: 'active'
    };
    if (!pending.some((item) => item.email === email || item === email)) {
        pending.push(subscriber);
        localStorage.setItem(newsletterLocalKey, JSON.stringify(pending));
    }
}

function setNewsletterMessage(text, color) {
    if (!newsletterMessage) return;
    newsletterMessage.textContent = text;
    newsletterMessage.style.color = color;
}

function handleNewsletterSubmit(email) {
    const trySave = () => {
        if (window.db) {
            const subscriberRef = window.db.collection("newsletterSubscribers").doc(email);
            subscriberRef.set({
                email,
                subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: "active"
            })
            .then(() => {
                newsletterForm.reset();
                setNewsletterMessage("Thank you for subscribing!", "#2e7d32");
            })
            .catch((error) => {
                console.error("Newsletter save failed:", error);
                saveNewsletterLocally(email);
                setNewsletterMessage("Saved locally. Firestore write failed.", "#b02b15");
            });
        } else {
            saveNewsletterLocally(email);
            setNewsletterMessage("Saved locally. Newsletter service is unavailable temporarily.", "#b02b15");
            newsletterForm.reset();
        }
    };

    if (window.firebaseAuthReady) {
        window.firebaseAuthReady
            .then(() => trySave())
            .catch(() => trySave());
    } else {
        trySave();
    }
}

if (newsletterForm && newsletterEmailInput && newsletterMessage) {
    function initNewsletterForm() {
        newsletterForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const email = newsletterEmailInput.value.trim().toLowerCase();

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setNewsletterMessage("Please enter a valid email address.", "#b02b15");
                return;
            }

            handleNewsletterSubmit(email);
        });
    }

    if (window.firebaseAuthReady) {
        window.firebaseAuthReady
            .then(() => {
                initNewsletterForm();
            })
            .catch(() => {
                initNewsletterForm();
            });
    } else {
        initNewsletterForm();
    }
}

(function () {
    var navbar = document.querySelector('.navbar');
    var navLinks = document.querySelector('.nav-links');
    if (!navbar || !navLinks) return;

    var menuToggle = document.createElement('button');
    menuToggle.type = 'button';
    menuToggle.className = 'menu-toggle';
    menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
    menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    navbar.insertBefore(menuToggle, navLinks);

    menuToggle.addEventListener('click', function () {
        navLinks.classList.toggle('open');
    });

    document.addEventListener('click', function (event) {
        if (navLinks.classList.contains('open') && !navbar.contains(event.target)) {
            navLinks.classList.remove('open');
        }
    });
})();

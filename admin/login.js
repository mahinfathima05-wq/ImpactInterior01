const form = document.getElementById("loginForm");

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (email && password) {
        window.location.href = "dashboard.html";
    }
});
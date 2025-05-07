// Authentication UI handler

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const userMenu = document.querySelector('.user-menu');
    const authLinks = document.querySelectorAll('.auth-links');
    const userName = document.getElementById('user-name');

    // Initially show auth links as default state
    if (userMenu) userMenu.style.display = 'none';
    authLinks.forEach(link => {
        link.style.display = 'block';
    });

    // Check authentication state immediately
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            console.log('User is signed in:', user.email);
            if (userMenu) userMenu.style.display = 'block';
            authLinks.forEach(link => {
                link.style.display = 'none';
            });
            if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
        } else {
            // User is signed out
            console.log('User is signed out');
            if (userMenu) userMenu.style.display = 'none';
            authLinks.forEach(link => {
                link.style.display = 'block';
            });
        }
    });
});

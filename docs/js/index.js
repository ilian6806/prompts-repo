document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded with JavaScript');
    const response = fetch(
        'https://api.github.com/repos/ilian6806/prompts-repo/releases/latest'
    ).then(response => response.json()).then(data => {
        document.getElementById('download-button').setAttribute('href', data.zipball_url);
    });
}, false);

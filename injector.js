//Inject video element
document.addEventListener('DOMContentLoaded', function () {
    //Inject the JS
    //http://stackoverflow.com/questions/9515704/building-a-chrome-extension-inject-code-in-a-page-using-a-content-script
    var script = document.createElement('script');
    script.src = chrome.extension.getURL('video.js');
    script.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);

    //Inject the HTML
    //http://stackoverflow.com/questions/16334054/inject-html-into-a-page-from-a-content-script
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open('GET', chrome.extension.getURL('video.html'), false);
    xmlHttp.send(null);
    document.body.innerHTML = xmlHttp.responseText + document.body.innerHTML;

    //Inject font awesome font face
    var s = document.createElement('style');
    s.type = 'text/css';
    s.textContent = '@font-face{font-family:"FontAwesome";src:url("'
        + chrome.extension.getURL('fonts/fontawesome-webfont.woff') + '");}';
    (document.head || document.body).appendChild(s);

    //Inject volume button images
    s = document.createElement('style');
    s.type = 'text/css'
    s.textContent =
        '#volume-button-icon.high{' +
        'background-image:url("' + chrome.extension.getURL('img/volume-high.png') + '");' +
        '}' +
        '#volume-button-icon.mid{' +
        'background-image:url("' + chrome.extension.getURL('img/volume-mid.png') + '");' +
        '}' +
        '#volume-button-icon.low{' +
        'background-image:url("' + chrome.extension.getURL('img/volume-low.png') + '");' +
        '}' +
        '#volume-button-icon.mute{' +
        'background-image:url("' + chrome.extension.getURL('img/volume-mute.png') + '");' +
        '}';
    (document.head || document.body).appendChild(s);
});


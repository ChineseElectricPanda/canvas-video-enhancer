// Block loading of jwplayer assets
chrome.webRequest.onBeforeRequest.addListener(
    function(d){
        return {cancel: true};
    },
    {urls:["https://mediastore.auckland.ac.nz/assets/jwplayer6/*", "https://mediastore.auckland.ac.nz/assets/speed.js"]},
    ["blocking"]);
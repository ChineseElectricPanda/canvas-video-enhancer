// Block loading of jwplayer assets
chrome.webRequest.onBeforeRequest.addListener(
    function(d){
        console.log(d.url);
        return {cancel: true};
    },
    {urls:["*://mediastore.auckland.ac.nz/assets/jwplayer6/*",
           "*://mediastore.auckland.ac.nz/assets/speed.js"]},
    ["blocking"]);
console.log('webRequest blocker started');
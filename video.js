console.log('INJECT Video Enhancer');

/* Config vars */
var postUrl = 'https://canvasvideoenhancer.azurewebsites.net/video';
var startTime = 42.4;
var skipTime = 10;
var shiftSkipTime = 30;

var urlRoot = window.location.href.replace(/\.preview$/, '');
var suffixes = {
    audio: '.mp3',
    low: '.mp4',
    high: '.m4v',
    full: '-slides.m4v'
};
var qualityName = {
    audio: 'Audio Only',
    low: 'Low',
    high: 'High',
    full: 'Full Frame'
};

var video = document.querySelector('#video');
var controls = document.querySelector('#controls');
var container = document.querySelector('#container');
document.querySelector('#video').currentTime = startTime;
var preview = document.querySelector('#preview');
var thumbnail = document.querySelector('#thumbnail');
var timeDisplay = document.querySelector('#time-display');
var thumbnailsOn = false;
var optionsMenu = document.querySelector('#options-menu-container');
var videoSpeed = document.querySelector('#video-speed');

var quality = 'high';

function seekVideo(event, el) {
    //Get playtime of mouse position
    var rect = el.getBoundingClientRect();
    var position = video.duration / rect.width * (event.pageX - rect.left);
    video.currentTime = position;
}

var previewHider;
//Listener for seek bar hover
function hoverSeekBar(event, el) {
    //Get playtime of mouse position
    var rect = el.getBoundingClientRect();
    var position = video.duration / rect.width * (event.pageX - rect.left);
    //only change thumbnail if it is visible and not in audio only
    if (thumbnailsOn && quality != 'audio') {
        thumbnail.currentTime = position;
    }
    //Display time in h:mm:ss or m:ss
    document.querySelector('#thumbnail-text').innerText = toTimeString(position);
    //Set the length of the hover bar
    document.querySelector('#hover-progress').style.width = event.pageX - rect.left;

    //Show the preview thumbnail
    clearTimeout(previewHider);
    preview.style.display = 'block';
    setTimeout(function () {
        preview.style.opacity = 1;
    });

    //set the position of the preivew
    var previewPosition = event.pageX - rect.left           //mouse position relative to edge of seek bar
        + (video.getBoundingClientRect().width / 40)       //offset by margin (2.5% of video)
        - (thumbnail.getBoundingClientRect().width / 2);   //offset by preview size (50% of thumbnail size)

    //Only clamp position if thumbnail is on (otherwise the label is small enough to fit anyway)
    if (thumbnailsOn) {
        //must be >0
        previewPosition = Math.max(0, previewPosition);
        //must be <[video width]-[thumbnail width]
        previewPosition = Math.min(video.getBoundingClientRect().width - thumbnail.getBoundingClientRect().width, previewPosition);
    }
    preview.style.left = previewPosition;

    //if the lmb is pressed down also trigger the seek
    if (event.buttons == 1) {
        seekVideo(event, el);
    }
}

//When mouse leaves seek bar remove the hover bar
function stopHoverSeekBar() {
    //hide the hover seek bar
    document.querySelector('#hover-progress').style.width = 0;
    //hide the preview thumbnail
    preview.style.opacity = 0;
    previewHider = setTimeout(function () {
        preview.style.display = 'none';
    }, 100);
}
function updateSeekDisplay() {
    //calculate position of seek handle
    var width = document.querySelector('#seek-bar').getBoundingClientRect().width;
    var position = video.currentTime * width / video.duration;

    //Set position of seek handle and width of progress bar
    document.querySelector('#seek-handle').style.left = position - 5 + 'px';
    document.querySelector('#seek-progress').style.width = position + 'px';

    //Update the loading progress
    if (video.buffered.length == 0) {
        document.querySelector('#load-progress').width = 0;
    }

    for (var i = 0; i < video.buffered.length; i++) {
        //only care about the progress overlapping current play time
        if (video.buffered.start(i) < video.currentTime
            && video.currentTime < video.buffered.end(i)) {
            document.querySelector('#load-progress').style.width = video.buffered.end(i) * width / video.duration + 'px';
        }
    }
}

function updateTimeDisplay() {
    timeDisplay.innerText = toTimeString(video.currentTime) + ' / ' + toTimeString(video.duration);
}

function toggleThumbnails() {
    thumbnailsOn = !thumbnailsOn;
    document.querySelector('#thumbnails-slider-bg').className = thumbnailsOn ? 'on' : '';
    document.querySelector('#thumbnail').style.visibility = thumbnailsOn && quality != 'audio' ? 'visible' : 'hidden';

    //Set the src of the preview if turning it on for the first time
    if (thumbnailsOn) {
        thumbnail.src = urlRoot + '.mp4';
    }
}
function showQualityMenu() {
    //hide all top level items
    document.querySelector('#top-level').style.display = 'none';
    //show all quality selectors
    document.querySelector('#quality-select').style.display = 'block';
    //set the state of the menu
    document.querySelector('#options-menu').className = 'options-mode';
    document.querySelector('#options-menu-bg').className = 'options-mode';
}

function hideQualityMenu() {
    //hide all quality selectors
    document.querySelector('#quality-select').style.display = 'none';
    //show all top level items
    document.querySelector('#top-level').style.display = 'block';
    //set the state of the menu
    document.querySelector('#options-menu').className = '';
    document.querySelector('#options-menu-bg').className = '';
}

function setQuality(q) {
    //set the quality
    quality = q;
    document.querySelector('#selected-quality').innerText = qualityName[q];

    //save selected quality
    localStorage.setItem('canvasVideoEnhancerQuality', q);

    //Save video state
    var paused = video.paused;
    var playbackRate = video.playbackRate;
    var currentTime = video.currentTime;
    var volume = video.volume;

    //Change src
    video.src = urlRoot + suffixes[q];

    //Restore video state
    video.playbackRate = playbackRate;
    video.currentTime = currentTime;
    video.volume = volume;
    if (!paused) {
        video.play();
    }

    if (q == 'audio') {
        //if audio only, hide thumbnails
        document.querySelector('#thumbnail').style.visibility = 'hidden';
        //always show controls
        hoverOver('audio-only');
        //show audio only hint
        document.querySelector('#audio-only-hint-container').style.display = 'table';
    } else {
        //else restore thumbnails (if it was on previously)
        if (thumbnailsOn) {
            //Set the src of the preview if turning it on for the first time
            thumbnail.src = urlRoot + '.mp4';
        }
        document.querySelector('#thumbnail').style.visibility = thumbnailsOn ? 'visible' : 'hidden';

        hoverLeave('audio-only');
        document.querySelector('#audio-only-hint-container').style.display = 'none';
    }

    //untick all items in the quality select menu
    for (var i = 0; i < document.querySelectorAll('#quality-select tr').length; i++) {
        document.querySelectorAll('#quality-select tr')[i].className = '';
    }
    //set the tick in the quality select menu
    document.querySelector('#quality-' + q).className = 'selected';
}

var bookmarks;

function bookmarkComparator(b1, b2) {
    return b1.time - b2.time;
}

function sortBookmarks() {
    bookmarks.sort(bookmarkComparator);
}

function loadBookmarks() {
    // Only load bookmarks if it hasn't been loaded yet
    if(bookmarks != undefined) {
        return;
    }

    bookmarks = localStorage.getItem('canvasVideoEnhancerBookmark-' + urlRoot.replace(/^https?:\/\/.+?\//, ''));
    try {
        bookmarks = JSON.parse(bookmarks);
    } catch (err) {
        bookmarks = null;
    }

    // If bookmarks was not parsed or doesn't exist or is not an array, create a new array to hold bookmarks
    if(!bookmarks || bookmarks.constructor !== Array) {
        bookmarks = [];
    }
}

function saveBookmarks() {
    localStorage.setItem('canvasVideoEnhancerBookmark-' + urlRoot.replace(/^https?:\/\/.+?\//, ''), JSON.stringify(bookmarks));
}

function updateBookmarkDisplays() {
    sortBookmarks();

    // Add entries to bookmarks table
    var bookmarksTable = document.querySelector('#bookmarks-table');
    var html = '';
    for(var i = 0; i < bookmarks.length; i++) {
        var bookmark = bookmarks[i];
        html +=
        '<tr class="bookmark-item" onclick="video.currentTime=' + bookmark.time + '"> \
            <td onclick="enableRenameBookmark(' + i + ', true); event.stopPropagation()"><i class="fa fa-pencil"></i></td> \
            <td oninput="renameBookmark(' + i + ', this.innerText)" onblur="enableRenameBookmark(' + i + ', false)" onclick="if(this.contentEditable === \'true\') { event.stopPropagation(); }">' + bookmark.label +'</td> \
            <td>' + toTimeString(bookmark.time) + '</td> \
            <td onclick="deleteBookmark(' + i + '); event.stopPropagation()"><i class="fa fa-times"></i></td> \
        </tr>';
    }
    bookmarksTable.innerHTML = html;

    // Add markers to seek bar
    var bookmarksMarkersContainer = document.querySelector('#bookmarks-markers-container');
    html = '';
    for(var i = 0; i < bookmarks.length; i++) {
        var bookmark = bookmarks[i];
        // Calculate screen position of bookmark time
        var x = bookmark.time / video.duration * 100;
        html += '<div style="left: ' + x + '%;"></div>';
    }
    bookmarksMarkersContainer.innerHTML = html;
}

function createBookmark() {
    var time = Math.floor(video.currentTime);

    // Don't create if there is already an existing bookmark at the same time
    for(var i = 0; i < bookmarks.length; i++){
        if(bookmarks[i].time == time){
            return false;
        }
    }

    bookmarks.push({
        time: time,
        label: 'Bookmark ' + (bookmarks.length + 1)});
    saveBookmarks();
    updateBookmarkDisplays();
    return true;
}

function enableRenameBookmark(index, enable) {
    var inputField = document.querySelectorAll('.bookmark-item>td:nth-child(2)')[index];
    inputField.contentEditable = enable;
    if(enable){
        inputField.focus();
        // Select all in field
        document.execCommand('selectAll',false,null);
    }
}

function renameBookmark(index, value) {
    bookmarks[index].label = value;
    saveBookmarks();
}

function deleteBookmark(index) {
    bookmarks.splice(index, 1);
    saveBookmarks();
    updateBookmarkDisplays();
}

function clearBookmarks() {
    localStorage.removeItem('canvasVideoEnhancerBookmark-' + urlRoot.replace(/^https?:\/\/.+?\//, ''));
}

function downloadVideo() {
	//create virtual link for downloading and click it
	var link = document.createElement('a');
	var fileName = info.courseName + info.courseNumber + '-' + info.year + '-' + info.month + '-' + info.day;
	link.download = fileName + '.' + suffixes[quality].split('.')[suffixes[quality].split('.').length - 1];
	link.href = urlRoot + suffixes[quality];
	link.click();
}

function setVolume(vol) {
    video.volume = vol;
    //save selected volume
    localStorage.setItem('canvasVideoEnhancerVolume', vol);
    document.querySelector('#volume-slider').value = vol;
    if (vol == 0) {
        document.querySelector('#volume-button-icon').className = 'mute';
    } else if (vol < 0.34) {
        document.querySelector('#volume-button-icon').className = 'low';
    } else if (vol < 0.67) {
        document.querySelector('#volume-button-icon').className = 'mid';
    } else {
        document.querySelector('#volume-button-icon').className = 'high';
    }
}

var lastInputVolume;
function toggleMute() {
    if (video.volume == 0) {
        setVolume(lastInputVolume)
    } else {
        setVolume(0);
    }
}

function setSpeed(s) {
    s = Math.min(3, Math.max(0.5, Math.round(s * 100) / 100));
    video.playbackRate = s;
    video.playbackRate = s;
    videoSpeed.value = s;
}

function showOptionsMenu() {
    optionsMenu.style.display = 'block';
    if (currentHovers.indexOf('options') < 0) {
        currentHovers.push('options');
    }
}

function hideOptionsMenu() {
    optionsMenu.style.display = 'none';
    hideQualityMenu();
    if (currentHovers.indexOf('options') > -1) {
        currentHovers.splice(currentHovers.indexOf('options'), 1);
    }
}
function toggleOptionsMenu() {
    if (optionsMenu.style.display == 'block') {
        hideOptionsMenu();
    } else {
        showOptionsMenu();
    }
}

//keep track of elements currently being hovered over (preventing interface hiding)
var currentHovers = [];
var hideControlsTimer;
function hoverOver(id) {
    //cancel the timer for hiding controls
    clearTimeout(hideControlsTimer);
    //add element to hovered list
    if (currentHovers.indexOf(id) < 0) {
        currentHovers.push(id);
    }
    //make controls visible
    controls.style.opacity = 1;
}
function hoverLeave(id) {
    clearTimeout(hideControlsTimer);
    if (currentHovers.indexOf(id) > -1) {
        currentHovers.splice(currentHovers.indexOf(id), 1);
    }
    if (currentHovers.length == 0) {
        hideControlsTimer = setTimeout(function () {
            controls.style.opacity = 0;
        }, 2000);
    }
}
function hoverTrigger() {
    hoverOver('');
    hoverLeave('');
}

function clickVideo() {
    if (optionsMenu.style.display == 'none' && document.querySelector('#hotkeys-reference-container').style.display == 'none') {
        playPause();
    }
    hideOptionsMenu();
    hideHotkeysReference();
}

function mouseLeaveContainer() {
    if (currentHovers.length == 0) {
        controls.style.opacity = 0;
    }
}

//Toggles fullscreen for an element
function toggleFullScreen(element) {
    if (!document.fullscreenElement &&    // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {  // current working methods
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

//Convert time in seconds to h:mm:ss or m:ss
function toTimeString(time) {
    if (typeof time != 'number' || isNaN(time)) {
        return '0:00';
    }
    var str = '';
    if (time > 3600) {
        str += Math.floor(time / 3600) + ':';
        str += Math.floor((time % 3600) / 60) > 9 ? Math.floor((time % 3600) / 60) : '0' + Math.floor((time % 3600) / 60);
        str += ':'
    } else {
        str += Math.floor((time % 3600) / 60) + ':';
    }
    str += Math.floor(time % 60) > 9 ? Math.floor(time % 60) : '0' + Math.floor(time % 60);
    return str;
}

function playPause() {
    if (video.paused) {
        video.play();
        document.querySelector('#play-button i').className = 'fa fa-pause';
        hoverLeave('paused');
        showHotkeyPopup('play');
    } else {
        video.pause();
        document.querySelector('#play-button i').className = 'fa fa-play';
        hoverOver('paused');
        showHotkeyPopup('pause');
    }
}

//Parses url into lecture
//TODO course name/number for joint lectures (eg COMPSCI345L01CSOFTENG350L01C)
function parseUrl(url) {
    var info = {};
    //Remove hostname and file extension from url
    url = url.replace(/^https?:\/\/.+?\//, '');
    url = url.replace(/\..+$/, '');

    url = url.split('/');

    try {
        info.courseName = url[2].match(/[A-Z]+/)[0];
        info.courseNumber = url[2].match(/[0-9]+G?/)[0];
    } catch (e) {
        info.courseName = url[2] || '';
        info.courseNumber = '';
    }

    try {
        var dateTimeString = url[url.length - 1].match(/\d+/)[0];

        info.year = dateTimeString.slice(0, 4);
        info.month = dateTimeString.slice(4, 6);
        info.day = dateTimeString.slice(6, 8);
        info.hour = dateTimeString.slice(8, 10);
        info.minute = dateTimeString.slice(10, 12);
    } catch (e) {
        info.year = '';
        info.month = '';
        info.day = '';
    }
    return info;
}

//Shows the hotkey popup
function showHotkeyPopup(icon, text) {
    //hide all icons
    for (var i = 0; i < document.querySelectorAll('.hotkey-popup-icon').length; i++) {
        document.querySelectorAll('.hotkey-popup-icon')[i].style.display = 'none';
    }
    //show the selected icon
    document.querySelector('#hotkey-popup-' + icon).style.display = 'block';

    document.querySelector('#hotkey-popup-text').innerText = text || '';

    document.querySelector('#hotkey-popup').style.transition = '';
    document.querySelector('#hotkey-popup').className = 'active';
    //trigger the animation
    setTimeout(function () {
        document.querySelector('#hotkey-popup').style.transition = 'transform 1s, -webkit-transform 1s, opacity 1s';
        document.querySelector('#hotkey-popup').className = 'inactive';
    }, 50)
}

function showHotkeysReference() {
    document.querySelector('#hotkeys-reference-container').style.display = 'table';
    hoverOver('hotkeys-reference');
}

function hideHotkeysReference() {
    document.querySelector('#hotkeys-reference-container').style.display = 'none';
    hoverLeave('hotkeys-reference');
}

function toggleHotkeysReference() {
    if (document.querySelector('#hotkeys-reference-container').style.display == 'none') {
        showHotkeysReference();
    } else {
        hideHotkeysReference();
    }
}

//Update seek bar and time text when time changes
video.addEventListener('timeupdate', updateSeekDisplay);
video.addEventListener('timeupdate', updateTimeDisplay);
//For added consistency
setInterval(function () {
    updateSeekDisplay();
    updateTimeDisplay();
}, 200);

video.addEventListener('progress', updateSeekDisplay);

//clicking outside the video hides the options
document.body.addEventListener('click', hideOptionsMenu);
document.body.addEventListener('click', hideHotkeysReference);

//Set the title of the video and page
var info = parseUrl(urlRoot);
document.title = info.courseName + ' ' + info.courseNumber + ' ' + info.year + '-' + info.month + '-' + info.day;
document.querySelector('#title').innerText = info.courseName + ' ' + info.courseNumber + ' ' + info.year + '-' + info.month + '-' + info.day;

//Load default/saved values todo todo todo
//Quality
setQuality(localStorage.getItem('canvasVideoEnhancerQuality') || 'high');
//Volume
setVolume(localStorage.getItem('canvasVideoEnhancerVolume') || 1);
lastInputVolume = setVolume(localStorage.getItem('canvasVideoEnhancerVolume') || 1);

currentHovers.push('paused');

// Enter key quits the renaming bookmark mode
document.addEventListener('keydown', function(e) {
    if(document.activeElement.parentElement.classList.contains('bookmark-item') && e.keyCode == 13) {
        document.activeElement.blur();
    }
});

//Video Hotkeys
document.addEventListener('keydown', function (e) {
    if(document.activeElement.contentEditable === 'true' || document.activeElement == 'INPUT') {
        return;
    }
    switch (e.keyCode) {
        //Space play/pauses
        case 32:
            hoverTrigger();
            playPause();
            break;
        //F toggles fullscreen
        case 70:
            toggleFullScreen(container);
            break;
        //Left arrow skips back
        case 37:
            hoverTrigger();
            //Shift modifier makes skip longer
            if (e.shiftKey) {
                video.currentTime -= shiftSkipTime;
                showHotkeyPopup('skip-backward', shiftSkipTime + 's');
            } else {
                video.currentTime -= skipTime;
                showHotkeyPopup('skip-backward', skipTime + 's');
            }
            break;
        //Right arrow skips forward
        case 39:
            hoverTrigger();
            //Shift modifier makes skip longer
            if (e.shiftKey) {
                video.currentTime += shiftSkipTime;
                showHotkeyPopup('skip-forward', shiftSkipTime + 's');
            } else {
                video.currentTime += skipTime;
                showHotkeyPopup('skip-forward', skipTime + 's');
            }
            break;
        //, slows down
        case 188:
            videoSpeed.value -= 0.1;
            setSpeed(videoSpeed.value);
            showHotkeyPopup('slower', videoSpeed.value + 'x');
            break;
        //. speeds up
        case 190:
            videoSpeed.value = Number(videoSpeed.value) + 0.1;
            setSpeed(videoSpeed.value);
            showHotkeyPopup('faster', videoSpeed.value + 'x');
            break;
        // / resets videoSpeed
        case 191:
            setSpeed(1);
            showHotkeyPopup('play', videoSpeed.value + 'x');
            break;
        // B creates a bookmark at the current location
        case 66:
            if(createBookmark()) {
                showHotkeyPopup('bookmark');
            }
            break;
    }
});

function logVideoUrl() {
    var xmlHttp = new XMLHttpRequest();
    var url = postUrl;
    xmlHttp.open('POST', url, true);

    xmlHttp.setRequestHeader('Content-type', 'application/json');
    var url = urlRoot;
    //Remove hostname and file extension from url
    url = url.replace(/^https?:\/\/.+?\//, '');
    xmlHttp.send(JSON.stringify({url: url}));
}

logVideoUrl();
loadBookmarks();

video.addEventListener('loadedmetadata', function(){
    updateBookmarkDisplays();
});

var playlist = [];
var weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var semester = ['Summer School', '', 'Quarter 1', 'Semester 1', 'Quarter 2', 'Semester 2', 'Quarter 3', '', 'Quarter 4', ''];
const API_ROOT_URL = 'https://canvasvideoenhancer.azurewebsites.net';

function init() {
    httpGetAsync(API_ROOT_URL + '/api/v1/playlist?course=' + info.courseCode + '&semester_code=' + info.semesterCode, function (data) {
        data = JSON.parse(data);

        // Check if the current video is in the list of videos retrieved
        var found = false;
        for (var i = 0; i < data.length; i++) {
            var v = data[i];
            if (v.year == parseInt(info.year)
                && v.month == parseInt(info.month)
                && v.day == parseInt(info.day)
                && v.hour == parseInt(info.hour)
                && v.minute == parseInt(info.minute)) {
                found = true;
                break;
            }
        }

        // Add the current video to the list of videos if it isn't there
        if (!found) {
            data.push({
                video_id: 1,
                url: window.location.pathname.replace(/\.preview$/, ''),
                year: info.year,
                month: info.month,
                day: info.day
            });
        }

        // Sort playlist by date
        data.sort(playlistEntryComparator);
        playlist = data;

        playlistList = document.querySelector('#playlist-list');
        var currentItem = null;
        for (var i = 0; i < data.length; i++) {
            var v = data[i];
            v.date = new Date(v.year, v.month - 1, v.day, v.hour, v.minute);

            var playlistItem = document.createElement('div');
            playlistItem.className = 'playlist-item';
            playlistItem.setAttribute('onclick', 'selectVideo(this, true)');
            playlistItem.dataset.id = v.video_id;
            playlistItem.dataset.url = toMediastoreUrl(v)
            playlistItem.innerText = weekday[v.date.getDay()] + ' ' + v.day + ' ' + month[v.month - 1];

            // Add the playlist entry to the playlist list
            playlistList.appendChild(playlistItem);

            // If this video in the playlist is the one on the current page, select it
            if (currentItem == null && window.location.href.indexOf(playlistItem.dataset.url) != -1) {
                currentItem = playlistItem;
            }
        }

        selectVideo(currentItem, false);

        var courses = parseCourseNames(info.courseCode);
        var coursesField = document.querySelector('#course-name');
        coursesField.innerText = courses[0];
        for (var i = 1; i < courses.length; i++) {
            coursesField.innerText += '\n' + courses[i];
        }
        document.querySelector('#semester').innerText = semester[data[0].semester_code % 10] + ', ' + v.course_year;
        document.querySelector('#total-videos').innerText = playlist.length;

        var playlistItems = document.querySelector('.playlist-item');
    });

    selectTab(localStorage.getItem('canvasVideoEnhancerSelectedTab') || 'playlist');
}

window.onpopstate = function (event) {
    selectVideo(document.querySelector('.playlist-item[data-id="' + event.state.id + '"]'), false);
}

function selectVideo(el, pushState) {
    // Unselect all playlist elements
    document.querySelectorAll('.playlist-item').forEach(function (e) {
        e.className = e.className.replace(/ ?selected/, '');
    });
    // Select the current item
    el.className += ' selected';

    var url = el.dataset.url;
    urlRoot = 'https://mediastore.auckland.ac.nz' + url;

    video.src = urlRoot;

    //Set the title of the video and page
    info = parseUrl(urlRoot);
    var title = info.courseName + ' ' + info.courseNumber + ' ' + info.year + '-' + info.month + '-' + info.day;
    document.title = title;
    document.querySelector('#title').innerText = title;

    // Set the playlist progress number
    for (var i = 0; i < playlist.length; i++) {
        if (playlist[i].video_id == el.dataset.id) {
            document.querySelector('#current-video').innerText = (i + 1);
            break;
        }
    }

    if (pushState) {
        // Change the url
        history.pushState({id: el.dataset.id}, '', el.dataset.url + '.preview');
    }

    // Load default/saved values
    setQuality(localStorage.getItem('canvasVideoEnhancerQuality') || 'high');
    setVolume(localStorage.getItem('canvasVideoEnhancerVolume') || 1);
    lastInputVolume = setVolume(localStorage.getItem('canvasVideoEnhancerVolume') || 1);
    video.currentTime = startTime;
    playVideo();
}

function playVideo() {
    document.querySelector('#play-button i').click();
}

function toMediastoreUrl(v) {
    if ('url' in v) {
        return v.url;
    }
    var url = '/' +
        v.course_year + '/' +
        v.semester_code + '/' +
        v.course + '/' +
        v.infix + '/' +
        v.prefix + v.year + v.month.padLeft(2) + v.day.padLeft(2) + v.hour.padLeft(2) + v.minute.padLeft(2) + '.' +
        v.suffix;
    return url;
}

Number.prototype.padLeft = function (n, str) {
    return Array(n - String(this).length + 1).join(str || '0') + this;
};

function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
    return null;
};

function parseCourseNames(str) {
    var courses = str.match(/[A-z]+?\d+?[A-z]?[A-z]\d+?[A-z]/g);
    for (var i = 0; i < courses.length; i++) {
        var c = courses[i];
        var subject = c.match(/[A-z]+?(?=\d)/)[0];
        var stream = c.match(/[A-z]\d+?[A-z]$/)[0];
        var courseCode = c.replace(subject, '').replace(stream, '');
        courses[i] = subject + ' ' + courseCode + ' ' + stream;
    }
    return courses;
}

function selectTab(name) {
    // Unselect all tabs
    document.querySelectorAll('.tab').forEach(function (el) {
        el.className = el.className.replace(/ ?selected/, '');
    });
    // Hide all tables
    document.querySelectorAll('.tab-content-container').forEach(function (el) {
        el.style.display = 'none';
    });

    // Select the given tab
    document.querySelector('#' + name + '-tab-header').className += ' selected';
    document.querySelector('#' + name + '-container').style.display = 'flex';
    localStorage.setItem('canvasVideoEnhancerSelectedTab', name);
}


function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function playlistEntryComparator(v1, v2) {
    if (v1.year < v2.year) {
        return -1;
    } else if (v1.year > v2.year) {
        return 1;
    }

    if (v1.month < v2.month) {
        return -1;
    } else if (v1.month > v2.month) {
        return 1;
    }

    if (v1.day < v2.day) {
        return -1;
    } else if (v1.day > v2.day) {
        return 1;
    }

    if (v1.hour < v2.hour) {
        return -1;
    } else if (v1.hour > v2.hour) {
        return 1;
    }

    if (v1.minute < v2.minute) {
        return -1;
    } else if (v1.minte > v2.minute) {
        return 1;
    }

    return 0;
}

init();
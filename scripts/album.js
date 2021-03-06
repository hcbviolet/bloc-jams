var setCurrentAlbum = function(album) {
    currentAlbum = album;
    var $albumTitle = $('.album-view-title');
    var $albumArtist = $('.album-view-artist');
    var $albumReleaseInfo = $('.album-view-release-info');
    var $albumImage = $('.album-cover-art');
    var $albumSongList = $('.album-view-song-list');
    
    $albumTitle.text(album.title);
    $albumArtist.text(album.artist);
    $albumReleaseInfo.text(album.year + ' ' + album.label);
    $albumImage.attr('src', album.albumArtUrl);
    
    $albumSongList.empty();
    for (var i = 0; i < album.songs.length; i++) {
        var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration);
        $albumSongList.append($newRow);
    }
};

var updateSeekBarWhileSongPlays = function() {
    if (currentSoundFile) {
        currentSoundFile.bind('timeupdate', function(event) {
            var seekBarFillRatio = this.getTime() / this.getDuration();
            var $seekBar = $('.seek-control .seek-bar');
            setCurrentTimeInPlayerBar(filterTimeCode(this.getTime()));
            updateSeekPercentage($seekBar, seekBarFillRatio);
        });
    }
};
 
var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
    var offsetXPercent = seekBarFillRatio * 100;
    offsetXPercent = Math.max(0, offsetXPercent);
    offsetXPercent = Math.min(100, offsetXPercent);
    var percentageString = offsetXPercent + '%';
    $seekBar.find('.fill').width(percentageString);
    $seekBar.find('.thumb').css({left: percentageString});
};

var setupSeekBars = function() {
    var $seekBars = $('.player-bar .seek-bar');

    $seekBars.click(function(event) {
         var offsetX = event.pageX - $(this).offset().left;
         var barWidth = $(this).width();
         var seekBarFillRatio = offsetX / barWidth;
        
        if ($(this).parent().attr('class') == 'seek-control') {
            seek(seekBarFillRatio * currentSoundFile.getDuration());
        } else {
            setVolume(seekBarFillRatio * 100);
        }

     updateSeekPercentage($(this), seekBarFillRatio);
    });
    
     $seekBars.find('.thumb').mousedown(function(event) {
         var $seekBar = $(this).parent();
 
         $(document).bind('mousemove.thumb', function(event){
             var offsetX = event.pageX - $seekBar.offset().left;
             var barWidth = $seekBar.width();
             var seekBarFillRatio = offsetX / barWidth;
             
             if ($(this).parent().attr('class') == 'seek-control') {
                 seek(seekBarFillRatio * currentSoundFile.getDuration());
             } else {
                 setVolume(seekBarFillRatio * 100);
             }
 
             updateSeekPercentage($seekBar, seekBarFillRatio);
         });
 
         $(document).bind('mouseup.thumb', function() {
             $(document).unbind('mousemove.thumb');
             $(document).unbind('mouseup.thumb');
         });
     });
};

var currentlyPlayingSongNumber = null;
var currentSongFromAlbum = null;
var currentAlbum = null;
var currentSoundFile = null;
var currentVolume = 80;
var $previousButton = $('.main-controls .previous');
var $nextButton = $('.main-controls .next');
var $playPauseBarButton = $('.main-controls .play-pause')

var trackIndex = function(album, song) {
     return album.songs.indexOf(song);
 };

var nextSong = function() {
    var currentIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    currentIndex ++;
    
    var getLastSongNumber = function(index) {
        return index == 0 ? currentAlbum.songs.length : index;
    };
    
    if (currentIndex === currentAlbum.songs.length) {
        currentIndex = 0;    
    }
    
    setSong(currentIndex + 1);
    currentSoundFile.play(); 
    updateSeekBarWhileSongPlays();
    updatePlayerBarSong();
    
    var lastSongNumber = getLastSongNumber(currentIndex);
    var $nextSongNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $lastSongNumberCell = getSongNumberCell(lastSongNumber);
    $nextSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
};

var previousSong = function() {
    var getLastSongNumber = function(index) {
        return index == (currentAlbum.songs.length - 1) ? 1 : index + 2;
    };
    
    var currentIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    currentIndex--;
    
    if (currentIndex < 0) {
        currentIndex = currentAlbum.songs.length - 1;
    }
    
    setSong(currentIndex + 1);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();
    updatePlayerBarSong();
    
    var lastSongNumber = getLastSongNumber(currentIndex);
    var $previousSongNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $lastSongNumberCell = getSongNumberCell(lastSongNumber);
    
    $previousSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);  
};


$(document).ready(function(){
    setCurrentAlbum(albumPicasso);
    setupSeekBars();
    $previousButton.click(previousSong);
    $nextButton.click(nextSong);
    $playPauseBarButton.click(togglePlayFromPlayerBar);
});

var togglePlayFromPlayerBar = function() {
    // if there's no currently playing song to play or pause,
    // play the first one
    
    if (!currentSoundFile) {
        setSong(1);
        var currentlyPlayingElement = getSongNumberCell(currentlyPlayingSongNumber);
        currentSoundFile.play();
        updateSeekBarWhileSongPlays();        
        updatePlayerBarSong();
        currentlyPlayingElement.html(pauseButtonTemplate);
    } else {
        var currentlyPlayingElement = getSongNumberCell(currentlyPlayingSongNumber);
        if(currentSoundFile.isPaused()) {
            currentSoundFile.play();
            $playPauseBarButton.html(playerBarPauseButton);
            currentlyPlayingElement.html(pauseButtonTemplate);
            }
        else {
            currentSoundFile.pause();
            $playPauseBarButton.html(playerBarPlayButton);
            currentlyPlayingElement.html(playButtonTemplate)
            };
    }
};

var createSongRow = function(songNumber, songName, songLength) {
    var template = 
      '<tr class="album-view-song-item">'
    + '  <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
    + '    <td class="song-item-title">' + songName + '</td>'
    + '    <td class="song-item-duration">' + filterTimeCode(songLength) + '</td>'
    + '</tr>'
    ;
    var $row = $(template);
    
        var clickHandler = function() {
        var songNumber = parseInt($(this).attr('data-song-number'));
            
        if (currentlyPlayingSongNumber !== null) {
          var currentlyPlayingElement = getSongNumberCell(currentlyPlayingSongNumber);	currentlyPlayingElement.html(currentlyPlayingSongNumber);
        }
        if (currentlyPlayingSongNumber !== songNumber) {
            $(this).html(pauseButtonTemplate);
            setSong(songNumber);
            currentSoundFile.play();
            updateSeekBarWhileSongPlays();
            updatePlayerBarSong();
        } 
        else if (currentlyPlayingSongNumber === songNumber) {
            if (currentSoundFile.isPaused()) {
                $(this).html(pauseButtonTemplate);
                $playPauseBarButton.html(playerBarPauseButton);
                currentSoundFile.play();
                updateSeekBarWhileSongPlays();
            }
            else if (!currentSoundFile.isPaused()){
                $(this).html(playButtonTemplate);
                $playPauseBarButton.html(playerBarPlayButton);
                currentSoundFile.pause();
            };
        } 
    };

    var onHover = function(event) {
        var songNumberElement = $(this).find('.song-item-number');
        var songNumber = parseInt(songNumberElement.attr('data-song-number'));
        if (songNumber !== currentlyPlayingSongNumber) {
            songNumberElement.html(playButtonTemplate);
        }
    };
    var offHover = function(event) {
        var songNumberElement = $(this).find('.song-item-number');
        var songNumber = parseInt(songNumberElement.attr('data-song-number'));
        if (songNumber !== currentlyPlayingSongNumber) {
            songNumberElement.html(songNumber);
        }
    };
    
    $row.find('.song-item-number').click(clickHandler);
    $row.hover(onHover, offHover);
    return $row;
};

var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
var playerBarPlayButton = '<span class="ion-play"></span>';
var playerBarPauseButton = '<span class="ion-pause"></span>';

var updatePlayerBarSong = function() {
    var $songName = $('.currently-playing .song-name');
    var $artistName = $('.currently-playing .artist-name');
    var $artistSongMobile = $('.currently-playing .artist-song-mobile');
    $songName.text(currentSongFromAlbum.title);
    $artistName.text(currentAlbum.artist);
    $artistSongMobile.text(currentSongFromAlbum.title + ' - ' + currentAlbum.artist);
    $playPauseBarButton.html(playerBarPauseButton);
    setTotalTimeInPlayerBar(filterTimeCode(currentSongFromAlbum.duration));
};

var setSong = function(songNumber) {
    if (currentSoundFile) {
        currentSoundFile.stop();
    }
    currentlyPlayingSongNumber = parseInt(songNumber);
    currentSongFromAlbum = currentAlbum.songs[songNumber - 1];
    currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
        formats: [ 'mp3' ],
        preload: true
     });
    setVolume(currentVolume);
};

var seek = function(time) {
    if (currentSoundFile) {
      currentSoundFile.setTime(time);  
    };
};

var setVolume = function(volume) {
    if (currentSoundFile) {
        currentSoundFile.setVolume(volume);
        currentVolume = volume;
    }
};
var getSongNumberCell = function(number) {
    return $('.song-item-number[data-song-number="' + number + '"]');
};

var setCurrentTimeInPlayerBar = function(currentTime) {
    var $currentTime = $('.seek-control .current-time');
    $currentTime.text(currentTime);
};

var setTotalTimeInPlayerBar = function(totalTime) {
    var $totalTime = $('.seek-control .total-time');
    $totalTime.text(totalTime);
};

var filterTimeCode = function (timeInSeconds) {
    var seconds = Math.floor(parseFloat(timeInSeconds) % 60);
    if(seconds <= 9){
      seconds = '0' + seconds;
    }
    var minutes = Math.floor(parseFloat(timeInSeconds / 60));
    return minutes + ':' + seconds;
};